"""Brand Kit: versioned approved knowledge. Adding a source creates the next Brand Kit version."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import next_number
from app.models.brand_kit import KIND_PREFIX, BrandKitVersion, SourceItem
from app.models.user import User
from app.pipeline import SourceView
from app.pipeline.retriever import get_embedder, source_text
from app.schemas.brand_kit import SourceCreate, SourceOut

EMBEDDED_KINDS = ("guideline", "fact")


def label(n: int) -> str:
    return f"v{n}"


def current_version(db: Session, workspace_id: str) -> int:
    return db.scalar(select(func.max(BrandKitVersion.number)).where(BrandKitVersion.workspace_id == workspace_id)) or 1


def _active_at(workspace_id: str, version: int):
    return select(SourceItem).where(
        SourceItem.workspace_id == workspace_id,
        SourceItem.kit_version <= version,
        (SourceItem.retired_in.is_(None)) | (SourceItem.retired_in > version),
    ).order_by(SourceItem.pk)


def _out(s: SourceItem) -> SourceOut:
    return SourceOut(id=s.public_id, kind=s.kind, title=s.title, text=s.text, version=label(s.kit_version), status=s.status)


def list_sources(db: Session, workspace_id: str, kind: str | None = None) -> list[SourceOut]:
    rows = db.scalars(_active_at(workspace_id, current_version(db, workspace_id))).all()
    return [_out(s) for s in rows if kind is None or s.kind == kind]


def add_source(db: Session, user: User, body: SourceCreate, public_id: str | None = None, new_version: bool = True) -> SourceOut:
    ws = user.workspace_id
    version = current_version(db, ws)
    if new_version:
        version += 1
        db.add(BrandKitVersion(workspace_id=ws, number=version, created_by=user.id))
    pid = public_id or f"{KIND_PREFIX[body.kind]}-{next_number(db, f'{ws}:src:{body.kind}')}"
    item = SourceItem(workspace_id=ws, public_id=pid, kind=body.kind, title=body.title.strip(), text=body.text.strip(),
                      kit_version=version, status="active", created_by=user.id)
    if body.kind in EMBEDDED_KINDS:
        emb = get_embedder()
        item.embedding, item.embedder = emb.embed([source_text(SourceView(pid, body.kind, item.title, item.text, ""))])[0], emb.name
    db.add(item)
    db.flush()
    return _out(item)


def snapshot(db: Session, workspace_id: str, version: int) -> list[SourceView]:
    """The approved sources as they stood in a given Brand Kit version, with embeddings ready."""
    emb = get_embedder()
    out: list[SourceView] = []
    for s in db.scalars(_active_at(workspace_id, version)).all():
        view = SourceView(s.public_id, s.kind, s.title, s.text, label(s.kit_version))
        if s.kind in EMBEDDED_KINDS:
            if s.embedding is None or s.embedder != emb.name:  # (re)embed with the current model and remember it
                s.embedding, s.embedder = emb.embed([source_text(view)])[0], emb.name
            view.embedding = s.embedding
        out.append(view)
    db.flush()
    return out

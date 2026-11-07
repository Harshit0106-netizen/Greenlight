from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models.user import User
from app.schemas.brand_kit import SourceCreate, SourceKind, SourceOut
from app.services import brand_kit_service

router = APIRouter(prefix="/brand-kit", tags=["brand-kit"])


@router.get("/sources", response_model=list[SourceOut])
def list_sources(kind: SourceKind | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return brand_kit_service.list_sources(db, user.workspace_id, kind)


@router.post("/sources", response_model=SourceOut, status_code=201)
def create_source(body: SourceCreate, user: User = Depends(require_roles("brand_admin")), db: Session = Depends(get_db)):
    out = brand_kit_service.add_source(db, user, body)
    from app.services.workflow_service import audit

    audit(db, user, user.workspace_id, None, "brand_kit_source_added", {"source_id": out.id, "version": out.version})
    db.commit()
    return out

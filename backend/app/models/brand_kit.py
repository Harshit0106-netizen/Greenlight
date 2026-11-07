from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, EmbeddingType
from app.models.user import utcnow

KINDS = ("guideline", "fact", "term", "asset")
KIND_PREFIX = {"guideline": "G", "fact": "F", "term": "T", "asset": "A"}


class BrandKitVersion(Base):
    """One row per version of a workspace's Brand Kit. Adding a source creates the next version."""

    __tablename__ = "brand_kit_version"
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspace.id"), primary_key=True)
    number: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_by: Mapped[str | None] = mapped_column(ForeignKey("app_user.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class SourceItem(Base):
    __tablename__ = "source_item"
    __table_args__ = (UniqueConstraint("workspace_id", "public_id"),)
    pk: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspace.id"), index=True)
    public_id: Mapped[str] = mapped_column(String(40))
    kind: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(300))
    text: Mapped[str] = mapped_column(Text)
    kit_version: Mapped[int] = mapped_column(Integer)  # Brand Kit version this source was introduced in
    retired_in: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    embedding: Mapped[list[float] | None] = mapped_column(EmbeddingType, nullable=True)
    embedder: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_by: Mapped[str | None] = mapped_column(ForeignKey("app_user.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

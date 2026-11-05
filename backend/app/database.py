"""PostgreSQL connection (SQLAlchemy). pgvector is enabled on PostgreSQL; other dialects (tests) fall back to JSON."""
from sqlalchemy import JSON, create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.types import TypeDecorator

from app.config import get_settings

EMBEDDING_DIM = 384


class Base(DeclarativeBase):
    pass


class EmbeddingType(TypeDecorator):
    """Vector(384) on PostgreSQL (pgvector), JSON list elsewhere."""

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from pgvector.sqlalchemy import Vector

            return dialect.type_descriptor(Vector(EMBEDDING_DIM))
        return dialect.type_descriptor(JSON())

    def process_bind_param(self, value, dialect):
        return None if value is None else [float(x) for x in value]

    def process_result_value(self, value, dialect):
        return None if value is None else [float(x) for x in value]


def make_engine(url: str | None = None):
    url = url or get_settings().sqlalchemy_url
    engine = create_engine(url, pool_pre_ping=True, future=True)
    if engine.dialect.name == "postgresql":

        @event.listens_for(engine, "connect")
        def _register_vector(dbapi_conn, _record):  # pragma: no cover - needs PostgreSQL
            import psycopg
            from pgvector.psycopg import register_vector

            try:
                register_vector(dbapi_conn)
            except psycopg.ProgrammingError:
                dbapi_conn.rollback()  # extension not created yet; ensure_extensions() creates it, then pool is reset

    return engine


engine = make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def ensure_extensions(eng=None) -> None:
    """Enable pgvector. Uses a plain connection (no vector registration) so a brand-new database works."""
    eng = eng or engine
    if eng.dialect.name == "postgresql":
        plain = create_engine(eng.url, future=True)
        with plain.begin() as conn:
            conn.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS vector")
        plain.dispose()
        eng.dispose()  # pooled connections must be reopened so they register the new vector type


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---- readable, per-scope ids: U-1, W-1, CL-2084, FD-1042, F-12 ... ------------------------------
from sqlalchemy import Integer, String, select  # noqa: E402
from sqlalchemy.orm import Mapped, Session, mapped_column  # noqa: E402


class IdCounter(Base):
    __tablename__ = "id_counter"
    scope: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[int] = mapped_column(Integer, nullable=False)


def next_number(db: Session, scope: str, start: int = 1) -> int:
    """Atomically bump a counter (row-locked on PostgreSQL)."""
    row = db.execute(select(IdCounter).where(IdCounter.scope == scope).with_for_update()).scalar_one_or_none()
    if row is None:
        row = IdCounter(scope=scope, value=start)
        db.add(row)
    else:
        row.value += 1
    db.flush()
    return row.value

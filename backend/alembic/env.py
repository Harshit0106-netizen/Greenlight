from alembic import context
from sqlalchemy import create_engine

import app.models  # noqa: F401  (registers every table)
from app.config import get_settings
from app.database import Base

target_metadata = Base.metadata
url = get_settings().sqlalchemy_url


def run_migrations_online() -> None:
    engine = create_engine(url)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    run_migrations_online()

"""Reads configuration from the environment / .env. Secrets never live in code."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://user:password@localhost:5432/greenlight"
    jwt_secret: str = "change-me"
    anthropic_api_key: str = ""
    allowed_origin: str = "http://localhost:3000"

    app_env: str = "dev"
    anthropic_model: str = "claude-sonnet-5-5"
    embedding_model: str = "all-MiniLM-L6-v2"
    seed_password: str = "greenlight-demo"

    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60
    llm_timeout_seconds: float = 20.0

    @property
    def sqlalchemy_url(self) -> str:
        """Use the psycopg 3 driver for plain postgresql:// URLs."""
        url = self.database_url
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    @property
    def llm_configured(self) -> bool:
        key = self.anthropic_api_key.strip()
        return bool(key) and key != "your-key-here"

    def assert_safe(self) -> None:
        if self.app_env == "production" and self.jwt_secret == "change-me":
            raise RuntimeError("JWT_SECRET must be changed before running in production.")


@lru_cache
def get_settings() -> Settings:
    return Settings()

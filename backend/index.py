"""Vercel entrypoint: Vercel serves the `app` object exported here (set Root Directory to `backend`)."""
from app.main import app  # noqa: F401

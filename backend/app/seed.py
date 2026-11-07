"""Demo data. FICTIONAL brand and people only.  Run:  python -m app.seed   (add --reset to wipe first)"""
import sys

from sqlalchemy import inspect, select

from app.config import get_settings
from app.database import Base, SessionLocal, engine, next_number
from app.models import BrandKitVersion, User, Workspace
from app.schemas.brand_kit import SourceCreate
from app.security import hash_password
from app.services import brand_kit_service

USERS = [
    ("Aarav Mehta", "aarav@acme.com", "creator"),
    ("Harshit Verma", "harshit@acme.com", "manager"),
    ("Priya Nair", "priya@acme.com", "reviewer"),
    ("Ruchir Bharadwaj", "ruchir@acme.com", "brand_admin"),
]
SOURCES = [
    ("G-4.2", "guideline", "Avoid unsupported superlatives",
     "Do not use claims such as '#1', 'best' or 'fastest' unless an approved fact substantiates them."),
    ("G-2.1", "guideline", "Use a helpful, confident tone",
     "Be clear and reassuring in the brand voice. Avoid pressure tactics, excessive exclamation marks and fear-based language."),
    ("G-5.1", "guideline", "Accessibility basics",
     "Every image needs descriptive alt text, link text must make sense on its own, and text needs WCAG AA contrast."),
    ("F-12", "fact", "Delivery coverage", "Fast delivery is available in select cities."),
    ("F-18", "fact", "Bottle capacity", "The Zippy Bottle has a 750 ml capacity."),
    ("F-21", "fact", "Material", "Made with BPA-free, food-grade stainless steel."),
    ("T-8", "term", "Zippy bottle", "Use: Zippy Bottle. Approved product name and capitalisation."),
    ("T-9", "term", "Cheap", "Use: Affordable. Preferred value-proposition language."),
    ("T-10", "term", "Best ever", "Use: Reliable. Superlatives need an approved fact."),
    ("A-1", "asset", "Brand palette", "Approved colours: Primary #315CE8, Ink #111827, Accent #A5B4FC, Canvas #F6F7FB."),
]


def seed(reset: bool = False) -> None:
    if not inspect(engine).has_table("workspace"):
        raise SystemExit("Tables not found. Run `alembic upgrade head` first.")
    with SessionLocal() as db:
        if reset:  # wipe rows, keep the schema (and alembic_version) intact
            for table in reversed(Base.metadata.sorted_tables):
                db.execute(table.delete())
            db.commit()
        if db.scalar(select(Workspace).limit(1)):
            print("Already seeded (use --reset to start over).")
            return
        ws = Workspace(id=f"W-{next_number(db, 'workspace', 1)}", name="Acme Corporation")
        db.add(ws)
        db.flush()
        password = get_settings().seed_password
        admin = None
        for name, email, role in USERS:
            u = User(id=f"U-{next_number(db, 'user', 1)}", workspace_id=ws.id, name=name, email=email,
                     password_hash=hash_password(password), role=role)
            db.add(u)
            admin = u if role == "brand_admin" else admin
        db.add(BrandKitVersion(workspace_id=ws.id, number=1, created_by=None))
        db.flush()
        for pid, kind, title, text in SOURCES:
            brand_kit_service.add_source(db, admin, SourceCreate(kind=kind, title=title, text=text), public_id=pid, new_version=False)
        db.commit()
        print(f"Seeded workspace {ws.id} with {len(USERS)} users and {len(SOURCES)} sources (Brand Kit v1).")
        for name, email, role in USERS:
            print(f"  {role:<12} {email}")
        print(f"  password for all demo users: {password}")


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)

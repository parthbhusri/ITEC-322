import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()


def clean_database_url(raw: str | None) -> str:
    """Tidy up DATABASE_URL so small copy-paste slips don't stop the app.

    Accepts the string exactly as Neon/Render/Supabase give it, and fixes:
    a leading "DATABASE_URL=", surrounding quotes, spaces or line breaks,
    and "postgres://" / "postgresql://" without the psycopg driver name.
    """
    url = (raw or "").strip()

    if url.upper().startswith("DATABASE_URL="):
        url = url.split("=", 1)[1].strip()

    url = url.strip("'\"").strip()
    # Line breaks from copying out of a wrapped box
    url = "".join(url.split())

    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]

    return url


DATABASE_URL = clean_database_url(os.getenv("DATABASE_URL"))

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

try:
    make_url(DATABASE_URL)
except ArgumentError:
    # Never print the URL itself: it contains the database password
    raise RuntimeError(
        "DATABASE_URL isn't a valid database address. It should start with "
        "postgresql+psycopg:// (or postgresql://) and contain no spaces. "
        f"(It {'does' if DATABASE_URL.startswith('postgres') else 'does not'} start with "
        f"'postgres' and is {len(DATABASE_URL)} characters long.)"
    ) from None

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""SQLAlchemy engine and session configuration for PostgreSQL."""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

Base = declarative_base()

# Use Postgres if configured, otherwise fallback to SQLite for easy Render deployment
_host = os.getenv('POSTGRES_HOST')
if _host and _host != 'localhost':
    DATABASE_URL = (
        f"postgresql://{os.getenv('POSTGRES_USER', 'policymind_app')}:"
        f"{os.getenv('POSTGRES_PASSWORD', 'policymind_secret')}@"
        f"{_host}:"
        f"{os.getenv('POSTGRES_PORT', '5432')}/"
        f"{os.getenv('POSTGRES_DB', 'policymind')}"
    )
else:
    DATABASE_URL = os.getenv('DATABASE_URL', "sqlite:///./policymind.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

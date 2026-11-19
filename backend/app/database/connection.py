import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

for candidate in [
    os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
    os.path.join(os.path.dirname(__file__), "..", ".env"),
    os.path.join(os.getcwd(), ".env"),
]:
    if os.path.exists(candidate):
        load_dotenv(candidate)
        break
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smart_study_agent.db")
# Ensure psycopg2 is used for PostgreSQL if psycopg isn't specified
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and ensure default user exists."""
    # Import models so they are registered on Base
    from app.models import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Migrate column if missing in existing database
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)"))
            conn.commit()
    except Exception:
        pass

    # Ensure user id=1 exists with a default password
    db = SessionLocal()
    try:
        import bcrypt
        from app.models.models import User
        default_hash = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode("utf-8")
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            default_user = User(
                id=1,
                email="student@studyagent.local",
                name="Student",
                hashed_password=default_hash,
                is_active=True,
                email_alerts_enabled=False,
                alert_email=None,
                alert_task_overdue=True,
                alert_quiz_completed=True,
                alert_study_plan_created=True,
            )
            db.add(default_user)
            db.commit()
        elif not user.hashed_password:
            user.hashed_password = default_hash
            db.commit()
    finally:
        db.close()

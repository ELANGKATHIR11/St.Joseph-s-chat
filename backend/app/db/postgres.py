from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Primary Engine
engine = None
try:
    print(f"Connecting to primary database: {db_url}")
    engine = create_engine(db_url)
    # Test connection
    with engine.connect() as conn:
        pass
    print("Database connection verified successfully.")
except Exception as e:
    print(f"Primary database connection failed: {e}")
    print("Falling back to local SQLite database...")
    db_url = "sqlite:///./medlaw_guard.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

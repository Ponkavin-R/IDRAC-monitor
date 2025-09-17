# backend/app/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# ✅ Use environment variable or fallback to your FreeSQLDatabase connection string
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://sql12797945:YOUR_DB_PASSWORD@sql12.freesqldatabase.com/sql12797945"
)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL, echo=True, pool_recycle=280)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

"""
Run this once to create all tables in the MariaDB database
defined by your .env file.

Usage:
    python create_tables.py
"""

from app.database import engine
from app.models.models import Base

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")
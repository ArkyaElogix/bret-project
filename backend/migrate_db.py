import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine
from app.models.models import Base

def run():
    print("Creating new tables (applicant_registry, duplicate_flags)...")
    # This safely creates any missing tables defined in models.py 
    # (It will skip tables that already exist, like users or assessment_sessions)
    Base.metadata.create_all(engine)
    
    with engine.begin() as conn:
        print("Adding duplicate_flag_id to assessment_sessions...")
        try:
            conn.execute(text("ALTER TABLE assessment_sessions ADD COLUMN duplicate_flag_id INT NULL;"))
            print("  OK: Column added.")
            
            # Now add the foreign key constraint
            conn.execute(text("ALTER TABLE assessment_sessions ADD CONSTRAINT fk_duplicate_flag FOREIGN KEY (duplicate_flag_id) REFERENCES duplicate_flags(id);"))
            print("  OK: Foreign key added.")
        except Exception as e:
            print(f"  SKIP (already exists or error): {e}")

    print("\nPhase 1 Migration complete.")

if __name__ == "__main__":
    run()

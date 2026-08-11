import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine
from app.models.models import Base


def phase1_add_duplicate_tables():
    """
    Phase 1 (historical): Created applicant_registry + duplicate_flags tables
    and added the (now-removed) duplicate_flag_id back-pointer to
    assessment_sessions.
    This step is kept for documentation only; create_all() is idempotent.
    """
    print("Phase 1: Ensuring applicant_registry and duplicate_flags tables exist...")
    Base.metadata.create_all(engine)
    print("  OK: Tables verified.")


def phase2_drop_duplicate_flag_id():
    """
    Phase 2: Remove the circular FK column `duplicate_flag_id` from
    `assessment_sessions`.

    Background:
        assessment_sessions.duplicate_flag_id  →  duplicate_flags
        duplicate_flags.new_session_id         →  assessment_sessions
        duplicate_flags.prior_registry_id      →  applicant_registry
        applicant_registry.session_id          →  assessment_sessions

    This triangle caused an unresolvable FK sort cycle in SQLAlchemy.
    The back-pointer was redundant — DuplicateFlag.new_session_id already
    points from flag → session and is used by all router queries.
    """
    print("\nPhase 2: Dropping circular FK column `duplicate_flag_id` from assessment_sessions...")
    with engine.begin() as conn:
        # Step 1: Drop the foreign key constraint first (MariaDB requires this
        # before dropping the column it covers).
        try:
            conn.execute(text(
                "ALTER TABLE assessment_sessions "
                "DROP FOREIGN KEY fk_duplicate_flag;"
            ))
            print("  OK: Foreign key constraint `fk_duplicate_flag` dropped.")
        except Exception as e:
            print(f"  SKIP (constraint may not exist): {e}")

        # Step 2: Drop the column itself.
        try:
            conn.execute(text(
                "ALTER TABLE assessment_sessions "
                "DROP COLUMN duplicate_flag_id;"
            ))
            print("  OK: Column `duplicate_flag_id` dropped.")
        except Exception as e:
            print(f"  SKIP (column may not exist): {e}")


def run():
    phase1_add_duplicate_tables()
    phase2_drop_duplicate_flag_id()
    print("\nMigration complete. No circular FK cycle remains.")


if __name__ == "__main__":
    run()

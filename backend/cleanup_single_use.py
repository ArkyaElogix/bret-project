from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import SQLALCHEMY_DATABASE_URL
from app.services.single_use_cleanup import cleanup_expired_single_use_accounts

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def cleanup_single_use_accounts():
    """
    Find and hard-delete single-use accounts past their deletion_scheduled_at.
    Verify applicant_registry entry exists before deletion.
    """
    db = SessionLocal()

    try:
        now = datetime.utcnow()
        timestamp = now.strftime("%Y-%m-%d %H:%M:%S UTC")

        result = cleanup_expired_single_use_accounts(db, now)
        for warning in result["warnings"]:
            print(f"[{timestamp}] WARNING: {warning}")
        print(
            f"[{timestamp}] Cleanup: checked={result['checked']} "
            f"deleted={result['deleted']} skipped={result['skipped']}"
        )

    except Exception as e:
        print(f"[{timestamp}] ERROR in cleanup_single_use_accounts: {e}")
        db.rollback()
    finally:
        db.close()

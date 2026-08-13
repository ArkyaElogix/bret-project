"""
Background cleanup worker for single-use accounts.
Runs every 30 minutes via APScheduler.
"""

from datetime import datetime
from sqlalchemy import create_engine, and_
from sqlalchemy.orm import sessionmaker
from app.models.models import User, AuditLog, AuditAction, ApplicantRegistry
from app.database import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def cleanup_single_use_accounts():
    """
    Find and hard-delete single-use accounts past their deletion_scheduled_at.
    Verify applicant_registry entry exists before deletion.
    """
    db = SessionLocal()
    
    try:
        now = datetime.utcnow()
        
        # Find eligible users
        users_to_delete = db.query(User).filter(
            and_(
                User.is_single_use == True,
                User.deletion_scheduled_at <= now,
                User.deleted_at.is_(None)
            )
        ).all()
        
        for user in users_to_delete:
            # Verify applicant_registry entry exists
            registry_entry = db.query(ApplicantRegistry).filter(
                ApplicantRegistry.user_id == user.id
            ).first()
            
            if not registry_entry:
                print(f"WARNING: Single-use user {user.id} ({user.email}) marked for deletion but no applicant_registry entry found. Skipping.")
                continue
            
            # Hard delete
            db.delete(user)
            
            # Audit log (will be soft-deleted too, but record it)
            audit_log = AuditLog(
                user_id=None,  # System action
                action=AuditAction.SINGLE_USE_DELETED,
                resource_type="USER",
                resource_id=user.id,
                details={"email": user.email, "deleted_at": now.isoformat()}
            )
            db.add(audit_log)
        
        db.commit()
        print(f"Cleanup: Deleted {len(users_to_delete)} single-use accounts")
        
    except Exception as e:
        print(f"ERROR in cleanup_single_use_accounts: {e}")
        db.rollback()
    finally:
        db.close()
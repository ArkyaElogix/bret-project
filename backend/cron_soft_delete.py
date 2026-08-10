import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.models import AssessmentSession, User, SessionStatus

def run_soft_delete():
    db: Session = SessionLocal()
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=12)
        
        # Find sessions submitted more than 12 hours ago where the user is not yet deleted
        expired_sessions = db.query(AssessmentSession).join(User).filter(
            AssessmentSession.status == SessionStatus.submitted,
            AssessmentSession.submitted_at < cutoff_time,
            User.deleted_at.is_(None)
        ).all()
        
        if not expired_sessions:
            print("No accounts to soft-delete at this time.")
            return

        deleted_count = 0
        for session in expired_sessions:
            user = session.user
            user.deleted_at = datetime.utcnow()
            user.token_version += 1  # Invalidate any active JWTs instantly
            deleted_count += 1
            
        db.commit()
        print(f"Successfully soft-deleted {deleted_count} candidate accounts.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during soft-delete: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_soft_delete()

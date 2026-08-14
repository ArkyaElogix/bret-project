from datetime import datetime
import json

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.models import (
    ApplicantRegistry,
    AuditAction,
    AuditLog,
    DuplicateFlag,
    User,
)


def cleanup_expired_single_use_accounts(db: Session, now: datetime | None = None) -> dict:
    """
    Hard-delete expired single-use users and their dependent cleanup records.

    Returns a small summary suitable for logs or an admin API response.
    """
    now = now or datetime.utcnow()

    users_to_delete = db.query(User).filter(
        and_(
            User.is_single_use.is_(True),
            User.deletion_scheduled_at <= now,
            User.deleted_at.is_(None),
        )
    ).all()

    deleted = 0
    skipped = 0
    warnings: list[str] = []

    for user in users_to_delete:
        user_id = user.id
        user_email = user.email

        registry_entry = db.query(ApplicantRegistry).filter(
            ApplicantRegistry.original_user_id == user_id
        ).first()

        if not registry_entry:
            skipped += 1
            warnings.append(
                f"Single-use user {user_id} ({user_email}) has no applicant_registry entry."
            )
            continue

        session_ids = [session.id for session in user.sessions]

        if session_ids:
            db.query(DuplicateFlag).filter(
                DuplicateFlag.new_session_id.in_(session_ids)
            ).delete(synchronize_session=False)

            registry_entries = db.query(ApplicantRegistry).filter(
                ApplicantRegistry.session_id.in_(session_ids)
            ).all()
            registry_ids = [r.id for r in registry_entries]
            if registry_ids:
                db.query(DuplicateFlag).filter(
                    DuplicateFlag.prior_registry_id.in_(registry_ids)
                ).delete(synchronize_session=False)

            db.query(ApplicantRegistry).filter(
                ApplicantRegistry.session_id.in_(session_ids)
            ).delete(synchronize_session=False)

        db.delete(user)
        db.add(
            AuditLog(
                action=AuditAction.SINGLE_USE_DELETED,
                user_id=None,
                target_user_id=user_id,
                ip_address=None,
                detail=json.dumps(
                    {"email": user_email, "deleted_at": now.isoformat()}
                ),
            )
        )
        deleted += 1

    db.commit()

    return {
        "checked": len(users_to_delete),
        "deleted": deleted,
        "skipped": skipped,
        "warnings": warnings,
    }

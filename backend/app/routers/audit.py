"""
Admin audit log router.
Provides read access to the privacy-sensitive action log.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, AuditLog, AuditAction
from app.schemas import AuditLogOut
from app.auth import require_admin

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/", response_model=list[AuditLogOut])
def list_audit_logs(
    limit: int = Query(default=200, le=1000),
    action: AuditAction | None = Query(default=None),
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only: list recent audit log entries.
    Optionally filter by action type or actor user_id."""
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if user_id:
        q = q.filter(AuditLog.user_id == user_id)
    return q.order_by(AuditLog.created_at.desc()).limit(limit).all()

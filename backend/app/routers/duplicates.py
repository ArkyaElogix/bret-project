from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.database import get_db
from app.auth import require_admin
from app.models.models import User, DuplicateFlag, DuplicateFlagStatus, AuditLog, AuditAction
from app.schemas import DuplicateFlagOut, DuplicateReviewRequest

router = APIRouter(prefix="/admin/duplicates", tags=["Duplicates"])


@router.get("", response_model=list[DuplicateFlagOut])
def list_duplicate_flags(
    status: str = "PENDING",
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    query = db.query(DuplicateFlag)
    if status != "ALL":
        query = query.filter(DuplicateFlag.status == status)
    return query.order_by(DuplicateFlag.created_at.desc()).all()


@router.get("/{flag_id}", response_model=DuplicateFlagOut)
def get_duplicate_flag(
    flag_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    flag = db.get(DuplicateFlag, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Duplicate flag not found")
    return flag


@router.post("/{flag_id}/review", response_model=DuplicateFlagOut)
def review_duplicate_flag(
    flag_id: int,
    payload: DuplicateReviewRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    flag = db.get(DuplicateFlag, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Duplicate flag not found")
        
    if payload.decision not in [DuplicateFlagStatus.APPROVED.value, DuplicateFlagStatus.REJECTED.value]:
        raise HTTPException(status_code=400, detail="Invalid decision. Must be APPROVED or REJECTED.")
        
    flag.status = payload.decision
    flag.reviewed_by = admin_user.id
    flag.reviewed_at = datetime.utcnow()
    flag.review_note = payload.note
    
    # Audit trail
    audit = AuditLog(
        action=AuditAction.DUPLICATE_REVIEWED,
        user_id=admin_user.id,
        target_user_id=flag.new_user_id,
        detail=json.dumps({"flag_id": flag.id, "decision": payload.decision, "note": payload.note})
    )
    db.add(audit)
    
    db.commit()
    db.refresh(flag)
    return flag

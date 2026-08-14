"""
Endpoints for managing Users. Note: this is just CRUD with password
hashing on create — actual login/auth (tokens, sessions) is a separate
piece to build later.
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models.models import User, UserRole, AccountType, AuditLog, AuditAction
from app.schemas import UserCreate, UserOut, PasswordChange, UserTypeUpdate, UserDeleteRequest, AuditLogOut, UserProfileUpdate
from app.security import hash_password, verify_password
from app.auth import require_admin, get_current_user
import secrets
from app.schemas import SingleUseUserCreate
from app.services.email_service import send_single_use_invitation_email
from app.services.single_use_cleanup import cleanup_expired_single_use_accounts

router = APIRouter(prefix="/users", tags=["Users"])

def _write_audit(
    db: Session,
    action: AuditAction,
    *,
    user_id: int | None = None,
    target_user_id: int | None = None,
    ip: str | None = None,
    detail: dict | None = None,
) -> None:
    try:
        db.add(AuditLog(
            action=action,
            user_id=user_id,
            target_user_id=target_user_id,
            ip_address=ip,
            detail=json.dumps(detail) if detail else None,
        ))
        db.flush()
    except Exception:
        pass
def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None

@router.post("/", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if payload.role not in (UserRole.ADMIN.value, UserRole.USER.value):
        raise HTTPException(status_code=400, detail="role must be ADMIN or USER")
    if payload.account_type not in (AccountType.BASIC.value, AccountType.EXECUTIVE.value):
        raise HTTPException(status_code=400, detail="account_type must be BASIC or EXECUTIVE")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        account_type=payload.account_type,
        education=payload.education,
        address=payload.address,
        country=payload.country,
        age=payload.age,
        profession=payload.profession,
        income_range=payload.income_range,
        phone=payload.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return db.query(User).order_by(User.id).all()

@router.get("/me/export")
def export_my_data(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GDPR Right to Access: Export all user data as JSON."""
    _write_audit(db, AuditAction.DATA_EXPORT,
                 user_id=current_user.id, ip=_client_ip(request))

    user_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
        "account_type": current_user.account_type.value,
        "created_at": current_user.created_at.isoformat(),
        "consent_given_at": current_user.consent_given_at.isoformat() if current_user.consent_given_at else None,
        "sessions": [],
    }

    for session in current_user.sessions:
        session_data = {
            "session_id": session.id,
            "form_id": session.form_id,
            "status": session.status.value,
            "created_at": session.created_at.isoformat(),
            "submitted_at": session.submitted_at.isoformat() if session.submitted_at else None,
            "responses": [
                {
                    "question_id": r.question_id,
                    "chosen_option": r.chosen_option.value,
                    "answered_at": r.answered_at.isoformat(),
                }
                for r in session.responses
            ],
            "scores": [
                {
                    "section_id": s.section_id,
                    "factor_id": s.factor_id,
                    "score": s.score,
                }
                for s in session.section_scores
            ],
        }
        if session.ai_report_data:
            session_data["ai_report"] = session.ai_report_data
        user_data["sessions"].append(session_data)

    db.commit()  # flush audit log
    return user_data



@router.delete("/me", status_code=204)
def delete_me(
    payload: UserDeleteRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GDPR Right to be Forgotten: Soft-delete own account with password confirmation.
    Sets deleted_at; hard-delete / anonymization happens in the Phase 2 retention job."""

    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password. Account deletion failed.")

    # Soft-delete: mark timestamp, invalidate token so existing sessions expire immediately
    current_user.deleted_at = datetime.utcnow()
    current_user.token_version += 1  # invalidates all outstanding JWTs

    _write_audit(db, AuditAction.ACCOUNT_DELETE,
                 user_id=current_user.id, ip=_client_ip(request))
    db.commit()

@router.patch("/me", response_model=UserOut)
def update_my_profile(
    payload: UserProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user's profile. All fields are optional (partial updates).
    Email uniqueness is checked if email is being changed (excludes current user)."""
    
    # Check email uniqueness if email is being changed
    if payload.email is not None and payload.email != current_user.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Apply only non-None fields
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    # Write audit log
    _write_audit(
        db, 
        AuditAction.USER_PROFILE_UPDATE,
        user_id=current_user.id,
        ip=_client_ip(request),
        detail={"fields_updated": list(update_data.keys())}
    )
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user),):
    if current_user.role!= UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only: delete a user. Refuses if the user has any assessment
    sessions, since those would be orphaned (no DB-level cascade) — matches
    how delete-form treats attached sessions."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.sessions:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete user with existing sessions",
        )
    db.delete(user)
    db.commit()


@router.patch("/{user_id}/password", response_model=UserOut)
def change_user_password(
    user_id: int,
    payload: PasswordChange,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only: set a new password for a user. The admin is already
    authenticated, so no old-password verification is required."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/type", response_model=UserOut)
def change_user_type(
    user_id: int,
    payload: UserTypeUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only: change a user's account type (BASIC/EXECUTIVE)."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if payload.account_type not in (AccountType.BASIC.value, AccountType.EXECUTIVE.value):
        raise HTTPException(status_code=400, detail="account_type must be BASIC or EXECUTIVE")
        
    user.account_type = payload.account_type
    db.commit()
    db.refresh(user)
    return user

@router.get("/admin/audit-log", response_model=list[AuditLogOut])
def get_audit_log(
    limit: int = 200,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only: return the most recent audit log entries."""
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )

@router.post("/single-use", response_model=UserOut, status_code=201)
async def create_single_use_user(
    user_data: SingleUseUserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a single-use candidate account (admin only).
    Auto-generates password, sends invitation email.
    """
    # Verify current user is admin
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Check email not already in use
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate secure password
    auto_password = secrets.token_urlsafe(9)  # ~12 alphanumeric chars
    
    # Create user
    new_user = User(
        email=user_data.email,
        name=user_data.name or user_data.email.split('@')[0],
        password_hash=hash_password(auto_password),
        role=UserRole.USER,
        is_single_use=True,
        single_use_status="pending_registration",
        token_version=0,
        account_type=user_data.account_type
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send invitation email
    await send_single_use_invitation_email(
        email=new_user.email,
        password=auto_password,
        name=new_user.name
    )
    
    # Audit log
    audit_log = AuditLog(
        action=AuditAction.SINGLE_USE_CREATED,
        user_id=current_user.id,
        target_user_id=new_user.id,
        detail=json.dumps({"email": new_user.email, "account_type": user_data.account_type}),
    )
    db.add(audit_log)
    db.commit()
    
    # Return user (NOT password)
    return new_user


@router.post("/single-use/cleanup")
def cleanup_single_use_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Admin-only: manually run expired single-use account cleanup.
    """
    return cleanup_expired_single_use_accounts(db)

@router.post("/{user_id}/single-use/unlock", response_model=UserOut)
async def unlock_single_use_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Admin unlock a locked single-use account.
    Allows one more login/submission attempt.
    """
    # Verify admin
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify single-use and locked
    if not target_user.is_single_use or target_user.single_use_status != "locked":
        raise HTTPException(
            status_code=400,
            detail="User is not a locked single-use account"
        )
    
    # Unlock
    target_user.single_use_status = "admin_unlocked"
    
    # Audit log
    audit_log = AuditLog(
        action=AuditAction.SINGLE_USE_ADMIN_UNLOCK,
        user_id=current_user.id,
        target_user_id=target_user.id,
        detail=json.dumps({"target_email": target_user.email}),
    )
    db.add(audit_log)
    db.commit()
    db.refresh(target_user)
    
    return target_user

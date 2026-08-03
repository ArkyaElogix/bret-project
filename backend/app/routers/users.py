"""
Endpoints for managing Users. Note: this is just CRUD with password
hashing on create — actual login/auth (tokens, sessions) is a separate
piece to build later.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, UserRole, ProductType
from app.schemas import UserCreate, UserOut, PasswordChange, UserTypeUpdate, UserDeleteRequest
from app.security import hash_password, verify_password
from app.auth import require_admin, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


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
    if payload.product_type not in (ProductType.BASIC.value, ProductType.EXECUTIVE.value):
        raise HTTPException(status_code=400, detail="product_type must be BASIC or EXECUTIVE")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        product_type=payload.product_type,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GDPR Right to Access: Export all user data as JSON."""
    user_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
        "product_type": current_user.product_type.value,
        "created_at": current_user.created_at.isoformat(),
        "sessions": []
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
                    "answered_at": r.answered_at.isoformat()
                } for r in session.responses
            ],
            "scores": [
                {
                    "section_id": s.section_id,
                    "factor_id": s.factor_id,
                    "score": s.score
                } for s in session.section_scores
            ]
        }
        # Include AI Report if generated
        if session.ai_report_data:
            session_data["ai_report"] = session.ai_report_data
            
        user_data["sessions"].append(session_data)

    return user_data


@router.delete("/me", status_code=204)
def delete_me(
    payload: UserDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """GDPR Right to be Forgotten: Delete own account with password confirmation.
    Cascades to delete all associated sessions and responses."""
    
    # 1. Verify password
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password. Account deletion failed.")

    # 2. Delete user (sessions, responses, and scores will cascade)
    db.delete(current_user)
    db.commit()

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
        
    if payload.product_type not in (ProductType.BASIC.value, ProductType.EXECUTIVE.value):
        raise HTTPException(status_code=400, detail="product_type must be BASIC or EXECUTIVE")
        
    user.product_type = payload.product_type
    db.commit()
    db.refresh(user)
    return user



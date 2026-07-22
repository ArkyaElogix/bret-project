"""
Endpoints for managing Users. Note: this is just CRUD with password
hashing on create — actual login/auth (tokens, sessions) is a separate
piece to build later.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, UserRole, ProductType
from app.schemas import UserCreate, UserOut, PasswordChange, UserTypeUpdate
from app.security import hash_password
from app.auth import require_admin

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

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return db.query(User).order_by(User.id).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
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
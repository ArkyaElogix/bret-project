"""
Login endpoint. Verifies email+password, issues a JWT on success.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, UserRole
from app.schemas import LoginRequest, TokenResponse, UserOut, CandidateRegisterRequest
from app.security import verify_password, hash_password
from app.auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user)
    return TokenResponse(access_token=token, role=user.role.value)

@router.post("/admin/login", response_model=TokenResponse)
def admin_login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Admin-only login. Verifies email+password AND that the user is an admin
    before issuing a token. Non-admins get 403 — no token is ever issued to them
    through this endpoint, even with correct credentials."""
    user = db.query(User).filter(User.email == payload.email).first()
    # Same vague error message for "wrong password" and "not an admin" to avoid
    # leaking which emails are valid admin accounts.
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required. Use the candidate login instead.",
        )

    token = create_access_token(user)
    return TokenResponse(access_token=token, role=user.role.value)


@router.post("/register", response_model=TokenResponse, status_code=201)
def register_candidate(payload: CandidateRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.USER,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user)
    return TokenResponse(access_token=token, role=user.role.value)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently logged-in user's profile (id, name, email, role)."""
    return current_user

@router.post("/logout", status_code=204)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.token_version += 1
    db.commit()
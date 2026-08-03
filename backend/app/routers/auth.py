"""
Login endpoint. Verifies email+password, issues a JWT on success.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import secrets
from datetime import datetime, timedelta

from app.database import get_db
from app.models.models import User, UserRole, ProductType, PasswordResetToken
from app.services.email_service import send_reset_email
from app.schemas import LoginRequest, TokenResponse, UserOut, CandidateRegisterRequest, ResetPasswordRequest, ForgotPasswordRequest
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
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token(user)
    return TokenResponse(access_token=token, role=user.role.value)


@router.post("/register", response_model=TokenResponse, status_code=201)
def register_candidate(payload: CandidateRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if payload.product_type not in (ProductType.BASIC.value, ProductType.EXECUTIVE.value):
        raise HTTPException(status_code=400, detail="product_type must be BASIC or EXECUTIVE")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        product_type=payload.product_type,
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

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    
    if user:
        # 1. Invalidate any existing unused tokens for this user
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        ).update({"used": True})
        
        # 2. Generate a secure random token
        raw_token = secrets.token_urlsafe(32)
        
        # 3. Save the hash to the database
        expires = datetime.utcnow() + timedelta(minutes=60)
        reset_entry = PasswordResetToken(
            user_id=user.id,
            token_hash=PasswordResetToken.hash_token(raw_token),
            expires_at=expires
        )
        db.add(reset_entry)
        db.commit()
        
        # 4. Send the email
        send_reset_email(user.email, raw_token)

    # Always return a generic success message to prevent email enumeration
    return {"message": "If an account with that email exists, you will receive a password reset link shortly."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = PasswordResetToken.hash_token(payload.token)
    
    db_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash
    ).first()
    
    if not db_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link.")
        
    if db_token.used:
        raise HTTPException(status_code=400, detail="This reset link has already been used.")
        
    if datetime.utcnow() > db_token.expires_at:
        raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")
        
    # Validation logic (matches frontend)
    pw = payload.new_password
    if len(pw) < 8 or not any(c.islower() for c in pw) or not any(c.isupper() for c in pw) or not any(c.isdigit() for c in pw) or not any(not c.isalnum() for c in pw):
        raise HTTPException(status_code=400, detail="Password does not meet strength requirements.")

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Update password
    user.password_hash = hash_password(payload.new_password)
    
    # Mark token used
    db_token.used = True
    
    # Invalidate existing sessions
    user.token_version += 1
    
    db.commit()
    
    return {"message": "Password reset successfully. You can now log in with your new password."}


@router.post("/logout", status_code=204)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.token_version += 1
    db.commit()
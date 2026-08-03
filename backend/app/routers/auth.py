"""
Login endpoint. Verifies email+password, issues a JWT on success.
"""

import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import secrets
from datetime import datetime, timedelta

from app.database import get_db
from app.models.models import (
    User, UserRole, ProductType, PasswordResetToken, AuditLog, AuditAction
)
from app.services.email_service import send_reset_email
from app.schemas import (
    LoginRequest, TokenResponse, UserOut,
    CandidateRegisterRequest, ResetPasswordRequest, ForgotPasswordRequest,
)
from app.security import verify_password, hash_password
from app.auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _write_audit(
    db: Session,
    action: AuditAction,
    *,
    user_id: int | None = None,
    target_user_id: int | None = None,
    ip: str | None = None,
    detail: dict | None = None,
) -> None:
    """Append one row to audit_logs.
    Silently swallows errors so a logging failure never breaks the request."""
    try:
        entry = AuditLog(
            action=action,
            user_id=user_id,
            target_user_id=target_user_id,
            ip_address=ip,
            detail=json.dumps(detail) if detail else None,
        )
        db.add(entry)
        db.flush()
    except Exception:
        pass


def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    # Guard: wrong password OR soft-deleted account — same error to prevent enumeration
    if (
        not user
        or not verify_password(payload.password, user.password_hash)
        or user.deleted_at is not None
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user.last_accessed_at = datetime.utcnow()
    _write_audit(db, AuditAction.USER_LOGIN, user_id=user.id, ip=_client_ip(request))
    db.commit()

    token = create_access_token(user)
    return TokenResponse(access_token=token, role=user.role.value)


@router.post("/admin/login", response_model=TokenResponse)
def admin_login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Admin-only login. Verifies email+password AND that the user is an admin
    before issuing a token. Non-admins get 401 — no token is ever issued to them
    through this endpoint, even with correct credentials."""
    user = db.query(User).filter(User.email == payload.email).first()
    if (
        not user
        or not verify_password(payload.password, user.password_hash)
        or user.deleted_at is not None
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user.last_accessed_at = datetime.utcnow()
    _write_audit(db, AuditAction.USER_LOGIN, user_id=user.id, ip=_client_ip(request),
                 detail={"role": "ADMIN"})
    db.commit()

    token = create_access_token(user)
    return TokenResponse(access_token=token, role=user.role.value)


@router.post("/register", response_model=TokenResponse, status_code=201)
def register_candidate(
    payload: CandidateRegisterRequest, request: Request, db: Session = Depends(get_db)
):
    if not payload.consent_accepted:
        raise HTTPException(
            status_code=400,
            detail="You must accept the privacy notice to create an account.",
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if payload.product_type not in (ProductType.BASIC.value, ProductType.EXECUTIVE.value):
        raise HTTPException(status_code=400, detail="product_type must be BASIC or EXECUTIVE")

    now = datetime.utcnow()
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        product_type=payload.product_type,
        role=UserRole.USER,
        consent_given_at=now,
        last_accessed_at=now,
    )
    db.add(user)
    db.flush()  # get user.id before audit writes

    _write_audit(db, AuditAction.USER_REGISTER, user_id=user.id, ip=_client_ip(request),
                 detail={"product_type": payload.product_type})
    _write_audit(db, AuditAction.CONSENT_GIVEN, user_id=user.id, ip=_client_ip(request))

    db.commit()
    db.refresh(user)

    token = create_access_token(user)
    return TokenResponse(access_token=token, role=user.role.value)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently logged-in user's profile."""
    return current_user


@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == payload.email).first()

    if user and user.deleted_at is None:
        # Invalidate any existing unused tokens
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False,
        ).update({"used": True})

        raw_token = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(minutes=60)
        reset_entry = PasswordResetToken(
            user_id=user.id,
            token_hash=PasswordResetToken.hash_token(raw_token),
            expires_at=expires,
        )
        db.add(reset_entry)
        _write_audit(db, AuditAction.PASSWORD_RESET_REQUEST,
                     user_id=user.id, ip=_client_ip(request))
        db.commit()

        send_reset_email(user.email, raw_token)

    # Always return generic message to prevent email enumeration
    return {"message": "If an account with that email exists, you will receive a password reset link shortly."}


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)
):
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

    pw = payload.new_password
    if (
        len(pw) < 8
        or not any(c.islower() for c in pw)
        or not any(c.isupper() for c in pw)
        or not any(c.isdigit() for c in pw)
        or not any(not c.isalnum() for c in pw)
    ):
        raise HTTPException(status_code=400, detail="Password does not meet strength requirements.")

    user = db.query(User).filter(User.id == db_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = hash_password(payload.new_password)
    db_token.used = True
    user.token_version += 1

    _write_audit(db, AuditAction.PASSWORD_RESET_COMPLETE,
                 user_id=user.id, ip=_client_ip(request))
    db.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}


@router.post("/logout", status_code=204)
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _write_audit(db, AuditAction.USER_LOGOUT,
                 user_id=current_user.id, ip=_client_ip(request))
    current_user.token_version += 1
    db.commit()

"""
CRUD endpoints for managing Forms (versions of the question set,
e.g. 'BRET v1', 'BRET Executive 2027').
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Form, AssessmentSession, User
from app.schemas import FormCreate, FormUpdate, FormOut
from app.auth import require_admin, get_current_user
from app.services.form_completion import is_form_complete

router = APIRouter(prefix="/forms", tags=["Forms"])


@router.post("/", response_model=FormOut, status_code=201)
def create_form(
    payload: FormCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    form = Form(**payload.model_dump())
    db.add(form)

    db.commit()
    db.refresh(form)
    return form


@router.get("/", response_model=list[FormOut])
def list_forms(
    active_only: bool | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """List forms. Any logged-in user can read; pass ?active_only=true for the
    candidate portal (only forms an admin has marked active)."""
    query = db.query(Form)
    if active_only:
        query = query.filter(Form.is_active.is_(True))
    return query.order_by(Form.created_at.desc()).all()


@router.get("/{form_id}", response_model=FormOut)
def get_form(
    form_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    form = db.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form


@router.put("/{form_id}", response_model=FormOut)
def update_form(
    form_id: int,
    payload: FormUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    form = db.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    updates = payload.model_dump(exclude_unset=True)
    if updates.get("is_active") is True:
        if not is_form_complete(db, form.id):
            raise HTTPException(
                status_code=400,
                detail="Cannot activate form: each section must contain exactly 10 questions.",
            )
    for field, value in updates.items():
        setattr(form, field, value)

    db.commit()
    db.refresh(form)
    return form


@router.delete("/{form_id}", status_code=204)
def delete_form(
    form_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    form = db.get(Form, form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    # Block deletion if any sessions are attached to this form
    session_count = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.form_id == form_id)
        .count()
    )
    if session_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete: {session_count} session(s) are linked to this form. Delete the sessions first.",
        )

    db.delete(form)
    db.commit()
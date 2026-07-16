"""
CRUD endpoints for managing Behavioural Types (formerly "Sections").
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import BehaviouralType, User
from app.schemas import BehaviouralTypeCreate, BehaviouralTypeUpdate, BehaviouralTypeOut
from app.auth import require_admin, get_current_user

router = APIRouter(prefix="/behavioural-types", tags=["Behavioural Types"])


@router.post("/", response_model=BehaviouralTypeOut, status_code=201)
def create_behavioural_type(
    payload: BehaviouralTypeCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    existing = (
        db.query(BehaviouralType)
        .filter(BehaviouralType.form_id == payload.form_id, BehaviouralType.code == payload.code)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Behavioural type with code '{payload.code}' already exists",
        )

    bt = BehaviouralType(**payload.model_dump())
    db.add(bt)
    db.commit()
    db.refresh(bt)
    return bt


@router.get("/", response_model=list[BehaviouralTypeOut])
def list_behavioural_types(
    form_id: int | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(BehaviouralType)
    if form_id is not None:
        query = query.filter(BehaviouralType.form_id == form_id)
    return query.order_by(BehaviouralType.order_index).all()


@router.get("/{behavioural_type_id}", response_model=BehaviouralTypeOut)
def get_behavioural_type(
    behavioural_type_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    bt = db.get(BehaviouralType, behavioural_type_id)
    if not bt:
        raise HTTPException(status_code=404, detail="Behavioural type not found")
    return bt


@router.put("/{behavioural_type_id}", response_model=BehaviouralTypeOut)
def update_behavioural_type(
    behavioural_type_id: int,
    payload: BehaviouralTypeUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    bt = db.get(BehaviouralType, behavioural_type_id)
    if not bt:
        raise HTTPException(status_code=404, detail="Behavioural type not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(bt, field, value)

    db.commit()
    db.refresh(bt)
    return bt


@router.delete("/{behavioural_type_id}", status_code=204)
def delete_behavioural_type(
    behavioural_type_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    bt = db.get(BehaviouralType, behavioural_type_id)
    if not bt:
        raise HTTPException(status_code=404, detail="Behavioural type not found")

    if bt.questions:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a behavioural type that still has questions attached",
        )

    db.delete(bt)
    db.commit()
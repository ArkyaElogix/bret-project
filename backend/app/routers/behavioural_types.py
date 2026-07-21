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



# @router.get("/", response_model=list[BehaviouralTypeOut])
# def list_behavioural_types(
#     form_id: int | None = None,
#     db: Session = Depends(get_db),
#     _user: User = Depends(get_current_user),
# ):
#     query = db.query(BehaviouralType)
#     if form_id is not None:
#         query = query.filter(BehaviouralType.form_id == form_id)
#     return query.order_by(BehaviouralType.order_index).all()

@router.get("/", response_model=list[BehaviouralTypeOut])
def list_behavioural_types(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return db.query(BehaviouralType).order_by(BehaviouralType.order_index).all()


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

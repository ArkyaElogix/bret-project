"""
CRUD endpoints for managing Behavioural Factors
(e.g. 'Altruistic', 'Emotional', 'Power', 'Existential'), scoped to a behavioural_type.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import BehaviouralFactor, BehaviouralType, Question, User
from app.schemas import (
    BehaviouralFactorCreate,
    BehaviouralFactorUpdate,
    BehaviouralFactorOut,
)
from app.auth import require_admin, get_current_user

router = APIRouter(prefix="/behavioural-factors", tags=["Behavioural Factors"])


@router.get("/", response_model=list[BehaviouralFactorOut])
def list_behavioural_factors(
    behavioural_type_id: int | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(BehaviouralFactor)
    if behavioural_type_id is not None:
        query = query.filter(
            BehaviouralFactor.behavioural_type_id == behavioural_type_id
        )
    return query.order_by(
        BehaviouralFactor.behavioural_type_id, BehaviouralFactor.order_index
    ).all()


@router.get("/{factor_id}", response_model=BehaviouralFactorOut)
def get_behavioural_factor(
    factor_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    factor = db.get(BehaviouralFactor, factor_id)
    if not factor:
        raise HTTPException(status_code=404, detail="Behavioural factor not found")
    return factor

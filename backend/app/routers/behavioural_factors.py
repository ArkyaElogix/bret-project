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
from app.auth import require_admin

router = APIRouter(prefix="/behavioural-factors", tags=["Behavioural Factors"])


@router.post("/", response_model=BehaviouralFactorOut, status_code=201)
def create_behavioural_factor(
    payload: BehaviouralFactorCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    behavioural_type = db.get(BehaviouralType, payload.behavioural_type_id)
    if not behavioural_type:
        raise HTTPException(status_code=404, detail="Behavioural type not found")

    factor = BehaviouralFactor(**payload.model_dump())
    db.add(factor)
    db.commit()
    db.refresh(factor)
    return factor


@router.get("/", response_model=list[BehaviouralFactorOut])
def list_behavioural_factors(
    behavioural_type_id: int | None = None, db: Session = Depends(get_db)
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
def get_behavioural_factor(factor_id: int, db: Session = Depends(get_db)):
    factor = db.get(BehaviouralFactor, factor_id)
    if not factor:
        raise HTTPException(status_code=404, detail="Behavioural factor not found")
    return factor


@router.put("/{factor_id}", response_model=BehaviouralFactorOut)
def update_behavioural_factor(
    factor_id: int,
    payload: BehaviouralFactorUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    factor = db.get(BehaviouralFactor, factor_id)
    if not factor:
        raise HTTPException(status_code=404, detail="Behavioural factor not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(factor, field, value)

    db.commit()
    db.refresh(factor)
    return factor


@router.delete("/{factor_id}", status_code=204)
def delete_behavioural_factor(
    factor_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    factor = db.get(BehaviouralFactor, factor_id)
    if not factor:
        raise HTTPException(status_code=404, detail="Behavioural factor not found")

    in_use = (
        db.query(Question)
        .filter(
            (Question.option_a_factor_id == factor_id)
            | (Question.option_b_factor_id == factor_id)
        )
        .first()
    )
    if in_use:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a behavioural factor still referenced by a question",
        )

    db.delete(factor)
    db.commit()
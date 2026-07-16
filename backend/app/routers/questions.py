"""
Endpoints for managing the question bank. Scoring (factor mapping) lives
directly on the Question row. Every question now belongs to a specific Form.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Question, BehaviouralType, BehaviouralFactor, Form, User
from app.schemas import QuestionCreate, QuestionOut, QuestionUpdate
from app.auth import require_admin, get_current_user

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.post("/", response_model=QuestionOut, status_code=201)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    if not db.get(Form, payload.form_id):
        raise HTTPException(status_code=404, detail="Form not found")

    behavioural_type = db.get(BehaviouralType, payload.behavioural_type_id)
    if not behavioural_type:
        raise HTTPException(status_code=404, detail="Behavioural type not found")

    for factor_id in (payload.option_a_factor_id, payload.option_b_factor_id):
        if factor_id is not None and not db.get(BehaviouralFactor, factor_id):
            raise HTTPException(
                status_code=404, detail=f"Behavioural factor {factor_id} not found"
            )

    question = Question(**payload.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/", response_model=list[QuestionOut])
def list_questions(
    form_id: int | None = None,
    behavioural_type_id: int | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Question)
    if form_id is not None:
        query = query.filter(Question.form_id == form_id)
    if behavioural_type_id is not None:
        query = query.filter(Question.behavioural_type_id == behavioural_type_id)
    return query.order_by(
        Question.form_id, Question.behavioural_type_id, Question.number
    ).all()


@router.get("/{question_id}", response_model=QuestionOut)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.put("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    for factor_id in (payload.option_a_factor_id, payload.option_b_factor_id):
        if factor_id is not None and not db.get(BehaviouralFactor, factor_id):
            raise HTTPException(
                status_code=404, detail=f"Behavioural factor {factor_id} not found"
            )

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(question, field, value)

    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}", status_code=204)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()
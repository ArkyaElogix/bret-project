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
from app.services.form_completion import is_form_complete

router = APIRouter(prefix="/questions", tags=["Questions"])

def count_factor_usage(
    db: Session,
    form_id: int,
    behavioural_type_id: int,
    factor_id: int,
    exclude_question_id: int | None = None,
) -> int:
    query = db.query(Question).filter(
        Question.form_id == form_id,
        Question.behavioural_type_id == behavioural_type_id,
        (
            (Question.option_a_factor_id == factor_id)
            | (Question.option_b_factor_id == factor_id)
        ),
    )

    if exclude_question_id is not None:
        query = query.filter(Question.id != exclude_question_id)

    total = 0
    for question in query.all():
        if question.option_a_factor_id == factor_id:
            total += 1
        if question.option_b_factor_id == factor_id:
            total += 1

    return total

def count_questions_in_section(
    db: Session,
    form_id: int,
    behavioural_type_id: int,
    exclude_question_id: int | None = None,
) -> int:
    query = db.query(Question).filter(
        Question.form_id == form_id,
        Question.behavioural_type_id == behavioural_type_id,
    )
    if exclude_question_id is not None:
        query = query.filter(Question.id != exclude_question_id)
    return query.count()

def validate_section_question_limit(
    db: Session,
    form_id: int,
    behavioural_type_id: int,
    exclude_question_id: int | None = None,
):
    if count_questions_in_section(
        db,
        form_id=form_id,
        behavioural_type_id=behavioural_type_id,
        exclude_question_id=exclude_question_id,
    ) >= 10:
        raise HTTPException(
            status_code=400,
            detail="Each section can contain at most 10 questions.",
        )

def deactivate_form_for_edit(db: Session, form) -> None:
    if form.is_active:
        form.is_active = False
        db.add(form)

def validate_factor_usage_limit(
    db: Session,
    form_id: int,
    behavioural_type_id: int,
    option_a_factor_id: int,
    option_b_factor_id: int,
    exclude_question_id: int | None = None,
):
    new_counts: dict[int, int] = {}

    for factor_id in (option_a_factor_id, option_b_factor_id):
        new_counts[factor_id] = new_counts.get(factor_id, 0) + 1

    for factor_id, added_count in new_counts.items():
        existing_count = count_factor_usage(
            db,
            form_id=form_id,
            behavioural_type_id=behavioural_type_id,
            factor_id=factor_id,
            exclude_question_id=exclude_question_id,
        )

        if existing_count + added_count > 5:
            raise HTTPException(
                status_code=400,
                detail="Each behavioural factor can only be applied 5 times per section.",
            )

def validate_factor_for_section(
    db: Session,
    factor_id: int,
    behavioural_type_id: int,
):
    factor = db.get(BehaviouralFactor, factor_id)
    if not factor:
        raise HTTPException(status_code=404, detail=f"Behavioural factor {factor_id} not found")

    if factor.behavioural_type_id != behavioural_type_id:
        raise HTTPException(
            status_code=400,
            detail="Selected factor does not belong to this section",
        )


@router.post("/", response_model=QuestionOut, status_code=201)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    form = db.get(Form, payload.form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    deactivate_form_for_edit(db, form)

    behavioural_type = db.get(BehaviouralType, payload.behavioural_type_id)
    if not behavioural_type:
        raise HTTPException(status_code=404, detail="Behavioural type not found")

    if payload.option_a_factor_id == payload.option_b_factor_id:
        raise HTTPException(
            status_code=400,
            detail="The two selected factors must be different.",
        )

    validate_factor_for_section(db, payload.option_a_factor_id, payload.behavioural_type_id)
    validate_factor_for_section(db, payload.option_b_factor_id, payload.behavioural_type_id)
    validate_section_question_limit(
        db,
        form_id=payload.form_id,
        behavioural_type_id=payload.behavioural_type_id,
    )
    validate_factor_usage_limit(db, form_id=payload.form_id, behavioural_type_id=payload.behavioural_type_id, option_a_factor_id=payload.option_a_factor_id, option_b_factor_id=payload.option_b_factor_id)
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

    form = db.get(Form, question.form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    deactivate_form_for_edit(db, form)

    for factor_id in (payload.option_a_factor_id, payload.option_b_factor_id):
        if not db.get(BehaviouralFactor, factor_id):
            raise HTTPException(
                status_code=404, detail=f"Behavioural factor {factor_id} not found"
            )
    if payload.option_a_factor_id == payload.option_b_factor_id:
        raise HTTPException(
            status_code=400,
            detail="The two selected factors must be different.",
    )

    updates = payload.model_dump(exclude_unset=True)
    target_section_id = updates.get("behavioural_type_id", question.behavioural_type_id)

    validate_factor_for_section(db, payload.option_a_factor_id, target_section_id)
    validate_factor_for_section(db, payload.option_b_factor_id, target_section_id)
    validate_section_question_limit(
        db,
        form_id=question.form_id,
        behavioural_type_id=target_section_id,
        exclude_question_id=question.id,
    )
    validate_factor_usage_limit(
        db,
        form_id=question.form_id,
        behavioural_type_id=target_section_id,
        option_a_factor_id=payload.option_a_factor_id,
        option_b_factor_id=payload.option_b_factor_id,
        exclude_question_id=question.id,
    )
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

    form = db.get(Form, question.form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    deactivate_form_for_edit(db, form)

    db.delete(question)
    db.commit()
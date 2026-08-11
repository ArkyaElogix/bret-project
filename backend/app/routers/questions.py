"""
Endpoints for managing the question bank. Scoring (factor mapping) lives
directly on the Question row. Every question now belongs to a specific Form.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Question, BehaviouralType, BehaviouralFactor, Form, User, AssessmentSession, SessionStatus
from app.schemas import QuestionCreate, QuestionOut, QuestionUpdate
from app.auth import require_admin, get_current_user
from app.services.form_completion import is_form_complete

router = APIRouter(prefix="/questions", tags=["Questions"])

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


def validate_section_distribution(
    db: Session,
    form_id: int,
    behavioural_type_id: int,
    exclude_question_id: int | None = None,
):
    question_count = count_questions_in_section(
        db,
        form_id=form_id,
        behavioural_type_id=behavioural_type_id,
        exclude_question_id=exclude_question_id,
    )

    if question_count < 10:
        raise HTTPException(
            status_code=400,
            detail="Each section must contain at least 10 questions.",
        )

    if question_count % 2 != 0:
        raise HTTPException(
            status_code=400,
            detail="Each section must contain an even number of questions.",
        )

    factors = db.query(BehaviouralFactor).filter(
        BehaviouralFactor.behavioural_type_id == behavioural_type_id
    ).all()
    if len(factors) != 4:
        raise HTTPException(
            status_code=400,
            detail="Each section must define exactly 4 behavioural factors.",
        )

    required_count = (question_count * 2) // 4
    actual_counts: dict[int, int] = {factor.id: 0 for factor in factors}

    query = db.query(Question).filter(
        Question.form_id == form_id,
        Question.behavioural_type_id == behavioural_type_id,
    )
    if exclude_question_id is not None:
        query = query.filter(Question.id != exclude_question_id)

    for question in query.all():
        actual_counts[question.option_a_factor_id] += 1
        actual_counts[question.option_b_factor_id] += 1

    for factor in factors:
        actual = actual_counts[factor.id]
        if actual != required_count:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{question_count} questions requires each factor to appear "
                    f"{required_count} times — {factor.name} currently appears "
                    f"{actual} times"
                ),
            )


def normalize_section_question_numbers(
    db: Session,
    form_id: int,
    behavioural_type_id: int,
) -> None:
    questions = (
        db.query(Question)
        .filter(
            Question.form_id == form_id,
            Question.behavioural_type_id == behavioural_type_id,
        )
        .order_by(Question.number)
        .all()
    )

    for index, question in enumerate(questions, start=1):
        if question.number != index:
            question.number = index
            db.add(question)


def get_section_factor_counts(
    db: Session,
    form_id: int,
    behavioural_type_id: int,
    exclude_question_id: int | None = None,
) -> tuple[dict[int, int], list[BehaviouralFactor]]:
    factors = db.query(BehaviouralFactor).filter(
        BehaviouralFactor.behavioural_type_id == behavioural_type_id
    ).all()
    counts: dict[int, int] = {f.id: 0 for f in factors}

    q = db.query(Question).filter(
        Question.form_id == form_id,
        Question.behavioural_type_id == behavioural_type_id,
    )
    if exclude_question_id is not None:
        q = q.filter(Question.id != exclude_question_id)

    for question in q.all():
        counts[question.option_a_factor_id] = counts.get(question.option_a_factor_id, 0) + 1
        counts[question.option_b_factor_id] = counts.get(question.option_b_factor_id, 0) + 1

    return counts, factors


def validate_factor_progressive_limit(
    db: Session,
    form_id: int,
    behavioural_type_id: int,
    option_a_factor_id: int,
    option_b_factor_id: int,
    exclude_question_id: int | None = None,
):
    counts, factors = get_section_factor_counts(
        db, form_id, behavioural_type_id, exclude_question_id=exclude_question_id
    )

    if len(factors) != 4:
        raise HTTPException(
            status_code=400,
            detail="Each section must define exactly 4 behavioural factors.",
        )

    new_counts = counts.copy()
    for fid in (option_a_factor_id, option_b_factor_id):
        new_counts[fid] = new_counts.get(fid, 0) + 1

    question_count = count_questions_in_section(
        db,
        form_id=form_id,
        behavioural_type_id=behavioural_type_id,
        exclude_question_id=exclude_question_id,
    )

    if question_count < 10:
        for fid in (option_a_factor_id, option_b_factor_id):
            existing = counts.get(fid, 0)
            if new_counts[fid] > 5:
                factor = next((f for f in factors if f.id == fid), None)
                name = factor.name if factor else str(fid)
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Before a section has 10 questions, each factor can be used at most 5 times — "
                        f"{name} currently appears {existing} times"
                    ),
                )
        return

    current_min = min(counts.values())
    current_max = max(counts.values())
    current_balance = current_max - current_min

    proposed_min = min(new_counts.values())
    proposed_max = max(new_counts.values())
    proposed_balance = proposed_max - proposed_min

    if current_balance <= 1:
        if proposed_balance > 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Proposed factor usage would become unbalanced: "
                    f"{proposed_max}-{proposed_min} = {proposed_balance}. "
                    f"Keep all factor counts within one of each other."
                ),
            )
    else:
        if proposed_balance > current_balance:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Proposed change would increase imbalance from {current_balance} to {proposed_balance}. "
                    f"Use lower-count factors until the section is balanced."
                ),
            )
        if proposed_max > current_max + 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Cannot increase a factor above {current_max + 1} when the current highest count is {current_max}. "
                    f"Slow down the leading factor and let the others catch up."
                ),
            )

def deactivate_form_for_edit(db: Session, form) -> None:
    """
    Deactivates a form when its questions are being edited.
    Blocks the edit entirely if any sessions are currently in progress,
    since changing questions mid-assessment would corrupt ongoing responses.
    """
    if not form.is_active:
        return  # Already inactive, nothing to do

    active_session_count = (
        db.query(AssessmentSession)
        .filter(
            AssessmentSession.form_id == form.id,
            AssessmentSession.status == SessionStatus.in_progress
        )
        .count()
    )
    if active_session_count > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot edit this form: {active_session_count} candidate session(s) are currently "
                f"in progress. Wait for all active sessions to be submitted before making changes."
            ),
        )

    form.is_active = False
    db.add(form)


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

def shift_questions_up(
    db: Session,
    form_id: int,
    behavioural_type_id: int,
    start_number: int,
):
    questions = (
        db.query(Question)
        .filter(
            Question.form_id == form_id,
            Question.behavioural_type_id == behavioural_type_id,
            Question.number >= start_number,
        )
        .order_by(Question.number.desc())
        .all()
    )
    for question in questions:
        question.number += 1
        db.add(question)


def shift_questions_down(
    db: Session,
    form_id: int,
    behavioural_type_id: int,
    start_number: int,
):
    questions = (
        db.query(Question)
        .filter(
            Question.form_id == form_id,
            Question.behavioural_type_id == behavioural_type_id,
            Question.number >= start_number,
        )
        .order_by(Question.number.asc())
        .all()
    )
    for question in questions:
        question.number -= 1
        db.add(question)

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

    validate_factor_progressive_limit(
        db,
        form_id=payload.form_id,
        behavioural_type_id=payload.behavioural_type_id,
        option_a_factor_id=payload.option_a_factor_id,
        option_b_factor_id=payload.option_b_factor_id,
    )

    # Make room for the requested question number by shifting existing numbers >= payload.number
    normalize_section_question_numbers(
        db,
        payload.form_id,
        payload.behavioural_type_id,
    )

    if payload.number is not None:
        shift_questions_up(
            db,
            payload.form_id,
            payload.behavioural_type_id,
            payload.number,
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

    # Validate progressive factor limits (exclude this question so we measure current state)
    validate_factor_progressive_limit(
        db,
        form_id=question.form_id,
        behavioural_type_id=target_section_id,
        option_a_factor_id=payload.option_a_factor_id,
        option_b_factor_id=payload.option_b_factor_id,
        exclude_question_id=question.id,
    )

    # If the question's number is being changed, adjust the surrounding numbers to keep a dense sequence.
    new_number = updates.get("number")
    normalize_section_question_numbers(
        db, question.form_id, target_section_id
    )

    if new_number is not None and new_number != question.number:
        old_number = question.number
        if new_number > old_number:
            questions = (
                db.query(Question)
                .filter(
                    Question.form_id == question.form_id,
                    Question.behavioural_type_id == target_section_id,
                    Question.id != question.id,
                    Question.number > old_number,
                    Question.number <= new_number,
                )
                .order_by(Question.number.asc())
                .all()
            )
            for existing in questions:
                existing.number -= 1
                db.add(existing)
        else:
            questions = (
                db.query(Question)
                .filter(
                    Question.form_id == question.form_id,
                    Question.behavioural_type_id == target_section_id,
                    Question.id != question.id,
                    Question.number >= new_number,
                    Question.number < old_number,
                )
                .order_by(Question.number.desc())
                .all()
            )
            for existing in questions:
                existing.number += 1
                db.add(existing)
    
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
    deleted_number = question.number
    db.delete(question)
    db.flush()

    normalize_section_question_numbers(db, form.id, question.behavioural_type_id)
    db.commit()
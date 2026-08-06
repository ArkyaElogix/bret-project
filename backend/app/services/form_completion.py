from sqlalchemy.orm import Session

from app.models.models import BehaviouralType, BehaviouralFactor, Question


def is_section_complete(db: Session, form_id: int, behavioural_type_id: int) -> bool:
    question_count = (
        db.query(Question)
        .filter(
            Question.form_id == form_id,
            Question.behavioural_type_id == behavioural_type_id,
        )
        .count()
    )
    if question_count < 10 or question_count % 2 != 0:
        return False

    factors = (
        db.query(BehaviouralFactor)
        .filter(BehaviouralFactor.behavioural_type_id == behavioural_type_id)
        .all()
    )
    if len(factors) != 4:
        return False

    required_count = (question_count * 2) // 4
    counts: dict[int, int] = {factor.id: 0 for factor in factors}

    for question in db.query(Question).filter(
        Question.form_id == form_id,
        Question.behavioural_type_id == behavioural_type_id,
    ).all():
        counts[question.option_a_factor_id] += 1
        counts[question.option_b_factor_id] += 1

    return all(counts[factor.id] == required_count for factor in factors)


def is_form_complete(db: Session, form_id: int) -> bool:
    sections = db.query(BehaviouralType).all()
    if len(sections) != 3:
        return False

    return all(
        is_section_complete(db, form_id, section.id)
        for section in sections
    )
from sqlalchemy.orm import Session

from app.models.models import BehaviouralType, Question

def is_form_complete(db: Session, form_id: int) -> bool:
    sections = db.query(BehaviouralType).all()
    if len(sections) != 3:
        return False

    for section in sections:
        count = (
            db.query(Question)
            .filter(
                Question.form_id == form_id,
                Question.behavioural_type_id == section.id,
            )
            .count()
        )
        if count != 10:
            return False

    return True
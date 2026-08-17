"""
Scoring logic: given a completed (or in-progress) session, tally up how
many times each behavioural factor was selected, per section, and store
the result in section_scores.

Currently implements RAW COUNTS (matches the original "compute raw column
totals" requirement). NOTE: the section_scores.score column was specced
as int 0-5, which hints at a possible normalization/scaling step -- this
hasn't been defined anywhere yet, so raw counts are used as-is. Flag this
with the team before treating these numbers as final.
"""

from sqlalchemy.orm import Session

from app.models.models import Response as ResponseModel, Question, SectionScore, AssessmentSession


def calculate_and_store_scores(session_id: int, db: Session) -> list[SectionScore]:
    session = db.get(AssessmentSession, session_id)
    if not session:
        return []

    # 1. Find all distinct sections and factors linked to this form's questions
    questions = db.query(Question).filter(Question.form_id == session.form_id).all()
    
    # Initialize tallies to 0 for all possible factors in this form
    tallies: dict[tuple[int, int], int] = {}
    for q in questions:
        if q.option_a_factor_id:
            tallies[(q.behavioural_type_id, q.option_a_factor_id)] = 0
        if q.option_b_factor_id:
            tallies[(q.behavioural_type_id, q.option_b_factor_id)] = 0

    # 2. Pull responses
    responses = (
        db.query(ResponseModel)
        .join(Question, ResponseModel.question_id == Question.id)
        .filter(ResponseModel.session_id == session_id)
        .all()
    )

    # 3. Add to tallies
    for response in responses:
        question = response.question
        factor_id = (
            question.option_a_factor_id
            if response.chosen_option.value == "A"
            else question.option_b_factor_id
        )
        if factor_id is None:
            continue
        
        key = (question.behavioural_type_id, factor_id)
        if key in tallies:
            tallies[key] += 1
        else:
            tallies[key] = 1 # Fallback safeguard

    # 4. Clear any previous scores for this session, then write fresh ones
    db.query(SectionScore).filter(SectionScore.session_id == session_id).delete()

    results = []
    for (section_id, factor_id), count in tallies.items():
        score_row = SectionScore(
            session_id=session_id,
            section_id=section_id,
            factor_id=factor_id,
            score=count,
        )
        db.add(score_row)
        results.append(score_row)

    db.flush()
    return results


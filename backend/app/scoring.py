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

from app.models.models import Response as ResponseModel, Question, SectionScore


def calculate_and_store_scores(session_id: int, db: Session) -> list[SectionScore]:
    # pull every answered response for this session, joined to its question
    # (need the question to know which factor each chosen option maps to)
    responses = (
        db.query(ResponseModel)
        .join(Question, ResponseModel.question_id == Question.id)
        .filter(ResponseModel.session_id == session_id)
        .all()
    )

    # tally: {(section_id, factor_id): count}
    tallies: dict[tuple[int, int], int] = {}
    for response in responses:
        question = response.question
        factor_id = (
            question.option_a_factor_id
            if response.chosen_option.value == "A"
            else question.option_b_factor_id
        )
        if factor_id is None:
            continue  # this option scores nothing, skip
        key = (question.behavioural_type_id, factor_id)
        tallies[key] = tallies.get(key, 0) + 1

    # clear any previous scores for this session, then write fresh ones
    # (simplest way to handle re-scoring without diffing old vs new)
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

    db.commit()
    for r in results:
        db.refresh(r)
    return results
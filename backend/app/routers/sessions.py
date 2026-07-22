"""
Endpoints for the actual assessment-taking flow: starting/resuming a
session, submitting answers (autosave), checking progress, and
finalizing submission.

All endpoints require login. A session's user_id now comes from the
logged-in token, not a client-supplied value. Regular users can only
access their own sessions; admins can access any session (needed for
reviewing responses later).
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import (
    AssessmentSession,
    Response as ResponseModel,
    Question,
    User,
    UserRole,
    Form,
    SectionScore,
    BehaviouralFactor,
    BehaviouralType,
    SessionStatus,
    ProductType,
    OptionLetter,
)
from app.schemas import (
    SessionStartRequest,
    SessionOut,
    AnswerSubmit,
    ResponseOut,
    SessionProgressOut,
    SectionScoreOut,
    SessionFullOut,
    FactorResultOut,
    SectionResultOut,
)
from app.scoring import calculate_and_store_scores
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/sessions", tags=["Sessions"])


def _get_owned_session(session_id: int, db: Session, current_user: User) -> AssessmentSession:
    """Fetch a session and enforce that only its owner or an admin can access it."""
    session = db.get(AssessmentSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized for this session")
    return session


@router.post("/start", response_model=SessionOut)
def start_or_resume_session(
    payload: SessionStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not db.get(Form, payload.form_id):
        raise HTTPException(status_code=404, detail="Form not found")

    # If the user already has an in-progress session for THIS form, return it
    # (resume). We do NOT auto-resume across different forms — that's a hard
    # rule below to force users to finish what they started.
    existing_for_form = (
        db.query(AssessmentSession)
        .filter(
            AssessmentSession.user_id == current_user.id,
            AssessmentSession.form_id == payload.form_id,
            AssessmentSession.status == SessionStatus.in_progress,
        )
        .first()
    )
    if existing_for_form:
        return existing_for_form

    # Hard gate: block starting a new session if the user has any other
    # in-progress session elsewhere. Users must finish (submit) the current
    # one before they can begin a new form.
    blocking = (
        db.query(AssessmentSession)
        .filter(
            AssessmentSession.user_id == current_user.id,
            AssessmentSession.status == SessionStatus.in_progress,
        )
        .first()
    )
    if blocking:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "You must finish your in-progress assessment before starting a new one.",
                "existing_session_id": blocking.id,
                "existing_form_id": blocking.form_id,
            },
        )

    session = AssessmentSession(
        user_id=current_user.id,
        form_id=payload.form_id,
        status=SessionStatus.in_progress,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/me", response_model=list[SessionOut])
def list_my_sessions(
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's own sessions, newest first. Optional status
    filter. Used by the candidate portal to show resume/start/completed state
    per form."""
    query = db.query(AssessmentSession).filter(AssessmentSession.user_id == current_user.id)
    if status_filter is not None:
        query = query.filter(AssessmentSession.status == status_filter)
    return query.order_by(AssessmentSession.created_at.desc()).all()


@router.post("/{session_id}/answers", response_model=ResponseOut)
def submit_answer(
    session_id: int,
    payload: AnswerSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, db, current_user)
    if session.status != SessionStatus.in_progress:
        raise HTTPException(status_code=400, detail="Session is already submitted")

    question = db.get(Question, payload.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if question.form_id != session.form_id:
        raise HTTPException(
            status_code=400, detail="Question does not belong to this session's form"
        )
    if payload.chosen_option not in (OptionLetter.A.value, OptionLetter.B.value):
        raise HTTPException(status_code=400, detail="chosen_option must be A or B")

    # upsert on (session_id, question_id)
    existing = (
        db.query(ResponseModel)
        .filter(
            ResponseModel.session_id == session_id,
            ResponseModel.question_id == payload.question_id,
        )
        .first()
    )
    if existing:
        existing.chosen_option = payload.chosen_option
        db.commit()
        db.refresh(existing)
        return existing

    response = ResponseModel(
        session_id=session_id,
        question_id=payload.question_id,
        chosen_option=payload.chosen_option,
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


@router.get("/{session_id}/progress", response_model=SessionProgressOut)
def get_session_progress(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, db, current_user)

    responses = (
        db.query(ResponseModel).filter(ResponseModel.session_id == session_id).all()
    )
    return SessionProgressOut(
        session=session,
        answered_question_ids=[r.question_id for r in responses],
        responses=responses,
    )


@router.post("/{session_id}/submit", response_model=SessionOut)
def submit_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, db, current_user)
    if session.status != SessionStatus.in_progress:
        raise HTTPException(status_code=400, detail="Session is already submitted")

    total_questions = (
        db.query(Question).filter(Question.form_id == session.form_id).count()
    )
    answered = (
        db.query(ResponseModel).filter(ResponseModel.session_id == session_id).count()
    )
    if answered < total_questions:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit: {answered}/{total_questions} questions answered",
        )

    session.status = SessionStatus.submitted
    session.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(session)

    calculate_and_store_scores(session_id, db)

    return session


@router.get("/{session_id}/scores", response_model=list[SectionScoreOut])
def get_session_scores(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, db, current_user)

    scores = (
        db.query(SectionScore).filter(SectionScore.session_id == session_id).all()
    )
    return scores


@router.get("/{session_id}/results", response_model=list[SectionResultOut])
def get_session_results(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return per-factor totals and percentages across all sections for a submitted session."""
    session = _get_owned_session(session_id, db, current_user)

    scores = (
        db.query(SectionScore).filter(SectionScore.session_id == session_id).all()
    )

    if not scores:
        return []

    # Gather factor and section metadata in one pass
    factor_ids = {s.factor_id for s in scores}
    section_ids = {s.section_id for s in scores}

    factors = {f.id: f for f in db.query(BehaviouralFactor).filter(BehaviouralFactor.id.in_(factor_ids)).all()}
    sections = db.query(BehaviouralType).filter(BehaviouralType.id.in_(section_ids)).order_by(BehaviouralType.order_index).all()


    by_section: dict[int, dict[int, int]] = {}
    for row in scores:
        by_section.setdefault(row.section_id, {})[row.factor_id] = row.score

    results: list[SectionResultOut] = []
    for section in sections:
        factor_scores = by_section.get(section.id)
        if not factor_scores:
            continue

        section_total = sum(factor_scores.values())
        factor_results = []
        for fid, score in factor_scores.items():
            factor = factors.get(fid)
            pct = round(score / section_total * 100, 1) if section_total > 0 else 0.0
            factor_results.append(FactorResultOut(
                factor_id=fid,
                factor_name=factor.name if factor else f"Factor {fid}",
                score=score,
                percentage=pct,
            ))
        factor_results.sort(key=lambda r: r.score, reverse=True)

        results.append(SectionResultOut(
            section_id=section.id,
            section_code=section.code,
            section_name=section.name,
            factors=factor_results,
        ))

    return results

@router.get("/", response_model=list[SessionOut])
def list_all_sessions(
    form_id: int | None = None,
    user_id: int | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only: list all sessions across all users, for review purposes."""
    query = db.query(AssessmentSession)
    if form_id is not None:
        query = query.filter(AssessmentSession.form_id == form_id)
    if user_id is not None:
        query = query.filter(AssessmentSession.user_id == user_id)
    if status_filter is not None:
        query = query.filter(AssessmentSession.status == status_filter)
    return query.order_by(AssessmentSession.created_at.desc()).all()


@router.get("/{session_id}/full", response_model=SessionFullOut)
def get_session_full(
    session_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only: full review of one session — all its answers plus final scores."""
    session = db.get(AssessmentSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    responses = (
        db.query(ResponseModel).filter(ResponseModel.session_id == session_id).all()
    )
    scores = (
        db.query(SectionScore).filter(SectionScore.session_id == session_id).all()
    )
    return SessionFullOut(session=session, responses=responses, scores=scores)


@router.delete("/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only: hard-delete a session and all its responses and scores."""
    session = db.get(AssessmentSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()

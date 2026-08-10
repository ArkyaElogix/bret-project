"""
Endpoints for the actual assessment-taking flow: starting/resuming a
session, submitting answers (autosave), checking progress, and
finalizing submission.

All endpoints require login. A session's user_id now comes from the
logged-in token, not a client-supplied value. Regular users can only
access their own sessions; admins can access any session (needed for
reviewing responses later).
"""
import json
import os
import time
from typing import Any, Dict, List
from datetime import datetime, timedelta
from app.services.ai_report_service import AIReportService
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
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
    AccountType,
    ReportStatement,
    OptionLetter,
    SessionActivityAction,
    SessionActivityLog,
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
    SessionReportOut,
    SessionActivityOut,
    PageNavigateRequest,
)
from app.scoring import calculate_and_store_scores
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/sessions", tags=["Sessions"])

def _log_activity(db: Session, session_id: int, action: SessionActivityAction, detail: dict = None):
    try:
        log = SessionActivityLog(
            session_id=session_id,
            action=action,
            detail=json.dumps(detail) if detail else None
        )
        db.add(log)
    except Exception as e:
        print(f"Failed to log activity: {e}")

def _build_basic_report_factor(
    factor_id: int,
    factor_name: str,
    score: int = 0,
    statement: str = "",
    title: str | None = None,
) -> dict[str, Any]:
    return {
        "factor_id": factor_id,
        "factor_name": factor_name,
        "raw_score": score,
        "score": score,
        "score_label": None,
        "statement_title": title,
        "statement": statement,
    }


def _build_basic_report_payload(session: AssessmentSession, db: Session) -> dict[str, Any]:
    user_name = session.user_name or (session.user.name if session.user else "Participant")
    account_type = (
        session.user.account_type.value
        if session.user and session.user.account_type
        else "BASIC"
    )
    form_name = session.form_name or (session.form.name if session.form else "Assessment")

    # --- ADD THIS TO FETCH REAL SCORES ---
    from app.models.models import SectionScore
    real_scores = db.query(SectionScore).filter(SectionScore.session_id == session.id).all()
    score_map = {s.factor_id: s.score for s in real_scores}
    # -------------------------------------

    sections = [
        {
            "section_id": 1001,
            "section_code": "LETTER",
            "section_name": "Discovery Letter",
            "factors": [
                _build_basic_report_factor(
                    0,
                    "Welcome",
                    0,
                    (
                        f"Dear {user_name}, this report offers a reflective view of your intrinsic drives, "
                        f"conditioned impulses, and acquired communication patterns. "
                        f"It is designed to help you understand your behavioral blueprint with clarity, "
                        f"purpose, and intentional self-awareness."
                    ),
                    "Discovery Letter",
                )
            ],
        },
        {
            "section_id": 1002,
            "section_code": "DEF",
            "section_name": "Definitions: Drives",
            "section_definitions": "Drives act as the deep-seated currents guiding your behavioral journey. Contemplating these intrinsic impulses reveals the 'WHY' behind your interactions and decisions.",
            "factors": [
                _build_basic_report_factor(
                    1,
                    "Altruistic Drive",
                    0,
                    "A drive rooted in service, empathy, and the welfare of others. It reflects concern for the collective and a desire to contribute beyond personal benefit.",
                    "Definition",
                ),
                _build_basic_report_factor(
                    2,
                    "Emotional Drive",
                    0,
                    "A drive guided by the heart and the human element. It reflects warmth, connection, and sensitivity to the emotional reality around you.",
                    "Definition",
                ),
                _build_basic_report_factor(
                    3,
                    "Power Drive",
                    0,
                    "A drive toward influence, impact, and responsibility. It reflects your desire to shape outcomes and lead with purpose.",
                    "Definition",
                ),
                _build_basic_report_factor(
                    4,
                    "Existential Drive",
                    0,
                    "A grounding force centered on stability, comfort, and self-preservation. It reflects the need to protect personal well-being while pursuing meaningful goals.",
                    "Definition",
                ),
            ],
        },
        {
            "section_id": 1003,
            "section_code": "DEF",
            "section_name": "Definitions: Conditioning Factors",
            "section_definitions": "Conditioning factors reflect our internal compass for navigating change. They describe how we mindfully interpret shifts in our environment, balancing the urge for novelty with the wisdom of stability and established order.",
            "factors": [
                _build_basic_report_factor(
                    5,
                    "Innovator",
                    0,
                    "A mindset inclined toward possibility, exploration, and new ideas. It reflects curiosity and the urge to rethink what already exists.",
                    "Definition",
                ),
                _build_basic_report_factor(
                    6,
                    "Adopter",
                    0,
                    "A mindset that values social acceptance and practical adaptation. It reflects your ability to work with new ideas once their value is clear.",
                    "Definition",
                ),
                _build_basic_report_factor(
                    7,
                    "Evaluator",
                    0,
                    "A mindset rooted in analysis, discipline, and careful judgment. It reflects a preference for evidence before action.",
                    "Definition",
                ),
                _build_basic_report_factor(
                    8,
                    "Preserver",
                    0,
                    "A mindset that values order, continuity, and stability. It reflects a preference to protect what works and maintain consistency.",
                    "Definition",
                ),
            ],
        },
        {
            "section_id": 1004,
            "section_code": "DEF",
            "section_name": "Definitions: Acquired Factors",
            "section_definitions": "Acquired factors represent the intentional communication styles we cultivate to navigate our environment. They reflect how we thoughtfully adapt our expression to connect, influence, and respond to the world around us",
            "factors": [
                _build_basic_report_factor(
                    9,
                    "Authoritative",
                    0,
                    "A style of taking charge and creating direction. It reflects decisiveness and confidence in leading people or situations.",
                    "Definition",
                ),
                _build_basic_report_factor(
                    10,
                    "Directive",
                    0,
                    "A style grounded in structure, standards, and clear guidance. It reflects a preference for rules and defined expectations.",
                    "Definition",
                ),
                _build_basic_report_factor(
                    11,
                    "Emotive",
                    0,
                    "A style that communicates with warmth and feeling. It reflects the ability to connect through expression and human engagement.",
                    "Definition",
                ),
                _build_basic_report_factor(
                    12,
                    "Placative",
                    0,
                    "A style centered on harmony, calm, and accommodation. It reflects a desire to reduce friction and create smooth interpersonal movement.",
                    "Definition",
                ),
            ],
        },
        {
            "section_id": 1005,
            "section_code": "A",
            "section_name": "Drives Profile",
            "factors": [
                _build_basic_report_factor(
                    1,
                    "Altruistic",
                    score_map.get(1,0),
                    f"{user_name} shows a balanced concern for others and for meaningful contribution. You are likely to support causes that benefit the wider collective, while also protecting your own boundaries.",
                    "Profile Insight",
                ),
                _build_basic_report_factor(
                    2,
                    "Emotional",
                    score_map.get(2,0),
                    f"{user_name} is likely to make decisions with a strong awareness of human impact and interpersonal connection. Emotion plays an important role in how you relate to others and judge situations.",
                    "Profile Insight",
                ),
                _build_basic_report_factor(
                    3,
                    "Power",
                    score_map.get(3,0),
                    f"{user_name} appears to value influence and meaningful responsibility. You tend to take seriously the need to shape outcomes and contribute in a visible, accountable way.",
                    "Profile Insight",
                ),
                _build_basic_report_factor(
                    4,
                    "Existential",
                    score_map.get(4,0),
                    f"{user_name} appears grounded in stability and self-preservation. You tend to protect your own comfort and security while remaining aware of broader responsibilities.",
                    "Profile Insight",
                ),
            ],
        },
        {
            "section_id": 1006,
            "section_code": "B",
            "section_name": "Conditioning: Change Orientation",
            "factors": [
                _build_basic_report_factor(
                    5,
                    "Innovator",
                    0,
                    f"{user_name} is likely to respond to change with thoughtful curiosity rather than immediate rejection. You are open to new possibilities, especially when they offer growth and meaningful improvement.",
                    "Profile Insight",
                ),
                _build_basic_report_factor(
                    6,
                    "Adopter",
                    score_map.get(6,0),
                    f"{user_name} tends to adapt to change once the value of a new approach is clear. You often prefer confirmation and practical reassurance before fully embracing a shift.",
                    "Profile Insight",
                ),
                _build_basic_report_factor(
                    7,
                    "Evaluator",
                    score_map.get(7,0),
                    f"{user_name} is likely to assess change through evidence and sound judgment. You want clarity, structure, and reason before moving forward.",
                    "Profile Insight",
                ),
                _build_basic_report_factor(
                    8,
                    "Preserver",
                    score_map.get(8,0),
                    f"{user_name} values continuity and stability in changing environments. You tend to protect what is working while remaining mindful of practical adaptation.",
                    "Profile Insight",
                ),
            ],
        },
        {
            "section_id": 1007,
            "section_code": "C",
            "section_name": "Acquired Communication Style",
            "factors": [
                _build_basic_report_factor(
                    9,
                    "Authoritative",
                    score_map.get(9,0),
                    f"{user_name} likely communicates with clarity and intent when leadership is needed. You are able to take charge when the situation demands direction and accountability.",
                    "Profile Insight",
                ),
                _build_basic_report_factor(
                    10,
                    "Directive",
                    score_map.get(10,0),
                    f"{user_name} likely values structure and clear expectations in communication. You tend to prefer guidance that brings predictability and order to interaction.",
                    "Profile Insight",
                ),
                _build_basic_report_factor(
                    11,
                    "Emotive",
                    score_map.get(11,0),
                    f"{user_name} is likely to connect well with others through expression and emotional awareness. Your communication can feel human, warm, and engaging when the context allows it.",
                    "Profile Insight",
                ),
                _build_basic_report_factor(
                    12,
                    "Placative",
                    score_map.get(12,0),
                    f"{user_name} tends to communicate in ways that preserve harmony and reduce tension. You are likely to value rapport, calmness, and mutually respectful interaction.",
                    "Profile Insight",
                ),
            ],
        },
        {
            "section_id": 1008,
            "section_code": "OBS",
            "section_name": "Overall Observations",
            "factors": [
                _build_basic_report_factor(
                    0,
                    "Integrated Behavioral Pattern",
                    0,
                    (
                        f"{user_name}'s profile suggests a balanced and reflective style of functioning. "
                        f"You appear capable of combining empathy, structure, and self-awareness in a way that supports meaningful growth and effective interaction."
                    ),
                    "Overall Observations",
                )
            ],
        },
    ]

    return {
        "session": session,
        "user": {
            "name": user_name,
            "product_type": account_type,
        },
        "form": {
            "id": session.form.id if session.form else session.form_id,
            "name": form_name,
        },
        "sections": sections,
    }

def delayed_cache_report(session_id: int, ai_report: dict, is_test_bypass: bool):
    """
    Waits 60 seconds before caching the report to ensure all AI background 
    processes have completely finalized the data structure.
    """
    time.sleep(60)
    
    # We must create a fresh database session because the original one 
    # attached to the request will already be closed by this time.
    db = SessionLocal()
    try:
        session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
        if not session:
            return
            
        # Verify it's a complete report
        is_complete = all(key in ai_report for key in [
            "overall_observations", 
            "action_agenda",
            "drives_profile"
        ])
        
        # Only cache if it's complete, and either it's a test bypass or it hasn't been cached yet
        if is_complete and (not session.ai_report_data or is_test_bypass):
            session.ai_report_data = ai_report
            db.commit()
            
    except Exception as e:
        print(f"Delayed cache failed: {e}")
    finally:
        db.close()


@router.get("/{session_id}/report", response_model=SessionReportOut)
def get_session_report(
    session_id: int,
    background_tasks: BackgroundTasks,  # <--- Add this parameter
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = _get_owned_session(session_id, db, current_user)

    if session.status != SessionStatus.submitted:
        raise HTTPException(status_code=400, detail="Session is not submitted yet")

    use_ai = os.getenv("USE_AI_REPORT", "true").lower() == "true"

    if use_ai:
        try:
            is_test_bypass = (current_user.role == UserRole.ADMIN and session.user_id == current_user.id)
            
            ai_report = None
            
            # Use cached report if it exists and we are not bypassing
            if session.ai_report_data and not is_test_bypass:
                ai_report = session.ai_report_data
            else:
                # Generate new report
                ai_service = AIReportService()
                ai_report = ai_service.generate_report(session_id, db)
                
                # Send the caching task to the background to wait 60 seconds
                background_tasks.add_task(delayed_cache_report, session_id, ai_report, is_test_bypass)

            # Format the raw AI dictionary for the UI
            ai_sections = _format_ai_report_for_response(ai_report, db)
            
            basic_payload = _build_basic_report_payload(session, db)
            
            static_sections = [
                s for s in basic_payload["sections"]
                if s["section_code"] in ("LETTER", "DEF")
            ]
            
            return {
                "session": session,
                "user": basic_payload["user"],
                "form": basic_payload["form"],
                "sections": static_sections + ai_sections,
            }
        except Exception as e:
            print(f"AI report generation failed: {e}")
    
    return _build_basic_report_payload(session, db)


def _ensure_form_available_for_new_session(form: Form) -> None:
    if not form.is_active:
        raise HTTPException(
            status_code=403,
            detail="This assessment is no longer available.",
        )

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
    form = db.get(Form, payload.form_id)
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    _ensure_form_available_for_new_session(form)

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
        _log_activity(db, existing_for_form.id, SessionActivityAction.SESSION_RESUME) # <--- ADD THIS
        db.commit()
        return existing_for_form

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
        prior_attempt_claimed=payload.prior_attempt_claimed,
        prior_attempt_details=payload.prior_attempt_details,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    _log_activity(db, session.id, SessionActivityAction.SESSION_START)
    db.commit()
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
    
    if session.expires_at and session.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This session has expired (24 hour limit reached).")

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
        _log_activity(db, session_id, SessionActivityAction.ANSWER_CHANGE, {"question_id": payload.question_id, "to": payload.chosen_option})
        db.commit()
        db.refresh(existing)
        return existing

    response = ResponseModel(
        session_id=session_id,
        question_id=payload.question_id,
        chosen_option=payload.chosen_option,
    )
    db.add(response)
    _log_activity(db, session_id, SessionActivityAction.ANSWER_SUBMIT, {"question_id": payload.question_id, "option": payload.chosen_option})
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
    background_tasks: BackgroundTasks,
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
    _log_activity(db, session_id, SessionActivityAction.SESSION_SUBMIT)
    db.commit()
    db.refresh(session)

    calculate_and_store_scores(session_id, db)

    # --- Phase 2: Duplicates & Email ---
    from app.services.duplicate_service import check_and_flag_duplicates, register_applicant
    from app.services.email_service import send_report_email
    import json

    # 1. Check for duplicates
    flags = check_and_flag_duplicates(session, current_user, db)
    if flags:
        from app.models.models import AuditAction, AuditLog
        audit = AuditLog(
            action=AuditAction.DUPLICATE_FLAGGED,
            user_id=current_user.id,
            target_user_id=current_user.id,
            detail=json.dumps({"flag_count": len(flags)})
        )
        db.add(audit)
        db.commit()

    # 2. Register permanent applicant record
    register_applicant(session, current_user, db)
    
    # 3. Queue the report email background task
    background_tasks.add_task(send_report_email, current_user.email, current_user.name, session.id)

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

# app/routers/sessions.py (updated get_session_report)



# @router.get("/{session_id}/report", response_model=SessionReportOut)
# def get_session_report(
#     session_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     session = _get_owned_session(session_id, db, current_user)
#     if session.status != SessionStatus.submitted:
#         raise HTTPException(status_code=400, detail="Session is not submitted yet")
    
#     # Use AI report generation
#     ai_service = AIReportService()
#     try:
#         ai_report = ai_service.generate_report(session_id, db)
#     except Exception as e:
#         # Fallback to static report if AI fails
#         return _generate_static_report(session_id, db)
    
#     # Transform AI report to match existing schema
#     return {
#         "session": session,
#         "user": {"name": session.user.name, "account_type": session.user.account_type.value},
#         "form": {"id": session.form.id, "name": session.form.name},
#         "sections": _format_ai_report_for_response(ai_report, db)
#     }

def _format_ai_report_for_response(ai_report: dict, db: Session) -> list:
    """Format AI report to match SessionReportOut schema."""
    sections = []
    
    # Convert each AI-generated profile to the expected format
    for profile_type in ["drives_profile", "conditioning_profile", "communication_profile"]:
        profile = ai_report.get(profile_type, {})
        if not profile:
            continue
        
        # Get or create section data
        section = {
            "section_id": 0,  # Placeholder
            "section_code": profile.get("section_code", ""),
            "section_name": profile.get("section_name", ""),
            "factors": []
        }
        
        # Add composite insight as the first factor
        if profile.get("composite_insight"):
            section["factors"].append({
                "factor_id": 0,
                "factor_name": "COMPOSITE INSIGHT",
                "raw_score": 0,
                "score": 0,
                "score_label": None,
                "statement_title": None,
                "statement": profile["composite_insight"]
            })
        
        # Add individual factors
        for factor in profile.get("factors", []):
            section["factors"].append({
                "factor_id": 0,
                "factor_name": factor["factor_name"],
                "raw_score": int(factor.get("score",0)),
                "score": factor.get("score",0),
                "score_label": factor.get("score_label",""),
                "statement_title": f"{factor['factor_name']} ({factor['score_label']})",
                "statement": factor["description"]
            })
        
        sections.append(section)
    
    # Add orientation insights
    orientation = ai_report.get("orientation_insights", {})
    if orientation:
        orientations_section = {
            "section_id": 0,
            "section_code": "O",
            "section_name": "Orientation Insights",
            "factors": []
        }
        for key, value in orientation.items():
            orientations_section["factors"].append({
                "factor_id": 0,
                "factor_name": key.replace("_", " ").title(),
                "raw_score": 0,
                "score": 0,
                "score_label": None,
                "statement_title": f"{key.replace('_', ' ').title()} Orientation",
                "statement": value
            })
        sections.append(orientations_section)
    
    # Add overall observations
    observations = ai_report.get("overall_observations", {})
    if observations:
        observations_section = {
            "section_id": 0,
            "section_code": "O",
            "section_name": "Overall Observations",
            "factors": []
        }
        if observations.get("integrated_pattern"):
            observations_section["factors"].append({
                "factor_id": 0,
                "factor_name": "INTEGRATED BEHAVIORAL PATTERN",
                "raw_score": 0,
                "score": 0,
                "score_label": None,
                "statement_title": "Integrated Behavioral Pattern",
                "statement": observations["integrated_pattern"]
            })
        if observations.get("key_takeaways"):
            observations_section["factors"].append({
                "factor_id": 0,
                "factor_name": "Key Takeaways",
                "raw_score": 0,
                "score": 0,
                "score_label": None,
                "statement_title": "Key Takeaways",
                "statement": "\n".join(f"• {item}" for item in observations["key_takeaways"])
            })
        sections.append(observations_section)
    agenda = ai_report.get("action_agenda", {})
    if agenda:
        agenda_section = {
            "section_id": 0,
            "section_code": "AGENDA",
            "section_name": "Action Agenda",
            "factors": []
        }
        # Focus areas
        if agenda.get("focus_areas"):
            agenda_section["factors"].append({
                "factor_id": 0,
                "factor_name": "Focus Areas",
                "raw_score": 0,
                "score": 0,
                "score_label": None,
                "statement_title": "Focus Areas",
                "statement": "\n".join(f"• {item}" for item in agenda["focus_areas"])
            })
        # 90-Day Roadmap
        # roadmap = agenda.get("roadmap", {})
        # if roadmap:
        #     agenda_section["factors"].append({
        #         "factor_id": 0,
        #         "factor_name": "Roadmap",
        #         "raw_score": 0,
        #         "score": 0,
        #         "score_label": None,
        #         "statement_title": "90-Day Roadmap",
        #         "statement": json.dumps({
        #             "30": roadmap.get("30", ""),
        #             "60": roadmap.get("60", ""),
        #             "90": roadmap.get("90", "")
        #         })
        #     })
                # 90-Day Roadmap
        roadmap = agenda.get("roadmap", {})
        if roadmap:
            # Helper to resiliently find keys containing '30', '60', or '90'
            def get_roadmap_phase(rd, phase):
                for key, value in rd.items():
                    if str(phase) in str(key):
                        return value
                return ""

            # Ensure each roadmap phase is converted to a plain string so the
            # frontend does not receive nested objects (which React cannot render
            # directly as children).
            def stringify_phase(val):
                if val is None:
                    return ""
                if isinstance(val, (str, int, float)):
                    return str(val)
                # If it's a dict or list, make a readable string representation
                if isinstance(val, dict):
                    return "\n".join(f"{k.title()}: {v}" for k, v in val.items())
                if isinstance(val, list):
                    parts = []
                    for item in val:
                        if isinstance(item, dict):
                            parts.append("\n".join(f"{k.title()}: {v}" for k, v in item.items()))
                        else:
                            parts.append(str(item))
                    return "\n\n".join(parts)
                try:
                    return json.dumps(val)
                except Exception:
                    return str(val)

            agenda_section["factors"].append({
                "factor_id": 0,
                "factor_name": "Roadmap",
                "raw_score": 0,
                "score": 0,
                "score_label": None,
                "statement_title": "90-Day Roadmap",
                "statement": json.dumps({
                    "30": stringify_phase(get_roadmap_phase(roadmap, 30)),
                    "60": stringify_phase(get_roadmap_phase(roadmap, 60)),
                    "90": stringify_phase(get_roadmap_phase(roadmap, 90)),
                })
            })

        # SSC Framework
        ssc = agenda.get("ssc", {})
        if ssc:
    # Ensure SSC pieces are strings (they may be objects from the AI)
            def ssc_str(v):
                if v is None:
                    return ""
                if isinstance(v, (str, int, float)):
                    return str(v)
                if isinstance(v, dict):
                    return "\n".join(f"{k.title()}: {val}" for k, val in v.items())
                if isinstance(v, list):
                    parts = []
                    for item in v:
                        if isinstance(item, dict):
                            parts.append("\n".join(f"{k.title()}: {val}" for k, val in item.items()))
                        else:
                            parts.append(str(item))
                    return "\n\n".join(parts)
                try:
                    return json.dumps(v)
                except Exception:
                    return str(v)

            agenda_section["factors"].append({
                "factor_id": 0,
                "factor_name": "SSC Framework",
                "raw_score": 0,
                "score": 0,
                "score_label": None,
                "statement_title": "SSC Framework",
                "statement": json.dumps({
                    "start": ssc_str(ssc.get("start", "")),
                    "stop": ssc_str(ssc.get("stop", "")),
                    "continue": ssc_str(ssc.get("continue", ""))
                })
            })
        sections.append(agenda_section)
    return sections

@router.post("/{session_id}/activity/navigate", status_code=204)
def log_navigation(
    session_id: int,
    payload: PageNavigateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log a stepper navigation event (candidate or admin preview)."""
    session = _get_owned_session(session_id, db, current_user)
    _log_activity(db, session.id, SessionActivityAction.PAGE_NAVIGATE, {
        "from_step": payload.from_step,
        "to_step": payload.to_step
    })
    db.commit()
@router.get("/{session_id}/activity", response_model=SessionActivityOut)
def get_session_activity(
    session_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Admin-only: Get full activity log and behavioral analysis for a session."""
    events = db.query(SessionActivityLog).filter(
        SessionActivityLog.session_id == session_id
    ).order_by(SessionActivityLog.created_at.asc()).all()
    if not events:
        return {
            "events": [],
            "summary": {
                "total_events": 0, "first_event_at": None, "last_event_at": None,
                "total_active_minutes": 0, "answer_count": 0, "answer_change_count": 0,
                "avg_seconds_per_answer": 0, "fastest_answer_seconds": 0, "slowest_answer_seconds": 0,
                "idle_gaps": [], "flags": []
            }
        }
    # Compute Summary & Flags
    total_events = len(events)
    first_event = events[0].created_at
    last_event = events[-1].created_at
    total_active_minutes = (last_event - first_event).total_seconds() / 60.0
    answer_count = sum(1 for e in events if e.action == SessionActivityAction.ANSWER_SUBMIT)
    answer_change_count = sum(1 for e in events if e.action == SessionActivityAction.ANSWER_CHANGE)
    resumes = sum(1 for e in events if e.action == SessionActivityAction.SESSION_RESUME)
    idle_gaps = []
    answer_durations = []
    
    for i in range(1, len(events)):
        prev = events[i-1]
        curr = events[i]
        diff_seconds = (curr.created_at - prev.created_at).total_seconds()
        
        # Idle Gaps > 10 minutes (600 seconds)
        if diff_seconds > 600:
            idle_gaps.append({"after_event_id": prev.id, "gap_minutes": round(diff_seconds / 60.0, 1)})
            
        # Answer Speeds
        if curr.action in (SessionActivityAction.ANSWER_SUBMIT, SessionActivityAction.ANSWER_CHANGE):
            # Ignore durations > 5 minutes for average speed (likely stepped away)
            if diff_seconds < 300:
                answer_durations.append(diff_seconds)
    avg_speed = sum(answer_durations) / len(answer_durations) if answer_durations else 0
    fastest = min(answer_durations) if answer_durations else 0
    slowest = max(answer_durations) if answer_durations else 0
    net_active_minutes = total_active_minutes - sum(g["gap_minutes"] for g in idle_gaps)

    flags = []
    if answer_count >= 20 and net_active_minutes > 0 and net_active_minutes < 5:
        flags.append({"type": "FAST_COMPLETION", "message": f"Completed assessment in {round(net_active_minutes, 1)} minutes active time."})
    
    if fastest > 0 and fastest < 2.0:
        flags.append({"type": "VERY_FAST_ANSWER", "message": f"At least one answer was submitted in {fastest:.1f}s."})
        
    for gap in idle_gaps:
        if gap["gap_minutes"] > 30:
            flags.append({"type": "LONG_IDLE", "message": f"Extended idle gap of {gap['gap_minutes']} minutes detected."})

    if answer_count > 0 and (answer_change_count / answer_count) > 0.2:
        flags.append({"type": "HIGH_CHANGE_RATE", "message": f"Changed {answer_change_count} answers (high indecision rate)."})
        
    if resumes >= 3:
        flags.append({"type": "FREQUENT_RESTARTS", "message": f"Session was resumed {resumes} times."})

    summary = {
        "total_events": total_events,
        "first_event_at": first_event,
        "last_event_at": last_event,
        "total_active_minutes": round(net_active_minutes, 1), # <-- Now uses net active time!
        "answer_count": answer_count,
        "answer_change_count": answer_change_count,
        "session_resumes": resumes,
        "avg_seconds_per_answer": round(avg_speed, 1),
        "fastest_answer_seconds": round(fastest, 1),
        "slowest_answer_seconds": round(slowest, 1),
        "idle_gaps": idle_gaps,
        "flags": flags
    }

    return {"events": events, "summary": summary}
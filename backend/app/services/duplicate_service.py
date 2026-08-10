import hashlib
import re
import Levenshtein
from sqlalchemy.orm import Session
from app.models.models import AssessmentSession, User, ApplicantRegistry, DuplicateFlag, MatchType, MatchConfidence

FUZZY_THRESHOLD = 0.80

def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode().lower().strip()).hexdigest()

def normalize_name(name: str) -> str:
    return re.sub(r'\s+', ' ', name.lower().strip())

def normalize_address(address: str | None) -> str | None:
    if not address:
        return None
    return re.sub(r'\s+', ' ', address.lower().strip())

def _create_flag(session: AssessmentSession, user: User, prior: ApplicantRegistry, match_type: MatchType, confidence: MatchConfidence, db: Session) -> DuplicateFlag:
    flag = DuplicateFlag(
        new_session_id=session.id,
        new_user_id=user.id,
        prior_registry_id=prior.id,
        prior_session_id=prior.session_id,
        match_type=match_type,
        match_confidence=confidence,
    )
    db.add(flag)
    db.flush()
    return flag

def check_and_flag_duplicates(session: AssessmentSession, user: User, db: Session) -> list[DuplicateFlag]:
    """
    Checks for exact email/phone matches, and fuzzy name+address matches.
    Returns a list of DuplicateFlag rows created (empty = no match).
    """
    flags = []

    # --- Pass 1: Exact email match ---
    email_hash = _sha256(user.email)
    prior_email = db.query(ApplicantRegistry).filter(
        ApplicantRegistry.email_hash == email_hash,
        ApplicantRegistry.original_user_id != user.id
    ).first()
    
    if prior_email:
        flags.append(_create_flag(session, user, prior_email, MatchType.EMAIL, MatchConfidence.EXACT, db))

    # --- Pass 2: Exact phone match ---
    if user.phone and not flags:
        phone_hash = _sha256(user.phone)
        prior_phone = db.query(ApplicantRegistry).filter(
            ApplicantRegistry.phone_hash == phone_hash,
            ApplicantRegistry.original_user_id != user.id
        ).first()
        
        if prior_phone:
            flags.append(_create_flag(session, user, prior_phone, MatchType.PHONE, MatchConfidence.EXACT, db))

    # --- Pass 3: Fuzzy name + address match ---
    # Only run if no exact match found yet to avoid double-flagging
    if not flags:
        norm_name = normalize_name(user.name)
        norm_addr = normalize_address(user.address)
        
        # Fetch all priors that aren't this user
        all_priors = db.query(ApplicantRegistry).filter(
            ApplicantRegistry.original_user_id != user.id
        ).all()
        
        for prior in all_priors:
            # Check name fuzzy
            name_fuzzy = (norm_name == prior.name_normalized) or (Levenshtein.ratio(norm_name, prior.name_normalized) >= FUZZY_THRESHOLD)
            
            # Check address fuzzy
            addr_fuzzy = False
            if user.address and prior.address_normalized:
                addr_fuzzy = (norm_addr == prior.address_normalized) or (Levenshtein.ratio(norm_addr, prior.address_normalized) >= FUZZY_THRESHOLD)
                
            # Must match BOTH heavily to flag
            if name_fuzzy and addr_fuzzy:
                flags.append(_create_flag(session, user, prior, MatchType.NAME_ADDRESS, MatchConfidence.FUZZY, db))
                break  # Just flag the first found for fuzzy
                
    return flags

def register_applicant(session: AssessmentSession, user: User, db: Session) -> ApplicantRegistry:
    """
    Writes a permanent registry entry after the duplicate check is finished.
    """
    entry = ApplicantRegistry(
        email=user.email,
        email_hash=_sha256(user.email),
        phone=user.phone,
        phone_hash=_sha256(user.phone) if user.phone else None,
        name_normalized=normalize_name(user.name),
        address_normalized=normalize_address(user.address),
        original_user_id=user.id,
        session_id=session.id,
    )
    db.add(entry)
    db.flush()
    return entry

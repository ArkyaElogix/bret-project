import hashlib
import re
from collections import defaultdict
from datetime import datetime

import Levenshtein
from sqlalchemy.orm import Session

from app.models.models import (
    AssessmentSession,
    User,
    ApplicantRegistry,
    DuplicateFlag,
    MatchType,
    MatchConfidence,
)

FUZZY_THRESHOLD = 0.80
STRONG_SINGLE_FIELD_THRESHOLD = 0.90


def _sha256(value: str) -> str:
    return hashlib.sha256(value.encode().lower().strip()).hexdigest()


def normalize_name(name: str) -> str:
    return re.sub(r"\s+", " ", name.lower().strip())


def normalize_address(address: str | None) -> str | None:
    if not address:
        return None
    return re.sub(r"\s+", " ", address.lower().strip())


def normalize_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = re.sub(r"\D+", "", phone)
    if len(digits) > 10 and digits.startswith("91"):
        digits = digits[-10:]
    return digits or None


def _ratio(left: str | None, right: str | None) -> float:
    if not left or not right:
        return 0.0
    return Levenshtein.ratio(left, right)


def _extract_prior_attempt_fields(text: str | None) -> dict:
    if not text:
        return {
            "emails": [],
            "phones": [],
            "names": [],
            "addresses": [],
            "dates_or_timeframes": [],
            "raw_text": "",
        }

    raw = text.strip()

    emails = sorted(set(re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", raw, flags=re.I)))

    phone_candidates = re.findall(
        r"(?:\+?\d[\d\s().-]{7,}\d)",
        raw,
    )
    phones = sorted(
        {
            normalized
            for candidate in phone_candidates
            if (normalized := normalize_phone(candidate))
        }
    )

    names = []
    name_patterns = [
        r"(?:name|named|under name|as)\s*[:\-]?\s*([A-Za-z][A-Za-z .'-]{2,80})",
        r"(?:i am|i'm|this is)\s+([A-Za-z][A-Za-z .'-]{2,80})",
    ]
    for pattern in name_patterns:
        for match in re.findall(pattern, raw, flags=re.I):
            cleaned = re.split(r"[,.;\n]", match, maxsplit=1)[0].strip()
            if cleaned:
                names.append(normalize_name(cleaned))

    addresses = []
    address_patterns = [
        r"(?:address|location|city|from|at)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9 ,./#'-]{3,120})",
    ]
    for pattern in address_patterns:
        for match in re.findall(pattern, raw, flags=re.I):
            cleaned = re.split(r"[;\n]", match, maxsplit=1)[0].strip()
            if cleaned:
                addresses.append(normalize_address(cleaned))

    dates_or_timeframes = sorted(
        set(
            re.findall(
                r"\b(?:20\d{2}|19\d{2}|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|last year|this year|last month|few months ago)\b",
                raw,
                flags=re.I,
            )
        )
    )

    return {
        "emails": sorted(set(emails)),
        "phones": phones,
        "names": sorted(set(names)),
        "addresses": sorted(set(filter(None, addresses))),
        "dates_or_timeframes": dates_or_timeframes,
        "raw_text": raw,
    }


def _add_match(matches_by_prior: dict, prior: ApplicantRegistry, match: dict) -> None:
    matches_by_prior[prior.id]["prior"] = prior
    matches_by_prior[prior.id]["matches"].append(match)


def _choose_primary_match(matches: list[dict]) -> tuple[MatchType, MatchConfidence]:
    exact_priority = [
        ("registration_email", MatchType.EMAIL),
        ("prior_attempt_email", MatchType.EMAIL),
        ("registration_phone", MatchType.PHONE),
        ("prior_attempt_phone", MatchType.PHONE),
    ]

    match_fields = {match["field"] for match in matches}

    for field, match_type in exact_priority:
        if field in match_fields:
            return match_type, MatchConfidence.EXACT

    if "registration_name_address" in match_fields:
        return MatchType.NAME_ADDRESS, MatchConfidence.FUZZY

    if "prior_attempt_name_address" in match_fields:
        return MatchType.NAME_ADDRESS, MatchConfidence.FUZZY

    return MatchType.PRIOR_ATTEMPT, MatchConfidence.FUZZY


def _create_flag(
    session: AssessmentSession,
    user: User,
    prior: ApplicantRegistry | None,
    match_type: MatchType,
    confidence: MatchConfidence,
    evidence: dict,
    db: Session,
) -> DuplicateFlag:
    flag = DuplicateFlag(
        new_session_id=session.id,
        new_user_id=user.id,
        prior_registry_id=prior.id if prior else None,
        prior_session_id=prior.session_id if prior else None,
        match_type=match_type,
        match_confidence=confidence,
        match_evidence=evidence,
    )
    db.add(flag)
    db.flush()
    return flag


def check_and_flag_duplicates(session: AssessmentSession, user: User, db: Session) -> list[DuplicateFlag]:
    """
    Duplicate detection only applies to single-use applicants.

    It always checks registration fields:
    - exact email
    - exact/normalized phone
    - fuzzy name + address

    If the applicant self-discloses a prior attempt, it also parses the free-text
    details and compares every detected email, phone, name, and address against
    applicant_registry. It does not stop at the first match.
    """
    if not user.is_single_use:
        return []

    flags: list[DuplicateFlag] = []
    matches_by_prior: dict[int, dict] = defaultdict(lambda: {"prior": None, "matches": []})

    priors = (
        db.query(ApplicantRegistry)
        .filter(ApplicantRegistry.original_user_id != user.id)
        .all()
    )

    # Registration email.
    if user.email:
        email_hash = _sha256(user.email)
        for prior in priors:
            if prior.email_hash == email_hash:
                _add_match(
                    matches_by_prior,
                    prior,
                    {
                        "field": "registration_email",
                        "confidence": "EXACT",
                        "input": user.email,
                    },
                )

    # Registration phone.
    user_phone_normalized = normalize_phone(user.phone)
    if user.phone:
        phone_hash = _sha256(user.phone)
        for prior in priors:
            prior_phone_normalized = normalize_phone(prior.phone)
            if prior.phone_hash == phone_hash or (
                user_phone_normalized and prior_phone_normalized and user_phone_normalized == prior_phone_normalized
            ):
                _add_match(
                    matches_by_prior,
                    prior,
                    {
                        "field": "registration_phone",
                        "confidence": "EXACT",
                        "input": user.phone,
                    },
                )

    # Registration name + address.
    norm_name = normalize_name(user.name)
    norm_addr = normalize_address(user.address)
    for prior in priors:
        name_score = _ratio(norm_name, prior.name_normalized)
        addr_score = _ratio(norm_addr, prior.address_normalized)

        name_fuzzy = norm_name == prior.name_normalized or name_score >= FUZZY_THRESHOLD
        addr_fuzzy = bool(norm_addr and prior.address_normalized) and (
            norm_addr == prior.address_normalized or addr_score >= FUZZY_THRESHOLD
        )

        if name_fuzzy and addr_fuzzy:
            _add_match(
                matches_by_prior,
                prior,
                {
                    "field": "registration_name_address",
                    "confidence": "FUZZY",
                    "input": {
                        "name": user.name,
                        "address": user.address,
                    },
                    "scores": {
                        "name": round(name_score, 3),
                        "address": round(addr_score, 3),
                    },
                },
            )

    parsed_prior_attempt = None

    if session.prior_attempt_claimed:
        parsed_prior_attempt = _extract_prior_attempt_fields(session.prior_attempt_details)

        for prior in priors:
            # Prior-attempt emails.
            for email in parsed_prior_attempt["emails"]:
                if prior.email_hash == _sha256(email):
                    _add_match(
                        matches_by_prior,
                        prior,
                        {
                            "field": "prior_attempt_email",
                            "confidence": "EXACT",
                            "input": email,
                        },
                    )

            # Prior-attempt phones.
            prior_phone_normalized = normalize_phone(prior.phone)
            for phone in parsed_prior_attempt["phones"]:
                if prior_phone_normalized and phone == prior_phone_normalized:
                    _add_match(
                        matches_by_prior,
                        prior,
                        {
                            "field": "prior_attempt_phone",
                            "confidence": "EXACT",
                            "input": phone,
                        },
                    )

            # Prior-attempt name + address when both are present.
            for parsed_name in parsed_prior_attempt["names"]:
                for parsed_address in parsed_prior_attempt["addresses"]:
                    name_score = _ratio(parsed_name, prior.name_normalized)
                    addr_score = _ratio(parsed_address, prior.address_normalized)

                    if name_score >= FUZZY_THRESHOLD and addr_score >= FUZZY_THRESHOLD:
                        _add_match(
                            matches_by_prior,
                            prior,
                            {
                                "field": "prior_attempt_name_address",
                                "confidence": "FUZZY",
                                "input": {
                                    "name": parsed_name,
                                    "address": parsed_address,
                                },
                                "scores": {
                                    "name": round(name_score, 3),
                                    "address": round(addr_score, 3),
                                },
                            },
                        )

            # Strong single-field prior-attempt name match.
            for parsed_name in parsed_prior_attempt["names"]:
                name_score = _ratio(parsed_name, prior.name_normalized)
                if name_score >= STRONG_SINGLE_FIELD_THRESHOLD:
                    _add_match(
                        matches_by_prior,
                        prior,
                        {
                            "field": "prior_attempt_name",
                            "confidence": "FUZZY",
                            "input": parsed_name,
                            "score": round(name_score, 3),
                        },
                    )

            # Strong single-field prior-attempt address match.
            for parsed_address in parsed_prior_attempt["addresses"]:
                addr_score = _ratio(parsed_address, prior.address_normalized)
                if addr_score >= STRONG_SINGLE_FIELD_THRESHOLD:
                    _add_match(
                        matches_by_prior,
                        prior,
                        {
                            "field": "prior_attempt_address",
                            "confidence": "FUZZY",
                            "input": parsed_address,
                            "score": round(addr_score, 3),
                        },
                    )

    for item in matches_by_prior.values():
        prior = item["prior"]
        matches = item["matches"]
        match_type, confidence = _choose_primary_match(matches)

        evidence = {
            "created_at": datetime.utcnow().isoformat(),
            "sources": {
                "registration_fields": True,
                "prior_attempt_claimed": bool(session.prior_attempt_claimed),
            },
            "parsed_prior_attempt": parsed_prior_attempt,
            "matches": matches,
        }

        flags.append(
            _create_flag(
                session=session,
                user=user,
                prior=prior,
                match_type=match_type,
                confidence=confidence,
                evidence=evidence,
                db=db,
            )
        )

    if session.prior_attempt_claimed and not flags:
        evidence = {
            "created_at": datetime.utcnow().isoformat(),
            "sources": {
                "registration_fields": True,
                "prior_attempt_claimed": True,
            },
            "parsed_prior_attempt": parsed_prior_attempt,
            "matches": [],
            "manual_review_reason": "Applicant self-disclosed a prior attempt, but no registry match was found.",
        }

        flags.append(
            _create_flag(
                session=session,
                user=user,
                prior=None,
                match_type=MatchType.PRIOR_ATTEMPT,
                confidence=MatchConfidence.FUZZY,
                evidence=evidence,
                db=db,
            )
        )

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
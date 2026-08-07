"""
BRET Assessment - SQLAlchemy models
Target DB: MariaDB

Revision notes (per mentor feedback):
- sections -> renamed to behavioural_types
- new table: behavioural_factors
- scoring_rules merged into questions (option_a/b_column -> option_a/b_factor_id)
- assessment_sessions: id is now int (not UUID), added product_type, user_identifier -> user_id (FK)
- new table: users
- new table: section_scores
"""

import enum
from datetime import datetime
import hashlib

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    Enum,
    DateTime,
    Boolean,
    UniqueConstraint,
    JSON,
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class OptionLetter(str, enum.Enum):
    A = "A"
    B = "B"


class SessionStatus(str, enum.Enum):
    in_progress = "in_progress"
    submitted = "submitted"


class AccountType(str, enum.Enum):
    BASIC = "BASIC"
    EXECUTIVE = "EXECUTIVE"


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"

class AuditAction(str, enum.Enum):
    """Enum of privacy-sensitive actions recorded in the audit log."""
    USER_REGISTER            = "USER_REGISTER"
    USER_LOGIN               = "USER_LOGIN"
    USER_LOGOUT              = "USER_LOGOUT"
    DATA_EXPORT              = "DATA_EXPORT"
    ACCOUNT_DELETE           = "ACCOUNT_DELETE"
    PASSWORD_RESET_REQUEST   = "PASSWORD_RESET_REQUEST"
    PASSWORD_RESET_COMPLETE  = "PASSWORD_RESET_COMPLETE"
    ADMIN_VIEW_USER          = "ADMIN_VIEW_USER"
    ADMIN_VIEW_SESSION       = "ADMIN_VIEW_SESSION"
    CONSENT_GIVEN            = "CONSENT_GIVEN"

# class Form(Base):
#     """A specific version/set of questions, e.g. 'BRET v1', 'BRET Executive 2027'.
#     Sections (behavioural_types) and factors are shared across all forms —
#     only the actual questions differ between forms."""
#     __tablename__ = "forms"

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     name = Column(String(255), nullable=False)
#     is_active = Column(Boolean, nullable=False, default=False)  # only one should be True at a time
#     created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

#     questions = relationship("Question", back_populates="form", cascade="all, delete-orphan")
#     sessions = relationship("AssessmentSession", back_populates="form")
#     behavioural_types = relationship("BehaviouralType", back_populates="form", cascade="all, delete-orphan")


# class BehaviouralType(Base):
#     """Formerly 'sections' — A, B, C."""
#     __tablename__ = "behavioural_types"

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
#     code = Column(String(1), nullable=False)  # 'A', 'B', 'C'
#     name = Column(String(100), nullable=False)
#     instructions = Column(Text, nullable=True)
#     order_index = Column(Integer, nullable=False, default=0)

#     questions = relationship(
#         "Question", back_populates="behavioural_type", order_by="Question.number"
#     )
#     behavioural_factors = relationship(
#         "BehaviouralFactor", back_populates="behavioural_type",
#         order_by="BehaviouralFactor.order_index"
#     )
#     form = relationship("Form", back_populates="behavioural_types")

#     __table_args__ = (
#         UniqueConstraint("form_id", "code", name="uq_form_type_code"),
#     )

class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan")
    sessions = relationship("AssessmentSession", back_populates="form")


class BehaviouralType(Base):
    __tablename__ = "behavioural_types"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(1), nullable=False)
    name = Column(String(100), nullable=False)
    instructions = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)

    questions = relationship("Question", back_populates="behavioural_type", order_by="Question.number")
    behavioural_factors = relationship(
        "BehaviouralFactor",
        back_populates="behavioural_type",
        order_by="BehaviouralFactor.order_index",
    )

    __table_args__ = (
        UniqueConstraint("code", name="uq_behavioural_type_code"),
    )

class BehaviouralFactor(Base):
    """e.g. Altruistic, Emotional, Power, Existential — scoped to a behavioural_type."""
    __tablename__ = "behavioural_factors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    behavioural_type_id = Column(
        Integer, ForeignKey("behavioural_types.id"), nullable=False
    )
    name = Column(String(100), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    color = Column(String(7), nullable=True, default="#808080")

    behavioural_type = relationship(
        "BehaviouralType", back_populates="behavioural_factors"
    )


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    behavioural_type_id = Column(
        Integer, ForeignKey("behavioural_types.id", ondelete="CASCADE"), nullable=False
    )
    number = Column(Integer, nullable=False)  # position within its behavioural_type
    option_a_text = Column(Text, nullable=False)
    option_b_text = Column(Text, nullable=False)

    # merged in from scoring_rules; nullable = that option scores nothing
    option_a_factor_id = Column(
        Integer, ForeignKey("behavioural_factors.id", ondelete="CASCADE"), nullable=False
    )
    option_b_factor_id = Column(
        Integer, ForeignKey("behavioural_factors.id", ondelete="CASCADE"), nullable=False
    )

    form = relationship("Form", back_populates="questions")
    behavioural_type = relationship("BehaviouralType", back_populates="questions")
    option_a_factor = relationship("BehaviouralFactor", foreign_keys=[option_a_factor_id])
    option_b_factor = relationship("BehaviouralFactor", foreign_keys=[option_b_factor_id])
    responses = relationship("Response", back_populates="question")

    __table_args__ = (
        # question numbering resets per form, not globally
        UniqueConstraint(
            "form_id", "behavioural_type_id", "number", name="uq_form_type_question_number"
        ),
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    account_type = Column(Enum(AccountType), nullable=False, default=AccountType.BASIC)
    token_version = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    education = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    country = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    profession = Column(String(255), nullable=True)
    income_range = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)


    # --- Privacy lifecycle metadata ---
    consent_given_at     = Column(DateTime, nullable=True)  # when user accepted the privacy notice
    deleted_at           = Column(DateTime, nullable=True)  # soft-delete timestamp (None = active)
    anonymized_at        = Column(DateTime, nullable=True)  # when PII was scrubbed
    retention_expires_at = Column(DateTime, nullable=True)  # scheduled hard-delete date
    last_accessed_at     = Column(DateTime, nullable=True)  # last successful login

    sessions = relationship("AssessmentSession", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", foreign_keys="AuditLog.user_id", back_populates="user")


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=False)
    status = Column(
        Enum(SessionStatus), nullable=False, default=SessionStatus.in_progress
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    submitted_at = Column(DateTime, nullable=True)
    ai_report_data = Column(JSON, nullable=True)
    user = relationship("User", back_populates="sessions")
    form = relationship("Form", back_populates="sessions")
    responses = relationship(
        "Response", back_populates="session", cascade="all, delete-orphan"
    )
    section_scores = relationship(
        "SectionScore", back_populates="session", cascade="all, delete-orphan"
    )
    expires_at = Column(DateTime, nullable=True)
    prior_attempt_claimed = Column(Boolean, nullable=False, default=False)
    prior_attempt_details = Column(Text, nullable=True)
     
    @property
    def user_name(self) -> str:
        return self.user.name if self.user else "Unknown User"
    @property
    def form_name(self) -> str:
        return self.form.name if self.form else "Unknown Assessment"

# Add enum to the top imports if not present
# import enum

class SessionActivityAction(str, enum.Enum):
    SESSION_START    = "SESSION_START"
    SESSION_RESUME   = "SESSION_RESUME"
    ANSWER_SUBMIT    = "ANSWER_SUBMIT"
    ANSWER_CHANGE    = "ANSWER_CHANGE"
    SESSION_SUBMIT   = "SESSION_SUBMIT"
    PAGE_NAVIGATE    = "PAGE_NAVIGATE"

class SessionActivityLog(Base):
    __tablename__ = "session_activity_logs"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    action     = Column(Enum(SessionActivityAction), nullable=False)
    detail     = Column(Text, nullable=True)  # JSON blob
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    session = relationship("AssessmentSession", backref="activity_logs")


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        Integer, ForeignKey("assessment_sessions.id"), nullable=False
    )
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    chosen_option = Column(Enum(OptionLetter), nullable=False)
    answered_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    session = relationship("AssessmentSession", back_populates="responses")
    question = relationship("Question", back_populates="responses")

    __table_args__ = (
        # combined constraint on the pair, not on each column individually
        UniqueConstraint("session_id", "question_id", name="uq_session_question"),
    )


class SectionScore(Base):
    """Stored score per (session, behavioural_type, factor) — avoids recomputing on every read."""
    __tablename__ = "section_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        Integer, ForeignKey("assessment_sessions.id"), nullable=False
    )
    section_id = Column(
        Integer, ForeignKey("behavioural_types.id"), nullable=False
    )
    factor_id = Column(
        Integer, ForeignKey("behavioural_factors.id"), nullable=False
    )
    score = Column(Integer, nullable=False)  # 0-5

    session = relationship("AssessmentSession", back_populates="section_scores")

    __table_args__ = (
        # NOTE: extended to include factor_id -- see flagged note above.
        # a single (session_id, section_id) unique constraint would prevent
        # storing more than one factor's score per section per session.
        UniqueConstraint(
            "session_id", "section_id", "factor_id", name="uq_session_section_factor"
        ),
    )

class ReportStatement(Base):
    __tablename__ = "report_statements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_type = Column(Enum(AccountType), nullable=False)
    behavioural_type_id = Column(Integer, ForeignKey("behavioural_types.id"), nullable=False)
    factor_id = Column(Integer, ForeignKey("behavioural_factors.id"), nullable=False)
    score = Column(Integer, nullable=False)  # 0-5
    score_label = Column(String(50), nullable=False) # e.g. "Very Strong", "Absence"
    title = Column(String(255), nullable=False)
    statement_text = Column(Text, nullable=False)

    behavioural_type = relationship("BehaviouralType")
    factor = relationship("BehaviouralFactor")

    __table_args__ = (
        UniqueConstraint(
            "account_type", "behavioural_type_id", "factor_id", "score",
            name="uq_report_statement_lookup"
        ),
    )


class PasswordResetToken(Base):
    """Stores hashed password-reset tokens issued via /auth/forgot-password.
    The raw token is sent in the email link only; the DB only ever holds its
    SHA-256 hash, so a DB leak cannot be used to reset passwords."""
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Return the SHA-256 hex digest of a raw token string."""
        return hashlib.sha256(raw_token.encode()).hexdigest()


class AuditLog(Base):
    """Structured audit trail for all privacy-sensitive actions.
    Kept separate from application logs so it can be queried and exported independently."""
    __tablename__ = "audit_logs"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    action         = Column(Enum(AuditAction), nullable=False)
    # actor: who performed the action (None for unauthenticated flows e.g. forgot-password)
    user_id        = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # target: the user the action was performed *on* (differs from user_id for admin ops)
    target_user_id = Column(Integer, nullable=True)
    ip_address     = Column(String(45), nullable=True)   # supports IPv6
    detail         = Column(Text, nullable=True)          # JSON blob for extra context
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id], back_populates="audit_logs")

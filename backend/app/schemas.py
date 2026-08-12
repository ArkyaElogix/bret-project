from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, field_validator, ValidationInfo
from datetime import datetime

# class BehaviouralTypeCreate(BaseModel):
#     form_id: int
#     code: str
#     name: str
#     instructions: Optional[str] = None
#     order_index: int = 0
class BehaviouralTypeCreate(BaseModel):
    code: str
    name: str
    instructions: Optional[str] = None
    order_index: int = 0



class BehaviouralTypeOut(BaseModel):
    id: int
    code: str
    name: str
    instructions: Optional[str] = None
    order_index: int

    model_config = ConfigDict(from_attributes=True)

class BehaviouralTypeUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    instructions: Optional[str] = None
    order_index: Optional[int] = None


# class BehaviouralTypeOut(BaseModel):
#     id: int
#     form_id: int
#     code: str
#     name: str
#     instructions: Optional[str] = None
#     order_index: int

#     model_config = ConfigDict(from_attributes=True)

class BehaviouralFactorBase(BaseModel):
    name: str
    order_index: int = 0
    color: str | None = None  # Add this line


class BehaviouralFactorCreate(BaseModel):
    behavioural_type_id: int
    name: str
    order_index: int = 0
    color: str | None = None  # Add this line


class BehaviouralFactorUpdate(BaseModel):
    name: Optional[str] = None
    order_index: Optional[int] = None
    color: str | None = None


class BehaviouralFactorOut(BaseModel):
    id: int
    behavioural_type_id: int
    name: str
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class SectionScoreOut(BaseModel):
    id: int
    session_id: int
    section_id: int
    factor_id: int
    score: int

    model_config = ConfigDict(from_attributes=True)


class SessionStartRequest(BaseModel):
    form_id: int
    prior_attempt_claimed: bool = False
    prior_attempt_details: str | None = None


class SessionOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    form_id: int
    form_name: str
    status: str
    submitted_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class AnswerSubmit(BaseModel):
    question_id: int
    chosen_option: str  # "A" or "B"

class UserTypeUpdate(BaseModel):
    account_type: str  # "BASIC" or "EXECUTIVE"


class ResponseOut(BaseModel):
    id: int
    session_id: int
    question_id: int
    chosen_option: str

    model_config = ConfigDict(from_attributes=True)


class SessionProgressOut(BaseModel):
    session: SessionOut
    answered_question_ids: list[int]
    responses: list[ResponseOut]


class SessionFullOut(BaseModel):
    session: SessionOut
    responses: list[ResponseOut]
    scores: list[SectionScoreOut]

class SessionActivityEventOut(BaseModel):
    id: int
    session_id: int
    action: str
    detail: str | None
    created_at: datetime
class BehaviouralFlag(BaseModel):
    type: str
    message: str
class ActivitySummary(BaseModel):
    total_events: int
    first_event_at: datetime | None
    last_event_at: datetime | None
    total_active_minutes: float
    answer_count: int
    answer_change_count: int
    session_resumes: int
    avg_seconds_per_answer: float
    fastest_answer_seconds: float
    slowest_answer_seconds: float
    idle_gaps: list[dict[str, Any]]
    flags: list[BehaviouralFlag]
class SessionActivityOut(BaseModel):
    events: list[SessionActivityEventOut]
    summary: ActivitySummary
class PageNavigateRequest(BaseModel):
    from_step: int
    to_step: int

class LoginRequest(BaseModel):
    email: str
    password: str

class CandidateRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    account_type: str
    consent_accepted: bool
    education: str
    address: str
    country: str
    age: int
    profession: str
    income_range: str | None = None
    phone: str | None = None
    @field_validator("address", "country", "phone", mode="before")
    @classmethod
    def normalize_strings(cls, v: str | None, info: ValidationInfo) -> str | None:
        if not v:
            return v
        v = v.strip()
        if info.field_name == "country":
            return v.upper()  
        if info.field_name == "phone":
            return v.replace(" ", "").replace("-", "") 
        return v

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "USER"  # "ADMIN" or "USER"
    account_type: str = "BASIC"  # "BASIC" or "EXECUTIVE"
    consent_accepted: bool
    
    # New fields
    education: str
    address: str
    country: str
    age: int
    profession: str
    income_range: str | None = None
    phone: str | None = None
    @field_validator("address", "country", "phone", mode="before")
    @classmethod
    def normalize_strings(cls, v: str | None, info: ValidationInfo) -> str | None:
        if not v:
            return v
        v = v.strip()
        if info.field_name == "country":
            return v.upper()  # Normalize country for easier matching
        if info.field_name == "phone":
            return v.replace(" ", "").replace("-", "") # Strip spaces and dashes
        return v

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    account_type: str
    education: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    age: Optional[int] = None
    profession: Optional[str] = None
    income_range: Optional[str] = None
    phone: Optional[str] = None
    consent_given_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    is_single_use: bool = False
    single_use_status: Optional[str] = None  # 'pending_registration', 'active', 'locked', 'admin_unlocked'
    deletion_scheduled_at: Optional[datetime] = None
    assessment_started_at: Optional[datetime] = None
    

    class Config:
        from_attributes = True

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    """Schema for PATCH /users/me — all fields optional (partial updates)."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[str] = None
    profession: Optional[str] = None
    income_range: Optional[str] = None
    age: Optional[int] = None
    address: Optional[str] = None
    country: Optional[str] = None

    @field_validator("address", "country", "phone", mode="before")
    @classmethod
    def normalize_strings(cls, v: str | None, info: ValidationInfo) -> str | None:
        if not v:
            return v
        v = v.strip()
        if info.field_name == "country":
            return v.upper()
        if info.field_name == "phone":
            return v.replace(" ", "").replace("-", "")
        return v


class PasswordChange(BaseModel):
    new_password: str

class UserDeleteRequest(BaseModel):
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class FormCreate(BaseModel):
    name: str
    is_active: bool = False


class FormUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class FormOut(BaseModel):
    id: int
    name: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class QuestionCreate(BaseModel):
    form_id: int
    behavioural_type_id: int
    number: int
    option_a_text: str
    option_b_text: str
    option_a_factor_id: int
    option_b_factor_id: int


class QuestionUpdate(BaseModel):
    number: Optional[int] = None
    option_a_text: Optional[str] = None
    option_b_text: Optional[str] = None
    option_a_factor_id: int
    option_b_factor_id: int


class QuestionOut(BaseModel):
    id: int
    form_id: int
    behavioural_type_id: int
    number: int
    option_a_text: str
    option_b_text: str
    option_a_factor_id: Optional[int] = None
    option_b_factor_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class FactorResultOut(BaseModel):
    """Aggregated result for one factor across all sections of a session."""
    factor_id: int
    factor_name: str  # [{"section_id": int, "section_name": str, "score": int}]
    score: int
    percentage: float

class SectionResultOut(BaseModel):
    """All factor resuts for one section, sorted by score descending. 
    Factors are scoped to a section, so results are grouped by section."""
    section_id: int
    section_code: str
    section_name: str
    factors: list[FactorResultOut]

class ReportFactorOut(BaseModel):
    factor_id: int
    factor_name: str
    raw_score: int
    score: int
    score_label: str | None = None
    statement_title: str | None = None
    statement: str | None = None
class ReportSectionOut(BaseModel):
    section_id: int
    section_code: str
    section_name: str
    section_definitions: str | None = None
    factors: list[ReportFactorOut]
class SessionReportOut(BaseModel):
    session: SessionOut
    user: dict[str, Any]
    form: dict[str, Any]
    sections: list[ReportSectionOut]

class AuditLogOut(BaseModel):
    id: int
    action: str
    user_id: Optional[int] = None
    target_user_id: Optional[int] = None
    ip_address: Optional[str] = None
    detail: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ApplicantRegistryOut(BaseModel):
    id: int
    email: str
    phone: str | None
    name_normalized: str
    address_normalized: str | None
    original_user_id: int
    session_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DuplicateFlagOut(BaseModel):
    id: int
    new_session_id: int
    new_user_id: int
    prior_registry_id: int
    prior_session_id: int
    match_type: str
    match_confidence: str
    status: str
    reviewed_by: int | None
    reviewed_at: datetime | None
    review_note: str | None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DuplicateReviewRequest(BaseModel):
    decision: str  # "APPROVED" or "REJECTED"
    note: str | None = None


class SingleUseUserCreate(BaseModel):
    email: EmailStr
    account_type: str  # BASIC or EXECUTIVE
    name: Optional[str] = None

class CompleteRegistrationRequest(BaseModel):
    phone: str
    address: str
    country: str
    age: int
    profession: str
    income_range: str
    consent_accepted: bool

class DuplicateDetectionResponse(BaseModel):
    is_duplicate: bool
    flags: Optional[dict] = None  # Details of duplicate flags
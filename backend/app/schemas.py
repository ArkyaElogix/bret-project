from typing import Optional, Any
from pydantic import BaseModel, ConfigDict
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


class BehaviouralFactorCreate(BaseModel):
    behavioural_type_id: int
    name: str
    order_index: int = 0


class BehaviouralFactorUpdate(BaseModel):
    name: Optional[str] = None
    order_index: Optional[int] = None


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
    product_type: str  # "BASIC" or "EXECUTIVE"


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


class LoginRequest(BaseModel):
    email: str
    password: str

class CandidateRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    product_type: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "USER"  # "ADMIN" or "USER"
    product_type: str = "BASIC"  # "BASIC" or "EXECUTIVE"

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    product_type: str

    model_config = ConfigDict(from_attributes=True)


class PasswordChange(BaseModel):
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
    factors: list[ReportFactorOut]
class SessionReportOut(BaseModel):
    session: SessionOut
    user: dict[str, Any]
    form: dict[str, Any]
    sections: list[ReportSectionOut]
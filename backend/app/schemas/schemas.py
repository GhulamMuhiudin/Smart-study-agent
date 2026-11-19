from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Study Plan Schemas
# ---------------------------------------------------------------------------

class StudyPlanCreate(BaseModel):
    title: str
    subjects: List[str]
    total_days: int
    hours_per_day: float
    start_date: str  # YYYY-MM-DD
    notes: Optional[str] = None


class StudySessionResponse(BaseModel):
    id: int
    plan_id: int
    day_number: int
    date: str
    subject: str
    topic: str
    duration_hours: float
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class StudyPlanResponse(BaseModel):
    id: int
    user_id: int
    title: str
    subjects: List[str]
    total_days: int
    hours_per_day: float
    start_date: str
    end_date: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    sessions: List[StudySessionResponse] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Task Schemas
# ---------------------------------------------------------------------------

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Quiz Schemas
# ---------------------------------------------------------------------------

class QuizQuestionResponse(BaseModel):
    """Public question view — correct_option is NOT included."""
    id: int
    quiz_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    explanation: Optional[str] = None
    order_num: int

    model_config = {"from_attributes": True}


class QuizQuestionWithAnswer(BaseModel):
    """Full question view returned only after submission."""
    id: int
    quiz_id: int
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: Optional[str] = None
    order_num: int

    model_config = {"from_attributes": True}


class QuizResponse(BaseModel):
    id: int
    user_id: int
    title: str
    subject: str
    topic: str
    difficulty: str
    num_questions: int
    created_at: datetime
    questions: List[QuizQuestionResponse] = []

    model_config = {"from_attributes": True}


class QuizAttemptCreate(BaseModel):
    quiz_id: int
    answers: Dict[str, str]  # {question_id: "a"}


class QuizAttemptResultQuestion(BaseModel):
    question_id: int
    question_text: str
    your_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None


class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    user_id: int
    score: int
    total_questions: int
    percentage: float
    completed_at: datetime
    results: List[QuizAttemptResultQuestion] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Chat / Agent Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    user_id: int = 1


class ChatResponse(BaseModel):
    message: str
    tool_called: Optional[str] = None
    success: bool = True
    data: Optional[Any] = None


# ---------------------------------------------------------------------------
# Dashboard Schemas
# ---------------------------------------------------------------------------

class DashboardStats(BaseModel):
    total_study_hours: float
    completed_tasks: int
    quiz_avg_score: float
    active_plans: int


# ---------------------------------------------------------------------------
# Agent Execution History
# ---------------------------------------------------------------------------

class AgentExecutionResponse(BaseModel):
    id: int
    user_id: int
    user_instruction: str
    tool_name: Optional[str] = None
    status: str
    result_summary: Optional[str] = None
    error_details: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Email Alert Settings
# ---------------------------------------------------------------------------

class EmailAlertSettings(BaseModel):
    email_alerts_enabled: bool = False
    alert_email: Optional[str] = None
    alert_task_overdue: bool = True
    alert_quiz_completed: bool = True
    alert_study_plan_created: bool = True


# ---------------------------------------------------------------------------
# Auth Schemas
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    email_alerts_enabled: bool = False
    alert_email: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

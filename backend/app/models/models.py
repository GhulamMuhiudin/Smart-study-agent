from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    email_alerts_enabled = Column(Boolean, default=False, nullable=False)
    alert_email = Column(String(255), nullable=True)
    alert_task_overdue = Column(Boolean, default=True, nullable=False)
    alert_quiz_completed = Column(Boolean, default=True, nullable=False)
    alert_study_plan_created = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    study_plans = relationship("StudyPlan", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    agent_history = relationship("AgentExecutionHistory", back_populates="user", cascade="all, delete-orphan")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    subjects = Column(JSON, nullable=False, default=list)
    total_days = Column(Integer, nullable=False)
    hours_per_day = Column(Float, nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="study_plans")
    sessions = relationship("StudySession", back_populates="plan", cascade="all, delete-orphan")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number = Column(Integer, nullable=False)
    date = Column(String(20), nullable=False)
    subject = Column(String(255), nullable=False)
    topic = Column(String(500), nullable=False)
    duration_hours = Column(Float, nullable=False, default=1.0)
    start_time = Column(String(20), nullable=True)
    end_time = Column(String(20), nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending / completed
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    plan = relationship("StudyPlan", back_populates="sessions")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending / completed / overdue
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="tasks")

    __table_args__ = (
        Index("ix_tasks_status", "status"),
        Index("ix_tasks_deadline", "deadline"),
    )


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    subject = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    difficulty = Column(String(50), nullable=False, default="intermediate")
    num_questions = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.order_num")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_quizzes_created_at", "created_at"),
    )


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_option = Column(String(1), nullable=False)  # a / b / c / d
    explanation = Column(Text, nullable=True)
    order_num = Column(Integer, nullable=False, default=0)

    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    answers = Column(JSON, nullable=False, default=dict)  # {question_id: "a"}
    score = Column(Integer, nullable=False, default=0)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False, default=0.0)
    completed_at = Column(DateTime, server_default=func.now(), nullable=False)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # user / assistant
    content = Column(Text, nullable=False)
    tool_called = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="chat_history")


class AgentExecutionHistory(Base):
    __tablename__ = "agent_execution_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user_instruction = Column(Text, nullable=False)
    tool_name = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # success / error / pending
    result_summary = Column(Text, nullable=True)
    error_details = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="agent_history")

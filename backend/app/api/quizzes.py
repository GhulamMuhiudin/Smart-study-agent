from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.database.connection import get_db
from app.models.models import Quiz, QuizAttempt, QuizQuestion, User
from app.schemas.schemas import (
    QuizAttemptCreate,
    QuizAttemptResponse,
    QuizAttemptResultQuestion,
    QuizResponse,
)
from app.services.email_service import email_service

router = APIRouter()


@router.get("/quizzes", response_model=List[QuizResponse])
def list_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all quizzes for the authenticated user."""
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.user_id == current_user.id)
        .order_by(Quiz.created_at.desc())
        .all()
    )
    return quizzes


@router.get("/quizzes/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific quiz. Questions returned WITHOUT correct_option."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizAttemptResponse)
def submit_quiz(
    quiz_id: int,
    payload: QuizAttemptCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit answers for a quiz.
    - Calculates score server-side
    - Returns score + correct answers + explanations
    - Saves the attempt to DB
    - Triggers email alert if enabled
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = (
        db.query(QuizQuestion)
        .filter(QuizQuestion.quiz_id == quiz_id)
        .order_by(QuizQuestion.order_num)
        .all()
    )

    # Calculate score
    score = 0
    result_questions: List[QuizAttemptResultQuestion] = []

    for q in questions:
        user_answer = payload.answers.get(str(q.id))
        is_correct = user_answer is not None and user_answer.lower() == q.correct_option.lower()
        if is_correct:
            score += 1
        result_questions.append(
            QuizAttemptResultQuestion(
                question_id=q.id,
                question_text=q.question_text,
                your_answer=user_answer,
                correct_answer=q.correct_option,
                is_correct=is_correct,
                explanation=q.explanation,
            )
        )

    total = len(questions)
    percentage = (score / total * 100) if total > 0 else 0.0

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=current_user.id,
        answers=payload.answers,
        score=score,
        total_questions=total,
        percentage=round(percentage, 2),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Send email alert if enabled (runs in background, won't block response)
    try:
        if current_user.email_alerts_enabled and current_user.alert_quiz_completed and current_user.alert_email:
            background_tasks.add_task(email_service.send_quiz_completed_alert, attempt, current_user.alert_email)
    except Exception:
        pass  # Don't fail submission because of email error

    return QuizAttemptResponse(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        user_id=attempt.user_id,
        score=attempt.score,
        total_questions=attempt.total_questions,
        percentage=attempt.percentage,
        completed_at=attempt.completed_at,
        results=result_questions,
    )

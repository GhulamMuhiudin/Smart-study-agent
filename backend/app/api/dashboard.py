from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.database.connection import get_db
from app.models.models import QuizAttempt, StudyPlan, StudySession, Task, User
from app.schemas.schemas import DashboardStats

router = APIRouter()


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return real aggregated statistics for the dashboard."""

    # Total study hours from completed sessions
    study_hours_result = (
        db.query(func.sum(StudySession.duration_hours))
        .join(StudyPlan)
        .filter(
            StudyPlan.user_id == current_user.id,
            StudySession.status == "completed",
        )
        .scalar()
    )
    total_study_hours = float(study_hours_result or 0.0)

    # Completed tasks count
    completed_tasks = (
        db.query(func.count(Task.id))
        .filter(Task.user_id == current_user.id, Task.status == "completed")
        .scalar()
        or 0
    )

    # Average quiz percentage
    quiz_avg_result = (
        db.query(func.avg(QuizAttempt.percentage))
        .filter(QuizAttempt.user_id == current_user.id)
        .scalar()
    )
    quiz_avg_score = float(quiz_avg_result or 0.0)

    # Active study plans count
    active_plans = (
        db.query(func.count(StudyPlan.id))
        .filter(StudyPlan.user_id == current_user.id)
        .scalar()
        or 0
    )

    return DashboardStats(
        total_study_hours=round(total_study_hours, 2),
        completed_tasks=int(completed_tasks),
        quiz_avg_score=round(quiz_avg_score, 2),
        active_plans=int(active_plans),
    )

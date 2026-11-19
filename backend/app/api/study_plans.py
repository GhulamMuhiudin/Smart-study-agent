from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.database.connection import get_db
from app.models.models import StudyPlan, User
from app.schemas.schemas import StudyPlanCreate, StudyPlanResponse

router = APIRouter()


@router.get("/study-plans", response_model=List[StudyPlanResponse])
def list_study_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all study plans for the user."""
    plans = (
        db.query(StudyPlan)
        .filter(StudyPlan.user_id == current_user.id)
        .order_by(StudyPlan.created_at.desc())
        .all()
    )
    return plans


@router.get("/study-plans/today", response_model=Optional[StudyPlanResponse])
def get_today_study_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the study plan active for today, or the most recent one."""
    today_str = date.today().strftime("%Y-%m-%d")
    plan = (
        db.query(StudyPlan)
        .filter(
            StudyPlan.user_id == current_user.id,
            StudyPlan.start_date <= today_str,
            StudyPlan.end_date >= today_str,
        )
        .first()
    )
    if not plan:
        # Fall back to most recent plan
        plan = (
            db.query(StudyPlan)
            .filter(StudyPlan.user_id == current_user.id)
            .order_by(StudyPlan.created_at.desc())
            .first()
        )
    return plan


@router.get("/study-plans/{plan_id}", response_model=StudyPlanResponse)
def get_study_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    return plan


@router.post("/study-plans", response_model=StudyPlanResponse, status_code=201)
def create_study_plan(
    payload: StudyPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually create a study plan (without AI generation)."""
    from datetime import datetime, timedelta

    try:
        start_dt = datetime.strptime(payload.start_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")

    end_dt = start_dt + timedelta(days=payload.total_days - 1)

    plan = StudyPlan(
        user_id=current_user.id,
        title=payload.title,
        subjects=payload.subjects,
        total_days=payload.total_days,
        hours_per_day=payload.hours_per_day,
        start_date=payload.start_date,
        end_date=end_dt.strftime("%Y-%m-%d"),
        notes=payload.notes,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/study-plans/{plan_id}", status_code=204)
def delete_study_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(StudyPlan).filter(StudyPlan.id == plan_id, StudyPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Study plan not found")
    db.delete(plan)
    db.commit()

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.database.connection import get_db
from app.models.models import AgentExecutionHistory, User
from app.schemas.schemas import AgentExecutionResponse

router = APIRouter()


@router.get("/activity", response_model=List[AgentExecutionResponse])
def get_activity(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return agent execution history (activity log) for the current user."""
    records = (
        db.query(AgentExecutionHistory)
        .filter(AgentExecutionHistory.user_id == current_user.id)
        .order_by(AgentExecutionHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    return records

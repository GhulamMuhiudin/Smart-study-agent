from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.agent.agent import AgentService
from app.core.auth import get_current_user
from app.database.connection import get_db
from app.models.models import User
from app.schemas.schemas import ChatRequest, ChatResponse

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

_agent_service: AgentService | None = None


def get_agent_service() -> AgentService:
    global _agent_service
    if _agent_service is None:
        _agent_service = AgentService()
    return _agent_service


@router.post("/agent/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat(
    request: Request,
    chat_request: ChatRequest,
    db: Session = Depends(get_db),
    agent: AgentService = Depends(get_agent_service),
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI study assistant."""
    result = agent.run_agent(chat_request.message, db, user_id=current_user.id)
    return ChatResponse(
        message=result["message"],
        tool_called=result.get("tool_called"),
        success=result.get("success", True),
        data=result.get("data"),
    )

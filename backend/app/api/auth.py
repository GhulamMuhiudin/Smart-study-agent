"""
Authentication endpoints: Registration, Login, Profile check, Demo login.
"""
from __future__ import annotations

import logging
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database.connection import get_db
from app.models.models import User
from app.schemas.schemas import TokenResponse, UserLogin, UserRegister, UserResponse

logger = logging.getLogger(__name__)
router = APIRouter()

EMAIL_REGEX = re.compile(r"^[\w\.-]+@[\w\.-]+\.\w+$")


@router.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new student account."""
    clean_email = payload.email.strip().lower()
    if not EMAIL_REGEX.match(clean_email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid email address.",
        )

    # Check existing user
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Create new user
    hashed_pwd = hash_password(payload.password)
    new_user = User(
        email=clean_email,
        name=payload.name.strip(),
        hashed_password=hashed_pwd,
        is_active=True,
        email_alerts_enabled=False,
        alert_email=clean_email,
        alert_task_overdue=True,
        alert_quiz_completed=True,
        alert_study_plan_created=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info("New user registered: id=%d email=%s", new_user.id, new_user.email)

    token = create_access_token(
        user_id=new_user.id,
        email=new_user.email,
        name=new_user.name,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
    )


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password."""
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact support.",
        )

    token = create_access_token(
        user_id=user.id,
        email=user.email,
        name=user.name,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/auth/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently logged-in user."""
    return UserResponse.model_validate(current_user)


@router.post("/auth/demo", response_model=TokenResponse)
def demo_login(db: Session = Depends(get_db)):
    """Quick demo login as student@studyagent.local for seamless evaluation."""
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Default demo user not found.",
        )

    token = create_access_token(
        user_id=user.id,
        email=user.email,
        name=user.name,
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )

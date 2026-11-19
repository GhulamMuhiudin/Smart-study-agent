from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.database.connection import get_db
from app.models.models import User
from app.schemas.schemas import EmailAlertSettings

router = APIRouter()


@router.get("/settings/email-alerts", response_model=EmailAlertSettings)
def get_email_alert_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get email alert settings for the authenticated user."""
    return EmailAlertSettings(
        email_alerts_enabled=current_user.email_alerts_enabled,
        alert_email=current_user.alert_email,
        alert_task_overdue=current_user.alert_task_overdue,
        alert_quiz_completed=current_user.alert_quiz_completed,
        alert_study_plan_created=current_user.alert_study_plan_created,
    )


@router.patch("/settings/email-alerts", response_model=EmailAlertSettings)
def update_email_alert_settings(
    payload: EmailAlertSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update email alert settings for the authenticated user."""
    current_user.email_alerts_enabled = payload.email_alerts_enabled
    current_user.alert_email = payload.alert_email
    current_user.alert_task_overdue = payload.alert_task_overdue
    current_user.alert_quiz_completed = payload.alert_quiz_completed
    current_user.alert_study_plan_created = payload.alert_study_plan_created

    db.commit()
    db.refresh(current_user)

    return EmailAlertSettings(
        email_alerts_enabled=current_user.email_alerts_enabled,
        alert_email=current_user.alert_email,
        alert_task_overdue=current_user.alert_task_overdue,
        alert_quiz_completed=current_user.alert_quiz_completed,
        alert_study_plan_created=current_user.alert_study_plan_created,
    )


@router.post("/settings/test-email")
async def send_test_email(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send an immediate test alert to the configured alert_email."""
    from app.services.email_service import EmailService

    if not current_user.alert_email:
        raise HTTPException(
            status_code=400,
            detail="No alert email configured. Please enter and save an email address first.",
        )

    email_service = EmailService()
    success = await email_service.send_email(
        to=current_user.alert_email,
        subject="🔔 Smart Study Agent — Test Alert Notification",
        body=(
            f"Hello {current_user.name},\n\n"
            "This is a test notification from your Smart Study Agent automated alerting system.\n\n"
            "Your email notifications are correctly configured and will automatically trigger for:\n"
            f"- Overdue tasks: {'Enabled' if current_user.alert_task_overdue else 'Disabled'}\n"
            f"- Completed quiz results: {'Enabled' if current_user.alert_quiz_completed else 'Disabled'}\n"
            f"- Generated study plans: {'Enabled' if current_user.alert_study_plan_created else 'Disabled'}\n\n"
            "The background scheduler runs hourly to monitor your tasks and deadlines automatically.\n\n"
            "Best regards,\n"
            "Smart Study Agent Automated System"
        ),
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to send email. Check SMTP settings in backend .env file.",
        )

    return {"message": f"Test alert email successfully dispatched to {current_user.alert_email}"}

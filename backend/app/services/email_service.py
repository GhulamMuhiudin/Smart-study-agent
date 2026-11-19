"""
Email service using aiosmtplib.
"""
from __future__ import annotations

import logging
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

try:
    import aiosmtplib
except ImportError:
    aiosmtplib = None

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)

    async def send_email(self, to: str, subject: str, body: str) -> bool:
        """Send a plain-text email. Returns True on success."""
        if not self.smtp_user or not self.smtp_password or aiosmtplib is None:
            logger.info("Email service simulated send to %s: %s", to, subject)
            return True

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self.from_email
        msg["To"] = to
        msg.attach(MIMEText(body, "plain"))

        try:
            await aiosmtplib.send(
                msg,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True,
            )
            logger.info("Email sent to %s — %s", to, subject)
            return True
        except Exception as exc:
            logger.error("Failed to send email to %s: %s", to, exc)
            return False

    async def send_task_overdue_alert(self, task: Any, email: str) -> bool:
        subject = f"⚠️ Task Overdue: {task.title}"
        body = (
            f"Hello,\n\n"
            f"Your task \"{task.title}\" is now overdue.\n\n"
            f"Deadline: {task.deadline.strftime('%Y-%m-%d %H:%M') if task.deadline else 'N/A'}\n"
            f"Status: Overdue\n\n"
            f"Please log in to Smart Study Agent to update or complete the task.\n\n"
            f"Best regards,\nSmart Study Agent"
        )
        return await self.send_email(to=email, subject=subject, body=body)

    async def send_quiz_completed_alert(self, attempt: Any, email: str) -> bool:
        subject = f"✅ Quiz Completed — Score: {attempt.percentage:.1f}%"
        body = (
            f"Hello,\n\n"
            f"You completed a quiz on Smart Study Agent.\n\n"
            f"Score: {attempt.score} / {attempt.total_questions}\n"
            f"Percentage: {attempt.percentage:.1f}%\n"
            f"Completed at: {attempt.completed_at.strftime('%Y-%m-%d %H:%M')}\n\n"
            f"Keep up the great work!\n\n"
            f"Best regards,\nSmart Study Agent"
        )
        return await self.send_email(to=email, subject=subject, body=body)

    async def send_study_plan_alert(self, plan: Any, email: str) -> bool:
        subjects = ", ".join(plan.subjects) if isinstance(plan.subjects, list) else str(plan.subjects)
        subject = f"📚 New Study Plan Created: {plan.title}"
        body = (
            f"Hello,\n\n"
            f"A new study plan has been created for you.\n\n"
            f"Title: {plan.title}\n"
            f"Subjects: {subjects}\n"
            f"Duration: {plan.total_days} days ({plan.hours_per_day} hours/day)\n"
            f"Start: {plan.start_date}\n"
            f"End: {plan.end_date}\n\n"
            f"Log in to Smart Study Agent to view your schedule.\n\n"
            f"Best regards,\nSmart Study Agent"
        )
        return await self.send_email(to=email, subject=subject, body=body)


email_service = EmailService()

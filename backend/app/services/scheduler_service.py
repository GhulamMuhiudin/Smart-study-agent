"""
Scheduler service using APScheduler.
Checks for overdue tasks every hour and sends a daily study reminder at 8am.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Callable

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
    from apscheduler.triggers.interval import IntervalTrigger
except ImportError:
    BackgroundScheduler = None
    CronTrigger = None
    IntervalTrigger = None

logger = logging.getLogger(__name__)

_scheduler = None


def check_overdue_tasks(db_factory: Callable) -> None:
    """Mark pending tasks past their deadline as overdue and email alerts."""
    db = db_factory()
    try:
        from app.models.models import Task, User
        from app.services.email_service import email_service

        now = datetime.now()
        overdue_tasks = (
            db.query(Task)
            .filter(Task.status == "pending", Task.deadline < now, Task.deadline.isnot(None))
            .all()
        )

        for task in overdue_tasks:
            task.status = "overdue"
            db.add(task)

            # Send email if user has alerts enabled
            user = db.query(User).filter(User.id == task.user_id).first()
            if user and user.email_alerts_enabled and user.alert_task_overdue and user.alert_email:
                try:
                    asyncio.run(email_service.send_task_overdue_alert(task, user.alert_email))
                except Exception as exc:
                    logger.error("Failed to send overdue alert for task %s: %s", task.id, exc)

        if overdue_tasks:
            db.commit()
            logger.info("Marked %d tasks as overdue", len(overdue_tasks))

    except Exception as exc:
        logger.error("Error in check_overdue_tasks: %s", exc)
        db.rollback()
    finally:
        db.close()


def send_daily_summary(db_factory: Callable) -> None:
    """Send daily study plan reminder at 8am."""
    db = db_factory()
    try:
        from app.models.models import StudySession, StudyPlan, User
        from app.services.email_service import email_service

        today_str = datetime.now().strftime("%Y-%m-%d")

        users = db.query(User).filter(
            User.is_active == True,
            User.email_alerts_enabled == True,
            User.alert_email.isnot(None),
        ).all()

        for user in users:
            sessions_today = (
                db.query(StudySession)
                .join(StudyPlan)
                .filter(
                    StudyPlan.user_id == user.id,
                    StudySession.date == today_str,
                    StudySession.status == "pending",
                )
                .all()
            )

            if sessions_today:
                plan = sessions_today[0].plan
                try:
                    asyncio.run(email_service.send_study_plan_alert(plan, user.alert_email))
                except Exception as exc:
                    logger.error("Failed to send daily summary to user %s: %s", user.id, exc)

    except Exception as exc:
        logger.error("Error in send_daily_summary: %s", exc)
    finally:
        db.close()


def start_scheduler(db_factory: Callable) -> None:
    """Start the APScheduler background scheduler."""
    global _scheduler

    if BackgroundScheduler is None:
        logger.warning(
            "apscheduler is not installed — background scheduler not started. Install with: pip install apscheduler"
        )
        return

    if _scheduler is not None and _scheduler.running:
        logger.warning("Scheduler already running — skipping start")
        return

    _scheduler = BackgroundScheduler()

    # Check overdue tasks every hour
    _scheduler.add_job(
        func=check_overdue_tasks,
        trigger=IntervalTrigger(hours=1),
        args=[db_factory],
        id="check_overdue_tasks",
        replace_existing=True,
        name="Check Overdue Tasks",
    )

    # Daily summary at 8:00 AM
    _scheduler.add_job(
        func=send_daily_summary,
        trigger=CronTrigger(hour=8, minute=0),
        args=[db_factory],
        id="daily_summary",
        replace_existing=True,
        name="Daily Study Summary",
    )

    _scheduler.start()
    logger.info("APScheduler started with %d jobs", len(_scheduler.get_jobs()))


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")

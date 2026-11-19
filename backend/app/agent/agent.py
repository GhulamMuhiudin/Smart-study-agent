"""
Agent service — orchestrates OpenAI function-calling with database tools.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from sqlalchemy.orm import Session

from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import TOOLS
from app.models.models import (
    AgentExecutionHistory,
    ChatHistory,
    Quiz,
    QuizQuestion,
    StudyPlan,
    StudySession,
    Task,
)

logger = logging.getLogger(__name__)

USER_ID = 1  # Single-user mode


def _get_client() -> Optional[Any]:
    if OpenAI is None:
        return None
    provider = os.getenv("AI_PROVIDER", "openai").lower()
    api_key = os.getenv("OPENAI_API_KEY", "")

    if provider == "gemini":
        # Google Gemini via OpenAI-compatible endpoint
        api_key = os.getenv("GEMINI_API_KEY", api_key)
        return OpenAI(
            api_key=api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )
    elif provider == "groq":
        # Groq Cloud (Free Llama 3.3 70B with native Tool Calling)
        api_key = os.getenv("GROQ_API_KEY", api_key)
        return OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

    base_url = os.getenv("OPENAI_BASE_URL")
    if base_url:
        return OpenAI(api_key=api_key, base_url=base_url)
    return OpenAI(api_key=api_key)


def _get_model() -> str:
    provider = os.getenv("AI_PROVIDER", "openai").lower()
    default_model = "gpt-4o-mini"
    if provider == "gemini":
        default_model = "gemini-1.5-flash"
    elif provider == "groq":
        default_model = "openai/gpt-oss-120b"
    return os.getenv("AI_MODEL", default_model)


class AgentService:
    def __init__(self):
        self.client = _get_client()
        self.model = _get_model()

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def run_agent(self, user_message: str, db: Session, user_id: int = 1) -> Dict[str, Any]:
        """Process a user message, dispatch tool calls, return response dict."""
        # Save user message to chat history
        self._save_chat(db, role="user", content=user_message, user_id=user_id)

        # Build conversation history (last 20 messages for context)
        history = self._build_history(db, user_id=user_id)

        exec_record = AgentExecutionHistory(
            user_id=user_id,
            user_instruction=user_message,
            tool_name=None,
            status="pending",
            result_summary=None,
            error_details=None,
        )
        db.add(exec_record)
        db.commit()
        db.refresh(exec_record)

        if self.client is None:
            err_msg = "AI client not initialized. Please configure OPENAI_API_KEY or GEMINI_API_KEY in backend/.env"
            exec_record.status = "error"
            exec_record.error_details = err_msg
            db.commit()
            return {
                "message": err_msg,
                "tool_called": None,
                "success": False,
                "data": None,
            }

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=history,
                tools=TOOLS,
                tool_choice="auto",
            )

            message = response.choices[0].message
            tool_called = None
            tool_data = None

            if message.tool_calls:
                tool_call = message.tool_calls[0]
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)
                tool_called = tool_name

                exec_record.tool_name = tool_name
                db.commit()

                tool_result, tool_data = self._dispatch_tool(tool_name, tool_args, db, user_id=user_id)

                # Second pass — summarise what happened
                followup_messages = history + [
                    {"role": "assistant", "content": None, "tool_calls": [
                        {
                            "id": tool_call.id,
                            "type": "function",
                            "function": {"name": tool_name, "arguments": tool_call.function.arguments},
                        }
                    ]},
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps(tool_result),
                    },
                ]

                followup = self.client.chat.completions.create(
                    model=self.model,
                    messages=followup_messages,
                )
                assistant_text = followup.choices[0].message.content or ""
            else:
                assistant_text = message.content or ""

            self._save_chat(db, role="assistant", content=assistant_text, tool_called=tool_called, user_id=user_id)

            exec_record.status = "success"
            exec_record.result_summary = assistant_text[:500]
            db.commit()

            return {
                "message": assistant_text,
                "tool_called": tool_called,
                "success": True,
                "data": tool_data,
            }

        except Exception as exc:
            logger.exception("Agent error: %s", exc)
            exec_record.status = "error"
            exec_record.error_details = str(exc)
            db.commit()
            return {
                "message": f"I encountered an error: {str(exc)}",
                "tool_called": None,
                "success": False,
                "data": None,
            }

    # ------------------------------------------------------------------
    # Tool dispatch
    # ------------------------------------------------------------------

    def _dispatch_tool(
        self, name: str, args: Dict[str, Any], db: Session, user_id: int = 1
    ) -> tuple[Dict[str, Any], Any]:
        dispatchers = {
            "create_study_plan": self._execute_create_study_plan,
            "generate_quiz": self._execute_generate_quiz,
            "create_task": self._execute_create_task,
            "list_tasks": self._execute_list_tasks,
            "list_study_plans": self._execute_list_study_plans,
        }
        fn = dispatchers.get(name)
        if fn is None:
            return {"error": f"Unknown tool: {name}"}, None
        return fn(args, db, user_id=user_id)

    # ------------------------------------------------------------------
    # Tool: create_study_plan
    # ------------------------------------------------------------------

    def _execute_create_study_plan(
        self, args: Dict[str, Any], db: Session, user_id: int = 1
    ) -> tuple[Dict[str, Any], Any]:
        subjects = args.get("subjects", [])
        total_days = int(args.get("total_days", 7))
        hours_per_day = float(args.get("hours_per_day", 2.0))
        start_date_str = args.get("start_date", datetime.now().strftime("%Y-%m-%d"))
        notes = args.get("notes", "")

        try:
            start_dt = datetime.strptime(start_date_str, "%Y-%m-%d")
        except ValueError:
            start_dt = datetime.now()
            start_date_str = start_dt.strftime("%Y-%m-%d")

        end_dt = start_dt + timedelta(days=total_days - 1)
        end_date_str = end_dt.strftime("%Y-%m-%d")

        # Ask AI to generate the schedule JSON
        schedule_prompt = f"""Create a detailed study schedule JSON for:
Subjects: {subjects}
Total days: {total_days}
Hours per day: {hours_per_day}
Start date: {start_date_str}
Notes: {notes}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "title": "Study Plan for <subjects>",
  "sessions": [
    {{
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "subject": "Subject Name",
      "topic": "Specific topic to study",
      "duration_hours": 1.5,
      "start_time": "09:00",
      "end_time": "10:30"
    }}
  ]
}}

Generate exactly {total_days} days worth of sessions. Distribute subjects evenly.
"""
        schedule_resp = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": schedule_prompt}],
            response_format={"type": "json_object"},
        )
        raw = schedule_resp.choices[0].message.content or "{}"
        try:
            schedule_data = json.loads(raw)
        except json.JSONDecodeError:
            schedule_data = {"title": f"Study Plan", "sessions": []}

        title = schedule_data.get("title", f"Study Plan — {', '.join(subjects)}")
        sessions_data = schedule_data.get("sessions", [])

        plan = StudyPlan(
            user_id=user_id,
            title=title,
            subjects=subjects,
            total_days=total_days,
            hours_per_day=hours_per_day,
            start_date=start_date_str,
            end_date=end_date_str,
            notes=notes,
        )
        db.add(plan)
        db.flush()

        for s in sessions_data:
            session = StudySession(
                plan_id=plan.id,
                day_number=int(s.get("day_number", 1)),
                date=s.get("date", start_date_str),
                subject=s.get("subject", subjects[0] if subjects else "General"),
                topic=s.get("topic", "Review"),
                duration_hours=float(s.get("duration_hours", hours_per_day)),
                start_time=s.get("start_time"),
                end_time=s.get("end_time"),
                status="pending",
            )
            db.add(session)

        db.commit()
        db.refresh(plan)

        result = {
            "plan_id": plan.id,
            "title": plan.title,
            "total_days": plan.total_days,
            "sessions_created": len(sessions_data),
            "start_date": plan.start_date,
            "end_date": plan.end_date,
        }
        return result, result

    # ------------------------------------------------------------------
    # Tool: generate_quiz
    # ------------------------------------------------------------------

    def _execute_generate_quiz(
        self, args: Dict[str, Any], db: Session, user_id: int = 1
    ) -> tuple[Dict[str, Any], Any]:
        subject = args.get("subject", "General")
        topic = args.get("topic", "General Knowledge")
        difficulty = args.get("difficulty", "intermediate")
        num_questions = int(args.get("num_questions", 5))

        quiz_prompt = f"""Generate a {difficulty} level quiz on {subject} — {topic}.
Create exactly {num_questions} multiple choice questions.

Return ONLY valid JSON (no markdown):
{{
  "questions": [
    {{
      "question_text": "Question text here?",
      "option_a": "First option",
      "option_b": "Second option",
      "option_c": "Third option",
      "option_d": "Fourth option",
      "correct_option": "a",
      "explanation": "Brief explanation of why this is correct"
    }}
  ]
}}

correct_option must be exactly one of: a, b, c, d (lowercase).
Make questions academically rigorous and relevant to {topic}.
"""
        quiz_resp = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": quiz_prompt}],
            response_format={"type": "json_object"},
        )
        raw = quiz_resp.choices[0].message.content or "{}"
        try:
            quiz_data = json.loads(raw)
        except json.JSONDecodeError:
            quiz_data = {"questions": []}

        questions_data = quiz_data.get("questions", [])[:num_questions]

        quiz = Quiz(
            user_id=user_id,
            title=f"{subject} — {topic} Quiz ({difficulty})",
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            num_questions=len(questions_data),
        )
        db.add(quiz)
        db.flush()

        for idx, q in enumerate(questions_data):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question_text=q.get("question_text", ""),
                option_a=q.get("option_a", ""),
                option_b=q.get("option_b", ""),
                option_c=q.get("option_c", ""),
                option_d=q.get("option_d", ""),
                correct_option=q.get("correct_option", "a").lower(),
                explanation=q.get("explanation", ""),
                order_num=idx,
            )
            db.add(question)

        db.commit()
        db.refresh(quiz)

        result = {
            "quiz_id": quiz.id,
            "title": quiz.title,
            "num_questions": len(questions_data),
            "subject": subject,
            "topic": topic,
            "difficulty": difficulty,
        }
        return result, result

    # ------------------------------------------------------------------
    # Tool: create_task
    # ------------------------------------------------------------------

    def _execute_create_task(
        self, args: Dict[str, Any], db: Session, user_id: int = 1
    ) -> tuple[Dict[str, Any], Any]:
        title = args.get("title", "New Task")
        description = args.get("description")
        deadline_str = args.get("deadline")

        deadline = None
        if deadline_str:
            try:
                deadline = datetime.strptime(deadline_str, "%Y-%m-%d")
            except ValueError:
                pass

        task = Task(
            user_id=user_id,
            title=title,
            description=description,
            deadline=deadline,
            status="pending",
        )
        db.add(task)
        db.commit()
        db.refresh(task)

        result = {
            "task_id": task.id,
            "title": task.title,
            "deadline": deadline_str,
            "status": task.status,
        }
        return result, result

    # ------------------------------------------------------------------
    # Tool: list_tasks
    # ------------------------------------------------------------------

    def _execute_list_tasks(
        self, args: Dict[str, Any], db: Session, user_id: int = 1
    ) -> tuple[Dict[str, Any], Any]:
        tasks = (
            db.query(Task)
            .filter(Task.user_id == user_id, Task.status.in_(["pending", "overdue"]))
            .order_by(Task.deadline.asc().nullslast())
            .limit(20)
            .all()
        )
        task_list = [
            {
                "id": t.id,
                "title": t.title,
                "deadline": t.deadline.strftime("%Y-%m-%d") if t.deadline else None,
                "status": t.status,
            }
            for t in tasks
        ]
        result = {"tasks": task_list, "count": len(task_list)}
        return result, result

    # ------------------------------------------------------------------
    # Tool: list_study_plans
    # ------------------------------------------------------------------

    def _execute_list_study_plans(
        self, args: Dict[str, Any], db: Session, user_id: int = 1
    ) -> tuple[Dict[str, Any], Any]:
        plans = (
            db.query(StudyPlan)
            .filter(StudyPlan.user_id == user_id)
            .order_by(StudyPlan.created_at.desc())
            .limit(10)
            .all()
        )
        plan_list = [
            {
                "id": p.id,
                "title": p.title,
                "subjects": p.subjects,
                "total_days": p.total_days,
                "start_date": p.start_date,
                "end_date": p.end_date,
            }
            for p in plans
        ]
        result = {"plans": plan_list, "count": len(plan_list)}
        return result, result

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _save_chat(
        self,
        db: Session,
        role: str,
        content: str,
        tool_called: Optional[str] = None,
        user_id: int = 1,
    ) -> None:
        entry = ChatHistory(
            user_id=user_id,
            role=role,
            content=content,
            tool_called=tool_called,
        )
        db.add(entry)
        db.commit()

    def _build_history(self, db: Session, user_id: int = 1) -> List[Dict[str, Any]]:
        recent = (
            db.query(ChatHistory)
            .filter(ChatHistory.user_id == user_id)
            .order_by(ChatHistory.created_at.desc())
            .limit(20)
            .all()
        )
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for entry in reversed(recent):
            messages.append({"role": entry.role, "content": entry.content})
        return messages

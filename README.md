# 📚 Smart Study Agent

> An AI-powered study companion that helps you plan sessions, generate quizzes, manage tasks, and stay on track — all from a clean, modern dashboard.

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Assistant** | Chat interface powered by OpenAI GPT or Google Gemini |
| 📅 **Study Planner** | AI-generated multi-day study plans saved to your account |
| 🧠 **Quiz Generator** | Auto-generated quizzes with instant scoring and explanations |
| ✅ **Task Manager** | Full CRUD task list with due dates and priority levels |
| 📊 **Dashboard** | At-a-glance stats: study hours, quiz scores, tasks completed |
| 📜 **Activity History** | Searchable log of every AI interaction |
| 📧 **Email Alerts** | Configurable email notifications for tasks and plans |

---

## 🛠 Tech Stack

### Backend
- **FastAPI** — async Python REST API framework
- **SQLAlchemy 2.0** — ORM with async support
- **PostgreSQL 15** — primary relational database
- **Alembic** — database migrations
- **APScheduler** — background scheduler for email alerts
- **OpenAI / Gemini** — AI provider (switchable via env var)
- **aiosmtplib** — async SMTP for email alerts

### Frontend
- **React 18** + **TypeScript**
- **Vite** — fast dev server and bundler
- **Tailwind CSS** — utility-first styling
- **React Router v6** — SPA routing
- **Axios** — HTTP client
- **Lucide React** — icon library

---

## 🚀 Local Development Setup

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.11+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Included with Node.js |
| PostgreSQL | 15+ | [postgresql.org](https://www.postgresql.org/download/) |
| Git | any | [git-scm.com](https://git-scm.com) |

---

### 1 · Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-study-agent.git
cd smart-study-agent
```

---

### 2 · PostgreSQL Setup

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Ubuntu / Debian
sudo apt install -y postgresql-15
sudo systemctl start postgresql

# Windows — use the graphical installer from postgresql.org
```

Create the database and user:

```sql
-- connect as the postgres superuser
psql -U postgres

CREATE USER smart_study_user WITH PASSWORD 'yourpassword';
CREATE DATABASE smart_study_agent OWNER smart_study_user;
GRANT ALL PRIVILEGES ON DATABASE smart_study_agent TO smart_study_user;
\q
```

---

### 3 · Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3.11 -m venv venv
# macOS / Linux
source venv/bin/activate
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Open .env and fill in your values (see AI Configuration section below)

# Initialise the database schema
python -c "from app.database.connection import init_db; init_db()"

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API is now running at **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

---

### 4 · Frontend Setup

Open a **new terminal**:

```bash
cd frontend

npm install
npm run dev
```

Frontend is now running at **http://localhost:5173**

The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`, so no CORS issues during development.

---

## 🤖 AI Configuration

The backend supports two AI providers. Set `AI_PROVIDER` in `.env` to switch between them.

### OpenAI (recommended)

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
AI_MODEL=gpt-4o-mini        # or gpt-4o, gpt-3.5-turbo
```

Get a key: https://platform.openai.com/api-keys

### Google Gemini

```dotenv
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key-here
AI_MODEL=gemini-1.5-flash   # or gemini-1.5-pro
```

Get a key: https://aistudio.google.com/app/apikey

> [!NOTE]
> You only need **one** provider key. The unused key can be left blank.

---

## 🧪 Testing the AI Tools

Once the app is running, try these prompts in the **AI Assistant** page:

### 1 · General Chat
> "Explain the difference between supervised and unsupervised learning in simple terms."

### 2 · Study Plan Generation
> "Create a 7-day study plan for learning React from scratch. I have 2 hours per day."

The plan is automatically saved and appears on the **Study Planner** page.

### 3 · Quiz Generation
> "Generate a 5-question multiple-choice quiz on Python list comprehensions."

The quiz appears on the **Quizzes** page. Click **Take Quiz** to attempt it.

---

## 📡 API Endpoint Documentation

Base URL (local): `http://localhost:8000`

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server and DB health check |

**Response:**
```json
{ "status": "healthy", "database": "connected" }
```

---

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Aggregate stats for the overview page |

**Response:**
```json
{
  "total_study_hours": 12.5,
  "completed_tasks": 8,
  "quiz_avg_score": 76.4,
  "active_plans": 2
}
```

---

### AI Agent

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/agent/chat` | `{ "message": "string", "context": "general\|study_plan\|quiz" }` | Send a message to the AI agent |

**Response:**
```json
{
  "reply": "Here is a 7-day plan...",
  "action_taken": "study_plan_created",
  "action_data": { "plan_id": 42 }
}
```

---

### Tasks

| Method | Endpoint | Body / Params | Description |
|---|---|---|---|
| GET | `/api/tasks` | `?status=pending&priority=high` | List tasks with optional filters |
| POST | `/api/tasks` | `TaskCreate` schema | Create a new task |
| GET | `/api/tasks/{id}` | — | Get a single task |
| PATCH | `/api/tasks/{id}` | `TaskUpdate` schema | Update task fields |
| DELETE | `/api/tasks/{id}` | — | Delete a task |
| PATCH | `/api/tasks/{id}/complete` | — | Mark task as completed |

**TaskCreate schema:**
```json
{
  "title": "Read Chapter 5",
  "description": "Optional notes",
  "due_date": "2025-01-15",
  "priority": "high"
}
```

---

### Study Plans

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/study-plans` | List all saved study plans |
| GET | `/api/study-plans/{id}` | Get a plan with its days and sessions |
| DELETE | `/api/study-plans/{id}` | Delete a study plan |

---

### Quizzes

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/quizzes` | — | List all quizzes |
| GET | `/api/quizzes/{id}` | — | Get quiz with questions |
| POST | `/api/quizzes/{id}/submit` | `{ "answers": { "q_id": "answer" } }` | Submit answers, get score |
| DELETE | `/api/quizzes/{id}` | — | Delete a quiz |

**Submit response:**
```json
{
  "score": 80,
  "total": 5,
  "correct": 4,
  "results": [
    { "question_id": 1, "correct": true, "explanation": "..." },
    { "question_id": 2, "correct": false, "your_answer": "B", "correct_answer": "C", "explanation": "..." }
  ]
}
```

---

### Activity History

| Method | Endpoint | Params | Description |
|---|---|---|---|
| GET | `/api/activity` | `?page=1&per_page=20&type=quiz` | Paginated activity log |
| DELETE | `/api/activity/{id}` | — | Delete an activity record |

---

### Settings

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/settings/email-alerts` | — | Get current email alert config |
| PATCH | `/api/settings/email-alerts` | `EmailAlertSettings` schema | Update email alert settings |

**EmailAlertSettings schema:**
```json
{
  "enabled": true,
  "email": "user@example.com",
  "alert_task_overdue": true,
  "alert_quiz_completed": false,
  "alert_plan_created": true
}
```

---

## 📧 Email Alerts Feature

Smart Study Agent can send you email notifications via Gmail SMTP.

**Configure in `.env`:**
```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youraddress@gmail.com
SMTP_PASSWORD=your-app-password   # NOT your Gmail login password
```

> [!TIP]
> You need a **Gmail App Password** (not your regular password).  
> Enable 2-Step Verification, then go to [Google App Passwords](https://myaccount.google.com/apppasswords) and generate one.

**Available alert types:**
- 🔴 **Task Overdue** — fired when a task passes its due date still pending
- 🟢 **Quiz Completed** — fired when you submit a quiz
- 🔵 **Study Plan Created** — fired when the AI saves a new plan

Manage alerts from the **Settings** page inside the app.

---

## 🗂 Project Structure

```
smart-study-agent/
├── .gitignore
├── README.md
├── deployment/
│   ├── nginx.conf                   # Nginx reverse proxy config
│   ├── smart-study-agent.service    # systemd service unit
│   └── DEPLOY.md                    # AWS EC2 deployment guide
│
├── backend/
│   ├── alembic.ini                  # Alembic config
│   ├── alembic/
│   │   └── env.py                   # Alembic env (reads app models)
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py                  # FastAPI app factory
│       ├── config.py                # Pydantic settings
│       ├── database/
│       │   ├── base.py              # Declarative base
│       │   └── connection.py        # Engine, session, init_db()
│       ├── models/                  # SQLAlchemy ORM models
│       │   ├── task.py
│       │   ├── study_plan.py
│       │   ├── quiz.py
│       │   ├── activity.py
│       │   └── settings.py
│       ├── schemas/                 # Pydantic request/response schemas
│       ├── routers/                 # FastAPI route handlers
│       │   ├── agent.py
│       │   ├── tasks.py
│       │   ├── study_plans.py
│       │   ├── quizzes.py
│       │   ├── activity.py
│       │   ├── dashboard.py
│       │   └── settings.py
│       ├── services/
│       │   ├── ai_service.py        # OpenAI / Gemini abstraction
│       │   └── email_service.py     # aiosmtplib email sender
│       └── scheduler.py             # APScheduler background jobs
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── types/index.ts
        ├── services/api.ts
        ├── hooks/
        │   ├── useStats.ts
        │   ├── useTasks.ts
        │   ├── useStudyPlans.ts
        │   ├── useQuizzes.ts
        │   └── useActivity.ts
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx
        │   │   ├── Header.tsx
        │   │   └── MainLayout.tsx
        │   └── ui/
        │       ├── Card.tsx
        │       ├── Button.tsx
        │       ├── Badge.tsx
        │       ├── LoadingSpinner.tsx
        │       ├── EmptyState.tsx
        │       └── Modal.tsx
        └── pages/
            ├── Overview.tsx
            ├── AIAssistant.tsx
            ├── StudyPlanner.tsx
            ├── Quizzes.tsx
            ├── Tasks.tsx
            ├── ActivityHistory.tsx
            └── Settings.tsx
```

---

## 📤 Push to GitHub

```bash
# From the project root
git init
git add .
git commit -m "Initial commit: Smart Study Agent"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-study-agent.git
git push -u origin main
```

> [!CAUTION]
> Run `git status` before pushing and confirm `.env` is **not** listed.
> The `.gitignore` excludes it, but always verify.

---

## ☁️ AWS Cloud & Database Deployment

For production deployment on AWS:
- **Database Setup (AWS RDS PostgreSQL or Self-Hosted)**: 👉 **[deployment/AWS_DATABASE_GUIDE.md](./deployment/AWS_DATABASE_GUIDE.md)**
- **EC2 Deployment Guide (Amazon Linux / Ubuntu)**: 👉 **[deployment/DEPLOY.md](./deployment/DEPLOY.md)**
- **One-Click Automated EC2 Script**: `deployment/setup-ec2.sh`

### Option A: One-Click Script on EC2
```bash
git clone https://github.com/GhulamMuhiudin/Smart-study-agent.git
cd Smart-study-agent
chmod +x deployment/setup-ec2.sh
./deployment/setup-ec2.sh
```

### Option B: Docker Compose (Any Cloud Server)
```bash
git clone https://github.com/GhulamMuhiudin/Smart-study-agent.git
cd Smart-study-agent
cp backend/.env.example backend/.env
# Edit backend/.env with your AI API Key, Database URL, and SECRET_KEY
docker compose up --build -d
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

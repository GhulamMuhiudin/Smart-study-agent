# ☁️ AWS Cloud Database Setup Guide — Smart Study Agent

This guide covers everything you need to create, connect, and manage your PostgreSQL database on **AWS RDS** (Managed Cloud Database) or **AWS EC2** (Zero-Cost Self-Hosted).

---

## 🎯 Option 1: AWS RDS PostgreSQL (Recommended for Production)

AWS RDS provides a fully managed PostgreSQL database with automated backups, high availability, and scaling.

### Step 1: Open AWS RDS Console
1. Log in to [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **RDS** and click **Databases**.
3. Click the orange **Create database** button.

---

### Step 2: Configure Database Options

| Setting | Value / Selection | Notes |
|---|---|---|
| **Choose a database creation method** | **Standard create** | Gives full control over configuration |
| **Engine type** | **PostgreSQL** | Compatible with SQLAlchemy models |
| **Engine Version** | **PostgreSQL 15.x or 16.x** | Recommended stable version |
| **Templates** | **Free tier** | ⭐ **Important** (prevents unexpected charges, gives 750 free hours/month on db.t3.micro/db.t4g.micro) |

---

### Step 3: Settings & Credentials

1. **DB instance identifier**: `smart-study-db`
2. **Master username**: `postgres` (or `smart_study_admin`)
3. **Master password**: Enter a secure password (e.g., `MyStudyPass2026!`)
4. **Confirm password**: Re-enter password.

> [!CAUTION]
> Remember this username and password! You will need them to build your `DATABASE_URL`.

---

### Step 4: Instance & Storage

- **DB instance class**: `db.t3.micro` or `db.t4g.micro` (Free Tier eligible: 1-2 vCPU, 1 GB RAM).
- **Storage type**: `General Purpose SSD (gp2 or gp3)`.
- **Allocated storage**: `20 GiB` (minimum, included in Free Tier).
- **Storage autoscaling**: Can leave enabled (threshold 1000 GiB) or uncheck to prevent auto-scaling.

---

### Step 5: Connectivity & Network Security (CRITICAL)

This step decides who can access your database.

1. **Virtual Private Cloud (VPC)**: Select the **Default VPC** (where your EC2 instance will live).
2. **Public access**:
   - Select **Yes** if you want to test connecting from your local PC or pgAdmin.
   - Select **No** if only your EC2 instance in the same VPC should connect to it.
3. **VPC security group**: Choose **Create new** or **Select existing**:
   - Group name: `smart-study-rds-sg`
4. **Database port**: `5432` (Default).

#### 🛡️ Configure RDS Security Group Inbound Rules:
Go to **EC2 Console** $\rightarrow$ **Security Groups** $\rightarrow$ select `smart-study-rds-sg`:
- **Add Rule**:
  - **Type**: `PostgreSQL`
  - **Port**: `5432`
  - **Source**:
    - Select your **EC2 Security Group** (recommended for production security).
    - Or select `0.0.0.0/0` (anywhere) temporarily while testing if public access is enabled.

---

### Step 6: Initial Database Name (Important)

1. Scroll down and expand **Additional configuration**.
2. Under **Initial database name**, type:
   ```text
   smart_study_agent
   ```
   *(If you leave this empty, RDS will not create a default database named `smart_study_agent`).*
3. Click **Create database** at the bottom.
4. Wait 5-10 minutes until Status changes from *Creating* to **Available**.

---

### Step 7: Get Your Endpoint & Build Connection String

1. Click on your database `smart-study-db`.
2. Under **Connectivity & security**, copy the **Endpoint**:
   - Example: `smart-study-db.c123456789.us-east-1.rds.amazonaws.com`
3. Your connection string for `backend/.env` will be:

```dotenv
DATABASE_URL=postgresql://postgres:MyStudyPass2026!@smart-study-db.c123456789.us-east-1.rds.amazonaws.com:5432/smart_study_agent
```

---

## 🎯 Option 2: Self-Hosted PostgreSQL on EC2 (100% Free / Single Instance)

If you prefer to keep everything on a single EC2 instance without creating a separate RDS resource:

### Step 1: Install PostgreSQL on EC2
On your EC2 terminal:

```bash
# Ubuntu
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Amazon Linux 2023
sudo dnf install -y postgresql15-server postgresql15
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Step 2: Create Database and User
```bash
sudo -u postgres psql <<'SQL'
CREATE USER postgres WITH PASSWORD 'MyStudyPass2026!';
CREATE DATABASE smart_study_agent OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE smart_study_agent TO postgres;
\q
SQL
```

### Step 3: Connection String for EC2 Local PostgreSQL
In `/opt/smart-study-agent/backend/.env`:
```dotenv
DATABASE_URL=postgresql://postgres:MyStudyPass2026!@localhost:5432/smart_study_agent
```

---

## 🔄 How Database Initialization Works on AWS

When you deploy the backend on AWS:
1. The backend automatically reads `DATABASE_URL` from `backend/.env`.
2. If `DATABASE_URL` starts with `postgresql://`, it automatically routes through `psycopg2-binary`.
3. In `backend/app/main.py`, the lifespan hook calls `init_db()`.
4. `init_db()` executes `Base.metadata.create_all(bind=engine)`, which automatically generates all tables in PostgreSQL:
   - `users` (with email, password hashing, alert settings)
   - `study_plans`
   - `study_sessions`
   - `tasks`
   - `quizzes`
   - `quiz_questions`
   - `quiz_attempts`
   - `chat_history`
   - `agent_execution_history`
5. It also auto-creates the default demo user (`student@studyagent.local` with password `password123`).

### Manual Table Creation / Verification Command
Inside your EC2 server virtual environment:
```bash
cd /opt/smart-study-agent
source venv/bin/activate
python3 -c "from app.database.connection import init_db; init_db()"
```

---

## 🧪 Testing the Database Connection

### From EC2 CLI:
```bash
# Test connection with psql:
psql -h <RDS_ENDPOINT> -U postgres -d smart_study_agent

# List all created tables:
\dt

# Exit:
\q
```

### Via Backend Health Endpoint:
```bash
curl http://localhost:8000/api/health
# Response:
# {"status":"healthy","database":"connected"}
```

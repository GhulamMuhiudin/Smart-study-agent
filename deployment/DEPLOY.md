# Amazon Linux 2023 Deployment Guide — Smart Study Agent

> [!IMPORTANT]
> This guide targets **Amazon Linux 2023** on an EC2 t2.micro / t3.micro instance (1 GB RAM).
> Read every step before you begin; skipping steps causes hard-to-debug failures.

---

## Prerequisites

| Resource | Requirement |
|---|---|
| EC2 instance type | t2.micro or t3.micro (1 GB RAM is sufficient) |
| AMI | Amazon Linux 2023 (latest) |
| Security Group — inbound | 22 (SSH), 80 (HTTP), 443 (HTTPS) |
| Security Group — blocked | **5432 must NOT be open to the internet** |
| Key pair | Your `.pem` file for SSH access |
| Domain / IP | Public IP or Elastic IP of the instance |

---

## Step 1 — System Update

```bash
sudo dnf update -y
```

---

## Step 2 — Install Python 3.11

Amazon Linux 2023 ships with Python 3.9; install 3.11 explicitly:

```bash
sudo dnf install -y python3.11 python3.11-pip python3.11-devel gcc
# Confirm version
python3.11 --version
```

---

## Step 3 — Install PostgreSQL 15

```bash
sudo dnf install -y postgresql15-server postgresql15
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql   # should show "active (running)"
```

---

## Step 4 — Set Up the Database

```bash
sudo -u postgres psql <<'SQL'
CREATE USER smart_study_user WITH PASSWORD 'StrongPassword123!';
CREATE DATABASE smart_study_agent OWNER smart_study_user;
GRANT ALL PRIVILEGES ON DATABASE smart_study_agent TO smart_study_user;
\q
SQL
```

> [!TIP]
> Use a strong, unique password and record it somewhere safe — you will need it in `.env`.

---

## Step 5 — Install Nginx

```bash
sudo dnf install -y nginx
sudo systemctl enable nginx
# Do NOT start Nginx yet — we configure it first (Step 11)
```

---

## Step 6 — Upload the Project

From your **local machine**:

```bash
# Option A: scp (simple)
scp -i your-key.pem -r smart-study-agent/ ec2-user@YOUR_INSTANCE_IP:/opt/

# Option B: git clone on the server
# (after pushing to GitHub — see GitHub Upload section below)
# ssh into the instance, then:
# sudo git clone https://github.com/YOUR_USERNAME/smart-study-agent.git /opt/smart-study-agent
```

Ensure the directory exists and is owned correctly:

```bash
sudo chown -R ec2-user:ec2-user /opt/smart-study-agent
```

---

## Step 7 — Backend Setup

```bash
cd /opt/smart-study-agent/backend

# Create virtual environment with Python 3.11
python3.11 -m venv /opt/smart-study-agent/venv
source /opt/smart-study-agent/venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env from the example template
cp .env.example .env
nano .env   # fill in real values (see table below)
```

### Required `.env` values

| Variable | Example / Description |
|---|---|
| `DATABASE_URL` | `postgresql://smart_study_user:StrongPassword123!@localhost:5432/smart_study_agent` |
| `AI_PROVIDER` | `openai` or `gemini` |
| `OPENAI_API_KEY` | `sk-…` (required if using OpenAI) |
| `GEMINI_API_KEY` | (required if using Gemini) |
| `AI_MODEL` | `gpt-4o-mini` or `gemini-1.5-flash` |
| `CORS_ORIGINS` | `http://YOUR_INSTANCE_IP` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASSWORD` | Your Gmail App Password |
| `SECRET_KEY` | A long random string (`openssl rand -hex 32`) |

Secure the file immediately after editing:

```bash
chmod 600 .env
```

---

## Step 8 — Initialise the Database

```bash
# Still inside the venv
python -c "from app.database.connection import init_db; init_db()"
```

You should see table-creation log lines. If you see errors, verify `DATABASE_URL` in `.env`.

---

## Step 9 — Set Up the systemd Service

```bash
sudo cp /opt/smart-study-agent/deployment/smart-study-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable smart-study-agent
sudo systemctl start smart-study-agent
sudo systemctl status smart-study-agent   # should show "active (running)"
```

Check logs if the service fails:

```bash
sudo journalctl -u smart-study-agent -n 50 --no-pager
```

---

## Step 10 — Build the React Frontend

> [!NOTE]
> Node.js is not installed by default on Amazon Linux 2023. Install it first:

```bash
sudo dnf install -y nodejs npm
node --version   # should be 18+
```

```bash
cd /opt/smart-study-agent/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy static files to Nginx web root
sudo mkdir -p /var/www/smart-study-agent
sudo cp -r dist/* /var/www/smart-study-agent/
sudo chown -R nginx:nginx /var/www/smart-study-agent
```

---

## Step 11 — Configure and Start Nginx

```bash
sudo cp /opt/smart-study-agent/deployment/nginx.conf /etc/nginx/conf.d/smart-study-agent.conf

# Test the config before reloading
sudo nginx -t

# If test passes:
sudo systemctl start nginx
sudo systemctl status nginx
```

> [!CAUTION]
> If `nginx -t` reports errors, do NOT start Nginx — fix the config first. Common issues:
> duplicate `server_name _` blocks (remove the default `/etc/nginx/nginx.conf` `server {}` block).

---

## Step 12 — Verification

```bash
# Health check through Nginx → FastAPI
curl http://localhost/api/health

# Expected response:
# {"status":"healthy","database":"connected"}
```

Open `http://YOUR_INSTANCE_IP` in a browser — you should see the React dashboard.

---

## HTTPS with Certbot (Optional but Recommended)

```bash
sudo dnf install -y python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
sudo systemctl reload nginx
```

Certbot auto-renews via a systemd timer — no cron needed.

---

## Environment Variable Security

```bash
# .env should only be readable by the service user
chmod 600 /opt/smart-study-agent/backend/.env
ls -la /opt/smart-study-agent/backend/.env
# -rw------- 1 ec2-user ec2-user ...
```

> [!CAUTION]
> **Never** commit `.env` to Git. The `.gitignore` excludes it, but double-check with
> `git status` before every push.

---

## GitHub Upload

```bash
cd /opt/smart-study-agent   # or your local project root
git init
git add .
git commit -m "Initial commit: Smart Study Agent"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smart-study-agent.git
git push -u origin main
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `502 Bad Gateway` | FastAPI not running | `sudo systemctl restart smart-study-agent` |
| `curl /api/health` returns HTML | Nginx serving React instead of proxying | Check `nginx.conf` `location /api/` block |
| DB connection refused | PostgreSQL stopped | `sudo systemctl start postgresql` |
| `ModuleNotFoundError` | venv not activated / wrong path | Verify `ExecStart` path in `.service` file |
| Email alerts not sent | SMTP credentials wrong | Check `SMTP_USER`, `SMTP_PASSWORD` in `.env` |

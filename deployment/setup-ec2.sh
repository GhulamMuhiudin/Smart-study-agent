#!/usr/bin/env bash
set -e

# ==============================================================================
# Smart Study Agent — One-Click AWS EC2 Automated Setup Script
# Works on: Amazon Linux 2023, Ubuntu 22.04 / 24.04
# ==============================================================================

echo "=========================================================="
echo " Starting Smart Study Agent AWS EC2 Setup..."
echo "=========================================================="

# 1. Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
fi

echo "Detected OS: $OS"

if [[ "$OS" == "amzn" || "$OS" == "fedora" || "$OS" == "rhel" ]]; then
    echo "Updating system packages via dnf..."
    sudo dnf update -y
    sudo dnf install -y python3.11 python3.11-pip python3.11-devel gcc nginx git nodejs npm
elif [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    echo "Updating system packages via apt..."
    sudo apt update -y && sudo apt upgrade -y
    sudo apt install -y python3 python3-pip python3-venv nginx git curl build-essential libpq-dev
    # Install Node.js 20 if not present
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
else
    echo "Unsupported OS. Please adapt script commands manually."
fi

PROJECT_DIR="/opt/smart-study-agent"

# 2. Check Directory
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Setting up project directory at $PROJECT_DIR..."
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown -R $USER:$USER "$PROJECT_DIR"
    git clone https://github.com/GhulamMuhiudin/Smart-study-agent.git "$PROJECT_DIR"
else
    echo "Project already exists at $PROJECT_DIR. Pulling latest main branch..."
    cd "$PROJECT_DIR"
    git pull origin main
fi

cd "$PROJECT_DIR"

# 3. Backend Virtual Environment
echo "Setting up Python virtual environment..."
python3 -m venv venv || python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# 4. Check for .env file
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
    echo "WARNING: Please edit backend/.env with your DATABASE_URL, AI API key, and SECRET_KEY!"
fi

# 5. Initialize Database
echo "Initializing Database tables..."
python3 -c "from app.database.connection import init_db; init_db()" || echo "DB init will complete once DATABASE_URL is set in .env."

# 6. Setup Systemd Service
echo "Configuring systemd service..."
sudo cp deployment/smart-study-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable smart-study-agent
sudo systemctl restart smart-study-agent || true

# 7. Build Frontend
echo "Building Frontend production bundle..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

# 8. Configure Nginx
echo "Configuring Nginx..."
sudo mkdir -p /var/www/smart-study-agent
sudo cp -r dist/* /var/www/smart-study-agent/
sudo cp "$PROJECT_DIR/deployment/nginx.conf" /etc/nginx/conf.d/smart-study-agent.conf 2>/dev/null || sudo cp "$PROJECT_DIR/deployment/nginx.conf" /etc/nginx/sites-available/smart-study-agent

if [ -d /etc/nginx/sites-enabled ]; then
    sudo ln -sf /etc/nginx/sites-available/smart-study-agent /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
fi

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "=========================================================="
echo " Setup Finished Successfully!"
echo " Backend running on port 8000 via systemd (smart-study-agent)"
echo " Frontend served on port 80 via Nginx"
echo " Visit http://<YOUR_EC2_PUBLIC_IP> in your browser."
echo "=========================================================="

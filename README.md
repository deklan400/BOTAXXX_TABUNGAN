# BOTAXXX – Financial Command Center

A comprehensive fintech-grade financial management system with multi-channel access (Web Dashboard + Telegram Bot).

## 🚀 Features

- **Multi-Component Architecture**: FastAPI backend, PostgreSQL database, React dashboard, Telegram bot
- **Authentication**: JWT-based auth with Google OAuth support
- **Financial Modules**:
  - **Savings (Tabungan)**: Track income/expense with balance calculation
  - **Loans (Pinjaman)**: Manage loans with payment tracking
  - **Targets**: Set financial goals with progress tracking
- **Overview Dashboard**: Combined financial overview with charts and statistics
- **Telegram Bot**: Full-featured bot for managing finances on-the-go
- **Production-Ready**: Logging, rate limiting, CI/CD, unit tests, Docker support

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- Docker & Docker Compose (optional, recommended)
- Telegram Bot Token (from @BotFather)

## 🛠️ Setup

### ⚡ Quick Installation (Recommended)

#### Linux/Mac

```bash
chmod +x install.sh
./install.sh
```

#### Windows (PowerShell)

```powershell
.\install.ps1
```

The installation script will automatically:
- ✅ Check prerequisites (Python, Node.js, Docker)
- ✅ Create Python virtual environments (backend & bot)
- ✅ Install all dependencies (backend, frontend, bot)
- ✅ Create `.env` files from templates
- ✅ Optionally start database with Docker

**⚠️ Important:** After installation, edit these files:
- `backend/.env` - Set `SECRET_KEY` (minimum 32 characters) and `DATABASE_URL`
- `bot/.env` - Set `TELEGRAM_BOT_TOKEN` (get from [@BotFather](https://t.me/BotFather))

---

### 📝 Manual Setup

### Quick Installation (Recommended)

#### Linux/Mac

Run the installation script:

```bash
chmod +x install.sh
./install.sh
```

#### Windows (PowerShell)

Run the PowerShell installation script:

```powershell
.\install.ps1
```

The installation script will:
- ✅ Check prerequisites (Python, Node.js, Docker)
- ✅ Set up Python virtual environments for backend and bot
- ✅ Install all dependencies (backend, frontend, bot)
- ✅ Create `.env` files from templates
- ✅ Optionally start the database with Docker

**Important:** After installation, make sure to edit the `.env` files:
- `backend/.env` - Set `SECRET_KEY` (minimum 32 characters) and `DATABASE_URL`
- `bot/.env` - Set `TELEGRAM_BOT_TOKEN`

---

### Manual Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd BOTAXXX_TABUNGAN
```

### 2. Environment Variables

Create `.env` files in root and `backend/` directory:

**Root `.env`**:
```env
# Database
POSTGRES_USER=botaxxx
POSTGRES_PASSWORD=botaxxx_password
POSTGRES_DB=botaxxx_db
DATABASE_URL=postgresql://botaxxx:botaxxx_password@localhost:5432/botaxxx_db

# Backend
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Frontend
VITE_API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# CORS (comma-separated list of allowed origins)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
API_BASE_URL=http://localhost:8000
```

**Backend `.env`** (same as root, or use root):
```env
DATABASE_URL=postgresql://botaxxx:botaxxx_password@localhost:5432/botaxxx_db
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

### 3. Run with Docker Compose (Recommended)

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- FastAPI backend (port 8000)
- React dashboard (port 5173)

### 4. Run Locally (Without Docker)

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Dashboard Setup

```bash
cd dashboard

# Install dependencies (if not done during install)
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

#### Telegram Bot Setup

```bash
cd bot

# Activate virtual environment (created by install script)
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Make sure .env file has TELEGRAM_BOT_TOKEN set
# Edit bot/.env and add your token from @BotFather

# Start bot
python main.py
```

**Note:** Make sure you have:
1. Created a bot with [@BotFather](https://t.me/BotFather) on Telegram
2. Set `TELEGRAM_BOT_TOKEN` in `bot/.env`
3. Started the backend server (the bot needs the API to be running)

---

## 🚀 VPS Deployment

### Quick Start

Untuk deploy ke VPS, ada 2 opsi:

#### Opsi 1: Automated Script (Recommended)

```bash
# Login ke VPS
ssh root@your-vps-ip

# Clone repository
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git
cd BOTAXXX_TABUNGAN

# Jalankan deployment script
chmod +x deploy-vps.sh
sudo bash deploy-vps.sh
```

#### Opsi 2: Manual Setup

Ikuti panduan lengkap di:
- **📖 [SETUP_VPS_LENGKAP.md](SETUP_VPS_LENGKAP.md)** - Panduan lengkap step-by-step dari 0 ke VPS
- **⚡ [QUICK_REFERENCE_VPS.md](QUICK_REFERENCE_VPS.md)** - Quick reference untuk setup cepat
- **📚 [DEPLOY_VPS.md](DEPLOY_VPS.md)** - Dokumentasi deployment detail
- **🚀 [QUICK_START_VPS.md](QUICK_START_VPS.md)** - Quick start guide

### Dokumentasi VPS

| File | Deskripsi |
|------|-----------|
| `SETUP_VPS_LENGKAP.md` | Panduan lengkap step-by-step dari awal sampai production-ready |
| `QUICK_REFERENCE_VPS.md` | Quick reference untuk setup cepat |
| `DEPLOY_VPS.md` | Dokumentasi deployment detail dengan troubleshooting |
| `QUICK_START_VPS.md` | Quick start guide untuk deployment cepat |
| `FIX_PIP_ERROR.md` | Solusi untuk error pip installation di Debian/Ubuntu |

### Troubleshooting VPS

**Error pip installation (`uninstall-no-record-file`):**
Ini adalah error umum di Debian/Ubuntu. Lihat `FIX_PIP_ERROR.md` untuk solusi lengkap.

**Quick fix:**
```bash
# Skip upgrade pip, langsung install requirements
cd /var/www/botaxxx/backend
source venv/bin/activate
pip install -r requirements.txt
```

### Prerequisites untuk VPS

- Ubuntu 20.04/22.04 atau Debian 11/12
- Root access atau user dengan sudo privileges
- Domain name (untuk SSL)
- Telegram Bot Token dari @BotFather

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Run Specific Test File

```bash
pytest tests/test_auth.py -v
pytest tests/test_savings.py -v
pytest tests/test_loans.py -v
pytest tests/test_targets.py -v
```

## 📊 Database Migrations

### Create a new migration

```bash
cd backend
alembic revision --autogenerate -m "description"
```

### Apply migrations

```bash
alembic upgrade head
```

### Rollback migration

```bash
alembic downgrade -1
```

## 🔐 Authentication Flow

### Web Dashboard

1. Register with email/password or use Google OAuth
2. Receive JWT token stored in localStorage
3. Token automatically attached to API requests

### Telegram Bot

1. Register in web dashboard first
2. Set your Telegram ID in profile settings
3. Start bot with `/start`
4. Bot authenticates using Telegram ID → receives JWT token
5. All bot commands use authenticated API calls

## 📁 Project Structure

```
BOTAXXX_TABUNGAN/
├── backend/          # FastAPI backend
├── dashboard/        # React + Vite frontend
├── bot/              # Telegram bot
├── docker-compose.yml
└── README.md
```

## 🔧 API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/telegram-login` - Login via Telegram ID

### Users
- `GET /users/me` - Get current user
- `PUT /users/me` - Update user profile

### Overview
- `GET /overview` - Get financial overview

### Savings
- `GET /savings` - List savings transactions
- `POST /savings` - Create savings transaction
- `GET /savings/{id}` - Get savings transaction
- `PUT /savings/{id}` - Update savings transaction
- `DELETE /savings/{id}` - Delete savings transaction
- `GET /savings/balance` - Get current balance

### Loans
- `GET /loans` - List loans
- `POST /loans` - Create loan
- `GET /loans/{id}` - Get loan details
- `PUT /loans/{id}` - Update loan
- `DELETE /loans/{id}` - Delete loan
- `POST /loans/{id}/payments` - Add payment to loan
- `GET /loans/{id}/payments` - Get loan payments

### Targets
- `GET /targets` - List targets
- `POST /targets` - Create target
- `GET /targets/{id}` - Get target
- `PUT /targets/{id}` - Update target
- `DELETE /targets/{id}` - Delete target

## 🚦 Rate Limiting

Rate limiting is applied to:
- `/auth/login` - 5 requests per minute per IP
- `/auth/register` - 3 requests per minute per IP
- `/auth/telegram-login` - 10 requests per minute per IP

## 📝 Logging

Structured logging is configured for:
- API requests (method, path, status, duration)
- Errors with stack traces
- Authentication events
- Database operations

Logs are output to console in development and can be configured for file/cloud logging in production.

## 🐳 Docker Services

- **backend**: FastAPI application (port 8000)
- **db**: PostgreSQL database (port 5432)
- **dashboard**: React development server (port 5173)

## 🔄 CI/CD

GitHub Actions workflow runs on:
- Push to `main` branch
- Pull requests to `main`

Workflow includes:
- Python 3.11 setup
- Backend dependency installation
- Running pytest test suite
- (Optional) Frontend build check

## 📄 License

MIT License

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 🆘 Support

For issues and questions, please open an issue on GitHub.

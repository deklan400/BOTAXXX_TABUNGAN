# BOTAXXX - Financial Command Center
# Installation Script for Windows (PowerShell)
# This script sets up the entire project: backend, frontend, database, and bot

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if command exists
function Test-Command {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    $missing = $false
    
    if (-not (Test-Command python)) {
        Write-Error "Python is not installed. Please install Python 3.11 or higher."
        $missing = $true
    } else {
        $version = python --version
        Write-Success "Python found: $version"
    }
    
    if (-not (Test-Command node)) {
        Write-Error "Node.js is not installed. Please install Node.js 18 or higher."
        $missing = $true
    } else {
        $version = node --version
        Write-Success "Node.js found: $version"
    }
    
    if (-not (Test-Command npm)) {
        Write-Error "npm is not installed. Please install npm."
        $missing = $true
    } else {
        $version = npm --version
        Write-Success "npm found: $version"
    }
    
    if (-not (Test-Command docker)) {
        Write-Warning "Docker is not installed. Docker is optional but recommended for database setup."
    } else {
        $version = docker --version
        Write-Success "Docker found: $version"
    }
    
    if (-not (Test-Command docker-compose)) {
        Write-Warning "docker-compose is not installed. Docker Compose is optional but recommended."
    } else {
        $version = docker-compose --version
        Write-Success "docker-compose found: $version"
    }
    
    if ($missing) {
        Write-Error "Please install missing prerequisites and run this script again."
        exit 1
    }
}

# Setup backend
function Setup-Backend {
    Write-Info "Setting up backend..."
    
    Push-Location backend
    
    # Create virtual environment if it doesn't exist
    if (-not (Test-Path "venv")) {
        Write-Info "Creating Python virtual environment..."
        python -m venv venv
    }
    
    # Activate virtual environment
    Write-Info "Activating virtual environment..."
    & .\venv\Scripts\Activate.ps1
    
    # Upgrade pip
    Write-Info "Upgrading pip..."
    python -m pip install --upgrade pip
    
    # Install requirements
    Write-Info "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Setup .env file
    if (-not (Test-Path ".env")) {
        Write-Info "Creating .env file from .env.example..."
        if (Test-Path ".env.example") {
            Copy-Item .env.example .env
            Write-Warning "Please edit backend\.env and set your SECRET_KEY and DATABASE_URL"
        } else {
            Write-Warning ".env.example not found. Creating basic .env file..."
            @"
# Database
DATABASE_URL=postgresql://botaxxx:botaxxx_password@localhost:5432/botaxxx_db

# Security
SECRET_KEY=change-this-to-a-random-secret-key-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60
"@ | Out-File -FilePath .env -Encoding utf8
            Write-Warning "Please edit backend\.env and set your SECRET_KEY (minimum 32 characters)"
        }
    } else {
        Write-Info ".env file already exists, skipping..."
    }
    
    # Run database migrations
    Write-Info "Running database migrations..."
    if (Test-Command alembic) {
        try {
            alembic upgrade head
        } catch {
            Write-Warning "Migrations failed. Make sure database is running."
        }
    } else {
        Write-Warning "Alembic not found. Make sure virtual environment is activated."
    }
    
    Pop-Location
    Write-Success "Backend setup complete!"
}

# Setup frontend
function Setup-Frontend {
    Write-Info "Setting up frontend..."
    
    Push-Location dashboard
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Info "Installing npm dependencies..."
        npm install
    } else {
        Write-Info "node_modules already exists, skipping npm install..."
    }
    
    # Setup .env file
    if (-not (Test-Path ".env")) {
        Write-Info "Creating .env file for frontend..."
        "VITE_API_BASE_URL=http://localhost:8000" | Out-File -FilePath .env -Encoding utf8
    } else {
        Write-Info ".env file already exists, skipping..."
    }
    
    Pop-Location
    Write-Success "Frontend setup complete!"
}

# Setup bot
function Setup-Bot {
    Write-Info "Setting up Telegram bot..."
    
    Push-Location bot
    
    # Create virtual environment if it doesn't exist
    if (-not (Test-Path "venv")) {
        Write-Info "Creating Python virtual environment for bot..."
        python -m venv venv
    }
    
    # Activate virtual environment
    Write-Info "Activating bot virtual environment..."
    & .\venv\Scripts\Activate.ps1
    
    # Install requirements
    Write-Info "Installing bot dependencies..."
    pip install -r requirements.txt
    
    # Setup .env file
    if (-not (Test-Path ".env")) {
        Write-Info "Creating .env file for bot..."
        @"
# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# API Configuration
API_BASE_URL=http://localhost:8000
"@ | Out-File -FilePath .env -Encoding utf8
        Write-Warning "Please edit bot\.env and set your TELEGRAM_BOT_TOKEN"
    } else {
        Write-Info ".env file already exists, skipping..."
    }
    
    Pop-Location
    Write-Success "Bot setup complete!"
}

# Setup database with Docker
function Setup-Database {
    if ((Test-Command docker) -and (Test-Command docker-compose)) {
        Write-Info "Setting up database with Docker Compose..."
        
        if (Test-Path "docker-compose.yml") {
            Write-Info "Starting PostgreSQL database..."
            docker-compose up -d db
            
            Write-Info "Waiting for database to be ready..."
            Start-Sleep -Seconds 5
            
            Write-Success "Database should be running. You can check with: docker-compose ps"
        } else {
            Write-Warning "docker-compose.yml not found. Skipping database setup."
        }
    } else {
        Write-Warning "Docker not available. Please set up PostgreSQL manually."
        Write-Info "Default connection: postgresql://botaxxx:botaxxx_password@localhost:5432/botaxxx_db"
    }
}

# Main installation
function Main {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  BOTAXXX - Financial Command Center" -ForegroundColor Cyan
    Write-Host "  Installation Script (Windows)" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check prerequisites
    Test-Prerequisites
    
    Write-Host ""
    Write-Info "Starting installation..."
    Write-Host ""
    
    # Setup backend
    Setup-Backend
    Write-Host ""
    
    # Setup frontend
    Setup-Frontend
    Write-Host ""
    
    # Setup bot
    Setup-Bot
    Write-Host ""
    
    # Setup database
    Setup-Database
    Write-Host ""
    
    Write-Host "==========================================" -ForegroundColor Green
    Write-Success "Installation complete!"
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host ""
    Write-Host "1. Edit environment files:"
    Write-Host "   - backend\.env (set SECRET_KEY, DATABASE_URL)"
    Write-Host "   - bot\.env (set TELEGRAM_BOT_TOKEN)"
    Write-Host ""
    Write-Host "2. Start the database (if using Docker):"
    Write-Host "   docker-compose up -d db"
    Write-Host ""
    Write-Host "3. Run database migrations:"
    Write-Host "   cd backend"
    Write-Host "   .\venv\Scripts\Activate.ps1"
    Write-Host "   alembic upgrade head"
    Write-Host ""
    Write-Host "4. Start the backend:"
    Write-Host "   cd backend"
    Write-Host "   .\venv\Scripts\Activate.ps1"
    Write-Host "   uvicorn app.main:app --reload"
    Write-Host ""
    Write-Host "5. Start the frontend (in another terminal):"
    Write-Host "   cd dashboard"
    Write-Host "   npm run dev"
    Write-Host ""
    Write-Host "6. Start the bot (in another terminal):"
    Write-Host "   cd bot"
    Write-Host "   .\venv\Scripts\Activate.ps1"
    Write-Host "   python main.py"
    Write-Host ""
    Write-Host "Or use Docker Compose to run everything:"
    Write-Host "   docker-compose up"
    Write-Host ""
}

# Run main function
Main


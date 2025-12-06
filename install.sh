#!/bin/bash

# BOTAXXX - Financial Command Center
# Installation Script
# This script sets up the entire project: backend, frontend, database, and bot

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    local missing=0
    
    if ! command_exists python3; then
        print_error "Python 3 is not installed. Please install Python 3.11 or higher."
        missing=1
    else
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        print_success "Python found: $(python3 --version)"
    fi
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        missing=1
    else
        print_success "Node.js found: $(node --version)"
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        missing=1
    else
        print_success "npm found: $(npm --version)"
    fi
    
    if ! command_exists docker; then
        print_warning "Docker is not installed. Docker is optional but recommended for database setup."
    else
        print_success "Docker found: $(docker --version)"
    fi
    
    if ! command_exists docker-compose; then
        print_warning "docker-compose is not installed. Docker Compose is optional but recommended."
    else
        print_success "docker-compose found: $(docker-compose --version)"
    fi
    
    if [ $missing -eq 1 ]; then
        print_error "Please install missing prerequisites and run this script again."
        exit 1
    fi
}

# Setup backend
setup_backend() {
    print_info "Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_info "Activating virtual environment..."
    source venv/bin/activate
    
    # Upgrade pip
    print_info "Upgrading pip..."
    pip install --upgrade pip
    
    # Install requirements
    print_info "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Setup .env file
    if [ ! -f ".env" ]; then
        print_info "Creating .env file from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please edit backend/.env and set your SECRET_KEY and DATABASE_URL"
        else
            print_warning ".env.example not found. Creating basic .env file..."
            cat > .env << EOF
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
EOF
            print_warning "Please edit backend/.env and set your SECRET_KEY (minimum 32 characters)"
        fi
    else
        print_info ".env file already exists, skipping..."
    fi
    
    # Run database migrations
    print_info "Running database migrations..."
    if command_exists alembic; then
        alembic upgrade head || print_warning "Migrations failed. Make sure database is running."
    else
        print_warning "Alembic not found. Make sure virtual environment is activated."
    fi
    
    cd ..
    print_success "Backend setup complete!"
}

# Setup frontend
setup_frontend() {
    print_info "Setting up frontend..."
    
    cd dashboard
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_info "Installing npm dependencies..."
        npm install
    else
        print_info "node_modules already exists, skipping npm install..."
    fi
    
    # Setup .env file
    if [ ! -f ".env" ]; then
        print_info "Creating .env file for frontend..."
        cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000
EOF
    else
        print_info ".env file already exists, skipping..."
    fi
    
    cd ..
    print_success "Frontend setup complete!"
}

# Setup bot
setup_bot() {
    print_info "Setting up Telegram bot..."
    
    cd bot
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_info "Creating Python virtual environment for bot..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_info "Activating bot virtual environment..."
    source venv/bin/activate
    
    # Install requirements
    print_info "Installing bot dependencies..."
    pip install -r requirements.txt
    
    # Setup .env file
    if [ ! -f ".env" ]; then
        print_info "Creating .env file for bot..."
        cat > .env << EOF
# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# API Configuration
API_BASE_URL=http://localhost:8000
EOF
        print_warning "Please edit bot/.env and set your TELEGRAM_BOT_TOKEN"
    else
        print_info ".env file already exists, skipping..."
    fi
    
    cd ..
    print_success "Bot setup complete!"
}

# Setup database with Docker
setup_database() {
    if command_exists docker && command_exists docker-compose; then
        print_info "Setting up database with Docker Compose..."
        
        if [ -f "docker-compose.yml" ]; then
            print_info "Starting PostgreSQL database..."
            docker-compose up -d db
            
            print_info "Waiting for database to be ready..."
            sleep 5
            
            print_success "Database should be running. You can check with: docker-compose ps"
        else
            print_warning "docker-compose.yml not found. Skipping database setup."
        fi
    else
        print_warning "Docker not available. Please set up PostgreSQL manually."
        print_info "Default connection: postgresql://botaxxx:botaxxx_password@localhost:5432/botaxxx_db"
    fi
}

# Main installation
main() {
    echo ""
    echo "=========================================="
    echo "  BOTAXXX - Financial Command Center"
    echo "  Installation Script"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    echo ""
    print_info "Starting installation..."
    echo ""
    
    # Setup backend
    setup_backend
    echo ""
    
    # Setup frontend
    setup_frontend
    echo ""
    
    # Setup bot
    setup_bot
    echo ""
    
    # Setup database
    setup_database
    echo ""
    
    echo "=========================================="
    print_success "Installation complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Edit environment files:"
    echo "   - backend/.env (set SECRET_KEY, DATABASE_URL)"
    echo "   - bot/.env (set TELEGRAM_BOT_TOKEN)"
    echo ""
    echo "2. Start the database (if using Docker):"
    echo "   docker-compose up -d db"
    echo ""
    echo "3. Run database migrations:"
    echo "   cd backend"
    echo "   source venv/bin/activate"
    echo "   alembic upgrade head"
    echo ""
    echo "4. Start the backend:"
    echo "   cd backend"
    echo "   source venv/bin/activate"
    echo "   uvicorn app.main:app --reload"
    echo ""
    echo "5. Start the frontend (in another terminal):"
    echo "   cd dashboard"
    echo "   npm run dev"
    echo ""
    echo "6. Start the bot (in another terminal):"
    echo "   cd bot"
    echo "   source venv/bin/activate"
    echo "   python main.py"
    echo ""
    echo "Or use Docker Compose to run everything:"
    echo "   docker-compose up"
    echo ""
}

# Run main function
main


# Docker Deployment Guide

Complete guide for running the Emissions Tracking Application with Docker.

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd technical-challenge

# 2. Create environment file
cp .env.docker .env

# 3. Edit .env and set your database password
nano .env  # or your preferred editor

# 4. Start all services
docker-compose up -d

# 5. Create admin user (optional)
docker-compose exec backend python manage.py createsuperuser

# 6. Access the application
# Frontend: http://localhost:4000
# Backend API: http://localhost:8000
# Admin: http://localhost:8000/admin
```

## Architecture

### Services

The Docker setup includes three services:

```yaml
├── db (PostgreSQL 16)
│   ├── Port: 5432
│   ├── Volume: postgres_data
│   └── Health check: pg_isready
│
├── backend (Django)
│   ├── Port: 8000
│   ├── Depends on: db
│   └── Auto-runs migrations
│
└── frontend (Angular with SSR)
    ├── Port: 4000 (production) or 4200 (dev)
    └── Depends on: backend
```

### Networking

All services run in a custom bridge network `emissions-network`:

- Services can communicate using service names (e.g., `http://backend:8000`)
- Frontend container uses `http://backend:8000/api` for API calls
- External access via published ports (8000, 4000/4200, 5432)

## Environment Configuration

### .env File

The `.env` file controls all configuration. Key variables:

```bash
# Database
DB_NAME=emissions_db
DB_USER=emissions_user
DB_PASSWORD=your_secure_password_here

# Django
DEBUG=True                    # Set False for production
SECRET_KEY=change_in_production
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# CORS (for frontend)
CORS_ALLOWED_ORIGINS=http://localhost:4000,http://localhost:4200
```

**Production checklist**:

- [ ] Set `DEBUG=False`
- [ ] Generate secure `SECRET_KEY` (use `openssl rand -base64 32`)
- [ ] Update `ALLOWED_HOSTS` with your domain
- [ ] Set strong `DB_PASSWORD`
- [ ] Update `CORS_ALLOWED_ORIGINS` with your frontend domain

## Running Modes

### Production Mode (SSR)

Runs optimized builds with Angular SSR on port 4000:

```bash
docker-compose up -d
```

Features:

- Multi-stage builds for smaller images
- Production-optimized Angular bundle
- Server-side rendering for SEO
- No hot reload (restart required for changes)

### Development Mode (Hot Reload)

Runs development servers with hot reload on port 4200:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Features:

- Source code mounted as volumes
- File changes auto-reload
- Development Angular server (ng serve)
- Django debug mode enabled
- Faster startup (no build optimization)

## Common Tasks

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Last 50 lines
docker-compose logs --tail=50 backend
```

### Execute Commands in Containers

```bash
# Django commands
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py test

# Database shell
docker-compose exec db psql -U emissions_user -d emissions_db

# Backend shell
docker-compose exec backend /bin/sh
```

### Rebuild Containers

After changing Dockerfile or dependencies:

```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend

# Force rebuild (no cache)
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop and Remove

```bash
# Stop containers (keep volumes)
docker-compose down

# Stop and remove volumes (deletes database!)
docker-compose down -v

# Stop and remove images
docker-compose down --rmi all
```

## Database Management

### Backup Database

```bash
# Create backup
docker-compose exec db pg_dump -U emissions_user emissions_db > backup.sql

# With timestamp
docker-compose exec db pg_dump -U emissions_user emissions_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

```bash
# Restore from backup
docker-compose exec -T db psql -U emissions_user emissions_db < backup.sql
```

### Reset Database

```bash
# Stop containers and delete volumes
docker-compose down -v

# Start fresh
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate
```

### Access Database

```bash
# PostgreSQL shell
docker-compose exec db psql -U emissions_user -d emissions_db

# Run query from command line
docker-compose exec db psql -U emissions_user -d emissions_db -c "SELECT COUNT(*) FROM emissions_emission;"
```

## Troubleshooting

### Backend Won't Start

**Symptom**: Backend container exits immediately

**Solutions**:

1. Check logs: `docker-compose logs backend`
2. Verify database is running: `docker-compose ps db`
3. Check database credentials in `.env`
4. Ensure migrations ran: `docker-compose exec backend python manage.py migrate`

### Frontend Can't Connect to Backend

**Symptom**: Frontend shows "API connection failed"

**Solutions**:

1. Verify backend is running: `curl http://localhost:8000/api/emissions/`
2. Check CORS settings in backend `.env`: `CORS_ALLOWED_ORIGINS`
3. Verify frontend environment: Check Angular environment files
4. Check Docker network: `docker network inspect emissions-network`

### Database Connection Failed

**Symptom**: Backend shows "could not connect to server"

**Solutions**:

1. Check database health: `docker-compose ps db`
2. Wait for database to be ready (check health status)
3. Verify credentials match in `.env`
4. Check database logs: `docker-compose logs db`

### Port Already in Use

**Symptom**: "bind: address already in use"

**Solutions**:

1. Stop local services on that port
2. Or change port in `docker-compose.yml`:
   ```yaml
   ports:
     - "8001:8000" # Use 8001 instead of 8000
   ```

### Out of Disk Space

**Solutions**:

```bash
# Remove unused images
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

### Changes Not Reflecting

**Production mode**:

```bash
docker-compose up -d --build
```

**Development mode**: Should auto-reload, but if not:

```bash
docker-compose restart frontend
```

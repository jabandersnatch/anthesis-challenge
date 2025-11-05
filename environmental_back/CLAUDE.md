# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Django REST Framework backend for tracking and serving annual greenhouse gas emissions data. Part of a full-stack application with an Angular frontend. The backend provides RESTful API endpoints for emissions data aggregated by year, country, activity sector, and emission amount.

## Core Architecture

### Database Model
- **Emission model** (`emissions/models.py`): Core data model with fields:
  - `year`: Year of emission data (indexed)
  - `emissions`: Float value representing metric tons (indexed)
  - `country`: CountryField from django-countries (indexed)
  - `activity`: Activity sector (e.g., "Air Travel", "Agriculture")
  - Database indexes on year, emissions, and country for query performance

### API Layer
- **Views** (`emissions/views.py`): Generic class-based views using DRF
  - `EmissionListCreateView`: List all emissions and create new records
  - `EmissionRetrieveUpdateDestroyView`: Get/update/delete individual records by ID
- **Serializers** (`emissions/serializers.py`): Uses CountryFieldMixin to properly serialize country data
- **URLs** (`emissions/urls.py`): Router configuration with endpoints at `/api/emissions/`

### Configuration
- **Settings** (`environmental_back/settings.py`):
  - PostgreSQL database configured via environment variables
  - Required env vars: `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
  - Uses python-dotenv for `.env` file loading
  - Key installed apps: `django_countries`, `rest_framework`, `emissions`

## Development Commands

### Database Operations
```bash
# Create migrations after model changes
python manage.py makemigrations

# Apply migrations to database
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser
```

### Running the Server
```bash
# Start development server (default: http://127.0.0.1:8000)
python manage.py runserver

# Start on specific port
python manage.py runserver 8080
```

### Testing
```bash
# Run all tests
python manage.py test

# Run tests for specific app
python manage.py test emissions

# Run specific test class or method
python manage.py test emissions.tests.TestClassName
python manage.py test emissions.tests.TestClassName.test_method_name
```

### Database Shell Access
```bash
# Django shell with model access
python manage.py shell

# Direct database shell
python manage.py dbshell
```

## Key API Endpoints

- `GET /api/emissions/` - List all emission records
- `POST /api/emissions/` - Create new emission record
- `GET /api/emissions/{emission_id}/` - Retrieve specific emission
- `PUT /api/emissions/{emission_id}/` - Full update of emission
- `PATCH /api/emissions/{emission_id}/` - Partial update of emission
- `DELETE /api/emissions/{emission_id}/` - Delete emission

## Important Notes

### Import Issues
The codebase currently has incorrect relative imports in `views.py` and `serializers.py`:
- Uses `from models import Emission` instead of `from emissions.models import Emission`
- Uses `from models import Emission` in serializers instead of proper app-qualified import
- These will cause import errors and should be fixed to use absolute imports with the app name

### URL Router Configuration
The `emissions/urls.py` incorrectly uses `router.register()` with generic views instead of ViewSets. The views are class-based generic views (`ListCreateAPIView`, `RetrieveUpdateDestroyAPIView`) which should be registered directly in urlpatterns, not through a router.

### Environment Configuration
Database credentials are stored in `.env` file. Ensure this file exists with proper PostgreSQL connection details before running migrations or starting the server.

### Data Format
Expected JSON structure for emission records:
```json
{
  "year": 2020,
  "emissions": 5.2,
  "country": "US",
  "activity": "Air Travel"
}
```
Note: Country codes follow ISO 3166-1 format (e.g., "US", "GB", "DE")

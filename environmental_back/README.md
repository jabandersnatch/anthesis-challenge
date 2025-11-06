# Environmental Emissions API - Backend

A robust Django REST Framework API for tracking and managing greenhouse gas emissions data. This backend provides a complete RESTful API with advanced filtering, pagination, and comprehensive data validation.

![Python](https://img.shields.io/badge/python-3.12+-blue.svg)
![Django](https://img.shields.io/badge/django-5.2-green.svg)
![DRF](https://img.shields.io/badge/DRF-3.16-red.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue.svg)

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Testing](#testing)
- [Development](#development)
- [Docker Deployment](#docker-deployment)

## Features

- **RESTful API Design**: Complete CRUD operations following REST principles
- **Advanced Filtering**: Filter by year, country, emission type, activity sector
- **Optimized Database**: Strategic indexes for high-performance queries
- **Data Validation**: Comprehensive validation with custom constraints
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation
- **Custom Query Methods**: Convenient manager methods for common queries
- **CORS Support**: Configured for frontend integration
- **Audit Trail**: Automatic timestamping of record creation and updates
- **Country Support**: ISO 3166-1 country codes with django-countries

## Technology Stack

- **Framework**: Django 5.2.8
- **API**: Django REST Framework 3.16
- **Database**: PostgreSQL 16
- **Documentation**: drf-spectacular (OpenAPI 3.0)
- **Package Manager**: uv
- **Additional Libraries**:
  - django-countries: Country field support
  - django-cors-headers: CORS handling
  - django-filter: Advanced filtering
  - python-dotenv: Environment variable management

## Getting Started

### Prerequisites

- Python 3.12 or higher
- PostgreSQL 16
- uv (Python package manager)

### Installation

1. **Navigate to the backend directory**:

```bash
cd environmental_back
```

2. **Install dependencies using uv**:

```bash
# From the project root
uv sync
```

3. **Activate the virtual environment**:

```bash
source .venv/bin/activate
```

### Configuration

1. **Create environment file**:

```bash
cp .env.example .env
```

2. **Edit `.env` with your settings**:

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=environmental_emissions
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:4200
```

### Database Setup

1. **Create PostgreSQL database**:

```bash
psql -U postgres
CREATE DATABASE environmental_emissions;
\q
```

2. **Run migrations**:

```bash
python manage.py migrate
```

3. **Create superuser** (optional):

```bash
python manage.py createsuperuser
```

4. **Start development server**:

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/emissions/`

## API Documentation

### Interactive Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc**: http://localhost:8000/api/schema/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### Endpoints

#### List Emissions

```http
GET /api/emissions/
```

**Query Parameters**:

- `year` - Exact year match
- `year__gte` - Year greater than or equal
- `year__lte` - Year less than or equal
- `country` - ISO 3166-1 country code (e.g., "US", "GB", "CA")
- `emission_type` - CO2, CH4, N2O, F_GASES
- `activity` - ENERGY, TRANSPORT, AGRICULTURE, INDUSTRY, WASTE, etc.
- `search` - Text search in country and activity fields
- `ordering` - Sort field (prefix with `-` for descending)
- `page` - Page number for pagination
- `page_size` - Results per page (max 100)

**Example Requests**:

```bash
# Get all emissions for US in 2020 or later
curl "http://localhost:8000/api/emissions/?country=US&year__gte=2020"

# Get CO2 emissions from energy sector, ordered by amount
curl "http://localhost:8000/api/emissions/?emission_type=CO2&activity=ENERGY&ordering=-emissions"

# Search for agriculture-related emissions
curl "http://localhost:8000/api/emissions/?search=agriculture"
```

#### Create Emission

```http
POST /api/emissions/
Content-Type: application/json

{
  "year": 2020,
  "emissions": 100.5,
  "country": "US",
  "emission_type": "CO2",
  "activity": "ENERGY"
}
```

#### Retrieve Single Emission

```http
GET /api/emissions/{id}/
```

#### Update Emission

```http
PUT /api/emissions/{id}/
Content-Type: application/json

{
  "year": 2020,
  "emissions": 150.5,
  "country": "US",
  "emission_type": "CO2",
  "activity": "ENERGY"
}
```

Or use PATCH for partial updates:

```http
PATCH /api/emissions/{id}/
Content-Type: application/json

{
  "emissions": 150.5
}
```

#### Delete Emission

```http
DELETE /api/emissions/{id}/
```

### Response Format

**Success Response** (200 OK):

```json
{
  "count": 100,
  "next": "http://localhost:8000/api/emissions/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "year": 2020,
      "emissions": "100.500",
      "country": "US",
      "emission_type": "CO2",
      "activity": "ENERGY",
      "created_at": "2024-11-05T10:00:00Z",
      "updated_at": "2024-11-05T10:00:00Z"
    }
  ]
}
```

**Error Response** (400 Bad Request):

```json
{
  "year": ["Year cannot be in the future"],
  "emissions": ["Emissions cannot be negative"]
}
```

## Project Structure

```
environmental_back/
├── emissions/                  # Main emissions app
│   ├── migrations/            # Database migrations
│   ├── tests/                 # Test suite
│   ├── admin.py               # Django admin configuration
│   ├── apps.py                # App configuration
│   ├── filters.py             # DRF filter backends
│   ├── models.py              # Emission data model
│   ├── serializers.py         # DRF serializers
│   ├── urls.py                # API routes
│   └── views.py               # API views
├── environmental_back/         # Project settings
│   ├── settings.py            # Django configuration
│   ├── urls.py                # Root URL configuration
│   └── wsgi.py                # WSGI configuration
├── manage.py                  # Django management script
├── Dockerfile                 # Docker container configuration
├── .dockerignore              # Docker ignore patterns
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## Data Model

### Emission Model

The core model for tracking greenhouse gas emissions:

```python
class Emission(models.Model):
    year = PositiveSmallIntegerField()      # 1900 to current year
    emissions = DecimalField()              # Metric tons (non-negative)
    country = CountryField()                # ISO 3166-1 country code
    emission_type = CharField()             # CO2, CH4, N2O, F_GASES
    activity = CharField()                  # Activity sector
    created_at = DateTimeField()            # Auto-generated
    updated_at = DateTimeField()            # Auto-updated
```

### Emission Types

- **CO2**: Carbon Dioxide
- **CH4**: Methane
- **N2O**: Nitrous Oxide
- **F_GASES**: Fluorinated Gases

### Activity Sectors

- ENERGY - Energy Production
- TRANSPORT - Transportation
- INDUSTRY - Industrial Processes
- AGRICULTURE - Agriculture
- WASTE - Waste Management
- RESIDENTIAL - Residential
- COMMERCIAL - Commercial
- AIR_TRAVEL - Air Travel
- MARITIME - Maritime Transport
- OTHER - Other

### Database Constraints

- **Unique Constraint**: Combination of (year, country, emission_type, activity) must be unique
- **Check Constraint**: Emissions value must be non-negative
- **Validation**: Year must be between 1900 and current year

### Database Indexes

Optimized indexes for common query patterns:

- Single field indexes: year, country, emission_type, emissions
- Composite indexes: (year, country), (country, emission_type), (year, country, emission_type)
- Activity indexes: (activity, year)
- Descending indexes: (-year, country) for recent data queries
- Audit indexes: (-created_at) for audit trail

### Custom Query Methods

The model includes convenient manager methods:

```python
# Filter by year
Emission.objects.for_year(2020)

# Filter by country
Emission.objects.for_country("US")

# Year range
Emission.objects.for_year_range(2015, 2020)

# By emission type
Emission.objects.by_type("CO2")

# By activity sector
Emission.objects.by_activity("ENERGY")

# Recent emissions (last N years)
Emission.objects.recent(years=5)

# Calculate total emissions
Emission.objects.filter(country="US").total_emissions()

# Chain methods
Emission.objects.for_country("US").by_type("CO2").for_year_range(2015, 2020)
```

## Testing

### Run Tests

```bash
# Run all tests
python manage.py test

# Run tests with verbosity
python manage.py test --verbosity=2

# Run specific test module
python manage.py test emissions.tests

# Run with coverage (if installed)
coverage run --source='.' manage.py test
coverage report
```

### Test Structure

```
emissions/tests/
├── __init__.py
├── test_models.py          # Model tests
├── test_views.py           # API endpoint tests
├── test_serializers.py     # Serializer tests
└── test_filters.py         # Filter tests
```

## Development

### Django Admin

Access the Django admin interface at `http://localhost:8000/admin/`

The admin interface provides:

- Full CRUD operations on emissions
- Filtering by year, country, emission type, activity
- Search functionality
- Bulk actions

### Django Shell

```bash
# Open Django shell
python manage.py shell

# Example queries
from emissions.models import Emission

# Get all emissions for US
us_emissions = Emission.objects.for_country("US")

# Get recent CO2 emissions
recent_co2 = Emission.objects.by_type("CO2").recent(years=5)

# Calculate total for a country
total = Emission.objects.for_country("US").total_emissions()
```

### Creating Migrations

```bash
# After model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration SQL
python manage.py sqlmigrate emissions 0001
```

### Database Management

```bash
# Create database backup
python manage.py dumpdata emissions.Emission > backup.json

# Load data from backup
python manage.py loaddata backup.json

# Flush database (WARNING: deletes all data)
python manage.py flush
```

## Docker Deployment

### Using Docker Compose (Recommended)

From the project root directory:

```bash
# Start all services (backend + database)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Stop services
docker-compose down
```

### Standalone Docker Build

```bash
# Build image
docker build -t environmental-backend .

# Run container
docker run -p 8000:8000 --env-file .env environmental-backend
```

## Common Tasks

### Generate Secret Key

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### Check Configuration

```bash
# Check for issues
python manage.py check

# Check deployment readiness
python manage.py check --deploy
```

### Collect Static Files

```bash
python manage.py collectstatic --noinput
```

## Troubleshooting

### Database Connection Issues

**Problem**: `django.db.utils.OperationalError: could not connect to server`

**Solution**:

1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Check database credentials in `.env`
3. Ensure database exists: `psql -U postgres -l`
4. Test connection: `psql -U postgres -d environmental_emissions`

### Migration Errors

**Problem**: Migration conflicts or errors

**Solution**:

```bash
# Show migrations status
python manage.py showmigrations

# Fake a migration (if already applied manually)
python manage.py migrate --fake emissions 0001

# Reset migrations (WARNING: data loss)
python manage.py migrate emissions zero
```

### CORS Issues

**Problem**: Frontend can't connect due to CORS

**Solution**:

1. Check `CORS_ALLOWED_ORIGINS` in `.env`
2. Ensure it includes your frontend URL
3. Restart the server after changes

## Performance Considerations

### Database Optimization

- **Indexes**: Strategic indexes are configured for common query patterns
- **Select Related**: Use `.select_related()` for foreign key queries
- **Prefetch Related**: Use `.prefetch_related()` for reverse foreign keys
- **Query Optimization**: Monitor queries with Django Debug Toolbar

### Pagination

- Default page size: 20 items
- Maximum page size: 100 items
- Use `page_size` parameter to adjust

## Security Best Practices

1. **Never commit `.env` file**: Contains sensitive credentials
2. **Use strong SECRET_KEY**: Generate a new one for production
3. **Set DEBUG=False in production**: Prevents information leakage
4. **Configure ALLOWED_HOSTS**: Restrict to known domains
5. **Use HTTPS in production**: Encrypt data in transit
6. **Regular updates**: Keep dependencies up to date

## Environment Variables Reference

| Variable               | Required | Default | Description                   |
| ---------------------- | -------- | ------- | ----------------------------- |
| `SECRET_KEY`           | Yes      | -       | Django secret key             |
| `DEBUG`                | No       | `True`  | Debug mode                    |
| `ALLOWED_HOSTS`        | No       | `[]`    | Comma-separated allowed hosts |
| `DB_ENGINE`            | Yes      | -       | Database engine               |
| `DB_NAME`              | Yes      | -       | Database name                 |
| `DB_USER`              | Yes      | -       | Database user                 |
| `DB_PASSWORD`          | Yes      | -       | Database password             |
| `DB_HOST`              | Yes      | -       | Database host                 |
| `DB_PORT`              | Yes      | `5432`  | Database port                 |
| `CORS_ALLOWED_ORIGINS` | Yes      | -       | Comma-separated CORS origins  |

## API Rate Limiting

Currently, no rate limiting is configured. For production deployment, consider adding:

- Django REST Framework throttling
- Nginx rate limiting
- API gateway rate limiting

## Contributing

For information about contributing to this project, see the main project README.

## License

This project is licensed under the MIT License.

## Author

Juan Andres Mendez Galvis

## Related Documentation

- [Project Root README](../README.md) - Full project overview
- [Frontend README](../enviromental-front/README.md) - Angular frontend documentation
- [Docker README](../README.docker.md) - Detailed Docker deployment guide

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [drf-spectacular](https://drf-spectacular.readthedocs.io/)

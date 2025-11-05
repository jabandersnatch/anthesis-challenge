from __future__ import annotations

from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Sum
from django.utils import timezone
from django_countries.fields import CountryField


class EmissionQuerySet(models.QuerySet["Emission"]):
    """Custom queryset with common filtering methods."""

    def for_year(self, year: int) -> EmissionQuerySet:
        """Filter emissions for a specific year."""
        return self.filter(year=year)

    def for_country(self, country_code: str) -> EmissionQuerySet:
        """Filter emissions for a specific country."""
        return self.filter(country=country_code)

    def for_year_range(self, start_year: int, end_year: int) -> EmissionQuerySet:
        """Filter emissions for a year range."""
        return self.filter(year__gte=start_year, year__lte=end_year)

    def by_type(self, emission_type: str) -> EmissionQuerySet:
        """Filter by emission type."""
        return self.filter(emission_type=emission_type)

    def by_activity(self, activity: str) -> EmissionQuerySet:
        """Filter by activity sector."""
        return self.filter(activity=activity)

    def recent(self, years: int = 5) -> EmissionQuerySet:
        """Get emissions from the last N years."""
        current_year = timezone.now().year
        return self.filter(year__gte=current_year - years)

    def total_emissions(self) -> Decimal:
        """Calculate total emissions for the queryset."""
        result = self.aggregate(total=Sum("emissions"))["total"]
        return result if result is not None else Decimal("0")


class EmissionManager(models.Manager["Emission"]):
    """Custom manager for Emission model."""

    def get_queryset(self) -> EmissionQuerySet:
        """Return custom queryset."""
        return EmissionQuerySet(self.model, using=self._db)

    def for_year(self, year: int) -> EmissionQuerySet:
        return self.get_queryset().for_year(year)

    def for_country(self, country_code: str) -> EmissionQuerySet:
        return self.get_queryset().for_country(country_code)

    def for_year_range(self, start_year: int, end_year: int) -> EmissionQuerySet:
        return self.get_queryset().for_year_range(start_year, end_year)

    def by_type(self, emission_type: str) -> EmissionQuerySet:
        return self.get_queryset().by_type(emission_type)

    def by_activity(self, activity: str) -> EmissionQuerySet:
        return self.get_queryset().by_activity(activity)

    def recent(self, years: int = 5) -> EmissionQuerySet:
        return self.get_queryset().recent(years)


class EmissionTypes(models.TextChoices):
    """Greenhouse gas emission types based on IPCC classification."""

    CO2 = "CO2", "Carbon Dioxide"
    CH4 = "CH4", "Methane"
    N2O = "N2O", "Nitrous Oxide"
    F_GASES = "F_GASES", "Fluorinated Gases"


class ActivitySector(models.TextChoices):
    """Common activity sectors for emissions tracking."""

    ENERGY = "ENERGY", "Energy Production"
    TRANSPORT = "TRANSPORT", "Transportation"
    INDUSTRY = "INDUSTRY", "Industrial Processes"
    AGRICULTURE = "AGRICULTURE", "Agriculture"
    WASTE = "WASTE", "Waste Management"
    RESIDENTIAL = "RESIDENTIAL", "Residential"
    COMMERCIAL = "COMMERCIAL", "Commercial"
    AIR_TRAVEL = "AIR_TRAVEL", "Air Travel"
    MARITIME = "MARITIME", "Maritime Transport"
    OTHER = "OTHER", "Other"


class Emission(models.Model):
    """
    Model for tracking greenhouse gas emissions data.

    Stores annual emissions data by country, activity sector, and gas type.
    Optimized for queries filtering by year, country, and emission type.
    """

    year = models.PositiveSmallIntegerField(
        help_text="Year of the emission data (1900-current year)",
        validators=[
            MinValueValidator(1900, message="Year must be 1900 or later"),
            MaxValueValidator(
                timezone.now().year, message="Year cannot be in the future"
            ),
        ],
    )

    emissions = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        help_text="Total emissions in metric tons (must be non-negative)",
        validators=[
            MinValueValidator(0.0, message="Emissions cannot be negative"),
        ],
    )

    emission_type = models.CharField(
        max_length=10,
        choices=EmissionTypes.choices,
        help_text="Type of greenhouse gas emitted",
    )

    country = CountryField(
        help_text="Country where the emissions were recorded (ISO 3166-1 format)"
    )

    activity = models.CharField(
        max_length=50,
        choices=ActivitySector.choices,
        help_text="Activity sector responsible for the emissions",
    )

    # Audit fields
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the record was created",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the record was last updated",
    )

    objects = EmissionManager()

    class Meta:
        # Composite indexes optimized for common query patterns
        indexes = [
            # Single field indexes for basic filtering
            models.Index(fields=["year"], name="idx_emission_year"),
            models.Index(fields=["country"], name="idx_emission_country"),
            models.Index(fields=["emission_type"], name="idx_emission_type"),
            models.Index(fields=["emissions"], name="idx_emission_value"),
            # Composite indexes for common query combinations
            models.Index(fields=["year", "country"], name="idx_year_country"),
            models.Index(fields=["country", "emission_type"], name="idx_country_type"),
            models.Index(
                fields=["year", "country", "emission_type"],
                name="idx_year_country_type",
            ),
            models.Index(fields=["activity", "year"], name="idx_activity_year"),
            # Index for ordering and recent data queries
            models.Index(fields=["-year", "country"], name="idx_year_desc_country"),
            # Index for audit trail queries
            models.Index(fields=["-created_at"], name="idx_created_desc"),
        ]

        # Unique constraint to prevent duplicate entries
        constraints = [
            models.UniqueConstraint(
                fields=["year", "country", "emission_type", "activity"],
                name="unique_emission_record",
                violation_error_message=(
                    "An emission record for this year, country, type, and "
                    "activity combination already exists."
                ),
            ),
            models.CheckConstraint(
                check=models.Q(emissions__gte=0),
                name="check_emissions_non_negative",
                violation_error_message="Emissions value must be non-negative.",
            ),
        ]

        verbose_name = "Emission"
        verbose_name_plural = "Emissions"

        # Default ordering: most recent year first, then by country and type
        ordering = ["-year", "country", "emission_type"]

        # Permissions for fine-grained access control
        permissions = [
            ("can_import_bulk_data", "Can import bulk emission data"),
            ("can_export_data", "Can export emission data"),
            ("can_view_audit_trail", "Can view audit trail information"),
        ]

    def __str__(self):
        """String representation for admin and debugging."""
        return (
            f"{self.country} - {self.get_emission_type_display()} "
            f"({self.year}): {self.emissions:,.2f} MT"
        )

    def __repr__(self):
        """Developer-friendly representation."""
        return (
            f"<Emission: {self.country} {self.year} "
            f"{self.emission_type} {self.emissions}MT>"
        )

    @property
    def emissions_in_kilotons(self) -> float:
        """Convert emissions to kilotons for display purposes."""
        return float(self.emissions) / 1000

    @property
    def emissions_in_megatons(self) -> float:
        """Convert emissions to megatons for display purposes."""
        return float(self.emissions) / 1_000_000

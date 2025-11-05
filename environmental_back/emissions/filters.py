"""
Custom filters for the Emission model.

Provides advanced filtering capabilities for emissions data including
range filters, multiple choice filters, and custom query parameter handling.
"""

from __future__ import annotations

import django_filters
from django.db.models import QuerySet

from emissions.models import ActivitySector, Emission, EmissionTypes


class EmissionFilter(django_filters.FilterSet):
    """
    Advanced filter set for Emission model.

    Provides filtering by:
    - Year (exact, greater than/equal, less than/equal, range)
    - Country (exact, multiple countries)
    - Emission type (exact, multiple types)
    - Activity sector (exact, multiple activities)
    - Emission value (greater than/equal, less than/equal, range)
    """

    # Year filters
    year = django_filters.NumberFilter(
        field_name="year",
        lookup_expr="exact",
        help_text="Filter by exact year (e.g., ?year=2020)",
    )
    year__gte = django_filters.NumberFilter(
        field_name="year",
        lookup_expr="gte",
        help_text="Filter by year greater than or equal to (e.g., ?year__gte=2015)",
    )
    year__lte = django_filters.NumberFilter(
        field_name="year",
        lookup_expr="lte",
        help_text="Filter by year less than or equal to (e.g., ?year__lte=2020)",
    )
    year__range = django_filters.RangeFilter(
        field_name="year",
        help_text="Filter by year range (e.g., ?year__range=2015,2020)",
    )

    # Country filters
    country = django_filters.CharFilter(
        field_name="country",
        lookup_expr="exact",
        help_text="Filter by country ISO code (e.g., ?country=US)",
    )
    country__in = django_filters.CharFilter(
        field_name="country",
        lookup_expr="in",
        method="filter_country_in",
        help_text="Filter by multiple countries (e.g., ?country__in=US,GB,DE)",
    )

    # Emission type filters
    emission_type = django_filters.ChoiceFilter(
        field_name="emission_type",
        choices=EmissionTypes.choices,
        help_text="Filter by emission type (e.g., ?emission_type=CO2)",
    )
    emission_type__in = django_filters.MultipleChoiceFilter(
        field_name="emission_type",
        choices=EmissionTypes.choices,
        help_text="Filter by multiple emission types (e.g., ?emission_type__in=CO2,CH4)",
    )

    # Activity sector filters
    activity = django_filters.ChoiceFilter(
        field_name="activity",
        choices=ActivitySector.choices,
        help_text="Filter by activity sector (e.g., ?activity=ENERGY)",
    )
    activity__in = django_filters.MultipleChoiceFilter(
        field_name="activity",
        choices=ActivitySector.choices,
        help_text="Filter by multiple activities (e.g., ?activity__in=ENERGY,TRANSPORT)",
    )

    # Emission value filters
    emissions__gte = django_filters.NumberFilter(
        field_name="emissions",
        lookup_expr="gte",
        help_text="Filter by emissions greater than or equal to (e.g., ?emissions__gte=1000)",
    )
    emissions__lte = django_filters.NumberFilter(
        field_name="emissions",
        lookup_expr="lte",
        help_text="Filter by emissions less than or equal to (e.g., ?emissions__lte=5000)",
    )
    emissions__range = django_filters.RangeFilter(
        field_name="emissions",
        help_text="Filter by emissions range (e.g., ?emissions__range=1000,5000)",
    )

    class Meta:
        model = Emission
        fields = [
            "year",
            "country",
            "emission_type",
            "activity",
        ]

    def filter_country_in(
        self, queryset: QuerySet[Emission], name: str, value: str
    ) -> QuerySet[Emission]:
        """
        Filter by multiple countries using comma-separated values.

        Args:
            queryset: The base queryset to filter
            name: The field name (not used)
            value: Comma-separated country codes (e.g., "US,GB,DE")

        Returns:
            Filtered queryset
        """
        if not value:
            return queryset

        countries = [code.strip() for code in value.split(",")]
        return queryset.filter(country__in=countries)

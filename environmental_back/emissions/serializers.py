from __future__ import annotations

from typing import Any

from django_countries.serializers import CountryFieldMixin
from emissions.models import Emission
from rest_framework import serializers


class EmissionSerializer(CountryFieldMixin, serializers.ModelSerializer):
    """
    Serializer for Emission model with full field support.

    Handles serialization of greenhouse gas emission records including
    country fields (using ISO 3166-1 format), emission types, and activity sectors.
    """

    # Add computed fields for convenient unit conversion
    emissions_in_kilotons = serializers.SerializerMethodField(
        help_text="Emissions value converted to kilotons"
    )
    emissions_in_megatons = serializers.SerializerMethodField(
        help_text="Emissions value converted to megatons"
    )

    class Meta:
        model = Emission
        fields = [
            "id",
            "year",
            "emissions",
            "emissions_in_kilotons",
            "emissions_in_megatons",
            "emission_type",
            "country",
            "activity",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "year": {
                "help_text": "Year of the emission data (1900 to current year)",
                "min_value": 1900,
            },
            "emissions": {
                "help_text": "Total emissions in metric tons (must be non-negative)",
                "min_value": 0.0,
            },
            "emission_type": {
                "help_text": "Type of greenhouse gas emitted (CO2, CH4, N2O, F_GASES)"
            },
            "country": {
                "help_text": "Country ISO code (e.g., 'US', 'GB', 'DE') where emissions were recorded"
            },
            "activity": {"help_text": "Activity sector responsible for the emissions"},
        }

    def get_emissions_in_kilotons(self, obj: Emission) -> float:
        """Convert emissions to kilotons for display."""
        return obj.emissions_in_kilotons

    def get_emissions_in_megatons(self, obj: Emission) -> float:
        """Convert emissions to megatons for display."""
        return obj.emissions_in_megatons

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """
        Validate emission data at object level.

        Ensures data consistency and business rule compliance.
        """
        # The model validators and constraints will handle most validation
        # This is for additional business logic if needed
        return super().validate(attrs)

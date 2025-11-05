"""
API views for the Emission model.

Provides CRUD operations with advanced filtering, pagination, and search capabilities
for greenhouse gas emissions data.
"""

from __future__ import annotations

from typing import Any

from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from emissions.filters import EmissionFilter
from emissions.models import Emission
from emissions.serializers import EmissionSerializer
from rest_framework import generics


@extend_schema_view(
    get=extend_schema(
        summary="List emissions",
        description=(
            "Retrieve a paginated list of emission records with advanced filtering. "
            "Supports filtering by year, country, emission type, activity sector, and emission value. "
            "Results are paginated (50 items per page by default)."
        ),
        parameters=[
            OpenApiParameter(
                name="year",
                description="Filter by exact year (e.g., 2020)",
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name="year__gte",
                description="Filter by year greater than or equal to (e.g., 2015)",
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name="year__lte",
                description="Filter by year less than or equal to (e.g., 2023)",
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name="country",
                description="Filter by country ISO code (e.g., US, GB, DE)",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="country__in",
                description="Filter by multiple countries, comma-separated (e.g., US,GB,DE)",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="emission_type",
                description="Filter by emission type (CO2, CH4, N2O, F_GASES)",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="activity",
                description="Filter by activity sector (e.g., ENERGY, TRANSPORT)",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="search",
                description="Search in country and activity fields",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="ordering",
                description="Order results by field (use '-' prefix for descending, e.g., '-year', 'emissions')",
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name="page",
                description="Page number for pagination",
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name="page_size",
                description="Number of results per page (max: 100)",
                required=False,
                type=int,
            ),
        ],
        tags=["emissions"],
    ),
    post=extend_schema(
        summary="Create emission record",
        description="Create a new emission record with the provided data.",
        tags=["emissions"],
    ),
)
class EmissionListCreateView(generics.ListCreateAPIView):
    """
    API view for listing and creating emission records.

    GET: Returns a paginated list of emissions with filtering and search capabilities
    POST: Creates a new emission record

    Supports:
    - Filtering by year, country, emission type, activity, and emission value
    - Search functionality across country and activity fields
    - Ordering by any field (ascending or descending)
    - Pagination (50 items per page, configurable up to 100)
    """

    queryset = Emission.objects.all()
    serializer_class = EmissionSerializer
    filterset_class = EmissionFilter

    # Search configuration
    search_fields = ["country", "activity"]

    # Ordering configuration
    ordering_fields = [
        "year",
        "emissions",
        "country",
        "emission_type",
        "activity",
        "created_at",
    ]
    ordering = ["-year", "country"]  # Default ordering

    def get_queryset(self) -> Any:
        """
        Get the queryset for this view, with potential optimizations.

        Returns:
            Queryset of Emission objects, potentially filtered by custom query params
        """
        queryset = super().get_queryset()


@extend_schema_view(
    get=extend_schema(
        summary="Get emission details",
        description="Retrieve detailed information about a specific emission record.",
        tags=["emissions"],
    ),
    put=extend_schema(
        summary="Update emission record",
        description="Update all fields of an existing emission record.",
        tags=["emissions"],
    ),
    patch=extend_schema(
        summary="Partially update emission",
        description="Update specific fields of an existing emission record.",
        tags=["emissions"],
    ),
    delete=extend_schema(
        summary="Delete emission record",
        description="Delete an existing emission record.",
        tags=["emissions"],
    ),
)
class EmissionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    API view for retrieving, updating, and deleting individual emission records.

    GET: Retrieve a specific emission record by ID
    PUT: Update all fields of an emission record
    PATCH: Partially update an emission record
    DELETE: Delete an emission record
    """

    queryset = Emission.objects.all()
    serializer_class = EmissionSerializer
    lookup_field = "id"
    lookup_url_kwarg = "emission_id"

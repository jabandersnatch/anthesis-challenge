"""
Tests for emissions API views.

Tests cover CRUD operations, filtering, pagination, search, and ordering
functionality for the Emission model API endpoints.
"""

from __future__ import annotations

from decimal import Decimal

from django.urls import reverse
from emissions.models import Emission, EmissionTypes, ActivitySector
from rest_framework import status
from rest_framework.test import APITestCase


class EmissionListCreateViewTests(APITestCase):
    """Test cases for EmissionListCreateView (list and create operations)."""

    def setUp(self):
        """Set up test data for each test."""
        # Create test emission records
        self.emission1 = Emission.objects.create(
            year=2020,
            emissions=Decimal("1000.500"),
            emission_type=EmissionTypes.CO2,
            country="US",
            activity=ActivitySector.ENERGY,
        )
        self.emission2 = Emission.objects.create(
            year=2021,
            emissions=Decimal("2000.750"),
            emission_type=EmissionTypes.CH4,
            country="GB",
            activity=ActivitySector.TRANSPORT,
        )
        self.emission3 = Emission.objects.create(
            year=2019,
            emissions=Decimal("1500.250"),
            emission_type=EmissionTypes.CO2,
            country="US",
            activity=ActivitySector.INDUSTRY,
        )

        self.list_url = reverse("emission-list-create")

    def test_list_emissions_success(self):
        """Test retrieving list of emissions returns 200."""
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 3)
        self.assertIn("results", response.data)

    def test_list_emissions_default_ordering(self):
        """Test emissions are ordered by -year, country by default."""
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        # Should be ordered by -year (2021, 2020, 2019), then country
        self.assertEqual(results[0]["year"], 2021)
        self.assertEqual(results[1]["year"], 2020)
        self.assertEqual(results[2]["year"], 2019)

    def test_create_emission_success(self):
        """Test creating a new emission record returns 201."""
        data = {
            "year": 2022,
            "emissions": "3000.500",
            "emission_type": EmissionTypes.N2O,
            "country": "DE",
            "activity": ActivitySector.AGRICULTURE,
        }

        response = self.client.post(self.list_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Emission.objects.count(), 4)
        self.assertEqual(response.data["year"], 2022)
        self.assertEqual(response.data["country"], "DE")
        self.assertEqual(response.data["emission_type"], EmissionTypes.N2O)

    def test_create_emission_invalid_year(self):
        """Test creating emission with invalid year returns 400."""
        data = {
            "year": 1800,  # Before 1900
            "emissions": "1000.0",
            "emission_type": EmissionTypes.CO2,
            "country": "US",
            "activity": ActivitySector.ENERGY,
        }

        response = self.client.post(self.list_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("year", response.data)

    def test_create_emission_negative_emissions(self):
        """Test creating emission with negative value returns 400."""
        data = {
            "year": 2020,
            "emissions": "-100.0",
            "emission_type": EmissionTypes.CO2,
            "country": "US",
            "activity": ActivitySector.ENERGY,
        }

        response = self.client.post(self.list_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("emissions", response.data)

    def test_create_emission_missing_required_field(self):
        """Test creating emission without required field returns 400."""
        data = {
            "year": 2020,
            "emissions": "1000.0",
            # Missing emission_type
            "country": "US",
            "activity": ActivitySector.ENERGY,
        }

        response = self.client.post(self.list_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("emission_type", response.data)

    def test_filter_by_year(self):
        """Test filtering emissions by exact year."""
        response = self.client.get(self.list_url, {"year": 2020})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["year"], 2020)

    def test_filter_by_year_range(self):
        """Test filtering emissions by year range."""
        response = self.client.get(
            self.list_url, {"year__gte": 2020, "year__lte": 2021}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        for result in response.data["results"]:
            self.assertGreaterEqual(result["year"], 2020)
            self.assertLessEqual(result["year"], 2021)

    def test_filter_by_country(self):
        """Test filtering emissions by country."""
        response = self.client.get(self.list_url, {"country": "US"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        for result in response.data["results"]:
            self.assertEqual(result["country"], "US")

    def test_filter_by_emission_type(self):
        """Test filtering emissions by emission type."""
        response = self.client.get(self.list_url, {"emission_type": EmissionTypes.CO2})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)
        for result in response.data["results"]:
            self.assertEqual(result["emission_type"], EmissionTypes.CO2)

    def test_filter_by_activity(self):
        """Test filtering emissions by activity sector."""
        response = self.client.get(self.list_url, {"activity": ActivitySector.ENERGY})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["activity"], ActivitySector.ENERGY)

    def test_search_by_country(self):
        """Test searching emissions by country field."""
        response = self.client.get(self.list_url, {"search": "US"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_ordering_by_emissions_ascending(self):
        """Test ordering emissions by value in ascending order."""
        response = self.client.get(self.list_url, {"ordering": "emissions"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        # Should be ordered by emissions ascending
        self.assertEqual(float(results[0]["emissions"]), 1000.500)
        self.assertEqual(float(results[1]["emissions"]), 1500.250)
        self.assertEqual(float(results[2]["emissions"]), 2000.750)

    def test_ordering_by_year_descending(self):
        """Test ordering emissions by year in descending order."""
        response = self.client.get(self.list_url, {"ordering": "-year"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(results[0]["year"], 2021)
        self.assertEqual(results[1]["year"], 2020)
        self.assertEqual(results[2]["year"], 2019)

    def test_combined_filters(self):
        """Test combining multiple filters."""
        response = self.client.get(
            self.list_url,
            {"country": "US", "emission_type": EmissionTypes.CO2, "year__gte": 2020},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        result = response.data["results"][0]
        self.assertEqual(result["country"], "US")
        self.assertEqual(result["emission_type"], EmissionTypes.CO2)
        self.assertEqual(result["year"], 2020)


class EmissionRetrieveUpdateDestroyViewTests(APITestCase):
    """Test cases for EmissionRetrieveUpdateDestroyView (RUD operations)."""

    def setUp(self):
        """Set up test data for each test."""
        self.emission = Emission.objects.create(
            year=2020,
            emissions=Decimal("1000.500"),
            emission_type=EmissionTypes.CO2,
            country="US",
            activity=ActivitySector.ENERGY,
        )
        self.detail_url = reverse(
            "emission-detail", kwargs={"emission_id": self.emission.id}
        )

    def test_retrieve_emission_success(self):
        """Test retrieving a single emission record returns 200."""
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.emission.id)
        self.assertEqual(response.data["year"], 2020)
        self.assertEqual(response.data["country"], "US")

    def test_retrieve_emission_not_found(self):
        """Test retrieving non-existent emission returns 404."""
        url = reverse("emission-detail", kwargs={"emission_id": 99999})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_emission_put_success(self):
        """Test full update of emission record returns 200."""
        data = {
            "year": 2021,
            "emissions": "2000.750",
            "emission_type": EmissionTypes.CH4,
            "country": "GB",
            "activity": ActivitySector.TRANSPORT,
        }

        response = self.client.put(self.detail_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.emission.refresh_from_db()
        self.assertEqual(self.emission.year, 2021)
        self.assertEqual(self.emission.country.code, "GB")
        self.assertEqual(self.emission.emission_type, EmissionTypes.CH4)

    def test_update_emission_patch_success(self):
        """Test partial update of emission record returns 200."""
        data = {"emissions": "3000.250"}

        response = self.client.patch(self.detail_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.emission.refresh_from_db()
        self.assertEqual(self.emission.emissions, Decimal("3000.250"))
        # Other fields should remain unchanged
        self.assertEqual(self.emission.year, 2020)
        self.assertEqual(self.emission.country.code, "US")

    def test_update_emission_invalid_data(self):
        """Test updating emission with invalid data returns 400."""
        data = {"emissions": "-500.0"}  # Negative value

        response = self.client.patch(self.detail_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("emissions", response.data)

    def test_delete_emission_success(self):
        """Test deleting emission record returns 204."""
        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Emission.objects.filter(id=self.emission.id).exists())

    def test_delete_emission_not_found(self):
        """Test deleting non-existent emission returns 404."""
        url = reverse("emission-detail", kwargs={"emission_id": 99999})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class EmissionPaginationTests(APITestCase):
    """Test cases for pagination functionality."""

    def setUp(self):
        """Create multiple emission records for pagination testing."""
        # Create 25 emissions for pagination testing with unique combinations
        # Using different years to ensure uniqueness
        for i in range(25):
            Emission.objects.create(
                year=2000 + i,  # Years from 2000 to 2024
                emissions=Decimal(f"{i * 100}.0"),
                emission_type=EmissionTypes.CO2,
                country="US",
                activity=ActivitySector.ENERGY,
            )

        self.list_url = reverse("emission-list-create")

    def test_pagination_default_page_size(self):
        """Test default pagination returns correct page size."""
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 25)
        # Check if results are paginated
        self.assertIn("results", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)
        # All 25 items should be on first page since default is 50 items per page
        self.assertEqual(len(response.data["results"]), 25)

    def test_pagination_with_more_records(self):
        """Test pagination with more than one page of results."""
        # Create more records to exceed the page size (50)
        for i in range(26, 76):  # Create 50 more records (25 + 50 = 75 total)
            Emission.objects.create(
                year=2000 + i,
                emissions=Decimal(f"{i * 100}.0"),
                emission_type=EmissionTypes.CH4,
                country="GB",
                activity=ActivitySector.TRANSPORT,
            )

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 75)
        # First page should have 50 items (default page size)
        self.assertEqual(len(response.data["results"]), 50)
        self.assertIsNotNone(response.data["next"])

    def test_pagination_page_navigation(self):
        """Test navigating between pages works correctly."""
        # Create more records to have multiple pages
        for i in range(26, 76):  # Total will be 75 records
            Emission.objects.create(
                year=2000 + i,
                emissions=Decimal(f"{i * 100}.0"),
                emission_type=EmissionTypes.CH4,
                country="GB",
                activity=ActivitySector.TRANSPORT,
            )

        # Get first page
        response = self.client.get(self.list_url, {"page": 1})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 50)
        self.assertIsNotNone(response.data["next"])

        # Get second page
        response = self.client.get(self.list_url, {"page": 2})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 25)  # Remaining items

    def test_pagination_last_page(self):
        """Test last page contains remaining items and no next link."""
        # Create more records to have multiple pages
        for i in range(26, 76):  # Total will be 75 records
            Emission.objects.create(
                year=2000 + i,
                emissions=Decimal(f"{i * 100}.0"),
                emission_type=EmissionTypes.CH4,
                country="GB",
                activity=ActivitySector.TRANSPORT,
            )

        response = self.client.get(self.list_url, {"page": 2})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 25)  # 75 total, 50+25
        self.assertIsNone(response.data["next"])
        self.assertIsNotNone(response.data["previous"])


class EmissionSerializerFieldTests(APITestCase):
    """Test cases for serializer field functionality."""

    def setUp(self):
        """Set up test data."""
        self.emission = Emission.objects.create(
            year=2020,
            emissions=Decimal("1000000.0"),  # 1 million metric tons
            emission_type=EmissionTypes.CO2,
            country="US",
            activity=ActivitySector.ENERGY,
        )
        self.detail_url = reverse(
            "emission-detail", kwargs={"emission_id": self.emission.id}
        )

    def test_computed_fields_in_response(self):
        """Test that computed fields are included in response."""
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("emissions_in_kilotons", response.data)
        self.assertIn("emissions_in_megatons", response.data)

    def test_emissions_kilotons_calculation(self):
        """Test emissions in kilotons is calculated correctly."""
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 1,000,000 MT = 1,000 kilotons
        self.assertEqual(response.data["emissions_in_kilotons"], 1000.0)

    def test_emissions_megatons_calculation(self):
        """Test emissions in megatons is calculated correctly."""
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 1,000,000 MT = 1 megaton
        self.assertEqual(response.data["emissions_in_megatons"], 1.0)

    def test_readonly_fields_cannot_be_set(self):
        """Test that readonly fields cannot be modified."""
        data = {
            "year": 2021,
            "emissions": "2000.0",
            "emission_type": EmissionTypes.CO2,
            "country": "US",
            "activity": ActivitySector.ENERGY,
            "created_at": "2022-01-01T00:00:00Z",  # Should be ignored
        }

        response = self.client.put(self.detail_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.emission.refresh_from_db()
        # created_at should not have changed
        self.assertNotEqual(
            self.emission.created_at.isoformat(), "2022-01-01T00:00:00+00:00"
        )

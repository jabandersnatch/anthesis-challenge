from django.contrib import admin
from emissions.models import Emission


@admin.register(Emission)
class EmissionAdmin(admin.ModelAdmin):
    list_display = ("id", "year", "emissions", "emission_type", "country", "activity")
    search_fields = ("country", "activity", "year", "emissions_type")
    list_filter = ("year", "country", "emission_type", "activity")
    ordering = ("-year",)

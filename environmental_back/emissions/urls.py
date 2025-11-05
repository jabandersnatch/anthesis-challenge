from django.urls import path
from emissions.views import EmissionListCreateView, EmissionRetrieveUpdateDestroyView

urlpatterns = [
    path("emissions/", EmissionListCreateView.as_view(), name="emission-list-create"),
    path(
        "emissions/<int:emission_id>/",
        EmissionRetrieveUpdateDestroyView.as_view(),
        name="emission-detail",
    ),
]

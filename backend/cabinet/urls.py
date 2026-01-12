from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicCabinetInfoView, CabinetSettingsView, TeamMemberViewSet

router = DefaultRouter()
router.register(r'team', TeamMemberViewSet)

urlpatterns = [
    path('public/', PublicCabinetInfoView.as_view(), name='cabinet-public'),
    path('settings/', CabinetSettingsView.as_view(), name='cabinet-settings'),
    path('', include(router.urls)),
]

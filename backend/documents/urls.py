"""
Configuration des URLs pour l'API Documents.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientViewSet, CaseViewSet, DocumentViewSet,
    DocumentPermissionViewSet, AuditLogViewSet,
    TagViewSet, DeadlineViewSet, DocumentVersionViewSet, NotificationViewSet, DiligenceViewSet, TaskViewSet, DecisionViewSet,
    AgendaViewSet
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'permissions', DocumentPermissionViewSet, basename='permission')
router.register(r'audit', AuditLogViewSet, basename='audit')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'deadlines', DeadlineViewSet, basename='deadline')
router.register(r'versions', DocumentVersionViewSet, basename='version')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'diligences', DiligenceViewSet, basename='diligence')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'decisions', DecisionViewSet, basename='decision')
router.register(r'agenda', AgendaViewSet, basename='agenda')

urlpatterns = [
    path('', include(router.urls)),
]

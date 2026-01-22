from django.urls import path
from .debug import debug_status

urlpatterns = [
    path('', debug_status, name='debug_status'),
]

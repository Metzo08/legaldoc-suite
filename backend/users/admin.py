"""
Administration Django pour les utilisateurs.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Administration personnalisée pour le modèle User.
    """
    list_display = ('username', 'email', 'get_full_name', 'role', 'is_active_user', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations Professionnelles', {
            'fields': ('role', 'phone', 'department', 'is_active_user')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Informations Professionnelles', {
            'fields': ('role', 'phone', 'department', 'email', 'first_name', 'last_name')
        }),
    )

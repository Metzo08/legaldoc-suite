"""
Administration Django pour la gestion documentaire.
"""
from django.contrib import admin
from .models import Client, Case, Document, DocumentPermission, AuditLog, Task


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """
    Administration pour les clients.
    """
    list_display = ('name', 'client_type', 'email', 'phone', 'created_by', 'created_at')
    list_filter = ('client_type', 'created_at')
    search_fields = ('name', 'email', 'company_registration')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Informations Principales', {
            'fields': ('name', 'client_type', 'email', 'phone')
        }),
        ('Adresse', {
            'fields': ('address',)
        }),
        ('Informations Entreprise', {
            'fields': ('company_registration',),
            'classes': ('collapse',)
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    """
    Administration pour les dossiers.
    """
    list_display = ('reference', 'title', 'client', 'status', 'opened_date', 'created_at')
    list_filter = ('status', 'opened_date', 'created_at')
    search_fields = ('reference', 'title', 'description', 'client__name')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('assigned_to',)
    
    fieldsets = (
        ('Informations Principales', {
            'fields': ('reference', 'title', 'client', 'status')
        }),
        ('Description', {
            'fields': ('description',)
        }),
        ('Dates', {
            'fields': ('opened_date', 'closed_date')
        }),
        ('Assignation', {
            'fields': ('assigned_to',)
        }),
        ('Métadonnées', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """
    Administration pour les documents.
    """
    list_display = ('title', 'case', 'document_type', 'file_name', 'file_size_display', 'ocr_processed', 'created_at')
    list_filter = ('document_type', 'ocr_processed', 'is_confidential', 'created_at')
    search_fields = ('title', 'description', 'file_name', 'ocr_text')
    readonly_fields = ('file_name', 'file_size', 'file_extension', 'ocr_text', 'ocr_processed', 'ocr_error', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Informations Principales', {
            'fields': ('title', 'description', 'case', 'document_type')
        }),
        ('Fichier', {
            'fields': ('file', 'file_name', 'file_size', 'file_extension')
        }),
        ('OCR', {
            'fields': ('ocr_processed', 'ocr_text', 'ocr_error'),
            'classes': ('collapse',)
        }),
        ('Sécurité et Classification', {
            'fields': ('is_confidential', 'tags')
        }),
        ('Métadonnées', {
            'fields': ('uploaded_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def file_size_display(self, obj):
        """
        Affiche la taille du fichier de manière lisible.
        """
        size = obj.file_size
        for unit in ['o', 'Ko', 'Mo', 'Go']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} To"
    file_size_display.short_description = 'Taille'


@admin.register(DocumentPermission)
class DocumentPermissionAdmin(admin.ModelAdmin):
    """
    Administration pour les permissions.
    """
    list_display = ('document', 'user', 'permission_level', 'granted_by', 'granted_at')
    list_filter = ('permission_level', 'granted_at')
    search_fields = ('document__title', 'user__username', 'user__email')
    readonly_fields = ('granted_at',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """
    Administration pour les logs d'audit.
    """
    list_display = ('timestamp', 'user', 'action', 'document', 'case', 'client', 'ip_address')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__username', 'document__title', 'case__reference', 'client__name', 'details')
    readonly_fields = ('user', 'action', 'document', 'case', 'client', 'details', 'ip_address', 'user_agent', 'timestamp')
    
    def has_add_permission(self, request):
        """
        Empêche la création manuelle de logs.
        """
        return False
    
    def has_change_permission(self, request, obj=None):
        """
        Empêche la modification des logs.
        """
        return False
    
    def has_delete_permission(self, request, obj=None):
        """
        Seuls les super-admins peuvent supprimer des logs.
        """
        return request.user.is_superuser


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """
    Administration pour les tâches.
    """
    list_display = ('title', 'assigned_to', 'status', 'priority', 'due_date', 'assigned_by')
    list_filter = ('status', 'priority', 'due_date')
    search_fields = ('title', 'description', 'assigned_to__username')
    readonly_fields = ('created_at', 'updated_at')

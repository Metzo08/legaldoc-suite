from django.contrib import admin
from .models import Cabinet, TeamMember

@admin.register(Cabinet)
class CabinetAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'updated_at')
    # Prevent deletion of the singleton
    def has_delete_permission(self, request, obj=None):
        return False
    # Prevent adding more if one exists (though model handles it too)
    def has_add_permission(self, request):
        return not Cabinet.objects.exists()

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    search_fields = ('name', 'role')

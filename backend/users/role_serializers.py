from rest_framework import serializers
from .models import RolePermission

class RolePermissionSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = RolePermission
        fields = ['role', 'role_display', 'permissions']

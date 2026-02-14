from rest_framework import permissions

class IsCabinetAdmin(permissions.BasePermission):
    """
    Permission permettant l'accès uniquement si l'utilisateur a le rôle ADMIN.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'ADMIN' or request.user.is_superuser)
        )

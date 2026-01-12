from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Permission personnalisée pour vérifier si l'utilisateur a le rôle ADMIN.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsAdminOrSelf(permissions.BasePermission):
    """
    Permet aux admins de tout faire, mais aux utilisateurs de ne voir/modifier que leur propre compte.
    """
    def has_object_permission(self, request, view, obj):
        # Admin peut tout faire
        if request.user.role == 'ADMIN':
            return True
        # L'utilisateur peut voir/modifier son propre compte
        return obj == request.user

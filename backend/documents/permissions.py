"""
Permissions personnalisées pour l'API de gestion documentaire.
"""
from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission personnalisée pour autoriser uniquement les admins à modifier.
    """
    
    def has_permission(self, request, view):
        # Lecture autorisée pour tous les utilisateurs authentifiés
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Écriture uniquement pour les admins
        return request.user and request.user.is_authenticated and request.user.is_admin


class CanDeleteDocuments(permissions.BasePermission):
    """
    Permission pour supprimer des documents (admin et avocats uniquement).
    """
    
    def has_permission(self, request, view):
        if request.method == 'DELETE':
            return request.user and request.user.is_authenticated and request.user.can_delete_documents
        return True


class HasDocumentPermission(permissions.BasePermission):
    """
    Vérifie si l'utilisateur a les permissions sur un document spécifique.
    """
    
    def has_object_permission(self, request, view, obj):
        # Les admins et avocats ont tous les droits (lecture/écriture) par défaut
        if request.user.is_admin or request.user.role == 'AVOCAT':
            return True
        
        # Déterminer le document à partir de l'objet
        from .models import Document
        if isinstance(obj, Document):
            document = obj
        elif hasattr(obj, 'document'):
            document = obj.document
        else:
            return False

        # L'uploader a tous les droits sur son propre document
        if document.uploaded_by == request.user:
            return True
        
        # Un client peut voir les documents de ses propres dossiers
        if request.user.role == 'CLIENT' and hasattr(request.user, 'client_profile'):
            if document.case.client == request.user.client_profile:
                return True

        # Vérifier les permissions spécifiques (partage)
        from .models import DocumentPermission
        try:
            perm = DocumentPermission.objects.get(document=document, user=request.user)
            
            if request.method in permissions.SAFE_METHODS:
                return perm.permission_level in ['READ', 'WRITE', 'DELETE', 'ADMIN']
            elif request.method in ['PUT', 'PATCH']:
                return perm.permission_level in ['WRITE', 'DELETE', 'ADMIN']
            elif request.method == 'DELETE':
                return perm.permission_level in ['DELETE', 'ADMIN']
            
        except DocumentPermission.DoesNotExist:
            # Si aucune permission spécifique, vérifier si l'utilisateur est assigné au dossier
            if document.case.assigned_to.filter(id=request.user.id).exists():
                return True
            return False
        
        return False

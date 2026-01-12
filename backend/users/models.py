"""
Modèles pour la gestion des utilisateurs avec rôles et permissions.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Modèle utilisateur personnalisé avec rôles pour le cabinet.
    """
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrateur'
        AVOCAT = 'AVOCAT', 'Avocat'
        COLLABORATEUR = 'COLLABORATEUR', 'Collaborateur'
        STAGIAIRE = 'STAGIAIRE', 'Stagiaire'
        SECRETAIRE = 'SECRETAIRE', 'Secrétaire'
        CLIENT = 'CLIENT', 'Client'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.COLLABORATEUR,
        verbose_name='Rôle'
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Téléphone'
    )
    
    department = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Département/Service'
    )
    
    is_active_user = models.BooleanField(
        default=True,
        verbose_name='Compte actif'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Dernière modification'
    )
    
    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
    
    @property
    def is_admin(self):
        """Vérifie si l'utilisateur est administrateur."""
        return self.role == self.Role.ADMIN
    
    @property
    def is_avocat(self):
        """Vérifie si l'utilisateur est avocat."""
        return self.role == self.Role.AVOCAT
    
    @property
    def can_manage_users(self):
        """Peut gérer les utilisateurs."""
        return self.role in [self.Role.ADMIN, self.Role.AVOCAT]
    
    @property
    def can_delete_documents(self):
        """Peut supprimer des documents."""
        return self.role in [self.Role.ADMIN, self.Role.AVOCAT]

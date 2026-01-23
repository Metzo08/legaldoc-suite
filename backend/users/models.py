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
    
    # Authentification à double facteur (2FA)
    two_factor_enabled = models.BooleanField(
        default=False,
        verbose_name='Authentification 2FA activée'
    )
    
    two_factor_secret = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        verbose_name='Secret 2FA (Base32)'
    )
    
    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"
    
    def save(self, *args, **kwargs):
        """Assure que les super-utilisateurs ont toujours le rôle ADMIN."""
        if self.is_superuser and self.role != self.Role.ADMIN:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)

    @property
    def is_admin(self):
        """Vérifie si l'utilisateur est administrateur."""
        return self.role == self.Role.ADMIN
    
    @property
    def is_avocat(self):
        """Vérifie si l'utilisateur est avocat."""
        return self.role == self.Role.AVOCAT
    
    def has_perm(self, perm_name):
        """Vérifie si l'utilisateur a une permission spécifique via son rôle."""
        # Les admins ont toujours tout
        if self.role == self.Role.ADMIN:
            return True
            
        try:
            # Import différé pour éviter l'import circulaire si defini avant
            # Mais ici RolePermission est défini après, donc on peut le référencer ?
            # Python lit le fichier de haut en bas, donc RolePermission n'existe pas ENCORE ici.
            # On doit utiliser 'RolePermission' en string ou le définir avant.
            # Ou utiliser l'import différé ou simplement s'appuyer sur le fait que la méthode
            # est appelée à l'exécution, donc RolePermission existera.
            
            # Pour être sûr :
            return RolePermission.objects.get(role=self.role).permissions.get(perm_name, False)
        except (RolePermission.DoesNotExist, AttributeError):
            return False

    @property
    def can_manage_users(self):
        return self.has_perm('can_manage_users')
    
    @property
    def can_delete_documents(self):
        return self.has_perm('can_manage_documents')


class RolePermission(models.Model):
    """
    Définit les permissions pour chaque rôle.
    """
    role = models.CharField(
        max_length=20,
        choices=User.Role.choices,
        primary_key=True,
        verbose_name='Rôle'
    )
    
    permissions = models.JSONField(
        default=dict,
        verbose_name='Permissions',
        help_text="Stocke les permissions sous forme de JSON { 'permission_name': boolean }"
    )
    
    def __str__(self):
        return f"Permissions pour {self.get_role_display()}"

    class Meta:
        verbose_name = 'Permission Rôle'
        verbose_name_plural = 'Permissions Rôles'

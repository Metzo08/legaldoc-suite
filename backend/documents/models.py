"""
Modèles pour la gestion documentaire: clients, cas, documents, permissions et audit.
"""
from django.db import models
from django.conf import settings
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
import os


class Client(models.Model):
    """
    Modèle représentant un client du cabinet.
    """
    class ClientType(models.TextChoices):
        PARTICULIER = 'PARTICULIER', 'Particulier'
        ENTREPRISE = 'ENTREPRISE', 'Entreprise'
        ASSOCIATION = 'ASSOCIATION', 'Association'
    
    name = models.CharField(max_length=255, verbose_name='Nom')
    email = models.EmailField(blank=True, verbose_name='Email')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Téléphone')
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='client_profile',
        verbose_name='Compte utilisateur'
    )
    address = models.TextField(blank=True, verbose_name='Adresse')
    client_type = models.CharField(
        max_length=20,
        choices=ClientType.choices,
        default=ClientType.PARTICULIER,
        verbose_name='Type de client'
    )
    company_registration = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='N° SIRET/SIREN'
    )
    notes = models.TextField(blank=True, verbose_name='Notes')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='clients_created',
        verbose_name='Créé par'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière modification')
    
    class Meta:
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.name


class Case(models.Model):
    """
    Modèle représentant un dossier/affaire juridique.
    """
    class CaseStatus(models.TextChoices):
        OUVERT = 'OUVERT', 'Ouvert'
        EN_COURS = 'EN_COURS', 'En cours'
        SUSPENDU = 'SUSPENDU', 'Suspendu'
        CLOS = 'CLOS', 'Clos'
        ARCHIVE = 'ARCHIVE', 'Archivé'
    
    class CaseCategory(models.TextChoices):
        CIVIL = 'CIVIL', 'Civil'
        CORRECTIONNEL = 'CORRECTIONNEL', 'Correctionnel'
    
    title = models.CharField(max_length=255, verbose_name='Intitulé de l\'affaire')
    reference = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Référence dossier'
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='cases',
        verbose_name='Client'
    )
    description = models.TextField(blank=True, verbose_name='Description')
    status = models.CharField(
        max_length=20,
        choices=CaseStatus.choices,
        default=CaseStatus.OUVERT,
        verbose_name='Statut'
    )
    opened_date = models.DateField(verbose_name='Date d\'ouverture')
    closed_date = models.DateField(null=True, blank=True, verbose_name='Date de clôture')
    category = models.CharField(
        max_length=20,
        choices=CaseCategory.choices,
        default=CaseCategory.CIVIL,
        verbose_name='Catégorie'
    )
    assigned_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_cases',
        blank=True,
        verbose_name='Assigné à'
    )
    
    # Nouveaux champs demandés
    represented_party = models.CharField(max_length=255, blank=True, verbose_name='Partie représentée')
    adverse_party = models.CharField(max_length=255, blank=True, verbose_name='Partie adverse')
    adverse_lawyer = models.CharField(max_length=255, blank=True, verbose_name='Avocat adverse')
    external_reference = models.CharField(max_length=100, blank=True, verbose_name='Référence (Numéro)')
    parent_case = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sub_cases',
        verbose_name='Dossier principal'
    )
    tags = models.ManyToManyField(
        'Tag',
        related_name='cases',
        blank=True,
        verbose_name='Tags'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='cases_created',
        verbose_name='Créé par'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière modification')
    
    class Meta:
        verbose_name = 'Dossier'
        verbose_name_plural = 'Dossiers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reference']),
            models.Index(fields=['status']),
            models.Index(fields=['opened_date']),
        ]
    
    def __str__(self):
        return f"{self.reference} - {self.title}"

    def save(self, *args, **kwargs):
        """
        Surcharge pour générer automatiquement la référence.
        Format principal : CIV1234 (CIV + 4 chiffres séquentiels)
        Format sous-dossier : CIV1234.1 (Réf Principal + . + incrément)
        """
        if not self.reference:
            prefix = 'CIV' if self.category == 'CIVIL' else 'COR'
            
            # 1. Vérifier si le client a déjà un dossier "principal" dans cette catégorie
            # Un dossier principal est celui qui n'a pas de parent_case ou qui est le premier créé.
            # On cherche le tout premier dossier du client dans cette catégorie.
            root_case = Case.objects.filter(
                client=self.client, 
                category=self.category
            ).order_by('created_at').first()
            
            if root_case:
                # C'est un sous-dossier (affaire récurrente du même client)
                # On récupère la référence du root (sans le suffixe si c'est déjà un sous-dossier, 
                # mais normalement le root n'en a pas)
                base_ref = root_case.reference.split('.')[0]
                
                # Compter combien de dossiers ce client a déjà dans cette catégorie
                count = Case.objects.filter(
                    client=self.client, 
                    category=self.category
                ).count()
                
                self.reference = f"{base_ref}.{count}"
            else:
                # C'est le premier dossier du client dans cette catégorie -> Dossier Principal
                # Trouver le numéro maximum utilisé globalement pour ce préfixe parmi les dossiers principaux
                import re
                principal_cases = Case.objects.filter(
                    category=self.category,
                    reference__regex=rf'^{prefix}\d+$' # Uniquement prefix + chiffres (pas de point)
                )
                
                max_num = 0
                for c in principal_cases:
                    match = re.search(r'(\d+)', c.reference)
                    if match:
                        num = int(match.group(1))
                        if num > max_num:
                            max_num = num
                
                # Prochain numéro, minimum 1000 pour avoir 4 chiffres comme dans l'exemple
                next_num = max(1000, max_num + 1)
                self.reference = f"{prefix}{next_num:04d}"
                
        super().save(*args, **kwargs)


def document_upload_path(instance, filename):
    """
    Génère le chemin de stockage pour les documents uploadés.
    Format: documents/client_id/case_id/filename
    """
    return f'documents/client_{instance.case.client.id}/case_{instance.case.id}/{filename}'


class Document(models.Model):
    """
    Modèle représentant un document.
    """
    class DocumentType(models.TextChoices):
        CONTRAT = 'CONTRAT', 'Contrat'
        COURRIER = 'COURRIER', 'Courrier'
        JUGEMENT = 'JUGEMENT', 'Jugement'
        PIECE = 'PIECE', 'Pièce'
        NOTE = 'NOTE', 'Note'
        MEMOIRE = 'MEMOIRE', 'Mémoire'
        ASSIGNATION = 'ASSIGNATION', 'Assignation'
        CONCLUSION = 'CONCLUSION', 'Conclusion'
        REQUETE = 'REQUETE', 'Requête'
        ACTE_HUISSIER = 'ACTE_HUISSIER', 'Acte d’huissier'
        DOSSIER_ADVERSE = 'DOSSIER_ADVERSE', 'Dossier partie adverse'
        CITATION = 'CITATION', 'Citation'
        AUTRE = 'AUTRE', 'Autre'
    
    title = models.CharField(max_length=255, verbose_name='Titre')
    description = models.TextField(blank=True, verbose_name='Description')
    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Dossier'
    )
    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices,
        default=DocumentType.AUTRE,
        verbose_name='Type de document'
    )
    file = models.FileField(
        upload_to=document_upload_path,
        verbose_name='Fichier'
    )
    file_name = models.CharField(max_length=255, verbose_name='Nom du fichier')
    file_size = models.BigIntegerField(verbose_name='Taille (octets)')
    file_extension = models.CharField(max_length=10, verbose_name='Extension')
    
    # Champs pour le texte extrait par OCR
    ocr_text = models.TextField(blank=True, verbose_name='Texte extrait (OCR)')
    ocr_processed = models.BooleanField(default=False, verbose_name='OCR traité')
    ocr_error = models.TextField(blank=True, verbose_name='Erreur OCR')
    
    # Recherche plein-texte PostgreSQL
    search_vector = SearchVectorField(null=True, verbose_name='Vecteur de recherche')
    
    # Métadonnées
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='documents_uploaded',
        verbose_name='Uploadé par'
    )
    is_confidential = models.BooleanField(default=True, verbose_name='Confidentiel')
    tags = models.ManyToManyField(
        'Tag',
        related_name='documents',
        blank=True,
        verbose_name='Tags'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'upload')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière modification')
    
    class Meta:
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['file_name']),
            models.Index(fields=['document_type']),
            models.Index(fields=['created_at']),
            GinIndex(fields=['search_vector']),  # Index pour la recherche
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        """
        Surcharge pour extraire les métadonnées du fichier.
        """
        if self.file:
            self.file_name = os.path.basename(self.file.name)
            self.file_size = self.file.size
            self.file_extension = os.path.splitext(self.file.name)[1].lower().replace('.', '')
        super().save(*args, **kwargs)


class DocumentPermission(models.Model):
    """
    Permissions granulaires pour l'accès aux documents.
    """
    class PermissionLevel(models.TextChoices):
        READ = 'READ', 'Lecture'
        WRITE = 'WRITE', 'Écriture'
        DELETE = 'DELETE', 'Suppression'
        ADMIN = 'ADMIN', 'Administration'
    
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='permissions',
        verbose_name='Document'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='document_permissions',
        verbose_name='Utilisateur'
    )
    permission_level = models.CharField(
        max_length=10,
        choices=PermissionLevel.choices,
        default=PermissionLevel.READ,
        verbose_name='Niveau de permission'
    )
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='permissions_granted',
        verbose_name='Accordé par'
    )
    granted_at = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'octroi')
    
    class Meta:
        verbose_name = 'Permission Document'
        verbose_name_plural = 'Permissions Documents'
        unique_together = ['document', 'user']
        indexes = [
            models.Index(fields=['user', 'permission_level']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.document.title} ({self.get_permission_level_display()})"


class AuditLog(models.Model):
    """
    Journal d'audit pour tracer toutes les actions sur les documents.
    """
    class ActionType(models.TextChoices):
        CREATE = 'CREATE', 'Création'
        VIEW = 'VIEW', 'Consultation'
        UPDATE = 'UPDATE', 'Modification'
        DELETE = 'DELETE', 'Suppression'
        DOWNLOAD = 'DOWNLOAD', 'Téléchargement'
        SHARE = 'SHARE', 'Partage'
        PERMISSION = 'PERMISSION', 'Changement de permission'
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        verbose_name='Utilisateur'
    )
    action = models.CharField(
        max_length=20,
        choices=ActionType.choices,
        verbose_name='Action'
    )
    document = models.ForeignKey(
        Document,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='Document'
    )
    case = models.ForeignKey(
        Case,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='Dossier'
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='Client'
    )
    details = models.TextField(blank=True, verbose_name='Détails')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='Adresse IP')
    user_agent = models.CharField(max_length=500, blank=True, verbose_name='User Agent')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Horodatage')
    
    class Meta:
        verbose_name = 'Journal d\'Audit'
        verbose_name_plural = 'Journaux d\'Audit'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username if self.user else 'Système'} - {self.get_action_display()} - {self.timestamp}"


class Tag(models.Model):
    """
    Tags pour catégoriser documents et dossiers.
    """
    name = models.CharField(max_length=50, unique=True, verbose_name='Nom')
    color = models.CharField(max_length=7, default='#6366f1', verbose_name='Couleur')  # Hex color
    description = models.TextField(blank=True, verbose_name='Description')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    
    class Meta:
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Deadline(models.Model):
    """
    Échéances liées aux dossiers juridiques.
    """
    class DeadlineType(models.TextChoices):
        AUDIENCE = 'AUDIENCE', 'Audience'
        DEPOT = 'DEPOT', 'Dépôt de pièce'
        REPONSE = 'REPONSE', 'Réponse à notifier'
        DELAI = 'DELAI', 'Délai de recours'
        CONGÉS = 'CONGES', 'Congés / Suspension'
        AUTRE = 'AUTRE', 'Autre'
    
    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='deadlines',
        verbose_name='Dossier'
    )
    # Champs spécifiques pour les Audiences
    jurisdiction = models.CharField(max_length=255, blank=True, verbose_name='Juridiction')
    courtroom = models.CharField(max_length=100, blank=True, verbose_name='Salle d\'audience')
    result = models.TextField(blank=True, verbose_name='Résultat')
    action_requested = models.TextField(blank=True, verbose_name='Diligence à faire')
    
    title = models.CharField(max_length=255, verbose_name='Titre / Objet')
    description = models.TextField(blank=True, verbose_name='Description')
    deadline_type = models.CharField(
        max_length=20,
        choices=DeadlineType.choices,
        default=DeadlineType.AUTRE,
        verbose_name='Type d\'échéance'
    )
    due_date = models.DateTimeField(verbose_name='Date d\'échéance')
    reminder_days = models.IntegerField(default=7, verbose_name='Rappel (jours avant)')
    notification_sent = models.BooleanField(default=False, verbose_name='Notification envoyée')
    is_completed = models.BooleanField(default=False, verbose_name='Terminé')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Date de complétion')
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deadlines_completed',
        verbose_name='Complété par'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='deadlines_created',
        verbose_name='Créé par'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière modification')
    
    class Meta:
        verbose_name = 'Échéance'
        verbose_name_plural = 'Échéances'
        ordering = ['due_date']
        indexes = [
            models.Index(fields=['due_date']),
            models.Index(fields=['is_completed']),
            models.Index(fields=['case', 'due_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.due_date.strftime('%d/%m/%Y')}"
    
    @property
    def is_overdue(self):
        """Vérifie si l'échéance est dépassée"""
        from django.utils import timezone
        return not self.is_completed and self.due_date < timezone.now()
    
    @property
    def days_remaining(self):
        """Nombre de jours restants"""
        from django.utils import timezone
        if self.is_completed:
            return 0
        delta = self.due_date - timezone.now()
        return delta.days


class DocumentVersion(models.Model):
    """
    Historique des versions d'un document.
    """
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='versions',
        verbose_name='Document'
    )
    version_number = models.IntegerField(verbose_name='Numéro de version')
    file = models.FileField(upload_to='document_versions/', verbose_name='Fichier')
    file_name = models.CharField(max_length=255, verbose_name='Nom du fichier')
    file_size = models.BigIntegerField(verbose_name='Taille du fichier')
    comment = models.TextField(blank=True, verbose_name='Commentaire')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='document_versions',
        verbose_name='Uploadé par'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'upload')
    
    class Meta:
        verbose_name = 'Version de Document'
        verbose_name_plural = 'Versions de Documents'
        ordering = ['-version_number']
        unique_together = ['document', 'version_number']
        indexes = [
            models.Index(fields=['document', '-version_number']),
        ]
    
    def __str__(self):
        return f"{self.document.title} - v{self.version_number}"


class Notification(models.Model):
    """
    Système de notifications internes pour les utilisateurs.
    """
    class Level(models.TextChoices):
        INFO = 'INFO', 'Information'
        SUCCESS = 'SUCCESS', 'Succès'
        WARNING = 'WARNING', 'Attention'
        ERROR = 'ERROR', 'Erreur'

    class EntityType(models.TextChoices):
        CASE = 'CASE', 'Dossier'
        DOCUMENT = 'DOCUMENT', 'Document'
        DEADLINE = 'DEADLINE', 'Échéance'
        SYSTEM = 'SYSTEM', 'Système'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinataire'
    )
    level = models.CharField(
        max_length=10,
        choices=Level.choices,
        default=Level.INFO,
        verbose_name='Niveau'
    )
    title = models.CharField(max_length=255, verbose_name='Titre')
    message = models.TextField(verbose_name='Message')
    is_read = models.BooleanField(default=False, verbose_name='Lu')
    entity_type = models.CharField(
        max_length=20,
        choices=EntityType.choices,
        default=EntityType.SYSTEM,
        verbose_name='Type d\'entité'
    )
    entity_id = models.IntegerField(null=True, blank=True, verbose_name='ID de l\'entité')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class Diligence(models.Model):
    """
    Système de pense-bête (diligences rapides) pour les utilisateurs.
    Peut être lié ou non à un dossier.
    """
    title = models.CharField(max_length=255, verbose_name='Description de la diligence')
    is_completed = models.BooleanField(default=False, verbose_name='Terminé')
    
    case = models.ForeignKey(
        Case,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='diligences',
        verbose_name='Dossier associé'
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='diligences_created',
        verbose_name='Créé par'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière modification')

    class Meta:
        verbose_name = 'Diligence'
        verbose_name_plural = 'Diligences'
        ordering = ['is_completed', '-created_at']
        indexes = [
            models.Index(fields=['created_by', 'is_completed']),
        ]

    def __str__(self):
        return self.title

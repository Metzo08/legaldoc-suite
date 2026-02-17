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
        COMMERCIAL = 'COMMERCIAL', 'Commercial'
        SOCIAL = 'SOCIAL', 'Social'
        PENAL = 'PENAL', 'Pénal'
        CORRECTIONNEL = 'CORRECTIONNEL', 'Correctionnel'
        TI_FAMILLE = 'TI_FAMILLE', 'TI Famille'
    
    title = models.CharField(max_length=255, blank=True, verbose_name='Intitulé de l\'affaire')
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
    adverse_lawyer = models.TextField(blank=True, verbose_name='Avocat(s) partie adverse')
    external_reference = models.CharField(max_length=100, blank=True, verbose_name='Référence (Numéro)')
    
    # Personne à contacter
    contact_name = models.CharField(max_length=255, blank=True, verbose_name='Nom du contact')
    contact_email = models.EmailField(blank=True, verbose_name='Email du contact')
    contact_phone = models.CharField(max_length=20, blank=True, verbose_name='Téléphone du contact')
    
    # Avocats à mes côtés
    our_lawyers = models.TextField(blank=True, verbose_name='Avocats à mes côtés')
    
    # Honoraires (visible uniquement par l'administrateur)
    fees = models.TextField(blank=True, verbose_name='Honoraires')
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
            # Préfixes par catégorie
            prefix_map = {
                'CIVIL': 'CIV',
                'COMMERCIAL': 'COM',
                'SOCIAL': 'SOC',
                'PENAL': 'PEN',
                'CORRECTIONNEL': 'COR'
            }
            prefix = prefix_map.get(self.category, 'CIV')

            if self.parent_case:
                # C'est explicitement un sous-dossier
                base_ref = self.parent_case.reference.split('.')[0]
                # Compter les sous-dossiers existants pour ce parent
                count = Case.objects.filter(parent_case=self.parent_case).count()
                self.reference = f"{base_ref}.{count + 1}"
            else:
                # Dossier Principal - Logique existante améliorée
                import re
                principal_cases = Case.objects.filter(
                    parent_case__isnull=True,
                    category=self.category,
                    reference__regex=rf'^{prefix}\d+$'
                )
                
                max_num = 0
                for c in principal_cases:
                    match = re.search(r'(\d+)', c.reference)
                    if match:
                        num = int(match.group(1))
                        if num > max_num:
                            max_num = num
                
                next_num = max(1000, max_num + 1)
                self.reference = f"{prefix}{next_num:04d}"
        
        # Fallback pour le titre s'il est vide
        if not self.title:
            if self.reference:
                self.title = self.reference
            else:
                self.title = "Dossier sans intitulé"
                
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
        max_length=500,
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
    
    is_multi_page = models.BooleanField(default=False, verbose_name='Multi-pages')
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


def document_page_upload_path(instance, filename):
    """
    Génère le chemin de stockage pour les pages de documents.
    """
    return f'documents/client_{instance.document.case.client.id}/case_{instance.document.case.id}/doc_{instance.document.id}/page_{instance.page_number}_{filename}'


class DocumentPage(models.Model):
    """
    Modèle représentant une page individuelle d'un document (image/scan).
    """
    document = models.ForeignKey(
        'Document',
        on_delete=models.CASCADE,
        related_name='pages',
        verbose_name='Document'
    )
    file = models.FileField(
        upload_to=document_page_upload_path,
        max_length=500,
        verbose_name='Fichier de la page'
    )
    page_number = models.PositiveIntegerField(verbose_name='Numéro de page')
    ocr_text = models.TextField(blank=True, verbose_name='Texte OCR de la page')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date d\'ajout')

    class Meta:
        verbose_name = 'Page de document'
        verbose_name_plural = 'Pages de document'
        ordering = ['page_number']

    def __str__(self):
        return f"Page {self.page_number} - {self.document.title}"


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
    decision = models.OneToOneField(
        'Decision',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audience_deadline',
        verbose_name='Décision associée'
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
    file = models.FileField(upload_to='document_versions/', max_length=500, verbose_name='Fichier')
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
        TASK = 'TASK', 'Tâche'
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


class Decision(models.Model):
    """
    Décisions de justice liées à un dossier.
    Chaque dossier (principal ou sous-dossier) peut avoir plusieurs décisions
    de type Instance, Appel ou Pourvoi.
    """
    class DecisionType(models.TextChoices):
        INSTANCE = 'INSTANCE', 'Instance'
        APPEL = 'APPEL', 'Appel'
        POURVOI = 'POURVOI', 'Pourvoi'

    class Section(models.TextChoices):
        GENERALE = 'GENERALE', 'Décisions Générales'
        CABINET_INSTRUCTION = 'CABINET_INSTRUCTION', 'Cabinets d\'Instruction'

    case = models.ForeignKey(
        Case,
        on_delete=models.CASCADE,
        related_name='decisions',
        verbose_name='Dossier'
    )
    decision_type = models.CharField(
        max_length=20,
        choices=DecisionType.choices,
        verbose_name='Type de décision'
    )
    date_decision = models.DateField(
        null=True,
        blank=True,
        verbose_name='Date de la décision'
    )
    juridiction = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Juridiction'
    )
    numero_decision = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Numéro de la décision'
    )
    resultat = models.TextField(
        blank=True,
        verbose_name='Résultat / Dispositif'
    )
    observations = models.TextField(
        blank=True,
        verbose_name='Observations'
    )
    
    # Nouveaux champs pour le module avancé
    section = models.CharField(
        max_length=50,
        choices=Section.choices,
        default=Section.GENERALE,
        verbose_name='Section'
    )
    cabinet_number = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='N° Cabinet'
    )
    infraction_motif = models.TextField(
        blank=True,
        verbose_name='Infraction / Motif'
    )
    mesure = models.TextField(
        blank=True,
        verbose_name='Mesure'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='decisions_created',
        verbose_name='Créé par'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière modification')

    class Meta:
        verbose_name = 'Décision'
        verbose_name_plural = 'Décisions'
        ordering = ['decision_type', 'date_decision']
        indexes = [
            models.Index(fields=['case', 'decision_type']),
        ]

    def __str__(self):
        return f"{self.get_decision_type_display()} - {self.case.reference}"


class Task(models.Model):
    """
    Tâches assignées aux membres du cabinet.
    """
    class Priority(models.TextChoices):
        LOW = 'LOW', 'Basse'
        MEDIUM = 'MEDIUM', 'Moyenne'
        HIGH = 'HIGH', 'Haute'
        URGENT = 'URGENT', 'Urgente'

    class Status(models.TextChoices):
        TODO = 'TODO', 'À faire'
        IN_PROGRESS = 'IN_PROGRESS', 'En cours'
        REVIEW = 'REVIEW', 'En révision'
        DONE = 'DONE', 'Terminé'

    title = models.CharField(max_length=255, verbose_name='Titre')
    description = models.TextField(blank=True, verbose_name='Description')
    
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_tasks',
        verbose_name='Assigné à'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks',
        verbose_name='Assigné par'
    )
    
    case = models.ForeignKey(
        Case,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
        verbose_name='Dossier lié'
    )
    
    due_date = models.DateTimeField(null=True, blank=True, verbose_name='Date d\'échéance')
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name='Priorité'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
        verbose_name='Statut'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière modification')

    class Meta:
        verbose_name = 'Tâche'
        verbose_name_plural = 'Tâches'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['priority']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class AgendaEvent(models.Model):
    """
    Entrées de l'agenda juridique du cabinet.
    Gère les audiences, procès et rendez-vous avec suivi des reports.
    """

    class TypeChambre(models.TextChoices):
        # TI (Tribunaux d'Instance)
        TI_DAKAR = 'TI_DAKAR', "TI Dakar"
        TI_PIKINE = 'TI_PIKINE', "TI Pikine"
        TI_GUEDIAWAYE = 'TI_GUEDIAWAYE', "TI Guédiawaye"
        TI_RUFISQUE = 'TI_RUFISQUE', "TI Rufisque"
        TI_KEUR_MASSAR = 'TI_KEUR_MASSAR', "TI Keur Massar"
        TI_FAMILLE = 'TI_FAMILLE', "TI Famille"
        
        # TGI Dakar
        TGI_DAKAR_CIVIL = 'TGI_DAKAR_CIVIL', "TGI Dakar - Civil"
        TGI_DAKAR_STATUT_PERSONNEL = 'TGI_DAKAR_STATUT_PERSONNEL', "TGI Dakar - Statut Personnel"
        TGI_DAKAR_FDTR = 'TGI_DAKAR_FDTR', "TGI Dakar - FDTR"
        TGI_DAKAR_CORRECTIONNELLE = 'TGI_DAKAR_CORRECTIONNELLE', "TGI Dakar - Correctionnelle"
        TGI_DAKAR_INSTRUCTION = 'TGI_DAKAR_INSTRUCTION', "TGI Dakar - Instruction"
        
        # TGI Pikine
        TGI_PIKINE_CIVIL = 'TGI_PIKINE_CIVIL', "TGI Pikine - Civil"
        TGI_PIKINE_FDTR = 'TGI_PIKINE_FDTR', "TGI Pikine - FDTR"
        TGI_PIKINE_CORRECTIONNELLE = 'TGI_PIKINE_CORRECTIONNELLE', "TGI Pikine - Correctionnelle"
        TGI_PIKINE_INSTRUCTION = 'TGI_PIKINE_INSTRUCTION', "TGI Pikine - Instruction"

        # TGI Guédiawaye
        TGI_GUEDIAWAYE_CIVIL = 'TGI_GUEDIAWAYE_CIVIL', "TGI Guédiawaye - Civil"
        TGI_GUEDIAWAYE_FDTR = 'TGI_GUEDIAWAYE_FDTR', "TGI Guédiawaye - FDTR"
        TGI_GUEDIAWAYE_CORRECTIONNELLE = 'TGI_GUEDIAWAYE_CORRECTIONNELLE', "TGI Guédiawaye - Correctionnelle"
        TGI_GUEDIAWAYE_INSTRUCTION = 'TGI_GUEDIAWAYE_INSTRUCTION', "TGI Guédiawaye - Instruction"

        # TGI Rufisque
        TGI_RUFISQUE_CIVIL = 'TGI_RUFISQUE_CIVIL', "TGI Rufisque - Civil"
        TGI_RUFISQUE_FDTR = 'TGI_RUFISQUE_FDTR', "TGI Rufisque - FDTR"
        TGI_RUFISQUE_CORRECTIONNELLE = 'TGI_RUFISQUE_CORRECTIONNELLE', "TGI Rufisque - Correctionnelle"
        TGI_RUFISQUE_INSTRUCTION = 'TGI_RUFISQUE_INSTRUCTION', "TGI Rufisque - Instruction"

        # TGI Keur Massar
        TGI_KEUR_MASSAR_CIVIL = 'TGI_KEUR_MASSAR_CIVIL', "TGI Keur Massar - Civil"
        TGI_KEUR_MASSAR_FDTR = 'TGI_KEUR_MASSAR_FDTR', "TGI Keur Massar - FDTR"
        TGI_KEUR_MASSAR_CORRECTIONNELLE = 'TGI_KEUR_MASSAR_CORRECTIONNELLE', "TGI Keur Massar - Correctionnelle"
        TGI_KEUR_MASSAR_INSTRUCTION = 'TGI_KEUR_MASSAR_INSTRUCTION', "TGI Keur Massar - Instruction"
        
        # Tribunal du Travail
        TRAVAIL_DAKAR = 'TRAVAIL_DAKAR', "Tribunal du Travail Dakar"
        TRAVAIL_PIKINE = 'TRAVAIL_PIKINE', "Tribunal du Travail Pikine"
        TRAVAIL_RUFISQUE = 'TRAVAIL_RUFISQUE', "Tribunal du Travail Rufisque"
        
        # Tribunal de Commerce
        TRIBUNAL_COMMERCE_DAKAR = 'TRIBUNAL_COMMERCE_DAKAR', "Tribunal de Commerce de Dakar"
        
        # Cours d'Appel et Autres
        CA_CORRECTIONNEL = 'CA_CORRECTIONNEL', 'CA Correctionnel'
        CA_CRIMINELLE = 'CA_CRIMINELLE', 'CA Criminelle'
        CA_SOCIAL = 'CA_SOCIAL', 'CA Social'
        COUR_SUPREME = 'COUR_SUPREME', 'Cour Suprême'
        AUTRE = 'AUTRE', 'Autre'

    class Statut(models.TextChoices):
        PREVU = 'PREVU', 'Prévu'
        REPORTE = 'REPORTE', 'Reporté'
        TERMINE = 'TERMINE', 'Terminé'
        ANNULE = 'ANNULE', 'Annulé'

    class EventType(models.TextChoices):
        AUDIENCE = 'AUDIENCE', 'Audience'
        RDV = 'RDV', 'Rendez-vous client'
        REUNION = 'REUNION', 'Réunion'
        DEPLACEMENT = 'DEPLACEMENT', 'Déplacement'
        AUTRE = 'AUTRE', 'Autre'

    # ── Informations principales ──
    title = models.CharField(max_length=255, verbose_name='Titre')
    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices,
        default=EventType.AUDIENCE,
        verbose_name="Type d'événement"
    )
    type_chambre = models.CharField(
        max_length=50,
        choices=TypeChambre.choices,
        default=TypeChambre.AUTRE,
        verbose_name='Type de chambre'
    )
    type_chambre_autre = models.CharField(
        max_length=100, blank=True,
        verbose_name='Chambre (autre)',
        help_text='Si "Autre" est sélectionné, précisez ici.'
    )
    dossier_numero = models.CharField(
        max_length=100, blank=True,
        verbose_name='Numéro de dossier'
    )
    dossier_nom = models.CharField(
        max_length=255, blank=True,
        verbose_name='Nom du dossier / parties'
    )

    # ── Date et heure ──
    date_audience = models.DateField(verbose_name="Date de l'audience")
    heure_audience = models.TimeField(verbose_name="Heure de l'audience")
    start_datetime = models.DateTimeField(
        verbose_name='Date et heure de début',
        help_text='Calculé automatiquement depuis date_audience + heure_audience'
    )
    end_datetime = models.DateTimeField(
        null=True, blank=True,
        verbose_name='Date et heure de fin'
    )

    # ── Statut et report ──
    statut = models.CharField(
        max_length=10,
        choices=Statut.choices,
        default=Statut.PREVU,
        verbose_name='Statut'
    )
    reporte_de = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reports_suivants',
        verbose_name="Reporté depuis (audience d'origine)"
    )
    motif_report = models.TextField(
        blank=True,
        verbose_name='Motif du report'
    )

    # ── Informations complémentaires ──
    case = models.ForeignKey(
        Case,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='agenda_events',
        verbose_name='Dossier lié'
    )
    notes = models.TextField(blank=True, verbose_name='Notes et observations')
    location = models.CharField(max_length=255, blank=True, verbose_name='Lieu')
    color = models.CharField(max_length=7, default='#2196f3', verbose_name='Couleur')

    # ── Archivage ──
    year = models.IntegerField(verbose_name="Année d'archivage")
    is_archived = models.BooleanField(default=False, verbose_name='Archivé')

    # ── Traçabilité ──
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='agenda_events',
        verbose_name='Créé par'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de création')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Dernière modification')

    class Meta:
        verbose_name = "Entrée d'agenda"
        verbose_name_plural = "Entrées d'agenda"
        ordering = ['date_audience', 'heure_audience']
        indexes = [
            models.Index(fields=['year', 'date_audience']),
            models.Index(fields=['type_chambre']),
            models.Index(fields=['statut']),
            models.Index(fields=['dossier_numero']),
            models.Index(fields=['case']),
            models.Index(fields=['created_by', 'year']),
        ]

    def __str__(self):
        chambre = self.get_type_chambre_display() if self.type_chambre != 'AUTRE' else self.type_chambre_autre
        return f"{self.dossier_numero or self.title} - {chambre} - {self.date_audience.strftime('%d/%m/%Y')} {self.heure_audience.strftime('%H:%M')}"

    def save(self, *args, **kwargs):
        """Calcule start_datetime et year automatiquement."""
        from datetime import datetime
        if self.date_audience and self.heure_audience:
            self.start_datetime = datetime.combine(self.date_audience, self.heure_audience)
        if self.date_audience:
            self.year = self.date_audience.year
        super().save(*args, **kwargs)


class AgendaHistory(models.Model):
    """
    Historique complet de toutes les modifications sur les entrées d'agenda.
    """

    class TypeAction(models.TextChoices):
        CREATION = 'CREATION', 'Création'
        MODIFICATION = 'MODIFICATION', 'Modification'
        REPORT = 'REPORT', 'Report'
        ANNULATION = 'ANNULATION', 'Annulation'
        TERMINATION = 'TERMINATION', 'Terminé'
        SUPPRESSION = 'SUPPRESSION', 'Suppression'

    agenda_entry = models.ForeignKey(
        AgendaEvent,
        on_delete=models.CASCADE,
        related_name='historique',
        verbose_name="Entrée d'agenda"
    )
    type_action = models.CharField(
        max_length=20,
        choices=TypeAction.choices,
        verbose_name="Type d'action"
    )
    ancienne_valeur = models.JSONField(
        null=True, blank=True,
        verbose_name='État avant modification'
    )
    nouvelle_valeur = models.JSONField(
        null=True, blank=True,
        verbose_name='État après modification'
    )
    commentaire = models.TextField(
        blank=True,
        verbose_name='Commentaire'
    )
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='agenda_history',
        verbose_name='Utilisateur'
    )
    date_action = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de l'action"
    )

    class Meta:
        verbose_name = "Historique d'agenda"
        verbose_name_plural = "Historiques d'agenda"
        ordering = ['-date_action']

    def __str__(self):
        return f"{self.get_type_action_display()} - {self.agenda_entry} - {self.date_action.strftime('%d/%m/%Y %H:%M')}"


class AgendaNotification(models.Model):
    """
    Notifications de rappel pour les audiences à venir.
    """

    class TypeNotification(models.TextChoices):
        SEPT_JOURS = '7_JOURS', '7 jours avant'
        TROIS_JOURS = '3_JOURS', '3 jours avant'
        UN_JOUR = '1_JOUR', '1 jour avant'
        DEUX_HEURES = '2_HEURES', '2 heures avant'

    class StatutNotification(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', 'En attente'
        ENVOYEE = 'ENVOYEE', 'Envoyée'
        ECHOUEE = 'ECHOUEE', 'Échouée'

    agenda_entry = models.ForeignKey(
        AgendaEvent,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name="Entrée d'agenda"
    )
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='agenda_notifications',
        verbose_name='Utilisateur à notifier'
    )
    type_notification = models.CharField(
        max_length=10,
        choices=TypeNotification.choices,
        verbose_name='Type de rappel'
    )
    date_envoi_prevue = models.DateTimeField(
        verbose_name="Date d'envoi prévue"
    )
    statut = models.CharField(
        max_length=10,
        choices=StatutNotification.choices,
        default=StatutNotification.EN_ATTENTE,
        verbose_name='Statut'
    )
    date_envoi_effectif = models.DateTimeField(
        null=True, blank=True,
        verbose_name="Date d'envoi effective"
    )

    class Meta:
        verbose_name = "Notification d'agenda"
        verbose_name_plural = "Notifications d'agenda"
        ordering = ['date_envoi_prevue']
        unique_together = ['agenda_entry', 'utilisateur', 'type_notification']

    def __str__(self):
        return f"Rappel {self.get_type_notification_display()} - {self.agenda_entry}"

"""
Sérialiseurs pour l'API de gestion documentaire.
"""
from rest_framework import serializers
from .models import Client, Case, Document, DocumentPermission, AuditLog, Tag, Deadline, DocumentVersion, Notification, Diligence, Task, Decision, AgendaEvent
from users.serializers import UserSerializer


class ClientSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Client.
    """
    created_by_name = serializers.SerializerMethodField()
    total_cases = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = (
            'id', 'name', 'email', 'phone', 'address', 'client_type',
            'company_registration', 'notes', 'created_by', 'created_by_name',
            'total_cases', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')
    
    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None
    
    def get_total_cases(self, obj):
        return obj.cases.count()


class CaseListSerializer(serializers.ModelSerializer):
    """
    Sérialiseur simplifié pour la liste des dossiers.
    """
    client_name = serializers.SerializerMethodField()
    assigned_to_names = serializers.SerializerMethodField()
    total_documents = serializers.SerializerMethodField()
    
    class Meta:
        model = Case
        fields = (
            'id', 'reference', 'title', 'client', 'client_name', 'status',
            'opened_date', 'closed_date', 'category', 'assigned_to_names', 'total_documents',
            'created_at', 'updated_at', 'represented_party', 'adverse_party',
            'adverse_lawyer', 'external_reference', 'contact_name', 'contact_email',
            'contact_phone', 'our_lawyers', 'fees', 'parent_case'
        )
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if request and not (request.user.is_superuser or (hasattr(request.user, 'role') and request.user.role == 'ADMIN')):
            representation.pop('fees', None)
        return representation

    def get_assigned_to_names(self, obj):
        return [user.get_full_name() for user in obj.assigned_to.all()]
    
    def get_total_documents(self, obj):
        return obj.documents.count()

    def get_client_name(self, obj):
        return obj.client.name if obj.client else None


class CaseDetailSerializer(serializers.ModelSerializer):
    """
    Sérialiseur détaillé pour un dossier.
    """
    client_details = ClientSerializer(source='client', read_only=True)
    client_name = serializers.SerializerMethodField()
    assigned_to_details = UserSerializer(source='assigned_to', many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    sub_cases = CaseListSerializer(many=True, read_only=True)
    decisions = serializers.SerializerMethodField()
    
    class Meta:
        model = Case
        fields = (
            'id', 'reference', 'title', 'client', 'client_details', 'description',
            'status', 'opened_date', 'closed_date', 'category', 'assigned_to', 'assigned_to_details',
            'created_by', 'created_by_name', 'created_at', 'updated_at', 'represented_party',
            'adverse_party', 'adverse_lawyer', 'external_reference', 'contact_name',
            'contact_email', 'contact_phone', 'our_lawyers', 'fees', 'client_name',
            'parent_case', 'sub_cases', 'decisions'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if request and not (request.user.is_superuser or (hasattr(request.user, 'role') and request.user.role == 'ADMIN')):
            representation.pop('fees', None)
        return representation

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None

    def get_client_name(self, obj):
        return obj.client.name if obj.client else None

    def get_decisions(self, obj):
        decisions = obj.decisions.all()
        return DecisionSerializer(decisions, many=True).data


class DocumentVersionSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les versions de documents.
    """
    document_title = serializers.CharField(source='document.title', read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentVersion
        fields = (
            'id', 'document', 'document_title', 'version_number', 'file',
            'file_url', 'file_name', 'file_size', 'comment', 'uploaded_by',
            'uploaded_by_name', 'uploaded_at'
        )
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at')
    
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class DocumentSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Document.
    """
    case_title = serializers.SerializerMethodField()
    case_reference = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    tags_list = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name',
        source='tags'
    )
    
    versions = DocumentVersionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Document
        fields = (
            'id', 'title', 'description', 'case', 'case_title', 'case_reference', 'client_name',
            'document_type', 'file', 'file_url', 'file_name', 'file_size',
            'file_extension', 'ocr_text', 'ocr_processed', 'ocr_error',
            'uploaded_by', 'uploaded_by_name', 'is_confidential', 'tags',
            'tags_list', 'versions', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'file_name', 'file_size', 'file_extension', 'ocr_text',
            'ocr_processed', 'ocr_error', 'uploaded_by', 'created_at', 'updated_at'
        )
    
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


    def get_case_title(self, obj):
        return obj.case.title if obj.case else None

    def get_case_reference(self, obj):
        return obj.case.reference if obj.case else None

    def get_client_name(self, obj):
        return obj.case.client.name if obj.case and obj.case.client else None


class DocumentUploadSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour l'upload de documents.
    """
    class Meta:
        model = Document
        fields = ('title', 'description', 'case', 'document_type', 'file', 'is_confidential')
        extra_kwargs = {
            'description': {'required': False},
            'document_type': {'required': False},
            'is_confidential': {'required': False},
        }
    
    def validate_file(self, value):
        """
        Valide la taille et l'extension du fichier.
        """
        from django.conf import settings
        
        # Vérifier la taille
        if value.size > settings.MAX_UPLOAD_SIZE:
            max_size_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
            raise serializers.ValidationError(
                f'Le fichier est trop volumineux. Taille maximale: {max_size_mb}MB'
            )
        
        # Vérifier l'extension
        ext = value.name.split('.')[-1].lower()
        if ext not in settings.ALLOWED_UPLOAD_EXTENSIONS:
            raise serializers.ValidationError(
                f'Type de fichier non autorisé. Extensions autorisées: {", ".join(settings.ALLOWED_UPLOAD_EXTENSIONS)}'
            )
        
        return value


class DocumentPermissionSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les permissions de documents.
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)
    granted_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentPermission
        fields = (
            'id', 'document', 'document_title', 'user', 'user_name',
            'permission_level', 'granted_by', 'granted_by_name', 'granted_at'
        )
        read_only_fields = ('id', 'granted_by', 'granted_at')
    
    def get_granted_by_name(self, obj):
        return obj.granted_by.get_full_name() if obj.granted_by else None


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le journal d'audit.
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True, allow_null=True)
    case_reference = serializers.CharField(source='case.reference', read_only=True, allow_null=True)
    client_name = serializers.CharField(source='client.name', read_only=True, allow_null=True)
    
    class Meta:
        model = AuditLog
        fields = (
            'id', 'user', 'user_name', 'action', 'document', 'document_title',
            'case', 'case_reference', 'client', 'client_name', 'details',
            'ip_address', 'user_agent', 'timestamp'
        )
        read_only_fields = ('id', 'timestamp')


class TagSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les tags.
    """
    document_count = serializers.SerializerMethodField()
    case_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tag
        fields = ('id', 'name', 'color', 'description', 'document_count', 'case_count', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def get_document_count(self, obj):
        if hasattr(obj, 'document_count'):
            return obj.document_count
        return obj.documents.count()
    
    def get_case_count(self, obj):
        if hasattr(obj, 'case_count'):
            return obj.case_count
        return obj.cases.count()


class DeadlineSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les échéances.
    """
    case_reference = serializers.SerializerMethodField()
    case_title = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    completed_by_name = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Deadline
        fields = (
            'id', 'case', 'case_reference', 'case_title', 'title', 'description',
            'deadline_type', 'due_date', 'reminder_days', 'is_completed',
            'jurisdiction', 'courtroom', 'result', 'action_requested',
            'completed_at', 'completed_by', 'completed_by_name', 'created_by',
            'created_by_name', 'is_overdue', 'days_remaining', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_by', 'completed_by', 'completed_at', 'created_at', 'updated_at')
    
    def get_case_reference(self, obj):
        return obj.case.reference if obj.case else None

    def get_case_title(self, obj):
        return obj.case.title if obj.case else None

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None
    
    def get_completed_by_name(self, obj):
        return obj.completed_by.get_full_name() if obj.completed_by else None


class DocumentVersionSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour les versions de documents.
    """
    document_title = serializers.CharField(source='document.title', read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = DocumentVersion
        fields = (
            'id', 'document', 'document_title', 'version_number', 'file',
            'file_url', 'file_name', 'file_size', 'comment', 'uploaded_by',
            'uploaded_by_name', 'uploaded_at'
        )
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at')
    
    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.get_full_name() if obj.uploaded_by else None
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class NotificationSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Notification.
    """
    class Meta:
        model = Notification
        fields = (
            'id', 'user', 'level', 'title', 'message', 'is_read',
            'entity_type', 'entity_id', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class DiligenceSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Diligence.
    """
    case_reference = serializers.CharField(source='case.reference', read_only=True)
    case_title = serializers.CharField(source='case.title', read_only=True)
    case_category = serializers.CharField(source='case.category', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Diligence
        fields = (
            'id', 'title', 'is_completed', 'case', 'case_reference', 
            'case_title', 'case_category', 'created_by', 'created_by_name', 
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')


class DecisionSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Decision.
    """
    case_reference = serializers.CharField(source='case.reference', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Decision
        fields = (
            'id', 'case', 'case_reference', 'decision_type', 'date_decision',
            'juridiction', 'numero_decision', 'resultat', 'observations',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class TaskSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle Task.
    """
    assigned_to_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()
    case_reference = serializers.SerializerMethodField()
    case_title = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'assigned_to', 'assigned_to_name',
            'assigned_by', 'assigned_by_name', 'case', 'case_reference', 'case_title',
            'due_date', 'priority', 'status', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'assigned_by', 'created_at', 'updated_at')

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None

    def get_assigned_by_name(self, obj):
        return obj.assigned_by.get_full_name() if obj.assigned_by else None

    def get_case_reference(self, obj):
        return obj.case.reference if obj.case else None

    def get_case_title(self, obj):
        return obj.case.title if obj.case else None


class AgendaEventSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle AgendaEvent.
    """
    case_reference = serializers.CharField(source='case.reference', read_only=True)
    case_title = serializers.CharField(source='case.title', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AgendaEvent
        fields = (
            'id', 'title', 'event_type', 'start_datetime', 'end_datetime',
            'all_day', 'case', 'case_reference', 'case_title', 'description',
            'location', 'color', 'reminder_minutes', 'is_recurring',
            'recurrence_rule', 'year', 'is_archived',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')
        extra_kwargs = {
            'year': {'required': False},
            'is_archived': {'required': False},
        }

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None

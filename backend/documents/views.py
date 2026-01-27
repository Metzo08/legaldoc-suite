"""
Vues API pour la gestion documentaire.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import Q
from .models import Client, Case, Document, DocumentPermission, AuditLog, Tag, Deadline, DocumentVersion, Notification, Diligence, Task
from .serializers import (
    ClientSerializer, CaseListSerializer, CaseDetailSerializer,
    DocumentSerializer, DocumentUploadSerializer, DocumentPermissionSerializer,
    AuditLogSerializer, TagSerializer, DeadlineSerializer, DocumentVersionSerializer,
    NotificationSerializer, DiligenceSerializer, TaskSerializer
)
from .permissions import IsAdminOrReadOnly, CanDeleteDocuments, HasDocumentPermission
from .ocr import process_document_ocr
from .utils import log_action, send_notification
import logging

logger = logging.getLogger(__name__)


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les clients.
    """
    queryset = Client.objects.all().prefetch_related('cases')
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'company_registration']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Filtre les clients.
        """
        queryset = super().get_queryset()
        
        # Restriction client: voir uniquement son propre profil
        if hasattr(self.request.user, 'role') and self.request.user.role == 'CLIENT':
            if hasattr(self.request.user, 'client_profile'):
                queryset = queryset.filter(id=self.request.user.client_profile.id)
            else:
                return queryset.none()
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Enregistre l'utilisateur créateur et log l'action.
        """
        client = serializer.save(created_by=self.request.user)
        log_action(
            user=self.request.user,
            action='CREATE',
            client=client,
            details=f'Client créé: {client.name}',
            request=self.request
        )
    
    def perform_update(self, serializer):
        """
        Log la modification.
        """
        client = serializer.save()
        log_action(
            user=self.request.user,
            action='UPDATE',
            client=client,
            details=f'Client modifié: {client.name}',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        """
        Log la suppression.
        """
        log_action(
            user=self.request.user,
            action='DELETE',
            client=instance,
            details=f'Client supprimé: {instance.name}',
            request=self.request
        )
        instance.delete()


class CaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les dossiers.
    """
    queryset = Case.objects.select_related('client', 'created_by').prefetch_related('assigned_to', 'tags')
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference', 'title', 'description', 'client__name']
    ordering_fields = ['reference', 'opened_date', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """
        Utilise un sérialiseur différent selon l'action.
        """
        if self.action == 'retrieve':
            return CaseDetailSerializer
        return CaseListSerializer
    
    def get_queryset(self):
        """
        Filtre les dossiers selon les paramètres.
        """
        queryset = super().get_queryset()
        
        # Filtrer par client
        client_id = self.request.query_params.get('client', None)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        # Filtrer par statut
        # Filtrer par statut
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filtrer par utilisateur assigné
        assigned_to = self.request.query_params.get('assigned_to', None)
        if assigned_to:
            queryset = queryset.filter(assigned_to=assigned_to)
            
        # Restriction client: voir uniquement ses propres dossiers
        if hasattr(self.request.user, 'role') and self.request.user.role == 'CLIENT':
            if hasattr(self.request.user, 'client_profile'):
                queryset = queryset.filter(client=self.request.user.client_profile)
            else:
                return queryset.none()
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Enregistre l'utilisateur créateur et log l'action.
        """
        case = serializer.save(created_by=self.request.user)
        log_action(
            user=self.request.user,
            action='CREATE',
            case=case,
            client=case.client,
            details=f'Dossier créé: {case.reference}',
            request=self.request
        )
        
        # Notification aux utilisateurs assignés
        for user in case.assigned_to.all():
            if user != self.request.user:
                send_notification(
                    user=user,
                    title="Nouveau dossier assigné",
                    message=f"Vous avez été assigné au dossier {case.reference}: {case.title}",
                    level='SUCCESS',
                    entity_type='CASE',
                    entity_id=case.id
                )
    
    def perform_update(self, serializer):
        """
        Log la modification.
        """
        case = serializer.save()
        log_action(
            user=self.request.user,
            action='UPDATE',
            case=case,
            client=case.client,
            details=f'Dossier modifié: {case.reference}',
            request=self.request
        )
    
    def perform_destroy(self, instance):
        """
        Log la suppression.
        """
        log_action(
            user=self.request.user,
            action='DELETE',
            case=instance,
            client=instance.client,
            details=f'Dossier supprimé: {instance.reference}',
            request=self.request
        )
        instance.delete()


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les documents.
    """
    queryset = Document.objects.select_related('case', 'case__client', 'uploaded_by').prefetch_related('tags', 'permissions')
    permission_classes = [IsAuthenticated, CanDeleteDocuments, HasDocumentPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'file_name', 'ocr_text']
    ordering_fields = ['title', 'created_at', 'file_size']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """
        Utilise un sérialiseur différent selon l'action.
        """
        if self.action == 'create':
            return DocumentUploadSerializer
        return DocumentSerializer
    
    def get_queryset(self):
        """
        Filtre les documents selon les paramètres et permissions.
        """
        queryset = super().get_queryset()
        
        # Filtrer par dossier
        case_id = self.request.query_params.get('case', None)
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        
        # Filtrer par type
        doc_type = self.request.query_params.get('type', None)
        if doc_type:
            queryset = queryset.filter(document_type=doc_type)
        
        # Filtrer par client
        client_id = self.request.query_params.get('client', None)
        if client_id:
            queryset = queryset.filter(case__client_id=client_id)

        # Restriction client: voir uniquement les documents de ses dossiers
        if hasattr(self.request.user, 'role') and self.request.user.role == 'CLIENT':
            if hasattr(self.request.user, 'client_profile'):
                queryset = queryset.filter(case__client=self.request.user.client_profile)
            else:
                return queryset.none()
        
        # Pour les non-admins (collaborateurs, stagiaires, secrétaires), 
        # on peut limiter aux dossiers auxquels ils sont assignés ou documents partagés
        elif not self.request.user.is_admin and not self.request.user.is_avocat:
            queryset = queryset.filter(
                Q(case__assigned_to=self.request.user) | 
                Q(permissions__user=self.request.user) |
                Q(uploaded_by=self.request.user)
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Enregistre l'utilisateur uploader, lance l'OCR et log l'action.
        """
        # Validation client: uploader uniquement dans ses dossiers
        if hasattr(self.request.user, 'role') and self.request.user.role == 'CLIENT':
            case = serializer.validated_data.get('case')
            if not hasattr(self.request.user, 'client_profile') or case.client != self.request.user.client_profile:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Vous ne pouvez créer des documents que dans vos propres dossiers.")

        document = serializer.save(uploaded_by=self.request.user)
        
        # Lancer l'OCR en asynchrone (ou synchrone pour le MVP)
        try:
            process_document_ocr(document)
            
            # Mettre à jour le vecteur de recherche
            Document.objects.filter(pk=document.pk).update(
                search_vector=SearchVector('title', 'description', 'ocr_text', 'file_name')
            )
        except Exception as e:
            logger.error(f"Erreur OCR pour document {document.id}: {str(e)}")
        
        log_action(
            user=self.request.user,
            action='CREATE',
            document=document,
            case=document.case,
            client=document.case.client,
            details=f'Document uploadé: {document.title}',
            request=self.request
        )

        # Notification au cabinet (si uploadé par un client) ou au client (si uploadé par le cabinet)
        is_client = hasattr(self.request.user, 'role') and self.request.user.role == 'CLIENT'
        
        if is_client:
            # Notifier les avocats assignés au dossier
            for user in document.case.assigned_to.all():
                send_notification(
                    user=user,
                    title="Nouveau document client",
                    message=f"Le client {self.request.user.get_full_name()} a déposé un document: {document.title}",
                    level='INFO',
                    entity_type='DOCUMENT',
                    entity_id=document.id
                )
        else:
            # Notifier le client si le dossier lui appartient
            if document.case.client and document.case.client.user:
                send_notification(
                    user=document.case.client.user,
                    title="Nouveau document disponible",
                    message=f"Un nouveau document a été ajouté à votre dossier {document.case.reference}: {document.title}",
                    level='SUCCESS',
                    entity_type='DOCUMENT',
                    entity_id=document.id
                )

    def perform_update(self, serializer):
        """
        Log la modification et relance l'OCR si le fichier a changé.
        """
        # Vérifier si le fichier a été modifié
        file_changed = 'file' in serializer.validated_data
        
        document = serializer.save()
        
        if file_changed:
            try:
                process_document_ocr(document)
                # Mettre à jour le vecteur de recherche
                Document.objects.filter(pk=document.pk).update(
                    search_vector=SearchVector('title', 'description', 'ocr_text', 'file_name')
                )
            except Exception as e:
                logger.error(f"Erreur OCR après modification pour document {document.id}: {str(e)}")

        log_action(
            user=self.request.user,
            action='UPDATE',
            document=document,
            case=document.case,
            client=document.case.client,
            details=f'Document modifié: {document.title}',
            request=self.request
        )
    
    def retrieve(self, request, *args, **kwargs):
        """
        Log la consultation du document.
        """
        instance = self.get_object()
        log_action(
            user=request.user,
            action='VIEW',
            document=instance,
            case=instance.case,
            details=f'Document consulté: {instance.title}',
            request=request
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_destroy(self, instance):
        """
        Log la suppression.
        """
        log_action(
            user=self.request.user,
            action='DELETE',
            document=instance,
            case=instance.case,
            client=instance.case.client,
            details=f'Document supprimé: {instance.title}',
            request=self.request
        )
        instance.delete()
    
    @action(detail=True, methods=['GET'])
    def download(self, request, pk=None):
        """
        Télécharge un document et log l'action.
        """
        document = self.get_object()
        log_action(
            user=request.user,
            action='DOWNLOAD',
            document=document,
            case=document.case,
            details=f'Document téléchargé: {document.title}',
            request=request
        )
        
        from django.http import FileResponse
        import os
        from rest_framework.exceptions import NotFound
        
        try:
            file_path = document.file.path
            if not os.path.exists(file_path):
                logger.error(f"Fichier manquant sur le disque: {file_path}")
                raise NotFound("Le fichier physique est introuvable sur le serveur.")
            
            return FileResponse(document.file.open('rb'), as_attachment=True, filename=document.file_name)
        except Exception as e:
            if isinstance(e, NotFound):
                raise e
            logger.error(f"Erreur lors de l'ouverture du fichier {document.id}: {str(e)}")
            return Response({"detail": "Erreur lors de l'accès au fichier."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['GET'])
    def search(self, request):
        """
        Recherche plein-texte dans les documents.
        """
        query = request.query_params.get('q', '')
        
        if not query:
            return Response({'results': []})
        
        # Recherche PostgreSQL full-text
        search_query = SearchQuery(query, config='french')
        
        documents = Document.objects.annotate(
            rank=SearchRank('search_vector', search_query)
        ).filter(
            Q(search_vector=search_query) |
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(ocr_text__icontains=query)
        ).order_by('-rank', '-created_at')[:50]
        
        serializer = self.get_serializer(documents, many=True)
        
        return Response({
            'query': query,
            'count': len(documents),
            'results': serializer.data
        })


class DocumentPermissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les permissions de documents.
    """
    queryset = DocumentPermission.objects.all()
    serializer_class = DocumentPermissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtre les permissions par document ou utilisateur.
        """
        queryset = super().get_queryset()
        
        document_id = self.request.query_params.get('document', None)
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Enregistre qui a accordé la permission.
        """
        permission = serializer.save(granted_by=self.request.user)
        log_action(
            user=self.request.user,
            action='PERMISSION',
            document=permission.document,
            details=f'Permission {permission.permission_level} accordée à {permission.user.username}',
            request=self.request
        )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet en lecture seule pour les logs d'audit.
    """
    queryset = AuditLog.objects.select_related('user', 'document', 'case', 'client').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-timestamp']
    
    def get_queryset(self):
        """
        Filtre les logs selon les paramètres.
        Seuls les admins peuvent voir tous les logs.
        """
        queryset = super().get_queryset()
        
        # Non-admins voient seulement leurs propres logs
        if not self.request.user.is_admin:
            queryset = queryset.filter(user=self.request.user)
        
        # Filtrer par utilisateur
        user_id = self.request.query_params.get('user', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filtrer par action
        action = self.request.query_params.get('action', None)
        if action:
            queryset = queryset.filter(action=action)
        
        # Filtrer par document
        document_id = self.request.query_params.get('document', None)
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        return queryset


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les tags.
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """
        Ajoute les compteurs de documents et dossiers.
        """
        from django.db.models import Count
        return Tag.objects.annotate(
            document_count=Count('documents', distinct=True),
            case_count=Count('cases', distinct=True)
        )


class DeadlineViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les échéances.
    """
    queryset = Deadline.objects.select_related('case', 'created_by', 'completed_by').all()
    serializer_class = DeadlineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'case__reference', 'case__title']
    ordering_fields = ['due_date', 'created_at']
    ordering = ['due_date']

    def check_upcoming_deadlines(self):
        """
        Vérifie les échéances proches et envoie des notifications.
        """
        from datetime import timedelta
        from django.utils import timezone
        
        now = timezone.now()
        # On vérifie les échéances à moins de 3 jours qui n'ont pas encore été notifiées
        upcoming = Deadline.objects.filter(
            is_completed=False,
            notification_sent=False,
            due_date__lte=now + timedelta(days=3)
        )
        
        for deadline in upcoming:
            if deadline.created_by:
                send_notification(
                    user=deadline.created_by,
                    title="Échéance Imminente",
                    message=f"Rappel: l'échéance '{deadline.title}' est prévue pour le {deadline.due_date.strftime('%d/%m/%Y')}.",
                    level='WARNING',
                    entity_type='DEADLINE',
                    entity_id=deadline.id
                )
                deadline.notification_sent = True
                deadline.save(update_fields=['notification_sent'])

    def list(self, request, *args, **kwargs):
        """
        Déclenche la vérification des échéances lors du listing.
        """
        try:
            self.check_upcoming_deadlines()
        except Exception as e:
            logger.error(f"Erreur check_upcoming_deadlines: {str(e)}")
        return super().list(request, *args, **kwargs)
    
    def get_queryset(self):
        """
        Filtrage avancé des échéances.
        """
        queryset = super().get_queryset()
        
        # Filtrer par dossier
        case_id = self.request.query_params.get('case', None)
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        
        # Filtrer par statut (complété/non complété)
        is_completed = self.request.query_params.get('is_completed', None)
        if is_completed is not None:
            queryset = queryset.filter(is_completed=is_completed.lower() == 'true')
        
        # Filtrer par type
        deadline_type = self.request.query_params.get('type', None)
        if deadline_type:
            queryset = queryset.filter(deadline_type=deadline_type)
        
        # Filtrer les échéances à venir (prochains X jours)
        upcoming_days = self.request.query_params.get('upcoming_days', None)
        if upcoming_days:
            from django.utils import timezone
            from datetime import timedelta
            end_date = timezone.now() + timedelta(days=int(upcoming_days))
            queryset = queryset.filter(
                due_date__gte=timezone.now(),
                due_date__lte=end_date,
                is_completed=False
            )
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Enregistre l'utilisateur créateur.
        """
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['POST'])
    def complete(self, request, pk=None):
        """
        Marquer une échéance comme complétée.
        """
        from django.utils import timezone
        deadline = self.get_object()
        deadline.is_completed = True
        deadline.completed_at = timezone.now()
        deadline.completed_by = request.user
        deadline.save()
        
        serializer = self.get_serializer(deadline)
        return Response(serializer.data)
    
    @action(detail=True, methods=['POST'])
    def uncomplete(self, request, pk=None):
        """
        Marquer une échéance comme non complétée.
        """
        deadline = self.get_object()
        deadline.is_completed = False
        deadline.completed_at = None
        deadline.completed_by = None
        deadline.save()
        
        serializer = self.get_serializer(deadline)
        return Response(serializer.data)


class DocumentVersionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les versions de documents.
    """
    queryset = DocumentVersion.objects.select_related('document', 'uploaded_by').all()
    serializer_class = DocumentVersionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['version_number', 'uploaded_at']
    ordering = ['-version_number']
    
    def get_queryset(self):
        """
        Filtrer les versions par document.
        """
        queryset = super().get_queryset()
        
        # Filtrer par document
        document_id = self.request.query_params.get('document', None)
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Créer une nouvelle version de document.
        """
        document = serializer.validated_data['document']
        
        # Calculer le prochain numéro de version
        last_version = DocumentVersion.objects.filter(document=document).order_by('-version_number').first()
        next_version = (last_version.version_number + 1) if last_version else 1
        
        # Extraire les informations du fichier
        file = serializer.validated_data['file']
        file_name = file.name
        file_size = file.size
        
        serializer.save(
            uploaded_by=self.request.user,
            version_number=next_version,
            file_name=file_name,
            file_size=file_size
        )


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les notifications des utilisateurs.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Retourne les notifications de l'utilisateur connecté.
        """
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Marque une notification comme lue.
        """
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marquée comme lue'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Marque toutes les notifications de l'utilisateur comme lues.
        """
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'toutes les notifications marquées comme lues'})


class DiligenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les diligences (pense-bête).
    """
    serializer_class = DiligenceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['is_completed', '-created_at']

    def get_queryset(self):
        """
        Retourne seulement les diligences créées par l'utilisateur connecté.
        """
        queryset = Diligence.objects.filter(created_by=self.request.user).select_related('case')
        case_id = self.request.query_params.get('case', None)
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        return queryset

    def perform_create(self, serializer):
        """
        Assigne l'utilisateur connecté à la nouvelle diligence.
        """
        serializer.save(created_by=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les tâches.
    """
    queryset = Task.objects.select_related('assigned_to', 'assigned_by', 'case').all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ['title', 'description', 'case__title', 'case__reference']
    ordering_fields = ['due_date', 'priority', 'status', 'created_at']
    ordering = ['due_date', '-priority']

    def get_queryset(self):
        """
        Filtre les tâches visibles par l'utilisateur.
        """
        queryset = super().get_queryset()
        
        # Admin voit tout
        if self.request.user.is_admin or self.request.user.is_superuser:
            pass
        else:
            # Utilisateurs voient ce qui leur est assigné ou ce qu'ils ont créé
            queryset = queryset.filter(
                Q(assigned_to=self.request.user) |
                Q(assigned_by=self.request.user)
            )

        # Filtres
        assigned_to = self.request.query_params.get('assigned_to', None)
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)

        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)

        case_id = self.request.query_params.get('case', None)
        if case_id:
            queryset = queryset.filter(case_id=case_id)

        return queryset

    def perform_create(self, serializer):
        """
        Assigne l'utilisateur créateur et notifie l'assigné.
        """
        task = serializer.save(assigned_by=self.request.user)
        
        # Notifier l'utilisateur assigné si ce n'est pas le créateur
        if task.assigned_to and task.assigned_to != self.request.user:
            send_notification(
                user=task.assigned_to,
                title="Nouvelle tâche assignée",
                message=f"{self.request.user.get_full_name()} vous a assigné une tâche : {task.title}",
                level='INFO',
                entity_type='TASK',
                entity_id=task.id
            )

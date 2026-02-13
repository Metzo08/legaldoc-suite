"""
Vues API pour la gestion documentaire.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
import logging
import threading
from django.db import transaction
from django.db.models import Q
from .models import Client, Case, Document, DocumentPermission, AuditLog, Tag, Deadline, DocumentVersion, Notification, Diligence, Task, Decision, AgendaEvent, AgendaHistory, AgendaNotification
from .serializers import (
    ClientSerializer, CaseListSerializer, CaseDetailSerializer,
    DocumentSerializer, DocumentUploadSerializer, DocumentPermissionSerializer,
    AuditLogSerializer, TagSerializer, DeadlineSerializer, DocumentVersionSerializer,
    NotificationSerializer, DiligenceSerializer, TaskSerializer, DecisionSerializer,
    AgendaEventSerializer, ReportAgendaSerializer, AgendaHistorySerializer
)
from .permissions import IsAdminOrReadOnly, CanDeleteDocuments, HasDocumentPermission
from .ocr import process_document_ocr
from .utils import log_action, send_notification

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
        if client_id and str(client_id).isdigit():
            queryset = queryset.filter(client_id=client_id)
        
        # Filtrer par statut
        # Filtrer par statut
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filtrer par utilisateur assigné
        assigned_to = self.request.query_params.get('assigned_to', None)
        if assigned_to and str(assigned_to).isdigit():
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

    @action(detail=True, methods=['get'])
    def chat_init(self, request, pk=None):
        """
        Initialise une session de chat : fusionne les docs et upload vers Gemini.
        """
        case = self.get_object()
        documents = case.documents.all().order_by('created_at')
        
        if not documents.exists():
            return Response({"detail": "Ce dossier ne contient aucun document."}, status=status.HTTP_400_BAD_REQUEST)
        
        from .ai_service import GeminiService
        import fitz  # PyMuPDF
        import os
        import docx # python-docx
        from django.conf import settings
        
        try:
            # 1. Fusionner les documents
            merged_doc = fitz.open()
            
            for doc in documents:
                try:
                    file_path = doc.file.path
                    if hasattr(doc, 'versions'):
                        searchable = doc.versions.filter(file_name__icontains='searchable_').order_by('-version_number').first()
                        if searchable:
                            file_path = searchable.file.path
                    
                    if not os.path.exists(file_path):
                        continue
                        
                    ext = file_path.lower().split('.')[-1]
                    
                    if ext == 'pdf':
                        with fitz.open(file_path) as pdf_doc:
                            merged_doc.insert_pdf(pdf_doc)
                            
                    elif ext in ['png', 'jpg', 'jpeg']:
                        img = fitz.open(file_path)
                        pdf_bytes = img.convert_to_pdf()
                        with fitz.open("pdf", pdf_bytes) as img_pdf:
                            merged_doc.insert_pdf(img_pdf)
                            
                    elif ext == 'docx':
                        try:
                            try:
                                doc_word = docx.Document(file_path)
                            except:
                                # Fallback handling if python-docx fails to open
                                logger.warning(f"python-docx failed for {file_path}")
                                continue

                            full_text = []
                            for para in doc_word.paragraphs:
                                full_text.append(para.text)
                            text_content = '\n'.join(full_text)
                            
                            text_pdf = fitz.open()
                            
                            # Simple pagination logic
                            # 3000 chars per page approx
                            chunk_size = 3000
                            if not text_content:
                                text_content = "[Document vide]"
                                
                            remaining = text_content
                            while len(remaining) > 0:
                                page = text_pdf.new_page()
                                chunk = remaining[:chunk_size]
                                remaining = remaining[chunk_size:]
                                try:
                                    # Insert text with some basic formatting awareness
                                    page.insert_text((50, 72), chunk, fontsize=10)
                                except:
                                    pass
                                    
                            merged_doc.insert_pdf(text_pdf)
                            
                        except Exception as e:
                            logger.error(f"Erreur conversion DOCX {doc.id}: {e}")
                            
                    elif ext == 'txt':
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            text_content = f.read()
                            
                        text_pdf = fitz.open()
                        remaining = text_content
                        chunk_size = 3000
                        while len(remaining) > 0:
                            page = text_pdf.new_page()
                            chunk = remaining[:chunk_size]
                            remaining = remaining[chunk_size:]
                            page.insert_text((50, 72), chunk, fontsize=10)
                                
                        merged_doc.insert_pdf(text_pdf)
                            
                except Exception as e:
                    logger.warning(f"Impossible de fusionner le document {doc.id}: {str(e)}")
                    continue
            
            if merged_doc.page_count == 0:
                # Fallback: Créer un PDF avec un message d'erreur pour l'IA
                fallback = fitz.open()
                page = fallback.new_page()
                page.insert_text((50, 50), "Aucun document n'a pu être converti correctement.", fontsize=12)
                output_filename = f"chat_context_empty_{case.reference.replace('/', '_')}.pdf"
                output_path = os.path.join(settings.MEDIA_ROOT, 'temp', output_filename)
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                fallback.save(output_path)
                fallback.close()
                uploaded_file = GeminiService().upload_file(output_path)
                return Response({
                    "status": "warning",
                    "session_id": uploaded_file.name,
                    "message": "Documents illisibles, chat vide initié.",
                    "doc_count": 0
                })
                
            # Sauvegarder temporairement
            output_filename = f"chat_context_{case.reference.replace('/', '_')}.pdf"
            output_path = os.path.join(settings.MEDIA_ROOT, 'temp', output_filename)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            merged_doc.save(output_path)
            merged_doc.close()
            
            # 2. Upload vers Gemini
            service = GeminiService()
            uploaded_file = service.upload_file(output_path)
            
            return Response({
                "status": "success",
                "session_id": uploaded_file.name, 
                "message": "Dossier analysé et prêt pour le chat.",
                "doc_count": documents.count()
            })
            
        except Exception as e:
            logger.error(f"Erreur init chat {case.id}: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def chat_message(self, request, pk=None):
        """
        Envoie un message au chatbot Gemini.
        Body: { session_id, message, history }
        """
        try:
            session_id = request.data.get('session_id')
            message = request.data.get('message')
            history = request.data.get('history', [])
            
            if not session_id or not message:
                return Response({"detail": "session_id et message requis"}, status=status.HTTP_400_BAD_REQUEST)
                
            from .ai_service import GeminiService
            service = GeminiService()
            
            response_text = service.chat_with_document(session_id, history, message)
            
            return Response({
                "response": response_text
            })
            
        except Exception as e:
            logger.error(f"Erreur chat message: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les documents.
    """
    queryset = Document.objects.select_related('case', 'case__client', 'uploaded_by').prefetch_related('tags', 'permissions', 'versions')
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
        if case_id and str(case_id).isdigit():
            queryset = queryset.filter(case_id=case_id)
        
        # Filtrer par type
        doc_type = self.request.query_params.get('type', None)
        if doc_type:
            queryset = queryset.filter(document_type=doc_type)
        
        # Filtrer par client
        client_id = self.request.query_params.get('client', None)
        if client_id and str(client_id).isdigit():
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
        
        # Fonction interne pour le traitement OCR en tâche de fond
        def run_ocr_background(doc_id):
            try:
                # Recharger le document dans ce thread
                from .models import Document
                from django.contrib.postgres.search import SearchVector
                doc = Document.objects.get(pk=doc_id)
                
                process_document_ocr(doc)
                
                # Mettre à jour le vecteur de recherche
                Document.objects.filter(pk=doc_id).update(
                    search_vector=SearchVector('title', 'description', 'ocr_text', 'file_name')
                )
                logger.info(f"OCR et indexation terminés pour document {doc_id}")
            except Exception as e:
                logger.error(f"Erreur OCR Task Arrière-plan pour document {doc_id}: {str(e)}")

        # Lancer l'OCR en thread séparé pour ne pas bloquer la réponse HTTP
        # Utile si Celery n'est pas encore configuré/utilisé pour toutes les tâches
        try:
            thread = threading.Thread(target=run_ocr_background, args=(document.id,))
            thread.daemon = True # Ne bloque pas l'arrêt du serveur
            thread.start()
            logger.info(f"Tâche OCR lancée en arrière-plan pour document {document.id}")
        except Exception as e:
            logger.error(f"Impossible de lancer le thread OCR pour {document.id}: {str(e)}")
        
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
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='reprocess-ocr')
    def reprocess_ocr(self, request, pk=None):
        """
        Relance manuellement le processus OCR pour un document.
        """
        document = self.get_object()
        try:
            from .ocr import process_document_ocr
            process_document_ocr(document)
            
            # Mettre à jour le vecteur de recherche
            from django.contrib.postgres.search import SearchVector
            Document.objects.filter(pk=document.pk).update(
                search_vector=SearchVector('title', 'description', 'ocr_text', 'file_name')
            )
            
            # Utiliser le sérialiseur pour retourner les données complètes (y compris les versions)
            document.refresh_from_db()
            serializer = self.get_serializer(document)
            
            return Response({
                'status': 'success',
                'message': 'OCR relancé avec succès',
                **serializer.data
            })
        except Exception as e:
            logger.error(f"Erreur reprocess_ocr: {str(e)}")
            return Response({
                'status': 'error',
                'message': f'Erreur lors du retraitement: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        if case_id and str(case_id).isdigit():
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
        if case_id and str(case_id).isdigit():
            queryset = queryset.filter(case_id=case_id)
        return queryset

    def perform_create(self, serializer):
        """
        Assigne l'utilisateur connecté à la nouvelle diligence.
        """
        serializer.save(created_by=self.request.user)


class DecisionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les décisions liées aux dossiers.
    """
    serializer_class = DecisionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['decision_type', 'date_decision']

    def get_queryset(self):
        """
        Filtre les décisions par dossier si le paramètre 'case' est fourni.
        """
        queryset = Decision.objects.select_related('case', 'created_by').all()
        case_id = self.request.query_params.get('case', None)
        if case_id and str(case_id).isdigit():
            queryset = queryset.filter(case_id=case_id)
        return queryset

    def perform_create(self, serializer):
        """
        Assigne l'utilisateur créateur.
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
        if assigned_to and str(assigned_to).isdigit():
            queryset = queryset.filter(assigned_to_id=assigned_to)

        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)

        case_id = self.request.query_params.get('case', None)
        if case_id and str(case_id).isdigit():
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


class AgendaViewSet(viewsets.ModelViewSet):
    """
    CRUD complet pour l'agenda juridique.
    Gère les audiences, reports, historique et filtres avancés.
    """
    serializer_class = AgendaEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AgendaEvent.objects.select_related('case', 'created_by', 'reporte_de').all()
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        case_id = self.request.query_params.get('case')
        event_type = self.request.query_params.get('event_type')
        type_chambre = self.request.query_params.get('type_chambre')
        statut = self.request.query_params.get('statut')
        dossier = self.request.query_params.get('dossier')
        search = self.request.query_params.get('search')

        if year:
            qs = qs.filter(year=int(year))
        if month and year:
            qs = qs.filter(date_audience__month=int(month))
        if case_id:
            qs = qs.filter(case_id=case_id)
        if event_type:
            qs = qs.filter(event_type=event_type)
        if type_chambre:
            qs = qs.filter(type_chambre=type_chambre)
        if statut:
            qs = qs.filter(statut=statut)
        if dossier:
            qs = qs.filter(
                Q(dossier_numero__icontains=dossier) |
                Q(dossier_nom__icontains=dossier)
            )
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(dossier_numero__icontains=search) |
                Q(dossier_nom__icontains=search) |
                Q(notes__icontains=search) |
                Q(location__icontains=search)
            )
        return qs

    def _serialize_entry(self, entry):
        """Transforme une entrée en dict pour l'historique."""
        return {
            'title': entry.title,
            'type_chambre': entry.type_chambre,
            'dossier_numero': entry.dossier_numero,
            'dossier_nom': entry.dossier_nom,
            'date_audience': str(entry.date_audience),
            'heure_audience': str(entry.heure_audience),
            'statut': entry.statut,
            'notes': entry.notes,
            'location': entry.location,
        }

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        # Log dans l'historique
        AgendaHistory.objects.create(
            agenda_entry=instance,
            type_action='CREATION',
            nouvelle_valeur=self._serialize_entry(instance),
            utilisateur=self.request.user,
            commentaire=f"Audience créée : {instance.dossier_numero or instance.title}"
        )

    def perform_update(self, serializer):
        old_data = self._serialize_entry(serializer.instance)
        instance = serializer.save()
        new_data = self._serialize_entry(instance)
        AgendaHistory.objects.create(
            agenda_entry=instance,
            type_action='MODIFICATION',
            ancienne_valeur=old_data,
            nouvelle_valeur=new_data,
            utilisateur=self.request.user,
            commentaire=f"Audience modifiée : {instance.dossier_numero or instance.title}"
        )

    def perform_destroy(self, instance):
        AgendaHistory.objects.create(
            agenda_entry=instance,
            type_action='SUPPRESSION',
            ancienne_valeur=self._serialize_entry(instance),
            utilisateur=self.request.user,
            commentaire=f"Audience supprimée : {instance.dossier_numero or instance.title}"
        )
        instance.delete()

    @action(detail=True, methods=['post'])
    def reporter(self, request, pk=None):
        """
        Reporte une audience à une nouvelle date.
        Crée automatiquement une nouvelle entrée et met à jour le statut de l'originale.
        """
        entry = self.get_object()
        serializer = ReportAgendaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        nouvelle_date = serializer.validated_data['nouvelle_date']
        nouvelle_heure = serializer.validated_data['nouvelle_heure']
        motif = serializer.validated_data.get('motif', '')
        new_chambre = serializer.validated_data.get('type_chambre', '') or entry.type_chambre
        new_notes = serializer.validated_data.get('notes', '')

        # 1. Marquer l'originale comme reportée
        old_data = self._serialize_entry(entry)
        entry.statut = 'REPORTE'
        entry.motif_report = motif
        entry.save()

        # 2. Créer la nouvelle entrée
        new_entry = AgendaEvent(
            title=entry.title,
            event_type=entry.event_type,
            type_chambre=new_chambre,
            type_chambre_autre=entry.type_chambre_autre,
            dossier_numero=entry.dossier_numero,
            dossier_nom=entry.dossier_nom,
            date_audience=nouvelle_date,
            heure_audience=nouvelle_heure,
            statut='PREVU',
            reporte_de=entry,
            notes=new_notes,
            case=entry.case,
            location=entry.location,
            color=entry.color,
            created_by=request.user,
        )
        new_entry.save()

        # 3. Log dans l'historique
        AgendaHistory.objects.create(
            agenda_entry=entry,
            type_action='REPORT',
            ancienne_valeur=old_data,
            nouvelle_valeur={
                'nouvelle_date': str(nouvelle_date),
                'nouvelle_heure': str(nouvelle_heure),
                'new_entry_id': new_entry.id,
            },
            utilisateur=request.user,
            commentaire=f"Report vers le {nouvelle_date.strftime('%d/%m/%Y')} à {nouvelle_heure.strftime('%H:%M')}. Motif : {motif}"
        )

        return Response(
            AgendaEventSerializer(new_entry).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def terminer(self, request, pk=None):
        """Marque une audience comme terminée."""
        entry = self.get_object()
        old_data = self._serialize_entry(entry)
        entry.statut = 'TERMINE'
        entry.save()
        AgendaHistory.objects.create(
            agenda_entry=entry,
            type_action='TERMINATION',
            ancienne_valeur=old_data,
            nouvelle_valeur=self._serialize_entry(entry),
            utilisateur=request.user,
            commentaire="Audience marquée comme terminée"
        )
        return Response(AgendaEventSerializer(entry).data)

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        """Annule une audience."""
        entry = self.get_object()
        old_data = self._serialize_entry(entry)
        entry.statut = 'ANNULE'
        entry.save()
        AgendaHistory.objects.create(
            agenda_entry=entry,
            type_action='ANNULATION',
            ancienne_valeur=old_data,
            nouvelle_valeur=self._serialize_entry(entry),
            utilisateur=request.user,
            commentaire=request.data.get('motif', 'Audience annulée')
        )
        return Response(AgendaEventSerializer(entry).data)

    @action(detail=False, methods=['get'])
    def historique_dossier(self, request):
        """
        Retourne l'historique complet d'un dossier par numéro.
        Inclut toutes les audiences et leurs reports.
        """
        dossier_numero = request.query_params.get('dossier_numero')
        if not dossier_numero:
            return Response(
                {'error': 'Le paramètre dossier_numero est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Toutes les entrées pour ce dossier
        entries = AgendaEvent.objects.filter(
            dossier_numero=dossier_numero
        ).select_related('case', 'created_by', 'reporte_de').order_by('date_audience')
        # Historique des modifications
        history = AgendaHistory.objects.filter(
            agenda_entry__dossier_numero=dossier_numero
        ).select_related('utilisateur').order_by('-date_action')

        return Response({
            'dossier_numero': dossier_numero,
            'entries': AgendaEventSerializer(entries, many=True).data,
            'history': AgendaHistorySerializer(history, many=True).data,
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Statistiques de l'agenda pour le dashboard."""
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        qs = self.get_queryset()

        total = qs.count()
        par_statut = {}
        for s in ['PREVU', 'REPORTE', 'TERMINE', 'ANNULE']:
            par_statut[s] = qs.filter(statut=s).count()
        par_chambre = {}
        for entry in qs.values('type_chambre').distinct():
            chambre = entry['type_chambre']
            par_chambre[chambre] = qs.filter(type_chambre=chambre).count()

        return Response({
            'total': total,
            'par_statut': par_statut,
            'par_chambre': par_chambre,
        })

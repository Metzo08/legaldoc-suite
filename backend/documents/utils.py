"""
Utilitaires pour créer des entrées dans le journal d'audit.
"""
from .models import AuditLog


def log_action(user, action, document=None, case=None, client=None, details='', request=None):
    """
    Crée une entrée dans le journal d'audit.
    
    Args:
        user: L'utilisateur qui effectue l'action
        action: Type d'action (voir AuditLog.ActionType)
        document: Document concerné (optionnel)
        case: Dossier concerné (optionnel)
        client: Client concerné (optionnel)
        details: Détails supplémentaires
        request: Objet HttpRequest pour extraire IP et user agent
    """
    ip_address = None
    user_agent = ''
    
    if request:
        # Extraire l'adresse IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        
        # Extraire le user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
    
    AuditLog.objects.create(
        user=user,
        action=action,
        document=document,
        case=case,
        client=client,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )


def send_notification(user, title, message, level='INFO', entity_type='SYSTEM', entity_id=None):
    """
    Crée une notification pour un utilisateur.
    
    Args:
        user: Destinataire (User instance)
        title: Titre de la notification
        message: Corps du message
        level: Niveau (INFO, SUCCESS, WARNING, ERROR)
        entity_type: Type d'entité liée (CASE, DOCUMENT, DEADLINE, SYSTEM)
        entity_id: ID de l'entité liée
    """
    from .models import Notification
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        level=level,
        entity_type=entity_type,
        entity_id=entity_id
    )

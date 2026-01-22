from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from django.conf import settings
from .models import User

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_status(request):
    """
    Endpoint public pour vérifier la santé du backend et l'état de l'utilisateur Metzo08.
    """
    db_ok = False
    db_error = None
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception as e:
        db_error = str(e)

    metzo = User.objects.filter(username='Metzo08').first()
    metzo_status = {
        'exists': metzo is not None,
        'is_active': metzo.is_active if metzo else None,
        'is_active_user': metzo.is_active_user if metzo else None,
        'has_usable_password': metzo.has_usable_password() if metzo else None,
    }

    return Response({
        'status': 'ok' if db_ok else 'error',
        'database': 'ok' if db_ok else f'error: {db_error}',
        'user_metzo08': metzo_status,
        'host_requested': request.get_host(), # Ce que Django voit
        'environment': {
            'DEBUG': settings.DEBUG,
            'ALLOWED_HOSTS': settings.ALLOWED_HOSTS,
            'CSRF_TRUSTED_ORIGINS': settings.CSRF_TRUSTED_ORIGINS,
            'CORS_ALLOWED_ORIGINS': settings.CORS_ALLOWED_ORIGINS,
        }
    })

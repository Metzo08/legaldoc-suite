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
    Endpoint minimal de santé du backend.
    Les détails techniques et d'environnement sont strictement masqués hors mode DEBUG.
    """
    db_ok = False
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        db_ok = False

    if not settings.DEBUG:
        return Response({'status': 'ok' if db_ok else 'error'}, status=200 if db_ok else 503)

    metzo = User.objects.filter(username='Metzo08').first()
    return Response({
        'status': 'ok' if db_ok else 'error',
        'database': 'ok' if db_ok else 'error',
        'user_metzo08': {
            'exists': metzo is not None,
            'is_active': metzo.is_active if metzo else None,
        },
        'host_requested': request.get_host(),
    })

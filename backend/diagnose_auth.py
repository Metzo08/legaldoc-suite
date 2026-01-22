import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

from users.models import User
from django.conf import settings

def diagnose():
    print("--- DIAGNOSTIQUE AUTHENTIFICATION ---")
    
    # 1. Check User
    username = 'Metzo08'
    password = 'Ddelta0807'
    u = User.objects.filter(username=username).first()
    
    if u:
        print(f"✅ Utilisateur '{username}' trouvé.")
        print(f"   - Actif (is_active): {u.is_active}")
        print(f"   - Actif User (is_active_user): {u.is_active_user}")
        print(f"   - Is Staff: {u.is_staff}")
        print(f"   - Role: {u.role}")
        print(f"   - Password Check: {'✅ OK' if u.check_password(password) else '❌ FAIL'}")
        print(f"   - 2FA Enabled: {u.two_factor_enabled}")
    else:
        print(f"❌ Utilisateur '{username}' NON TROUVÉ dans la base de données.")
        users = [user.username for user in User.objects.all()]
        print(f"   utilisateurs existants: {users}")

    # 2. Check Settings
    print("\n--- RÉGLAGES RÉSEAU ---")
    print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"CORS_ALLOWED_ORIGINS: {getattr(settings, 'CORS_ALLOWED_ORIGINS', 'NON DÉFINI')}")
    print(f"CSRF_TRUSTED_ORIGINS: {getattr(settings, 'CSRF_TRUSTED_ORIGINS', 'NON DÉFINI')}")
    print(f"DEBUG: {settings.DEBUG}")

if __name__ == "__main__":
    diagnose()

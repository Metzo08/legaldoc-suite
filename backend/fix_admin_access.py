import os
import django
from django.contrib.auth import get_user_model

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

User = get_user_model()

def fix_admin_user():
    username = 'Metzo08'
    password = 'Ddelta0807'
    email = 'contact@cabinetmaitreibrahimambengue.cloud'
    
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'role': 'ADMIN',
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
            'first_name': 'Maitre Ibrahima',
            'last_name': 'MBENGUE'
        }
    )
    
    user.set_password(password)
    user.role = 'ADMIN'
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    # Désactiver la 2FA par défaut pour permettre la reconnexion
    user.two_factor_enabled = False
    user.two_factor_secret = None
    user.save()
    
    if created:
        print(f"L'utilisateur {username} a été CRÉÉ avec succès.")
    else:
        print(f"L'utilisateur {username} existe déjà. Le mot de passe et le rôle ADMIN ont été RÉINITIALISÉS.")

if __name__ == "__main__":
    fix_admin_user()

import os
import django
from django.contrib.auth import get_user_model

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

User = get_user_model()

def fix_admin_users():
    users_to_fix = [
        {'username': 'Metzo08', 'password': 'Ddelta0807', 'email': 'contact@cabinetmaitreibrahimambengue.cloud'},
        {'username': 'Metzo09', 'password': 'Ddelta0807', 'email': 'contact@cabinetmaitreibrahimambengue.cloud'}
    ]
    
    for user_info in users_to_fix:
        user, created = User.objects.get_or_create(
            username=user_info['username'],
            defaults={
                'email': user_info['email'],
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        
        user.set_password(user_info['password'])
        user.role = 'ADMIN'
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()
        
        status = "CRÉÉ" if created else "MIS À JOUR"
        print(f"L'utilisateur {user_info['username']} a été {status} avec le rôle ADMIN.")

if __name__ == "__main__":
    fix_admin_users()

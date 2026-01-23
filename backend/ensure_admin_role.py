import os
import django

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

from users.models import User

def ensure_admin_role():
    print("Vérification des rôles des super-utilisateurs...")
    superusers = User.objects.filter(is_superuser=True)
    
    count = 0
    for user in superusers:
        if user.role != User.Role.ADMIN:
            print(f"Mise à jour du rôle pour : {user.username} -> {User.Role.ADMIN}")
            user.role = User.Role.ADMIN
            user.save()
            count += 1
            
    print(f"Terminé. {count} utilisateur(s) mis à jour.")

if __name__ == "__main__":
    ensure_admin_role()

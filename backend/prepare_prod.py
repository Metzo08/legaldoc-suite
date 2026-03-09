import os
import sys
import django

# Add the backend directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model

def setup_production():
    print("\n" + "="*50)
    print("  PREPARATION POUR LA PRODUCTION")
    print("="*50 + "\n")
    
    # 1. Supprimer toutes les données
    print("Étape 1: Suppression de toutes les données (flush)...")
    print("Cela va effacer toutes les données de la base de données (dossiers, documents, utilisateurs).")
    confirmation = input("Êtes-vous sûr de vouloir continuer ? (OUI/non) : ")
    
    if confirmation.strip().upper() != 'OUI':
        print("Annulation de la préparation de production.")
        return

    call_command('flush', interactive=False)
    print("✅ Base de données vidée.")
    
    # 2. Créer l'administrateur
    print("\nÉtape 2: Création de l'administrateur...")
    
    User = get_user_model()
    
    print("Veuillez définir les identifiants du compte administrateur :")
    username = input("Identifiant (ex: admin) : ")
    while not username:
        username = input("Un identifiant est requis : ")
        
    password = input("Mot de passe (ex: PassAdminSecurise_2024!) : ")
    while not password or len(password) < 8:
        password = input("Veuillez entrer un mot de passe d'au moins 8 caractères : ")
        
    try:
        # Création du superuser
        admin_user = User.objects.create_superuser(
            username=username, 
            email='admin@legaldoc.com', 
            password=password
        )
        admin_user.first_name = "Administrateur"
        admin_user.last_name = "Système"
        
        # S'assurer qu'il a le rôle ADMIN si le modèle le permet
        if hasattr(admin_user, 'role'):
            admin_user.role = 'ADMIN'
            
        admin_user.save()
        print(f"✅ Administrateur '{username}' créé avec succès.")
        
        # 3. Restaurer les permissions de base (ex: RolePermission) qui ont pu être vidées par le flush
        print("\nÉtape 3: Restauration des configurations par défaut...")
        try:
            from users.models import RolePermission
            if not RolePermission.objects.filter(role='ADMIN').exists():
                RolePermission.objects.create(
                    role='ADMIN',
                    permissions={'admin_access': True}  # Adapter selon les clés requises par le frontend
                )
                print("✅ Permissions de l'administrateur configurées.")
        except ImportError:
            pass
            
        print("\n" + "="*50)
        print("  ✅ LA PLATEFORME EST PRÊTE POUR LA PRODUCTION !")
        print("="*50)
        print("\nUtilisez vos nouveaux identifiants pour vous connecter.")
        print("Lancez le script start.ps1 ou deploy_remote.ps1 pour commencer.")

    except Exception as e:
        print(f"\n❌ Erreur lors de la création de l'administrateur : {str(e)}")


if __name__ == '__main__':
    setup_production()

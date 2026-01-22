"""
Script pour créer des données de démonstration pour LegalDoc Suite
"""
from django.utils import timezone
from django.core.files.base import ContentFile
from datetime import timedelta, date
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

from users.models import User
from documents.models import Client, Case, Document, AuditLog, Tag
from cabinet.models import Cabinet, TeamMember

# S'assurer que les utilisateurs administratifs existent
def create_admin_users():
    users = [
        {'username': 'admin', 'password': 'adminpassword', 'email': 'admin@legaldoc.local'},
        {'username': 'Metzo08', 'password': 'Ddelta0807', 'email': 'contact@cabinetmaitreibrahimambengue.cloud'}
    ]
    for user_data in users:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )
        if created or user.username == 'Metzo08':
            user.set_password(user_data['password'])
            user.save()
    return User.objects.get(username='Metzo08')

admin = create_admin_users()

# Helper pour obtenir ou créer sans planter sur MultipleObjectsReturned
def get_first_or_create(model, defaults=None, **kwargs):
    obj = model.objects.filter(**kwargs).first()
    if obj:
        return obj, False
    return model.objects.create(**{**kwargs, **(defaults or {})}), True

# 1. Créer des clients
print("Création des clients...")

client1, _ = get_first_or_create(
    Client,
    name="Jean Dupont",
    defaults={
        "email": "jean.dupont@email.com",
        "phone": "01 23 45 67 89",
        "address": "15 rue de la République, 75001 Paris",
        "client_type": "PARTICULIER",
        "notes": "Client régulier depuis 2020",
        "created_by": admin
    }
)

client2, _ = get_first_or_create(
    Client,
    name="TechCorp SARL",
    defaults={
        "email": "contact@techcorp.fr",
        "phone": "01 98 76 54 32",
        "address": "42 avenue des Champs-Élysées, 75008 Paris",
        "client_type": "ENTREPRISE",
        "company_registration": "123 456 789 00012",
        "notes": "Société spécialisée dans le développement logiciel",
        "created_by": admin
    }
)

client3, _ = get_first_or_create(
    Client,
    name="Association Les Amis du Droit",
    defaults={
        "email": "contact@amisdudroit.org",
        "phone": "01 11 22 33 44",
        "address": "8 boulevard Saint-Germain, 75005 Paris",
        "client_type": "ASSOCIATION",
        "notes": "Association à but non lucratif",
        "created_by": admin
    }
)

client4, _ = get_first_or_create(
    Client,
    name="Marie Martin",
    defaults={
        "email": "marie.martin@email.com",
        "phone": "06 12 34 56 78",
        "address": "23 rue Victor Hugo, 69002 Lyon",
        "client_type": "PARTICULIER",
        "notes": "Nouveau client - divorce",
        "created_by": admin
    }
)

print(f"✓ {Client.objects.count()} clients au total")

# 2. Créer des dossiers
print("Création des dossiers...")

case1, _ = get_first_or_create(
    Case,
    title="Litige commercial - Contrat de prestation",
    defaults={
        "client": client2,
        "description": "Litige concernant un contrat de prestation de services non respecté",
        "status": "EN_COURS",
        "opened_date": date.today() - timedelta(days=45),
        "category": "CIVIL",
        "created_by": admin
    }
)
case1.assigned_to.add(admin)

case2, _ = get_first_or_create(
    Case,
    title="Divorce - Séparation de biens",
    defaults={
        "client": client4,
        "description": "Procédure de divorce avec séparation de biens",
        "status": "OUVERT",
        "opened_date": date.today() - timedelta(days=15),
        "category": "CIVIL",
        "created_by": admin
    }
)
case2.assigned_to.add(admin)

case_sub1, _ = get_first_or_create(
    Case,
    title="Sous-dossier Civil Accord",
    defaults={
        "client": client4,
        "parent_case": case2,
        "description": "Détails supplémentaires sur l'accord amiable",
        "status": "EN_COURS",
        "opened_date": date.today() - timedelta(days=5),
        "category": "CIVIL",
        "created_by": admin
    }
)

case3, _ = get_first_or_create(
    Case,
    title="Succession - Testament contesté",
    defaults={
        "client": client1,
        "description": "Contestation d'un testament par les héritiers",
        "status": "EN_COURS",
        "opened_date": date.today() - timedelta(days=90),
        "category": "CIVIL",
        "created_by": admin
    }
)
case3.assigned_to.add(admin)

case4, _ = get_first_or_create(
    Case,
    title="Abus de confiance - Plainte",
    defaults={
        "client": client3,
        "description": "Plainte au pénal pour abus de confiance",
        "status": "EN_COURS",
        "opened_date": date.today() - timedelta(days=120),
        "category": "CORRECTIONNEL",
        "created_by": admin
    }
)
case4.assigned_to.add(admin)

case_sub4, _ = get_first_or_create(
    Case,
    title="Citation directe",
    defaults={
        "client": client3,
        "parent_case": case4,
        "description": "Citation directe devant le tribunal",
        "status": "EN_COURS",
        "opened_date": date.today() - timedelta(days=2),
        "category": "CORRECTIONNEL",
        "created_by": admin
    }
)

print(f"✓ {Case.objects.count()} dossiers au total")

# 3. Créer des utilisateurs supplémentaires
print("Création des utilisateurs...")

def create_user_if_not_exists(username, email, password, first_name, last_name, role, phone, department):
    if not User.objects.filter(username=username).exists():
        return User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone=phone,
            department=department
        )
    return User.objects.get(username=username)

avocat1 = create_user_if_not_exists("sophie.bernard", "sophie.bernard@legaldoc.com", "Avocat123!", "Sophie", "Bernard", "AVOCAT", "01 23 45 67 90", "Droit des affaires")
avocat2 = create_user_if_not_exists("pierre.dubois", "pierre.dubois@legaldoc.com", "Avocat123!", "Pierre", "Dubois", "AVOCAT", "01 23 45 67 91", "Droit de la famille")
collaborateur = create_user_if_not_exists("julie.petit", "julie.petit@legaldoc.com", "Collab123!", "Julie", "Petit", "COLLABORATEUR", "01 23 45 67 92", "Support juridique")
secretaire = create_user_if_not_exists("marc.roux", "marc.roux@legaldoc.com", "Secret123!", "Marc", "Roux", "SECRETAIRE", "01 23 45 67 93", "Secrétariat")
stagiaire = create_user_if_not_exists("lea.moreau", "lea.moreau@legaldoc.com", "Stage123!", "Léa", "Moreau", "STAGIAIRE", "01 23 45 67 94", "Stage - Droit pénal")

print(f"✓ {User.objects.count()} utilisateurs au total")

# 4. Créer des entrées d'audit
print("Création des entrées d'audit...")

if not AuditLog.objects.filter(details="Création du client Jean Dupont").exists():
    AuditLog.objects.create(
        user=admin,
        action="CREATE",
        client=client1,
        details="Création du client Jean Dupont",
        ip_address="192.168.1.100"
    )

if not AuditLog.objects.filter(details="Création du dossier DOS-2024-001").exists():
    AuditLog.objects.create(
        user=admin,
        action="CREATE",
        case=case1,
        details="Création du dossier DOS-2024-001",
        ip_address="192.168.1.100"
    )

print(f"✓ {AuditLog.objects.count()} entrées d'audit au total")

# 5. Créer des tags
print("Création des tags...")
tag_urgent, _ = Tag.objects.get_or_create(name="Urgent", defaults={"color": "#f44336"})
tag_important, _ = Tag.objects.get_or_create(name="Important", defaults={"color": "#ff9800"})
tag_prive, _ = Tag.objects.get_or_create(name="Privé", defaults={"color": "#9c27b0"})
tag_travail, _ = Tag.objects.get_or_create(name="Travail", defaults={"color": "#2196f3"})

# 6. Créer des documents
print("Création des documents...")

docs_data = [
    {
        "title": "Contrat de prestation TechCorp",
        "case": case1,
        "type": "CONTRAT",
        "content": "Contenu du contrat de prestation de services...",
        "tags": [tag_important, tag_travail]
    },
    {
        "title": "Courrier de mise en demeure",
        "case": case1,
        "type": "COURRIER",
        "content": "Lettre recommandée avec accusé de réception...",
        "tags": [tag_urgent]
    },
    {
        "title": "Acte de mariage",
        "case": case2,
        "type": "PIECE",
        "content": "Extrait d'acte de mariage n°12345...",
        "tags": [tag_prive]
    },
    {
        "title": "Jugement de divorce",
        "case": case2,
        "type": "JUGEMENT",
        "content": "Par ces motifs, le tribunal prononce le divorce...",
        "tags": [tag_important]
    },
    {
        "title": "Testament olographe",
        "case": case3,
        "type": "PIECE",
        "content": "Ceci est mon testament rédigé de ma main...",
        "tags": [tag_important, tag_prive]
    },
    {
        "title": "Notes d'entretien",
        "case": case4,
        "type": "NOTE",
        "content": "Notes prises lors de l'entretien du 10 décembre...",
        "tags": [tag_travail]
    }
]

for d in docs_data:
    # On vérifie si le document existe déjà (par titre et dossier)
    doc = Document.objects.filter(title=d["title"], case=d["case"]).first()
    
    if not doc:
        # On crée l'instance sans sauvegarder immédiatement pour éviter le NotNullViolation sur file_size
        doc = Document(
            title=d["title"],
            case=d["case"],
            document_type=d["type"],
            description=f"Description pour {d['title']}",
            uploaded_by=admin,
            is_confidential=False,
            ocr_processed=True,
            ocr_text=d["content"]
        )
        
        # Simuler un fichier - CONTENT_FILE remplit automatiquement le champ file et permet le calcul de file_size au save()
        content = d["content"].encode('utf-8')
        doc.file.save(f"{d['title'].replace(' ', '_')}.txt", ContentFile(content), save=False)
        
        # Maintenant que le fichier est attaché, Django pourra calculer file_size lors du premier save()
        doc.save()
        
        if "tags" in d:
            doc.tags.set(d["tags"])
        print(f"  + Document créé: {d['title']}")
    else:
        print(f"  ~ Document déjà existant: {d['title']}")

print(f"✓ {Document.objects.count()} documents au total")

# 7. Créer les informations du Cabinet
print("Configuration du cabinet...")
cab = Cabinet.load()
cab.name = "CABINET DE MAITRE IBRAHIMA MBENGUE"
cab.description = "L'excellence juridique au cœur de Dakar. Un cabinet de référence alliant rigueur, dévouement et expertise stratégique pour la défense de vos intérêts et l'accompagnement de vos ambitions."
cab.address = "35 bis, Avenue Malick SY\nDakar - Sénégal\nB.P: 14887 Dakar Peytavin"
cab.phone = "(+221) 33 821 97 97"
cab.fax = "(00221) 33-821-97-97"
cab.cel = "(00221) 77.633.88.81"
cab.email = "maitreimbengue@gmail.com"
cab.opening_hours = "Lundi - Vendredi : 09h00 - 17h00\nRéception des clients : Lundi - Jeudi : 15h00 - 17h00"
cab.save()

# 8. Créer les membres de l'équipe
print("Création de l'équipe...")
TeamMember.objects.all().delete()

team_data = [
    {
        "name": "Maître Ibrahima MBENGUE",
        "role": "Avocat à la cour",
        "biography": "Avocat à la Cour, avec 35 ans d’expérience.\nBarreau du Sénégal.\nConseil inscrit à la Cour pénale internationale (CPI).\nConseil inscrit à la Cour africaine des droits de l’homme et des peuples (CADHP).\nSpécialisé en droit pénal, social et civil.",
        "photo": "cabinet/team/ibrahima_mbengue.jpg",
        "email": "maitreimbengue@gmail.com",
        "order": 1
    },
    {
        "name": "Me Khady SENE",
        "role": "Avocate collaboratrice",
        "biography": "Diplômée en droit économique et des affaires. Avocat à la cour et membre de l'association des jeunes avocats du Sénégal. Membre de l'association des avocates du Sénégal, experte en contentieux pénal et des affaires.",
        "photo": "cabinet/team/khady_sene.jpg",
        "email": "ksene94042@gmail.com",
        "linkedin_url": "https://www.linkedin.com/in/maitre-khady-sene-1361b514a/",
        "order": 2
    },
    {
        "name": "M. Augustin François NDAO",
        "role": "Juriste Interne / Collaborateur",
        "biography": "Juriste interne spécialisé en droit des Affaires. Certifié informatique et internet par FORCE-N Sénégal",
        "photo": "cabinet/team/augustin_ndao.jpg",
        "email": "francoisndao@gmail.com",
        "linkedin_url": "https://www.linkedin.com/in/augustin-f-ndao/",
        "order": 3
    },
    {
        "name": "M. Médoune MBENGUE",
        "role": "Clerc principal et secrétaire général",
        "biography": "M. Médoune Mbengue apporte une expertise solide au cabinet, fort de 15 ans d'expérience en tant que clerc principal. Il assure également, avec rigueur et dévouement, les fonctions stratégiques de secrétaire général.",
        "photo": "cabinet/team/medoune_mbengue_v2.png",
        "email": "medounembengue111@icloud.com",
        "order": 4
    }
]

for m in team_data:
    TeamMember.objects.create(**m)

print(f"✓ {TeamMember.objects.count()} membres de l'équipe créés")

print("\n" + "="*50)
print("DONNÉES DE DÉMONSTRATION CRÉÉES AVEC SUCCÈS!")
print("="*50)
print(f"\nRésumé:")
print(f"  - Clients: {Client.objects.count()}")
print(f"  - Dossiers: {Case.objects.count()}")
print(f"  - Utilisateurs: {User.objects.count()}")
print(f"  - Entrées d'audit: {AuditLog.objects.count()}")
print("\nUtilisateurs créés:")
print("  1. admin / Admin123! (Administrateur)")
print("  2. sophie.bernard / Avocat123! (Avocat - Droit des affaires)")
print("  3. pierre.dubois / Avocat123! (Avocat - Droit de la famille)")
print("  4. julie.petit / Collab123! (Collaborateur)")
print("  5. marc.roux / Secret123! (Secrétaire)")
print("  6. lea.moreau / Stage123! (Stagiaire)")

"""
Script pour peupler la base de données avec des données de test.
Usage: python populate_test_data.py
"""

import os
import django
import sys

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

from django.contrib.auth import get_user_model
from documents.models import Client, Case, Document, Tag, Deadline
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()

print("🚀 Début du peuplement de la base de données...")

# Créer des tags
print("\n📌 Création des tags...")
tags_data = [
    {"name": "Urgent", "color": "#ef4444", "description": "Documents nécessitant une action immédiate"},
    {"name": "Confidentiel", "color": "#8b5cf6", "description": "Informations sensibles"},
    {"name": "À réviser", "color": "#f59e0b", "description": "Documents à relire"},
    {"name": "Approuvé", "color": "#10b981", "description": "Documents validés"},
    {"name": "Contrat", "color": "#3b82f6", "description": "Documents contractuels"},
    {"name": "Facture", "color": "#f97316", "description": "Documents comptables"},
    {"name": "Procédure", "color": "#ec4899", "description": "Documents de procédure"},
    {"name": "Archivé", "color": "#6b7280", "description": "Documents archivés"},
]

tags = []
for tag_data in tags_data:
    tag, created = Tag.objects.get_or_create(
        name=tag_data["name"],
        defaults={
            "color": tag_data["color"],
            "description": tag_data["description"]
        }
    )
    tags.append(tag)
    if created:
        print(f"  ✅ Tag créé: {tag.name}")
    else:
        print(f"  ℹ️  Tag existant: {tag.name}")

# Créer des clients supplémentaires
print("\n👥 Création des clients...")
clients_data = [
    {
        "name": "TechCorp Solutions",
        "email": "contact@techcorp.fr",
        "phone": "+33 1 45 67 89 01",
        "address": "15 Avenue des Champs-Élysées, 75008 Paris",
        "company_registration": "RCS Paris 123 456 789",
        "client_type": "ENTREPRISE"
    },
    {
        "name": "Marie Dubois",
        "email": "marie.dubois@email.fr",
        "phone": "+33 6 12 34 56 78",
        "address": "23 Rue de la Paix, 75002 Paris",
        "client_type": "PARTICULIER"
    },
    {
        "name": "Immobilière Parisienne",
        "email": "contact@immo-paris.fr",
        "phone": "+33 1 42 56 78 90",
        "address": "45 Boulevard Haussmann, 75009 Paris",
        "company_registration": "RCS Paris 987 654 321",
        "client_type": "ENTREPRISE"
    },
    {
        "name": "Jean Martin",
        "email": "jean.martin@email.fr",
        "phone": "+33 6 98 76 54 32",
        "address": "12 Rue du Commerce, 75015 Paris",
        "client_type": "PARTICULIER"
    },
    {
        "name": "Cabinet Médical Santé+",
        "email": "contact@sante-plus.fr",
        "phone": "+33 1 56 78 90 12",
        "address": "78 Avenue de la République, 75011 Paris",
        "company_registration": "RCS Paris 456 789 123",
        "client_type": "ENTREPRISE"
    },
]

admin_user = User.objects.get(username='admin')
clients = []

for client_data in clients_data:
    # Créer un utilisateur pour le client
    username = client_data["name"].lower().replace(' ', '').replace('-', '').replace('.', '')[:10]
    email = client_data["email"]
    password = "Client123!"
    
    user, user_created = User.objects.get_or_create(
        username=username,
        defaults={
            "email": email,
            "first_name": client_data["name"].split(' ')[0],
            "last_name": " ".join(client_data["name"].split(' ')[1:]),
            "role": "CLIENT",
            "is_active": True
        }
    )
    if user_created:
        user.set_password(password)
        user.save()
        print(f"  👤 Utilisateur client créé: {username} (pwd: {password})")

    client, created = Client.objects.get_or_create(
        email=client_data["email"],
        defaults={
            **client_data,
            "created_by": admin_user,
            "user": user
        }
    )
    
    # Si le client existait déjà mais n'avait pas d'utilisateur, on le lie
    if not created and not client.user:
        client.user = user
        client.save()
        print(f"  🔗 Client lié à l'utilisateur: {username}")

    clients.append(client)
    if created:
        print(f"  ✅ Client créé: {client.name}")
    else:
        print(f"  ℹ️  Client existant: {client.name}")

# Récupérer tous les clients existants
all_clients = list(Client.objects.all())
print(f"\n📊 Total clients: {len(all_clients)}")

# Créer des dossiers
print("\n📁 Création des dossiers...")
cases_data = [
    {
        "reference": "2024-DIV-001",
        "title": "Divorce Martin",
        "description": "Procédure de divorce par consentement mutuel",
        "status": "EN_COURS",
        "client": clients[3],
        "opened_date": timezone.now().date() - timedelta(days=30),
    },
    {
        "reference": "2024-COM-001",
        "title": "Contrat TechCorp - Partenariat",
        "description": "Négociation contrat de partenariat commercial",
        "status": "EN_COURS",
        "client": clients[0],
        "opened_date": timezone.now().date() - timedelta(days=15),
    },
    {
        "reference": "2024-IMM-001",
        "title": "Vente Appartement Dubois",
        "description": "Vente d'un appartement 3 pièces à Paris 15e",
        "status": "EN_COURS",
        "client": clients[1],
        "opened_date": timezone.now().date() - timedelta(days=45),
    },
    {
        "reference": "2024-LOC-001",
        "title": "Bail Commercial Immobilière Parisienne",
        "description": "Rédaction bail commercial local 200m²",
        "status": "EN_COURS",
        "client": clients[2],
        "opened_date": timezone.now().date() - timedelta(days=10),
    },
    {
        "reference": "2024-TRA-001",
        "title": "Litige Prud'homal Cabinet Santé+",
        "description": "Défense employeur - licenciement contesté",
        "status": "EN_COURS",
        "client": clients[4],
        "opened_date": timezone.now().date() - timedelta(days=60),
    },
    {
        "reference": "2024-SUC-001",
        "title": "Succession Famille Dubois",
        "description": "Règlement succession - 3 héritiers",
        "status": "OUVERT",
        "client": clients[1],
        "opened_date": timezone.now().date() - timedelta(days=5),
    },
    {
        "reference": "2023-COM-045",
        "title": "Contentieux TechCorp vs Concurrent",
        "description": "Action en contrefaçon de brevet",
        "status": "CLOS",
        "client": clients[0],
        "opened_date": timezone.now().date() - timedelta(days=365),
    },
    {
        "reference": "2024-PEN-001",
        "title": "Défense Pénale M. Martin",
        "description": "Comparution immédiate - Délit routier",
        "status": "EN_COURS",
        "client": clients[3],
        "opened_date": timezone.now().date() - timedelta(days=2),
    },
    {
        "reference": "2024-SOC-042",
        "title": "Audit Social TechCorp 2024",
        "description": "Audit de conformité sociale annuel",
        "status": "EN_COURS",
        "client": clients[0],
        "opened_date": timezone.now().date() - timedelta(days=20),
    },
    {
        "reference": "2024-FIS-012",
        "title": "Contrôle Fiscal Immobilière",
        "description": "Assistance lors du contrôle fiscal exercices 2021-2023",
        "status": "EN_COURS",
        "client": clients[2],
        "opened_date": timezone.now().date() - timedelta(days=8),
    },
    {
        "reference": "2024-FAM-003",
        "title": "Pension Alimentaire Dubois",
        "description": "Révision du montant de la pension alimentaire",
        "status": "OUVERT",
        "client": clients[1],
        "opened_date": timezone.now().date() - timedelta(days=1),
    },
    {
        "reference": "2024-CON-101",
        "title": "Rupture Contrat Fournisseur Santé+",
        "description": "Litige rupture brutale des relations commerciales",
        "status": "PRE_CONTENTIEUX",
        "client": clients[4],
        "opened_date": timezone.now().date() - timedelta(days=12),
    },
]

# Récupérer les avocats
avocats = list(User.objects.filter(role__in=['AVOCAT', 'ADMIN']))
cases = []

for case_data in cases_data:
    case, created = Case.objects.get_or_create(
        reference=case_data["reference"],
        defaults={
            **case_data,
            "created_by": admin_user
        }
    )
    
    # Assigner des avocats
    if created:
        case.assigned_to.add(*random.sample(avocats, min(2, len(avocats))))
        
        # Ajouter des tags
        case_tags = random.sample(tags, random.randint(1, 3))
        case.tags.add(*case_tags)
    
    cases.append(case)
    if created:
        print(f"  ✅ Dossier créé: {case.reference} - {case.title}")
    else:
        # Force update client
        case.client = case_data["client"]
        case.save()
        print(f"  ℹ️  Dossier existant mis à jour: {case.reference}")

# Récupérer tous les dossiers
all_cases = list(Case.objects.all())
print(f"\n📊 Total dossiers: {len(all_cases)}")

# Créer des échéances
print("\n📅 Création des échéances...")
deadline_types = ['AUDIENCE', 'DEPOT', 'REPONSE', 'DELAI', 'AUTRE']
deadlines_data = [
    {
        "title": "Audience Tribunal - Divorce Martin",
        "description": "Audience de conciliation au Tribunal de Grande Instance",
        "deadline_type": "AUDIENCE",
        "days_offset": 3,  # Dans 3 jours
        "case_index": 0,
    },
    {
        "title": "Dépôt conclusions TechCorp",
        "description": "Dépôt des conclusions écrites au greffe",
        "deadline_type": "DEPOT",
        "days_offset": 7,
        "case_index": 1,
    },
    {
        "title": "Réponse assignation Santé+",
        "description": "Délai de réponse à l'assignation prud'homale",
        "deadline_type": "REPONSE",
        "days_offset": 15,
        "case_index": 4,
    },
    {
        "title": "Délai d'appel Contentieux",
        "description": "Fin du délai pour faire appel du jugement",
        "deadline_type": "DELAI",
        "days_offset": 30,
        "case_index": 6,
    },
    {
        "title": "Signature acte de vente Dubois",
        "description": "Rendez-vous notaire pour signature définitive",
        "deadline_type": "AUTRE",
        "days_offset": 45,
        "case_index": 2,
    },
    {
        "title": "Audience Prud'hommes",
        "description": "Audience de jugement au Conseil de Prud'hommes",
        "deadline_type": "AUDIENCE",
        "days_offset": 60,
        "case_index": 4,
    },
    {
        "title": "Dépôt pièces complémentaires",
        "description": "Communication pièces complémentaires partie adverse",
        "deadline_type": "DEPOT",
        "days_offset": 1,  # Demain - urgent!
        "case_index": 1,
    },
    {
        "title": "Audience référé Immobilière",
        "description": "Audience en référé pour expulsion locataire",
        "deadline_type": "AUDIENCE",
        "days_offset": -2,  # En retard!
        "case_index": 3,
    },
]

for deadline_data in deadlines_data:
    case_index = deadline_data.pop("case_index")
    days_offset = deadline_data.pop("days_offset")
    
    if case_index < len(all_cases):
        deadline, created = Deadline.objects.get_or_create(
            title=deadline_data["title"],
            case=all_cases[case_index],
            defaults={
                **deadline_data,
                "due_date": timezone.now() + timedelta(days=days_offset),
                "reminder_days": 7,
                "created_by": admin_user
            }
        )
        
        if created:
            status = "⚠️ EN RETARD" if days_offset < 0 else f"📅 Dans {days_offset}j"
            print(f"  ✅ Échéance créée: {deadline.title} - {status}")
        else:
            print(f"  ℹ️  Échéance existante: {deadline.title}")

print("\n" + "="*60)
print("✨ PEUPLEMENT TERMINÉ !")
print("="*60)

# Afficher les statistiques finales
total_clients = Client.objects.count()
total_cases = Case.objects.count()
total_documents = Document.objects.count()
total_tags = Tag.objects.count()
total_deadlines = Deadline.objects.count()
upcoming_deadlines = Deadline.objects.filter(
    due_date__gte=timezone.now(),
    is_completed=False
).count()
# Créer des documents
print("\n📄 Création des documents...")
documents_data = [
    {
        "title": "Requête en divorce",
        "document_type": "ACTE",
        "file_name": "requete_divorce_martin.pdf",
        "file_size": 1024 * 500,  # 500 KB
        "file_extension": ".pdf",
        "case_index": 0,
        "ocr_text": "REQUÊTE EN DIVORCE\n\nPOUR : Madame Marie MARTIN\nCONTRE : Monsieur Jean MARTIN\n\nPLAISE AU JUGE AUX AFFAIRES FAMILIAUX",
        "ocr_processed": True
    },
    {
        "title": "Acte de Mariage",
        "document_type": "PIECE",
        "file_name": "acte_mariage_martin.pdf",
        "file_size": 1024 * 200,
        "file_extension": ".pdf",
        "case_index": 0,
        "ocr_text": "EXTRAIT D'ACTE DE MARIAGE\n\nAnnée 2010\nLe 15 juin 2010 ont comparu publiquement en la maison commune...",
        "ocr_processed": True
    },
    {
        "title": "Projet de Contrat Partenariat",
        "document_type": "CONTRAT",
        "file_name": "contrat_partenariat_v1.docx",
        "file_size": 1024 * 50,
        "file_extension": ".docx",
        "case_index": 1,
        "ocr_text": "CONTRAT DE PARTENARIAT COMMERCIAL\n\nENTRE LES SOUSSIGNÉS :\nLa société TechCorp Solutions...\nET\nLa société Partenaire...",
        "ocr_processed": True
    },
    {
        "title": "Compromis de Vente",
        "document_type": "CONTRAT",
        "file_name": "compromis_vente_dubois.pdf",
        "file_size": 1024 * 1500,
        "file_extension": ".pdf",
        "case_index": 2,
        "ocr_text": "COMPROMIS DE VENTE\n\nENTRE LES SOUSSIGNÉS :\nMonsieur Pierre DUBOIS (Vendeur)\nET\nMonsieur Acheteur (Acquéreur)\n\nIL A ÉTÉ CONVENU CE QUI SUIT...",
        "ocr_processed": True
    },
    {
        "title": "Bail Commercial 3-6-9",
        "document_type": "CONTRAT",
        "file_name": "bail_commercial_immo.pdf",
        "file_size": 1024 * 800,
        "file_extension": ".pdf",
        "case_index": 3,
        "ocr_text": "BAIL COMMERCIAL\n\nSoumis au statut des baux commerciaux (articles L.145-1 et suivants du Code de commerce)\n\nBAILLEUR : Immobilière Parisienne\nPRENEUR : Société Locataire",
        "ocr_processed": True
    },
    {
        "title": "Lettre de Licenciement",
        "document_type": "CORRESPONDANCE",
        "file_name": "lettre_licenciement.pdf",
        "file_size": 1024 * 100,
        "file_extension": ".pdf",
        "case_index": 4,
        "ocr_text": "OBJET : Notification de licenciement pour faute grave\n\nMonsieur,\n\nNous avons le regret de vous notifier par la présente votre licenciement...",
        "ocr_processed": True
    },
    {
        "title": "Testament Olographe",
        "document_type": "ACTE",
        "file_name": "testament_dubois.jpg",
        "file_size": 1024 * 2000,
        "file_extension": ".jpg",
        "case_index": 5,
        "ocr_text": "Ceci est mon testament.\nJe soussigné, Monsieur Dubois, sain de corps et d'esprit...\nFait à Paris, le 1er janvier 2020.",
        "ocr_processed": True
    },
    {
        "title": "Jugement TGI Paris",
        "document_type": "JUGEMENT",
        "file_name": "jugement_tgi_techcorp.pdf",
        "file_size": 1024 * 3000,
        "file_extension": ".pdf",
        "case_index": 6,
        "ocr_text": "TRIBUNAL DE GRANDE INSTANCE DE PARIS\nJUGEMENT DU 15 SEPTEMBRE 2023\n\nPAR CES MOTIFS,\nLe Tribunal, statuant publiquement, par jugement contradictoire et en premier ressort...",
        "ocr_processed": True
    },
    {
        "title": "Facture Honoraires N°2024-056",
        "document_type": "FACTURE",
        "file_name": "facture_honoraires.pdf",
        "file_size": 1024 * 50,
        "file_extension": ".pdf",
        "case_index": 0,
        "ocr_text": "FACTURE D'HONORAIRES N°2024-056\n\nClient : Mme Martin\nDossier : Divorce\n\nMontant HT : 1500,00 €\nTVA (20%) : 300,00 €\nTotal TTC : 1800,00 €",
        "ocr_processed": True
    }
]

# Créer un fichier dummy pour simuler l'upload
from django.core.files.base import ContentFile

for doc_data in documents_data:
    case_index = doc_data.pop("case_index")
    
    if case_index < len(all_cases):
        case = all_cases[case_index]
        
        # Créer le document
        doc, created = Document.objects.get_or_create(
            title=doc_data["title"],
            case=case,
            defaults={
                **doc_data,
                "uploaded_by": admin_user,
                "file": ContentFile(b"dummy content", name=doc_data["file_name"])
            }
        )
        
        if created:
            # Assigner des tags aléatoires
            doc_tags = random.sample(tags, random.randint(1, 3))
            doc.tags.add(*doc_tags)
            print(f"  ✅ Document créé: {doc.title}")
        else:
            print(f"  ℹ️  Document existant: {doc.title}")

# Mettre à jour les compteurs
overdue_deadlines = Deadline.objects.filter(
    due_date__lt=timezone.now(),
    is_completed=False
).count()

print(f"\n📊 STATISTIQUES FINALES:")
print(f"  👥 Clients: {total_clients}")
print(f"  📁 Dossiers: {total_cases}")
print(f"  📄 Documents: {total_documents}")
print(f"  🏷️  Tags: {total_tags}")
print(f"  📅 Échéances totales: {total_deadlines}")
print(f"  ⏰ Échéances à venir: {upcoming_deadlines}")
print(f"  ⚠️  Échéances en retard: {overdue_deadlines}")

print("\n🎉 Vous pouvez maintenant tester la plateforme avec des données réalistes !")
print("🌐 Accédez au dashboard: http://localhost:3000")
print("🔐 Login: admin / Admin123!")

import os
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from documents.models import Client, Case, Document, Tag, Deadline, DocumentVersion
from documents.ocr import OCRProcessor

User = get_user_model()

class Command(BaseCommand):
    help = 'Peuple la base de données avec des données de test complètes'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Début du peuplement de la base de données...'))

        # 1. Création des Utilisateurs
        self.stdout.write('Création des utilisateurs...')
        users = self.create_users()

        # 2. Création des Tags
        self.stdout.write('Création des tags...')
        tags = self.create_tags()

        # 3. Création des Clients
        self.stdout.write('Création des clients...')
        clients = self.create_clients(users)

        # 4. Création des Dossiers (Cases)
        self.stdout.write('Création des dossiers...')
        cases = self.create_cases(users, clients, tags)

        # 5. Création des Documents
        self.stdout.write('Création des documents...')
        self.create_documents(users, cases, tags)

        # 6. Création des Échéances (Deadlines)
        self.stdout.write('Création des échéances...')
        self.create_deadlines(cases)

        self.stdout.write(self.style.SUCCESS('Base de données peuplée avec succès !'))

    def create_users(self):
        users_data = [
            {'username': 'avocat1', 'role': 'AVOCAT', 'first_name': 'Jean', 'last_name': 'Dupont'},
            {'username': 'avocat2', 'role': 'AVOCAT', 'first_name': 'Marie', 'last_name': 'Curie'},
            {'username': 'collab1', 'role': 'COLLABORATEUR', 'first_name': 'Pierre', 'last_name': 'Martin'},
            {'username': 'stagiaire1', 'role': 'STAGIAIRE', 'first_name': 'Sophie', 'last_name': 'Durand'},
            {'username': 'secretaire1', 'role': 'SECRETAIRE', 'first_name': 'Julie', 'last_name': 'Bernard'},
        ]
        
        created_users = []
        # Admin is assumed to exist, but let's grab him if he does
        try:
            admin = User.objects.get(username='admin')
            created_users.append(admin)
        except User.DoesNotExist:
            pass

        for u_data in users_data:
            user, created = User.objects.get_or_create(
                username=u_data['username'],
                defaults={
                    'email': f"{u_data['username']}@cabinet.example.com",
                    'first_name': u_data['first_name'],
                    'last_name': u_data['last_name'],
                    'role': u_data['role'],
                    'department': 'Juridique'
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            created_users.append(user)
        
        return created_users

    def create_tags(self):
        tags_data = [
            {'name': 'Urgent', 'color': '#ef4444'},
            {'name': 'En attente', 'color': '#f59e0b'},
            {'name': 'Pénal', 'color': '#3b82f6'},
            {'name': 'Social', 'color': '#10b981'},
            {'name': 'Commercial', 'color': '#8b5cf6'},
            {'name': 'Facturé', 'color': '#6366f1'},
        ]
        
        created_tags = []
        for tag_data in tags_data:
            tag, _ = Tag.objects.get_or_create(
                name=tag_data['name'],
                defaults={'color': tag_data['color']}
            )
            created_tags.append(tag)
        return created_tags

    def create_clients(self, users):
        clients_data = [
            {'name': 'Dupont SARL', 'type': 'ENTREPRISE', 'email': 'contact@dupont.com'},
            {'name': 'Martin SA', 'type': 'ENTREPRISE', 'email': 'info@martin-sa.fr'},
            {'name': 'Philippe Etche', 'type': 'PARTICULIER', 'email': 'phil.etche@email.com'},
            {'name': 'Association Aide', 'type': 'ASSOCIATION', 'email': 'contact@aide.org'},
        ]
        
        created_clients = []
        admin_user = users[0] if users else None
        
        for c_data in clients_data:
            client, _ = Client.objects.get_or_create(
                name=c_data['name'],
                defaults={
                    'email': c_data['email'],
                    'client_type': c_data['type'],
                    'phone': '0123456789',
                    'address': '10 Rue de la Paix, Paris',
                    'created_by': admin_user
                }
            )
            created_clients.append(client)
        return created_clients

    def create_cases(self, users, clients, tags):
        cases_list = []
        statuses = ['OUVERT', 'EN_COURS', 'SUSPENDU', 'CLOS']
        
        for i in range(15):
            client = random.choice(clients)
            creator = random.choice(users)
            status = random.choice(statuses)
            
            case, created = Case.objects.get_or_create(
                reference=f'DOSS-{2024}-{i+1:03d}',
                defaults={
                    'title': f'Affaire {client.name} vs {random.choice(["Partie Adverse X", "État", "Assurance Y"])}',
                    'client': client,
                    'status': status,
                    'description': 'Description détaillée du dossier...',
                    'opened_date': timezone.now().date() - timedelta(days=random.randint(0, 365)),
                    'created_by': creator
                }
            )
            
            # Attribuer des tags
            case.tags.add(*random.sample(tags, k=random.randint(0, 3)))
            cases_list.append(case)
            
        return cases_list

    def create_documents(self, users, cases, tags):
        doc_types = ['CONTRAT', 'COURRIER', 'JUGEMENT', 'PIECE', 'AUTRE']
        
        for case in cases:
            # Créer 3 à 8 documents par dossier
            for j in range(random.randint(3, 8)):
                uploader = random.choice(users)
                doc_type = random.choice(doc_types)
                
                doc = Document.objects.create(
                    title=f'Document {doc_type} - {j+1}',
                    document_type=doc_type,
                    case=case,
                    description='Document auto-généré',
                    file=ContentFile(b'Contenu du document de test', name=f'doc_{case.id}_{j}.txt'),
                    file_name=f'doc_{case.id}_{j}.txt',
                    file_size=1024,
                    file_extension='txt',
                    uploaded_by=uploader,
                    ocr_text="Ceci est un texte extrait par OCR simulé pour la recherche.",
                    ocr_processed=True
                )
                doc.tags.add(*random.sample(tags, k=random.randint(0, 2)))

    def create_deadlines(self, cases):
        types = ['AUDIENCE', 'DEPOT', 'REPONSE', 'DELAI', 'AUTRE']
        now = timezone.now()
        
        for case in cases:
            if case.status == 'CLOS':
                continue
                
            # Créer une échéance passée (retard)
            if random.random() > 0.7:
                Deadline.objects.create(
                    case=case,
                    title="Audience passée (Retard)",
                    deadline_type='AUDIENCE',
                    due_date=now - timedelta(days=random.randint(1, 10)),
                    reminder_days=2,
                    is_completed=False
                )
            
            # Créer une échéance très proche (Urgent)
            if random.random() > 0.6:
                Deadline.objects.create(
                    case=case,
                    title="Dépôt conclusions (Urgent)",
                    deadline_type='DEPOT',
                    due_date=now + timedelta(days=random.randint(0, 2)),
                    reminder_days=1,
                    is_completed=False
                )
                
            # Créer des échéances futures
            for k in range(random.randint(1, 3)):
                Deadline.objects.create(
                    case=case,
                    title=f"Échéance future {k+1}",
                    deadline_type=random.choice(types),
                    due_date=now + timedelta(days=random.randint(5, 60)),
                    reminder_days=7,
                    is_completed=False
                )

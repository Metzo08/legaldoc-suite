from django.core.management.base import BaseCommand
from django.conf import settings
from cabinet.models import Cabinet, TeamMember
import shutil
import os

class Command(BaseCommand):
    help = 'Synchronise les données du cabinet et de l\'équipe avec les valeurs souhaitées.'

    def handle(self, *args, **options):
        # 1. Mise à jour du Cabinet (Branding & Couleurs)
        cabinet = Cabinet.load()
        cabinet.name = "Cabinet de Maître Ibrahima Mbengue"
        cabinet.description = "L'excellence juridique au cœur de Dakar. Un cabinet de référence alliant rigueur, dévouement et expertise stratégique pour la défense de vos intérêts et l'accompagnement de vos ambitions."
        cabinet.primary_color = "#1a237e"
        cabinet.secondary_color = "#c2185b"
        cabinet.address = "35, Avenue Malick SY, BP: 14887 Dakar Peytavin, Dakar - Sénégal"
        cabinet.phone = "(+221) 33 821 97 97"
        cabinet.cel = "(00221) 77.633.88.81"
        cabinet.email = "maitreimbengue@gmail.com"
        cabinet.opening_hours = "Lundi, Mardi et Jeudi : 15h00 - 17h00\nMercredi : Sur rendez-vous uniquement\nVendredi : Fermé au public"
        cabinet.consultation_fees = "Consultation orale : 50.000 à 200.000 FCFA\nRédaction d'acte : Forfait ou temps passé"
        cabinet.save()
        self.stdout.write(self.style.SUCCESS("Configuration du Cabinet mise à jour."))

        # 2. Copier les photos depuis fixtures vers media
        fixtures_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'fixtures', 'team_photos')
        fixtures_dir = os.path.abspath(fixtures_dir)
        media_team_dir = os.path.join(settings.MEDIA_ROOT, 'cabinet', 'team')
        os.makedirs(media_team_dir, exist_ok=True)

        photo_map = {
            "Maître Ibrahima MBENGUE": "ibrahima_mbengue.jpg",
            "Me Khady SENE": "khady_sene.jpg",
            "M. Augustin François NDAO": "augustin_ndao.jpg",
            "M. Médoune MBENGUE": "medoune_mbengue.jpg",
        }

        for name, filename in photo_map.items():
            src = os.path.join(fixtures_dir, filename)
            dst = os.path.join(media_team_dir, filename)
            if os.path.exists(src):
                shutil.copy2(src, dst)
                self.stdout.write(self.style.SUCCESS(f"Photo copiée: {filename}"))
            else:
                self.stdout.write(self.style.WARNING(f"Photo introuvable: {src}"))

        # 3. Mise à jour de l'équipe
        team_data = [
            {
                "name": "Maître Ibrahima MBENGUE",
                "role": "Avocat à la cour",
                "biography": "Avocat à la Cour, avec 35 ans d'expérience.\nBarreau du Sénégal.\nConseil inscrit à la Cour pénale internationale (CPI).\nConseil inscrit à la Cour africaine des droits de l'homme et des peuples (CADHP).\nSpécialisé en droit pénal, social et civil.",
                "email": "maitreimbengue@gmail.com",
                "order": 1
            },
            {
                "name": "Me Khady SENE",
                "role": "Avocate collaboratrice",
                "biography": "Diplômée en droit économique et des affaires. Avocat à la cour et membre de l'association des jeunes avocats du Sénégal. Membre de l'association des avocates du Sénégal, experte en contentieux pénal et des affaires.",
                "email": "ksene94042@gmail.com",
                "linkedin_url": "https://www.linkedin.com/in/maitre-khady-sene-1361b514a/",
                "order": 2
            },
            {
                "name": "M. Augustin François NDAO",
                "role": "Juriste Interne",
                "biography": "Juriste interne spécialisé en droit des Affaires. Certifié informatique et internet par FORCE-N Sénégal.",
                "email": "francoisndao@gmail.com",
                "phone": "774935564",
                "linkedin_url": "https://www.linkedin.com/in/augustin-f-ndao/",
                "order": 3
            },
            {
                "name": "M. Médoune MBENGUE",
                "role": "Clerc principal et secrétaire général",
                "biography": "M. Médoune Mbengue apporte une expertise solide au cabinet, fort de 15 ans d'expérience en tant que clerc principal. Il assure également, avec rigueur et dévouement, les fonctions stratégiques de secrétaire général.",
                "email": "medounembengue111@icloud.com",
                "order": 4
            }
        ]

        for member_info in team_data:
            photo_filename = photo_map.get(member_info["name"], "")
            photo_path = f"cabinet/team/{photo_filename}" if photo_filename else ""

            member, created = TeamMember.objects.update_or_create(
                name=member_info["name"],
                defaults={
                    "role": member_info["role"],
                    "biography": member_info["biography"],
                    "email": member_info.get("email", ""),
                    "phone": member_info.get("phone", ""),
                    "linkedin_url": member_info.get("linkedin_url", ""),
                    "order": member_info["order"],
                    "is_active": True,
                    "photo": photo_path,
                }
            )
            action = "Créé" if created else "Mis à jour"
            self.stdout.write(self.style.SUCCESS(f"Membre {member.name} {action} (photo: {photo_path})."))

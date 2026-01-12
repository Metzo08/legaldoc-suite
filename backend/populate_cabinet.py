from cabinet.models import Cabinet, TeamMember
from django.core.files.base import ContentFile
import os

def run():
    # 1. Create Cabinet
    print("Creating Cabinet...")
    cabinet, created = Cabinet.objects.get_or_create(pk=1)
    cabinet.name = "Cabinet Avocats & Associés"
    cabinet.description = "Un cabinet d'excellence dédié à la défense de vos intérêts. Notre expertise couvre le droit des affaires, le droit civil et le contentieux international. Nous nous engageons à fournir des services juridiques de la plus haute qualité avec intégrité et dévouement."
    cabinet.primary_color = "#1e40af" # Dark Blue
    cabinet.secondary_color = "#d97706" # Amber
    cabinet.address = "123 Avenue des Champs-Élysées, 75008 Paris"
    cabinet.email = "contact@cabinet-avocats.fr"
    cabinet.save()
    print(f"Cabinet '{cabinet.name}' created/updated.")

    # 2. Create Team Members
    print("Creating Team Members...")
    
    # Clear existing to avoid duplicates in this demo script
    TeamMember.objects.all().delete()

    members = [
        {
            "name": "Jean Dupont",
            "role": "Associé Fondateur",
            "biography": "Avocat au barreau de Paris depuis 20 ans, spécialiste en droit des affaires.",
            "order": 1
        },
        {
            "name": "Marie Curie",
            "role": "Avocate Senior",
            "biography": "Expertise reconnue en propriété intellectuelle et droit des nouvelles technologies.",
            "order": 2
        },
        {
            "name": "Pierre Martin",
            "role": "Collaborateur",
            "biography": "Diplômé de la Sorbonne, spécialisé en contentieux civil.",
            "order": 3
        }
    ]

    for m in members:
        TeamMember.objects.create(**m)
        print(f"Member '{m['name']}' created.")

    print("Done! Demo data populated.")

if __name__ == '__main__':
    run()

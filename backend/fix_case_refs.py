import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

from documents.models import Case
from django.db import transaction

def fix_references():
    print("Début du nettoyage des références...")
    
    with transaction.atomic():
        # 1. Convertir les chaînes vides ou espaces en NULL
        all_cases = Case.objects.all()
        count = 0
        for case in all_cases:
            if case.reference and case.reference.strip() == "":
                case.reference = None
                case.save(update_fields=['reference'])
                count += 1
        
        # Aussi ceux qui sont déjà des chaines vides exactes ''
        empty_exact = Case.objects.filter(reference='')
        count += empty_exact.count()
        empty_exact.update(reference=None)
        
        print(f"Trouvé et corrigé {count} dossiers avec une référence vide ou invalide.")
        
        # 2. Re-générer les références pour ceux qui n'en ont pas
        null_refs = Case.objects.filter(reference__isnull=True).order_by('created_at')
        count = null_refs.count()
        print(f"Génération de références pour {count} dossiers...")
        
        for case in null_refs:
            # save() appellera la nouvelle logique de génération
            case.save()
            print(f"  -> Dossier ID {case.id} : nouvelle référence {case.reference}")
            
    print("Nettoyage terminé avec succès.")

if __name__ == "__main__":
    fix_references()

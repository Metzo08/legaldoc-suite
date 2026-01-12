import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

from documents.models import Client, Case

def test_reference_generation():
    print("--- Début du test de génération de références ---")
    
    # 1. Créer un client de test
    client = Client.objects.create(name="Client Test Audit", email="audit@test.com")
    print(f"Client créé : {client.name} (ID: {client.id})")
    
    # 2. Créer un premier dossier CIVIL
    case_civ1 = Case.objects.create(
        title="Affaire Civile 1",
        client=client,
        category='CIVIL'
    )
    print(f"Dossier créé : {case_civ1.title} -> Réf : {case_civ1.reference}")
    
    # 3. Créer un second dossier CIVIL pour le même client (doit être un sous-dossier)
    case_civ2 = Case.objects.create(
        title="Affaire Civile 2",
        client=client,
        category='CIVIL'
    )
    print(f"Sous-dossier créé : {case_civ2.title} -> Réf : {case_civ2.reference}")
    
    # 4. Créer un premier dossier CORRECTIONNEL
    case_cor1 = Case.objects.create(
        title="Affaire Correctionnelle 1",
        client=client,
        category='CORRECTIONNEL'
    )
    print(f"Dossier créé : {case_cor1.title} -> Réf : {case_cor1.reference}")
    
    # 5. Vérifier la cohérence
    expected_civ2 = f"{case_civ1.reference}.1"
    if case_civ2.reference == expected_civ2:
        print("SUCCESS: La logique de sous-dossier est CORRECTE.")
    else:
        print(f"FAILURE: Attendu {expected_civ2}, reçu {case_civ2.reference}")

    # Nettoyage
    case_civ1.delete()
    case_civ2.delete()
    case_cor1.delete()
    client.delete()
    print("--- Fin du test ---")

if __name__ == "__main__":
    test_reference_generation()

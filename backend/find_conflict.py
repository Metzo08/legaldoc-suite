from documents.models import Case
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

print("--- RECHERCHE DOSSIER 1607 ---")
c = Case.objects.filter(reference='1607').first()
if c:
    print(f"ID: {c.id}")
    print(f"Reference: {c.reference}")
    print(f"Titre: {c.title}")
    print(f"Partie représentée: {c.represented_party}")
    print(f"Client: {c.client.name if c.client else 'N/A'}")
else:
    print("Dossier 1607 introuvable (C'est bizarre si vous avez une IntegrityError).")

print("\n--- RECHERCHE BABACAR ---")
babs = Case.objects.filter(represented_party__icontains='Babacar')
for b in babs:
    print(f"ID: {b.id} | Ref: {b.reference} | Titre: {b.title}")

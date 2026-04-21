import os
import django
from django.db import connection

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

def drop_old_constraint():
    with connection.cursor() as cursor:
        try:
            print("Tentative de suppression de la contrainte 'documents_case_reference_key'...")
            cursor.execute("ALTER TABLE documents_case DROP CONSTRAINT IF EXISTS documents_case_reference_key;")
            print("Succès : La contrainte a été supprimée ou n'existait pas.")
        except Exception as e:
            print(f"Erreur lors de la suppression : {e}")

if __name__ == "__main__":
    drop_old_constraint()

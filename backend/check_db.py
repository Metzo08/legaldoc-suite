import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

def list_constraints():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT conname, contype, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public' AND conrelid = 'documents_case'::regclass;
        """)
        constraints = cursor.fetchall()
        print("--- Contraintes sur la table documents_case ---")
        for con in constraints:
            print(f"Nom: {con[0]}, Type: {con[1]}, Définition: {con[2]}")
        
        cursor.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'documents_case' AND schemaname = 'public';
        """)
        indexes = cursor.fetchall()
        print("\n--- Index sur la table documents_case ---")
        for idx in indexes:
            print(f"Nom: {idx[0]}, Définition: {idx[1]}")

if __name__ == "__main__":
    list_constraints()

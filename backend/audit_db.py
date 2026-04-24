
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

from documents.models import Client, Case, Document

def audit():
    print("--- COUNTS AUDIT ---")
    clients_count = Client.objects.all().count()
    cases_count = Case.objects.all().count()
    documents_count = Document.objects.all().count()
    
    print(f"Clients: {clients_count}")
    print(f"Cases: {cases_count}")
    print(f"Documents: {documents_count}")
    
    print("\n--- BABACAR DIOP SEARCH ---")
    bd_clients = Client.objects.filter(name__icontains='Babacar Diop')
    print(f"Clients matching 'Babacar Diop': {[(c.id, c.name) for c in bd_clients]}")
    
    bd_cases = Case.objects.filter(title__icontains='Babacar Diop')
    print(f"Cases matching 'Babacar Diop' in title: {[(c.id, c.reference, c.title) for c in bd_cases]}")
    
    print("\n--- CASES PER CLIENT ---")
    for client in Client.objects.all():
        count = client.cases.count()
        if count > 0:
            print(f"Client {client.name} (ID: {client.id}) has {count} cases")

if __name__ == "__main__":
    audit()

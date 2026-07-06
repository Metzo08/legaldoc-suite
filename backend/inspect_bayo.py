import os
import django
import sys

# Add backend to path
sys.path.append(r"/app")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')

try:
    django.setup()
    from documents.models import Case, Client
    
    print("--- SEARCH RESULTS FOR CASES ---")
    queries_cases = ['Bayo', 'Kecouto', 'Kekouto', '6155']
    for q in queries_cases:
        print(f"\nSearching Cases for: '{q}'")
        cases = Case.objects.filter(
            django.db.models.Q(title__icontains=q) |
            django.db.models.Q(reference__icontains=q) |
            django.db.models.Q(represented_party__icontains=q) |
            django.db.models.Q(adverse_party__icontains=q)
        )
        if not cases.exists():
            print(f"No cases found for '{q}'")
        for case in cases:
            print(f" - Case ID: {case.id}")
            print(f"   Title: {case.title}")
            print(f"   Reference: {case.reference}")
            print(f"   Category: {case.category}")
            print(f"   Client: {case.client.name} (ID: {case.client.id})")
            print(f"   Represented: {case.represented_party}")
            print(f"   Adverse: {case.adverse_party}")
            print(f"   Status: {case.status}")
            
    print("\n--- SEARCH RESULTS FOR CLIENTS ---")
    queries_clients = ['Bayo', 'Kecouto', 'Kekouto']
    for q in queries_clients:
        print(f"\nSearching Clients for: '{q}'")
        clients = Client.objects.filter(name__icontains=q)
        if not clients.exists():
            print(f"No clients found for '{q}'")
        for client in clients:
            print(f" - Client ID: {client.id}")
            print(f"   Name: {client.name}")
            print(f"   Type: {client.client_type}")
            print(f"   Cases count: {client.cases.count()}")

except Exception as e:
    print(f"Error: {e}")

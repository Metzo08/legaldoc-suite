import os
import django
import sys

# Add backend to path
sys.path.append(r"c:\Users\hp\Downloads\LegalDoc Suite\backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')

try:
    django.setup()
    from documents.models import Case
    
    # Try multiple variations of 'COR3' as it might be case sensitive or partial
    print("Searching for case COR3...")
    cases = Case.objects.filter(reference__icontains='COR3')
    
    if not cases.exists():
        print("No case found with 'COR3' in reference.")
    
    for case in cases:
        print(f"Case: {case.reference} (ID: {case.id})")
        print(f"Documents: {case.documents.count()}")
        for doc in case.documents.all():
            print(f" - Doc: {doc.title} (ID: {doc.id})")
            print(f"   File Name: {doc.file.name}")
            try:
                path = doc.file.path
                print(f"   Path: {path}")
                print(f"   Exists on Host: {os.path.exists(path)}")
            except Exception as e:
                print(f"   Path Error: {e}")
                
except Exception as e:
    print(f"Error: {e}")

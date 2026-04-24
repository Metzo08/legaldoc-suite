from documents.models import Case
import re

print('--- DOSSIERS BABACAR ---')
babacars = Case.objects.filter(title__icontains='Babacar')
for c in babacars:
    print(f"ID: {c.id} | Ref: {c.reference} | Title: {c.title}")

print('\n--- MAX REFS PER CATEGORY ---')
categories = ['CIVIL', 'COMMERCIAL', 'SOCIAL', 'PENAL', 'CORRECTIONNEL', 'TI_FAMILLE']
for cat in categories:
    refs = Case.objects.filter(category=cat).values_list('reference', flat=True).order_by('-reference')[:10]
    print(f"{cat}: {list(refs)}")

print('\n--- ALL REFS SORTED ---')
all_refs = Case.objects.all().values_list('reference', flat=True).order_by('-reference')[:20]
print(list(all_refs))

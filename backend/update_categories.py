import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

from documents.models import Case

# Get all cases
cases = list(Case.objects.all().order_by('id'))
total = len(cases)
half = total // 2

print(f"Total cases: {total}")
print(f"Updating {total - half} cases to CORRECTIONNEL...")

# Update second half to CORRECTIONNEL
for case in cases[half:]:
    case.category = 'CORRECTIONNEL'
    case.save()

civil = Case.objects.filter(category='CIVIL').count()
corr = Case.objects.filter(category='CORRECTIONNEL').count()
print(f"Done! Civil: {civil}, Correctionnel: {corr}")

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

from users.serializers import UserSerializer
print("Installation réussie !")

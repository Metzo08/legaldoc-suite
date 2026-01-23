
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legaldoc.settings')
django.setup()

from users.models import User
from users.serializers import UserSerializer

try:
    print("Fetching users...")
    users = User.objects.all()
    count = users.count()
    print(f"Found {count} users.")
    
    print("Serializing...")
    data = UserSerializer(users, many=True).data
    print("Serialization OK")
    print("First user data:", data[0] if data else "No data")
    
except Exception as e:
    import traceback
    with open('error.log', 'w') as f:
        traceback.print_exc(file=f)
    print("Error written to error.log")

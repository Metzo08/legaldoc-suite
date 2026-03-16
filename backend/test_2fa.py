import os, django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "legaldoc.settings")
django.setup()

from users.models import User
import pyotp

user = User.objects.filter(role=User.Role.COLLABORATEUR).first()
if user:
    # Setup test password
    user.set_password("testpass123")
    user.save()

    from rest_framework.test import APIClient
    client = APIClient()

    totp = pyotp.TOTP(user.two_factor_secret)
    valid_code = totp.now()

    response = client.post("/api/users/verify_otp/", {
        "username": user.username,
        "password": "testpass123",
        "otp_code": valid_code
    }, format="json")

    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
else:
    print("No collaborateur found.")

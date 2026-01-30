
import requests

url = "http://localhost:8000/api/auth/login/"
data = {
    "username": "admin", # Hypothetical
    "password": "password"
}

try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

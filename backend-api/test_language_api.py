#!/usr/bin/env python3
"""
Test script for language API endpoints
"""
import requests
import json

# Get authentication token first
def get_auth_token():
    try:
        response = requests.post('http://localhost:8000/api/auth/login/', {
            'username': 'admin',
            'password': 'admin123'
        })
        if response.status_code == 200:
            return response.json()['access']
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.ConnectionError:
        print("Cannot connect to server. Make sure Django server is running on port 8000")
        return None

def test_language_endpoints():
    # Get authentication token
    token = get_auth_token()
    if not token:
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("Testing language API endpoints...")
    print("=" * 50)
    
    # Test GET user language
    print("\n1. Testing GET /api/auth/get-user-language/")
    try:
        response = requests.get('http://localhost:8000/api/auth/get-user-language/', headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test UPDATE language to French
    print("\n2. Testing PUT /api/auth/update-language/ (French)")
    try:
        response = requests.put('http://localhost:8000/api/auth/update-language/', 
                               json={'language': 'french'}, 
                               headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test UPDATE language to English
    print("\n3. Testing PUT /api/auth/update-language/ (English)")
    try:
        response = requests.put('http://localhost:8000/api/auth/update-language/', 
                               json={'language': 'english'}, 
                               headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test UPDATE language with invalid value
    print("\n4. Testing PUT /api/auth/update-language/ (Invalid language)")
    try:
        response = requests.put('http://localhost:8000/api/auth/update-language/', 
                               json={'language': 'invalid'}, 
                               headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test final GET to verify changes
    print("\n5. Testing final GET /api/auth/get-user-language/")
    try:
        response = requests.get('http://localhost:8000/api/auth/get-user-language/', headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_language_endpoints()
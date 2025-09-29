#!/usr/bin/env python
import requests
import json

def test_qr_api():
    """Test QR API endpoint directly"""
    url = "http://127.0.0.1:8000/api/auth/qr/generate/"
    headers = {
        "Authorization": "Token e229fdcab0b6d4bd7e99fbce539458e48231b21e",
        "Content-Type": "application/json"
    }
    data = {
        "amount": "500",
        "description": "Test peman"
    }
    
    try:
        print("🧪 Testing QR API endpoint...")
        response = requests.post(url, headers=headers, json=data, timeout=10)
        print(f"📡 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success!")
            print(f"📄 QR Data length: {len(result.get('qr_data', ''))}")
            print(f"🖼️ QR Image length: {len(result.get('qr_image', ''))}")
            print(f"📋 Display info: {result.get('display_info', {})}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

if __name__ == "__main__":
    test_qr_api()
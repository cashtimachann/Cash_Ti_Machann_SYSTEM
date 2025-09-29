#!/usr/bin/env python3

import requests
import json

# Test the send money API endpoint
def test_send_money_endpoint():
    url = "http://127.0.0.1:8000/api/transactions/send/"
    
    # Test without authentication (should return 401)
    print("Testing send money endpoint accessibility...")
    
    try:
        response = requests.post(url, json={})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("✅ API endpoint is accessible (requires authentication as expected)")
        elif response.status_code == 404:
            print("❌ API endpoint not found (404 error)")
        else:
            print(f"⚠️ Unexpected status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure Django server is running on port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_send_money_endpoint()
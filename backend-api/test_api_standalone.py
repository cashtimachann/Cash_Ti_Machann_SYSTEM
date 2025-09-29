#!/usr/bin/env python3

import os
import sys
import subprocess
import time

# Test the API endpoint by running a separate process
def test_api():
    try:
        result = subprocess.run([
            'python3', '-c', '''
import requests
try:
    r = requests.post("http://127.0.0.1:8000/api/transactions/send/", json={})
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
    if r.status_code == 401:
        print("✅ API endpoint is working (authentication required)")
    elif r.status_code == 404:
        print("❌ API endpoint not found")
    else:
        print(f"⚠️ Unexpected status: {r.status_code}")
except Exception as e:
    print(f"❌ Error: {e}")
'''
        ], capture_output=True, text=True, timeout=10)
        
        print("STDOUT:")
        print(result.stdout)
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
            
    except subprocess.TimeoutExpired:
        print("Test timed out")
    except Exception as e:
        print(f"Error running test: {e}")

if __name__ == "__main__":
    test_api()
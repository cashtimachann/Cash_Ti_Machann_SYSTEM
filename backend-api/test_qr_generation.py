#!/usr/bin/env python
import os
import django
import sys

# Add the project directory to the Python path
sys.path.append('/Users/herlytache/Desktop/Cash Ti Machann/backend-api')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')

# Configure Django
django.setup()

from accounts.models import User
import qrcode
import json
import base64
from io import BytesIO
from django.utils import timezone

def test_qr_generation():
    """Test QR code generation functionality"""
    try:
        print("🧪 Testing QR Code Generation...")
        
        # Test data
        qr_data = {
            'type': 'payment_request',
            'user_id': '1',
            'phone': '+509 1234 5678',
            'name': 'Test User',
            'amount': '100',
            'description': 'Test payment',
            'timestamp': timezone.now().isoformat()
        }
        
        qr_string = json.dumps(qr_data)
        print(f"📄 QR Data: {qr_string}")
        
        # Generate QR code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_string)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        print(f"🖼️ QR Image created: {type(img)}")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        print(f"📸 Base64 length: {len(img_str)} characters")
        print(f"📸 Base64 preview: {img_str[:50]}...")
        
        print("✅ QR Code generation test successful!")
        return True
        
    except Exception as e:
        print(f"❌ QR generation test failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_qr_generation()
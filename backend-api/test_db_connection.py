#!/usr/bin/env python
"""
Test script to verify database connection
"""
import os
import django
from django.conf import settings
from django.db import connection
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
django.setup()

def test_database_connection():
    """Test the database connection"""
    try:
        with connection.cursor() as cursor:
            # Test basic connection
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            print(f"✅ Connexion à la base de données réussie! Résultat: {result}")
            
            # Get database name
            cursor.execute("SELECT current_database()")
            db_name = cursor.fetchone()[0]
            print(f"✅ Base de données connectée: {db_name}")
            
            # Get PostgreSQL version
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0]
            print(f"✅ Version PostgreSQL: {version.split(',')[0]}")
            
            # Get database configuration from Django settings
            db_config = settings.DATABASES['default']
            print(f"✅ Configuration Django:")
            print(f"   - Engine: {db_config['ENGINE']}")
            print(f"   - Name: {db_config['NAME']}")
            print(f"   - User: {db_config['USER']}")
            print(f"   - Host: {db_config['HOST']}")
            print(f"   - Port: {db_config['PORT']}")
            
            return True
            
    except Exception as e:
        print(f"❌ Erreur de connexion à la base de données: {e}")
        print(f"   Type d'erreur: {type(e).__name__}")
        return False

if __name__ == "__main__":
    print("🔍 Test de connexion à la base de données PostgreSQL...")
    test_database_connection()
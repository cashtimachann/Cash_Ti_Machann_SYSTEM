#!/usr/bin/env python
"""
Script de vérification rapide de la connexion à la base de données
Cash Ti Machann - Digital Financial Services Platform
"""
import os
import django
from django.db import connection
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cash_ti_machann.settings')
django.setup()

def verify_db_connection():
    """Vérification rapide de la connexion à la base de données"""
    try:
        from accounts.models import User
        from transactions.models import Transaction
        
        with connection.cursor() as cursor:
            # Test de base
            cursor.execute("SELECT current_database(), current_user, version()")
            db_info = cursor.fetchone()
            
            print("🏦 Cash Ti Machann - Vérification de la base de données")
            print("=" * 60)
            print(f"✅ Base de données: {db_info[0]}")
            print(f"✅ Utilisateur: {db_info[1]}")
            print(f"✅ Version: {db_info[2].split(',')[0]}")
            print()
            
            # Statistiques
            print("📊 Statistiques:")
            print(f"   - Utilisateurs: {User.objects.count()}")
            print(f"   - Transactions: {Transaction.objects.count()}")
            
            # Test de performance simple
            cursor.execute("SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'")
            active_connections = cursor.fetchone()[0]
            print(f"   - Connexions actives: {active_connections}")
            
            print()
            print("✅ Connexion à cash_timachann_db fonctionnelle!")
            return True
            
    except Exception as e:
        print("❌ Erreur de connexion:")
        print(f"   {e}")
        return False

if __name__ == "__main__":
    verify_db_connection()
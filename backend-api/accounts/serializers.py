from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile, Wallet

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'phone_number', 'user_type', 'is_active']
        read_only_fields = ['id', 'user_type', 'is_active']

class UserProfileSerializer(serializers.ModelSerializer):
    residence_country_code = serializers.SerializerMethodField()
    residence_country_name = serializers.SerializerMethodField()
    country_display = serializers.SerializerMethodField()
    residence_country_display = serializers.SerializerMethodField()
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'date_of_birth', 'address', 'city', 'country',
            'residence_country_code', 'residence_country_name', 'country_display', 'residence_country_display',
            'id_document_type', 'id_document_number', 'verification_status'
        ]
        read_only_fields = ['verification_status']

    def get_residence_country_code(self, obj):
        return obj.residence_country.iso2 if getattr(obj, 'residence_country', None) else None

    def get_residence_country_name(self, obj):
        if getattr(obj, 'residence_country', None):
            return obj.residence_country.name
        return None

    def get_country_display(self, obj):
        rc = getattr(obj, 'residence_country', None)
        if rc:
            return rc.name_kreol or rc.name
        return obj.country

    def get_residence_country_display(self, obj):
        rc = getattr(obj, 'residence_country', None)
        if rc:
            # Prefer Kreyòl if available, include ISO2 in parentheses
            base = rc.name_kreol or rc.name
            return f"{base} ({rc.iso2})"
        if obj.country:
            return obj.country
        return None

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['balance', 'currency']
        read_only_fields = ['balance']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    # Profile fields
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    date_of_birth = serializers.DateField()
    address = serializers.CharField(max_length=255, required=False)
    city = serializers.CharField(max_length=100, required=False)
    country = serializers.CharField(max_length=100, required=False, default='Haiti')

    class Meta:
        model = User
        fields = ['email', 'phone_number', 'first_name', 'last_name', 'date_of_birth', 'password', 'password_confirm', 
                 'address', 'city', 'country']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Mo de pas yo pa menm bagay la'
            })
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Yon kont deja egziste ak email sa a. Ou ka konekte ak kont ou ki egziste deja a.')
        return value

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError('Yon kont deja egziste ak nimewo telefòn sa a. Ou ka konekte ak kont ou ki egziste deja a.')
        return value

    def create(self, validated_data):
        # Remove password_confirm and profile fields
        password_confirm = validated_data.pop('password_confirm')
        profile_data = {
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'date_of_birth': validated_data.pop('date_of_birth'),
            'address': validated_data.pop('address', ''),
            'city': validated_data.pop('city', ''),
            'country': validated_data.pop('country', 'Haiti'),
        }

        # Create user
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        # Create profile
        UserProfile.objects.create(user=user, **profile_data)
        
        # Create wallet
        Wallet.objects.create(user=user)

        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])

class VerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)
    code = serializers.CharField(max_length=6)

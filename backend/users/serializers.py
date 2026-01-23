"""
Sérialiseurs pour l'API Users.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour le modèle User.
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'role', 'phone', 'department', 'is_admin',
            'is_active_user', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la création d'utilisateurs avec mot de passe.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'phone', 'department'
        )
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la mise à jour des utilisateurs.
    """
    class Meta:
        model = User
        fields = (
            'email', 'first_name', 'last_name', 'role', 
            'phone', 'department', 'is_active_user'
        )


class ChangePasswordSerializer(serializers.Serializer):
    """
    Sérialiseur pour changer le mot de passe.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Les mots de passe ne correspondent pas."})
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Personnalisation du token JWT pour inclure les infos utilisateur.
    """
    def validate(self, attrs):
        # Authentification standard (username/password)
        data = super().validate(attrs)
        
        # Vérifier si la 2FA est activée pour cet utilisateur
        if self.user.two_factor_enabled:
            # Si activée, on ne renvoie PAS encore les tokens
            # On renvoie une réponse spéciale indiquant que la 2FA est requise
            return {
                'two_factor_required': True,
                'email': self.user.email,
                'username': self.user.username
            }
        
        # Sinon, flux standard : ajouter les infos utilisateur dans la réponse
        data['user'] = UserSerializer(self.user).data
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Ajout des claims personnalisés
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['is_admin'] = user.is_active_user and user.role == 'ADMIN'

        return token


class VerifyOTPSerializer(serializers.Serializer):
    """
    Sérialiseur pour la vérification du code OTP.
    """
    username = serializers.CharField()
    password = serializers.CharField() # Pour re-vérifier ou utiliser un cache
    otp_code = serializers.CharField(max_length=6, min_length=6)

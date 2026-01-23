"""
Vues API pour la gestion des utilisateurs.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import update_session_auth_hash
from .models import User
from .permissions import IsAdminRole
from .serializers import (
    UserSerializer, 
    UserCreateSerializer, 
    UserUpdateSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    UserCreateSerializer, 
    UserUpdateSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    VerifyOTPSerializer
)
from .role_serializers import RolePermissionSerializer
from .models import RolePermission
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
import pyotp
import qrcode
import io
import base64


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vue pour obtenir le token JWT personnalisé.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]  # Permet l'accès sans authentification


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les utilisateurs.
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        """
        Permissions personnalisées selon les actions.
        """
        # Seul un admin peut voir la liste, créer ou supprimer des utilisateurs
        # Pour voir/modifier un profil spécifique, on pourrait affiner avec IsAdminOrSelf
        if self.action in ['list', 'create', 'destroy', 'update', 'partial_update']:
            return [IsAdminRole()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['GET'])
    def me(self, request):
        """
        Récupère les informations de l'utilisateur connecté.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['POST'])
    def change_password(self, request, pk=None):
        """
        Change le mot de passe d'un utilisateur.
        """
        user = self.get_object()
        
        # Seul l'utilisateur lui-même ou un admin peut changer le mot de passe
        if request.user != user and not request.user.is_admin:
            return Response(
                {'detail': 'Vous n\'avez pas la permission de modifier ce mot de passe.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            # Vérifier l'ancien mot de passe
            if not user.check_password(serializer.data.get('old_password')):
                return Response(
                    {'old_password': 'Mot de passe incorrect.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Définir le nouveau mot de passe
            user.set_password(serializer.data.get('new_password'))
            user.save()
            
            # Mettre à jour la session pour éviter la déconnexion
            update_session_auth_hash(request, user)
            
            return Response({'detail': 'Mot de passe modifié avec succès.'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['POST'])
    def deactivate(self, request, pk=None):
        """
        Désactive un utilisateur.
        """
        if not request.user.role == 'ADMIN':
            return Response(
                {'detail': 'Vous n\'avez pas la permission de désactiver un utilisateur.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        user.is_active_user = False
        user.save()
        return Response({'detail': 'Utilisateur désactivé avec succès.'})
    
    @action(detail=True, methods=['POST'])
    def activate(self, request, pk=None):
        """
        Active un utilisateur.
        """
        if not request.user.role == 'ADMIN':
            return Response(
                {'detail': 'Vous n\'avez pas la permission d\'activer un utilisateur.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        user.is_active_user = True
        user.save()
        return Response({'detail': 'Utilisateur activé avec succès.'})

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def setup_2fa(self, request):
        """
        Génère un secret 2FA et renvoie le QR Code.
        """
        user = request.user
        if not user.two_factor_secret:
            user.two_factor_secret = pyotp.random_base32()
            user.save()

        otp_uri = pyotp.totp.TOTP(user.two_factor_secret).provisioning_uri(
            name=user.email,
            issuer_name="LegalDoc Suite"
        )

        # Générer QR Code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(otp_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code_base64 = base64.b64encode(buffered.getvalue()).decode()

        return Response({
            'secret': user.two_factor_secret,
            'qr_code': f"data:image/png;base64,{qr_code_base64}"
        })

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def confirm_2fa(self, request):
        """
        Confirme et active la 2FA pour l'utilisateur.
        """
        otp_code = request.data.get('otp_code')
        user = request.user
        
        if not user.two_factor_secret:
            return Response({'detail': '2FA non configurée.'}, status=status.HTTP_400_BAD_REQUEST)
        
        totp = pyotp.TOTP(user.two_factor_secret)
        if totp.verify(otp_code):
            user.two_factor_enabled = True
            user.save()
            return Response({'detail': '2FA activée avec succès.'})
        else:
            return Response({'detail': 'Code invalide.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['POST'], permission_classes=[AllowAny])
    def verify_otp(self, request):
        """
        Vérifie le code OTP lors du login (2ème étape).
        """
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            otp_code = serializer.validated_data['otp_code']
            
            try:
                user = User.objects.get(username=username)
                # Re-vérifier le mot de passe par sécurité
                if not user.check_password(password):
                    return Response({'detail': 'Identifiants invalides.'}, status=status.HTTP_401_UNAUTHORIZED)
                
                if not user.two_factor_enabled:
                    return Response({'detail': '2FA non activée.'}, status=status.HTTP_400_BAD_REQUEST)
                
                totp = pyotp.TOTP(user.two_factor_secret)
                if totp.verify(otp_code):
                    # Générer les tokens JWT
                    refresh = RefreshToken.for_user(user)
                    
                    # Inclure les infos utilisateur comme dans le CustomTokenObtainPairSerializer
                    user_data = UserSerializer(user).data
                    
                    return Response({
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user': user_data
                    })
                else:
                    return Response({'otp_code': 'Code invalide.'}, status=status.HTTP_400_BAD_REQUEST)
                    
            except User.DoesNotExist:
                return Response({'detail': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def disable_2fa(self, request):
        """
        Désactive la 2FA.
        """
        password = request.data.get('password')
        user = request.user
        
        if not user.check_password(password):
            return Response({'password': 'Mot de passe incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
            
class RolePermissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les permissions par rôle.
    Seul l'admin peut modifier.
    """
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    @action(detail=False, methods=['POST'], url_path='init-defaults')
    def init_defaults(self, request):
        """Initialise les permissions par défaut si elles n'existent pas."""
        defaults = {
            'ADMIN': {
                'can_manage_users': True,
                'can_view_fees': True,
                'can_manage_cases': True,
                'can_delete_cases': True,
                'can_manage_documents': True, # Tout voir et modifier
                'can_delete_documents': True,
                'can_view_dashboard_stats': True,
                'can_access_audit_log': True
            },
            'AVOCAT': {
                'can_manage_users': False,
                'can_view_fees': True,
                'can_manage_cases': True,
                'can_delete_cases': False,
                'can_manage_documents': True,
                'can_delete_documents': True,
                'can_view_dashboard_stats': True,
                'can_access_audit_log': False
            },
            'COLLABORATEUR': {
                'can_manage_users': False,
                'can_view_fees': False, # Par défaut masqué
                'can_manage_cases': True,
                'can_delete_cases': False,
                'can_manage_documents': True,
                'can_delete_documents': False,
                'can_view_dashboard_stats': False,
                'can_access_audit_log': False
            },
            'SECRETAIRE': {
                'can_manage_users': False,
                'can_view_fees': False,
                'can_manage_cases': True, # Peut créer/modifier dossiers
                'can_delete_cases': False,
                'can_manage_documents': True, # Peut ajouter docs
                'can_delete_documents': False,
                'can_view_dashboard_stats': False,
                'can_access_audit_log': False
            },
            'CLIENT': {
                'can_manage_users': False,
                'can_view_fees': False,
                'can_manage_cases': False, # Lecture seule
                'can_delete_cases': False,
                'can_manage_documents': False, # Lecture seule
                'can_delete_documents': False,
                'can_view_dashboard_stats': False,
                'can_access_audit_log': False
            }
        }

        created_count = 0
        for role, perms in defaults.items():
            obj, created = RolePermission.objects.get_or_create(role=role)
            if created or not obj.permissions:
                obj.permissions = perms
                obj.save()
                created_count += 1
        
        return Response({'detail': f'{created_count} rôles initialisés.'})

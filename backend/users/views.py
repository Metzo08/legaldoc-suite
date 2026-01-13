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
    CustomTokenObtainPairSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView


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

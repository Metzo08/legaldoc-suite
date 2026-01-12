from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Cabinet, TeamMember
from .serializers import CabinetSerializer, TeamMemberSerializer

class PublicCabinetInfoView(APIView):
    """
    API Publique pour récupérer les infos du cabinet (Branding + Team)
    pour la page de login/landing. Pas d'auth requise.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cabinet = Cabinet.load()
        team = TeamMember.objects.filter(is_active=True).order_by('order')
        
        cabinet_data = CabinetSerializer(cabinet, context={'request': request}).data
        
        return Response({
            'branding': {
                'name': cabinet_data.get('name'),
                'description': cabinet_data.get('description'),
                'logo': cabinet_data.get('logo'),
                'primary_color': cabinet_data.get('primary_color'),
                'secondary_color': cabinet_data.get('secondary_color'),
            },
            'contact': {
                'address': cabinet_data.get('address'),
                'phone': cabinet_data.get('phone'),
                'fax': cabinet_data.get('fax'),
                'cel': cabinet_data.get('cel'),
                'email': cabinet_data.get('email'),
                'website': cabinet_data.get('website'),
                'opening_hours': cabinet_data.get('opening_hours'),
            },
            'team': TeamMemberSerializer(team, many=True, context={'request': request}).data
        })

class CabinetSettingsView(generics.RetrieveUpdateAPIView):
    """
    Gestion des paramètres du cabinet (Admin only).
    """
    queryset = Cabinet.objects.all()
    serializer_class = CabinetSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)

    def get_object(self):
        return Cabinet.load()

class TeamMemberViewSet(viewsets.ModelViewSet):
    """
    Gestion de l'équipe (Admin only).
    """
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)

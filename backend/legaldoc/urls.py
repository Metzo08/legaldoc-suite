"""
Configuration des URLs pour LegalDoc Suite.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from users.views import CustomTokenObtainPairView
from django.views.generic import RedirectView

urlpatterns = [
    # Redirection de la racine vers l'admin
    path('', RedirectView.as_view(url='admin/', permanent=False)),
    
    # Administration Django
    path('admin/', admin.site.urls),
    
    # Authentification JWT
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API de l'application
    path('api/users/', include('users.urls')),
    path('api/documents/', include('documents.urls')),
    path('api/cabinet/', include('cabinet.urls')),
    path('api/debug/status/', include('users.debug_urls')),
    
    # Documentation API
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Servir les fichiers média en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Diagnostics block
import os
from django.db.models import Q
try:
    from documents.models import Case, Client
    inspect_path = os.path.join(settings.MEDIA_ROOT, 'inspect_results.txt')
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    with open(inspect_path, 'w', encoding='utf-8') as f:
        f.write("=== DIAGNOSTICS DE BASE DE DONNEES ===\n")
        
        # 1. Search cases
        f.write("\n--- RECHERCHE DOSSIERS ---\n")
        search_terms = ['Bayo', 'Kecouto', 'Kekouto', '6155']
        for term in search_terms:
            f.write(f"\nRecherche '{term}':\n")
            cases = Case.objects.filter(
                Q(title__icontains=term) |
                Q(reference__icontains=term) |
                Q(represented_party__icontains=term) |
                Q(adverse_party__icontains=term)
            )
            f.write(f"Trouve: {cases.count()} dossiers\n")
            for c in cases:
                f.write(f" - ID: {c.id} | Ref: {c.reference} | Titre: {c.title} | Categorie: {c.category} | Client: {c.client.name} (ID: {c.client.id}) | Represented: {c.represented_party} | Adverse: {c.adverse_party}\n")
                
        # 2. Search clients
        f.write("\n--- RECHERCHE CLIENTS ---\n")
        for term in search_terms[:-1]:
            f.write(f"\nRecherche '{term}':\n")
            clients = Client.objects.filter(name__icontains=term)
            f.write(f"Trouve: {clients.count()} clients\n")
            for cl in clients:
                f.write(f" - ID: {cl.id} | Nom: {cl.name} | Type: {cl.client_type}\n")
                
        # 3. Derniers dossiers crees
        f.write("\n--- 10 DERNIERS DOSSIERS CREES ---\n")
        last_cases = Case.objects.order_by('-created_at')[:10]
        for c in last_cases:
            f.write(f" - ID: {c.id} | Ref: {c.reference} | Titre: {c.title} | Categorie: {c.category} | Client: {c.client.name}\n")
            
        # 4. Dry-run Case creation test
        f.write("\n--- DUMMY CASE CREATION TEST ---\n")
        import traceback
        try:
            from documents.serializers import CaseListSerializer
            from django.contrib.auth import get_user_model
            User = get_user_model()
            admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()
            
            # Let's prepare a test payload similar to what the frontend sends
            test_payload = {
                'title': 'Test Creation Bug',
                'reference': '',
                'client': 65, # Kécouta BAYO
                'category': 'CIVIL',
                'opened_date': '2026-07-06',
                'represented_party': 'Test Represented',
                'adverse_party': 'Test Adverse',
                'status': 'OUVERT'
            }
            
            class MockRequest:
                def __init__(self, user):
                    self.user = user
            
            serializer = CaseListSerializer(data=test_payload, context={'request': MockRequest(admin_user)})
            if serializer.is_valid():
                try:
                    from django.db import transaction
                    with transaction.atomic():
                        case = serializer.save(created_by=admin_user)
                        f.write(f"Dry-run case save succeeded: ID {case.id}, Ref: {case.reference}\n")
                        transaction.set_rollback(True)
                except Exception as e_save:
                    f.write(f"Dry-run case save failed: {str(e_save)}\n{traceback.format_exc()}\n")
            else:
                f.write(f"Dry-run serializer invalid: {serializer.errors}\n")
        except Exception as e_test:
            f.write(f"Dry-run test setup failed: {str(e_test)}\n{traceback.format_exc()}\n")
            
        # 5. Last 150 lines of debug.log
        f.write("\n--- LAST 150 LINES OF DEBUG.LOG ---\n")
        debug_log_path = os.path.join(settings.BASE_DIR, 'debug.log')
        if os.path.exists(debug_log_path):
            with open(debug_log_path, 'r', encoding='utf-8', errors='ignore') as log_f:
                lines = log_f.readlines()
                f.write(f"Total lines in debug.log: {len(lines)}\n")
                last_lines = lines[-150:]
                f.writelines(last_lines)
        else:
            f.write("debug.log not found\n")
            
        f.write("\n=== FIN DIAGNOSTICS ===\n")
except Exception as e:
    import traceback
    try:
        inspect_path = os.path.join(settings.MEDIA_ROOT, 'inspect_results.txt')
        with open(inspect_path, 'w', encoding='utf-8') as f:
            f.write(f"Erreur diagnostics: {str(e)}\n{traceback.format_exc()}")
    except:
        pass

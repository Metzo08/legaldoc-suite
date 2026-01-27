#!/bin/bash

# Script de déploiement automatique pour LegalDoc Suite sur VPS
# Usage: ./deploy.sh

echo "🚀 Démarrage du déploiement..."

# 1. Récupérer les dernières modifications
echo "📥 Récupération du code (git pull)..."
git pull origin main

# 2. Reconstruire et relancer les conteneurs Docker
echo "🔄 Reconstruction des conteneurs (docker compose build)..."
docker compose down
docker compose up -d --build

# 3. Appliquer les migrations de base de données
echo "🗃️ Application des migrations (migrate)..."
docker compose exec -T backend python manage.py migrate

# 4. Collecter les fichiers statiques (si utilisation de nginx/static)
echo "🎨 Collecte des fichiers statiques..."
docker compose exec -T backend python manage.py collectstatic --noinput

echo "✅ Déploiement terminé avec succès !"

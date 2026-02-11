#!/bin/bash

# Script de mise à jour pour le VPS Hostinger (Docker)
# Exécuter depuis /var/www/legaldoc sur le VPS
set -e

echo "🚀 Démarrage de la mise à jour LegalDoc Suite..."
echo "================================================="

# 1. Récupérer le code depuis GitHub
echo ""
echo "📥 [1/4] Git Pull..."
git pull origin main
echo "✅ Code récupéré."

# 2. Rebuilder les images Docker (pour installer les nouvelles dépendances)
echo ""
echo "🔨 [2/4] Rebuild des conteneurs (peut prendre quelques minutes)..."
docker compose up -d --build
echo "✅ Conteneurs reconstruits et relancés."

# 3. Appliquer les migrations Django
echo ""
echo "🗄️  [3/4] Migrations base de données..."
docker compose exec -T backend python manage.py migrate --noinput
echo "✅ Migrations appliquées."

# 4. Vérifier l'état
echo ""
echo "� [4/4] État des services :"
docker compose ps

echo ""
echo "================================================="
echo "✅ Mise à jour terminée avec succès !"
echo "🌐 Site : https://cabinetmaitreibrahimambengue.cloud"
echo "================================================="

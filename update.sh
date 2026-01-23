#!/bin/bash

# Arrêter le script en cas d'erreur
set -e

echo "🚀 Démarrage de la mise à jour..."

# 1. Récupérer le code
echo "📥 Git Pull..."
git pull origin main

# 2. Mise à jour Backend
echo "🐘 Mise à jour Backend..."
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
else
    # Tentative de création si absent
    echo "⚠️ venv non activé, tentative..."
    source ../venv/bin/activate 2>/dev/null || true
fi

# Migration DB
python manage.py migrate
python manage.py collectstatic --noinput

# 3. Mise à jour Frontend
echo "⚛️ Mise à jour Frontend..."
cd ../frontend
npm install
npm run build

echo "✅ Build terminé."
echo "🔄 Si vous utilisez Supervisor/Gunicorn, lancez : sudo supervisorctl restart all"

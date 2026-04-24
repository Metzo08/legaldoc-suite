#!/bin/bash

# Script de maintenance SSL robuste pour LegalDoc Suite
# Ce script détecte automatiquement le dossier de certificat actif et met à jour Nginx.

DOMAIN="cabinetmaitreibrahimambengue.cloud"
PROJECT_DIR="/var/www/legaldoc"

cd $PROJECT_DIR

echo "--- $(date) : Démarrage de la maintenance SSL ---"

# 1. Tentative de renouvellement
docker compose run --rm certbot renew

# 2. Détection du dossier le plus récent dans certbot/conf/live/
# On cherche les dossiers qui contiennent fullchain.pem
LATEST_CERT_DIR=$(ls -td certbot/conf/live/$DOMAIN*/ 2>/dev/null | head -n 1)

if [ -z "$LATEST_CERT_DIR" ]; then
    echo "❌ Erreur : Aucun dossier de certificat trouvé pour $DOMAIN"
    exit 1
fi

CERT_FOLDER_NAME=$(basename $LATEST_CERT_DIR)
echo "✅ Dossier de certificat actif détecté : $CERT_FOLDER_NAME"

# 3. Vérification et mise à jour de la configuration Nginx si nécessaire
CONFIG_FILE="nginx/nginx_ssl.conf"

if grep -q "$CERT_FOLDER_NAME" "$CONFIG_FILE"; then
    echo "ℹ️ La configuration Nginx pointe déjà vers le bon dossier."
else
    echo "🔄 Mise à jour de la configuration Nginx vers $CERT_FOLDER_NAME..."
    # Remplacement de l'ancien dossier (quel qu'il soit) par le nouveau détecté
    sed -i "s/live\/$DOMAIN[^/]*\//live\/$CERT_FOLDER_NAME\//g" $CONFIG_FILE
    cp $CONFIG_FILE nginx/nginx.conf
    
    echo "🔄 Redémarrage de Nginx pour appliquer les changements..."
    docker compose restart nginx
fi

echo "--- Maintenance SSL terminée ---"

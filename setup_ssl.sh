#!/bin/bash

# Guide d'installation SSL pour LegalDoc Suite

echo "🚀 Démarrage de la configuration SSL..."

# 1. Préparation des dossiers
echo "📂 Création des dossiers certbot..."
mkdir -p certbot/conf
mkdir -p certbot/www

# 2. Mise à jour de nginx pour le challenge ACME
echo "🔄 Mise à jour de Nginx..."
docker-compose up -d nginx

echo "⏳ Attente de 10 secondes pour le démarrage de Nginx..."
sleep 10

# 3. Génération des certificats
echo "🔐 Demande de certificat via Certbot..."
docker-compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot --email maitreimbengue@gmail.com --agree-tos --no-eff-email -d cabinetmaitreibrahimambengue.cloud

# 4. Activation du SSL
if [ -d "certbot/conf/live/cabinetmaitreibrahimambengue.cloud" ]; then
    echo "✅ Certificats obtenus avec succès !"
    
    echo "📝 Activation de la configuration SSL..."
    cp nginx/nginx_ssl.conf nginx/nginx.conf
    
    echo "🔄 Redémarrage de Nginx..."
    docker-compose restart nginx
    
    echo "🎉 Félicitations ! Votre site est maintenant sécurisé (HTTPS)."
    echo "👉 https://cabinetmaitreibrahimambengue.cloud"
else
    echo "❌ Erreur : La génération du certificat a échoué."
    echo "Vérifiez que le domaine pointe bien vers ce serveur (82.29.168.215) et que le port 80 est ouvert."
fi

Write-Host "🚀 Démarrage du déploiement sur le VPS..."

# Commande SSH pour exécuter le déploiement à distance
# Nous supposons que le dossier s'appelle 'LegalDoc-Suite' et est dans le dossier home de l'utilisateur root.
# Si le chemin est différent, veuillez modifier la partie 'cd LegalDoc-Suite'
ssh root@82.29.168.215 "cd LegalDoc-Suite && git pull origin main && chmod +x deploy.sh && ./deploy.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Déploiement terminé avec succès !" -ForegroundColor Green
}
else {
    Write-Host "❌ Erreur lors du déploiement. Vérifiez la connexion SSH ou le chemin du dossier." -ForegroundColor Red
}

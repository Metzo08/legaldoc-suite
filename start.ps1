# Script de démarrage rapide pour Windows
# LegalDoc Suite - Quick Start

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  LegalDoc Suite - Démarrage" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si PostgreSQL est démarré
Write-Host "1. Vérification de PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "   ✓ PostgreSQL est démarré" -ForegroundColor Green
    } else {
        Write-Host "   ! PostgreSQL n'est pas démarré. Démarrage..." -ForegroundColor Red
        Start-Service $pgService.Name
    }
} else {
    Write-Host "   ! Service PostgreSQL non trouvé" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Démarrage du backend Django..." -ForegroundColor Yellow

# Démarrer le backend dans un nouveau terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; .\venv\Scripts\Activate.ps1; python manage.py runserver"

Write-Host "   ✓ Backend démarré sur http://localhost:8000" -ForegroundColor Green

Write-Host ""
Write-Host "3. Démarrage du frontend React..." -ForegroundColor Yellow

# Attendre 3 secondes
Start-Sleep -Seconds 3

# Démarrer le frontend dans un nouveau terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm start"

Write-Host "   ✓ Frontend démarré sur http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Application démarrée !" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ouvrez votre navigateur à l'adresse: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour quitter..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

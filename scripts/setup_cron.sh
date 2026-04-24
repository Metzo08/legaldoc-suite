#!/bin/bash

# Configuration de la tâche Cron pour LegalDoc Suite
# Ce script automatise la maintenance SSL.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
MAINTAIN_SCRIPT="$SCRIPT_DIR/maintain_ssl.sh"

# Donner les droits d'exécution
chmod +x "$MAINTAIN_SCRIPT"

# Ajouter à la crontab si non présent (vérification tous les 1er du mois à 3h00)
CRON_JOB="0 3 1 * * /bin/bash $MAINTAIN_SCRIPT >> /var/log/legaldoc_ssl_maintenance.log 2>&1"

(crontab -l 2>/dev/null | grep -Fv "$MAINTAIN_SCRIPT"; echo "$CRON_JOB") | crontab -

echo "✅ Tâche Cron configurée avec succès."
echo "La maintenance SSL sera exécutée le 1er de chaque mois à 03h00."
echo "Les logs seront disponibles dans /var/log/legaldoc_ssl_maintenance.log"

# 🚀 Guide de Déploiement sur VPS

Ce guide explique comment mettre à jour votre instance Legaldoc Suite sur votre serveur VPS après avoir poussé des modifications sur GitHub.

## Prérequis

*   Accès SSH à votre VPS.
*   Le projet doit déjà être cloné sur le VPS.
*   Docker et Docker Compose doivent être installés.

## Méthode Rapide (Via Script)

Nous avons ajouté un script `deploy.sh` à la racine du projet.

1.  **Connectez-vous à votre VPS :**
    ```bash
    ssh user@votre-ip-vps
    ```

2.  **Allez dans le dossier du projet :**
    ```bash
    cd /chemin/vers/LegalDoc-Suite
    ```

3.  **Rendez le script exécutable (une seule fois) :**
    ```bash
    chmod +x deploy.sh
    ```

4.  **Lancez le déploiement :**
    ```bash
    ./deploy.sh
    ```

---

## Méthode Manuelle (Étape par étape)

Si vous préférez exécuter les commandes manuellement :

1.  **Récupérer le nouveau code :**
    ```bash
    git pull origin main
    ```

2.  **Arrêter les conteneurs existants (recommandé pour éviter les conflits) :**
    ```bash
    docker compose down
    ```

3.  **Reconstruire et relancer les services (Frontend & Backend) :**
    Cette étape est cruciale car nous avons modifié le Frontend (React) et ajouté des dépendances Backend.
    ```bash
    docker compose up -d --build
    ```

4.  **Appliquer les migrations de base de données :**
    Nécessaire pour créer la table `Task`.
    ```bash
    docker compose exec backend python manage.py migrate
    ```

5.  **Vérifier que tout fonctionne :**
    ```bash
    docker compose ps
    docker compose logs -f backend
    ```

## En cas de problème

*   **Erreur lors du git pull** : Vérifiez si vous avez des fichiers modifiés localement sur le VPS (`git status`). Si oui, et que vous voulez les écraser : `git reset --hard origin/main`.
*   **Erreur Frontend** : Si la nouvelle page ne s'affiche pas, forcez le rafraîchissement du cache navigateur (CTRL+F5).

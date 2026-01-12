# Guide d'Installation - LegalDoc Suite

Ce guide détaille l'installation et la configuration de LegalDoc Suite sur votre système.

## Prérequis

### Logiciels Requis

- **Python 3.11+** - [Télécharger Python](https://www.python.org/downloads/)
- **Node.js 18+** - [Télécharger Node.js](https://nodejs.org/)
- **PostgreSQL 15+** - [Télécharger PostgreSQL](https://www.postgresql.org/download/)
- **Tesseract OCR** - [Guide d'installation Tesseract](#installation-tesseract)
- **Git** (optionnel) - Pour cloner le projet

### Installation de Tesseract OCR

#### Windows
1. Télécharger l'installateur depuis [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
2. Exécuter l'installateur
3. Ajouter le chemin d'installation (par défaut `C:\Program Files\Tesseract-OCR`) à votre PATH

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install tesseract-ocr tesseract-ocr-fra
```

#### MacOS
```bash
brew install tesseract tesseract-lang
```

---

## Installation

### Étape 1 : Créer la Base de Données PostgreSQL

Ouvrir `psql` ou un client PostgreSQL et exécuter :

```sql
CREATE DATABASE legaldoc;
CREATE USER legaldoc_user WITH PASSWORD 'votre_mot_de_passe_sécurisé';
GRANT ALL PRIVILEGES ON DATABASE legaldoc TO legaldoc_user;
```

### Étape 2 : Configuration du Backend Django

```bash
# Naviguer vers le dossier backend
cd "C:\Users\hp\Downloads\LegalDoc Suite\backend"

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### Étape 3 : Configuration des Variables d'Environnement

Créer un fichier `.env` dans le dossier `backend/` :

```env
SECRET_KEY=votre-cle-secrete-django-tres-securisee-changez-moi
DEBUG=True
DATABASE_NAME=legaldoc
DATABASE_USER=legaldoc_user
DATABASE_PASSWORD=votre_mot_de_passe_sécurisé
DATABASE_HOST=localhost
DATABASE_PORT=5432
ENCRYPTION_KEY=une-cle-de-32-caracteres-minimum-pour-chiffrement-aes256!
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
TESSERACT_CMD=tesseract
# Windows: TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### Étape 4 : Initialiser la Base de Données

```bash
# Toujours dans le dossier backend avec l'environnement virtuel activé
python manage.py migrate
python manage.py createsuperuser
```

Suivre les instructions pour créer un compte administrateur.

### Étape 5 : Configuration du Frontend React

Ouvrir un nouveau terminal :

```bash
# Naviguer vers le dossier frontend
cd "C:\Users\hp\Downloads\LegalDoc Suite\frontend"

# Installer les dépendances
npm install
```

Créer un fichier `.env` dans le dossier `frontend/` :

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_NAME=LegalDoc Suite
```

---

## Lancement de l'Application

### Démarrer le Backend

Dans un terminal (avec l'environnement virtuel activé) :

```bash
cd backend
python manage.py runserver
```

Le backend sera accessible sur : **http://localhost:8000**  
L'admin Django sera sur : **http://localhost:8000/admin**

### Démarrer le Frontend

Dans un second terminal :

```bash
cd frontend
npm start
```

Le frontend sera accessible sur : **http://localhost:3000**

---

## Premier Test

1. Ouvrir votre navigateur à l'adresse **http://localhost:3000**
2. Vous serez redirigé vers la page de connexion
3. Utiliser les identifiants du superutilisateur créé précédemment
4. Vous devriez voir le tableau de bord

---

## Dépannage

### Erreur : "Port already in use"
- Backend (port 8000) : Arrêter les autres processus sur ce port ou utiliser `python manage.py runserver 8001`
- Frontend (port 3000) : Le terminal vous proposera automatiquement le port 3001

### Erreur : "Database connection failed"
- Vérifier que PostgreSQL est démarré
- Vérifier les credentials dans le fichier `.env`
- Tester la connexion avec `psql -U legaldoc_user -d legaldoc`

### Erreur : "Tesseract  not found"
- Vérifier l'installation de Tesseract
- Vérifier le chemin dans `TESSERACT_CMD` dans le `.env`
- Tester en ligne de commande : `tesseract --version`

### Erreur de CORS
- Vérifier que `CORS_ALLOWED_ORIGINS` dans `backend/.env` contient l'URL du frontend
- Redémarrer le serveur backend après modification

---

## Configuration pour Production

⚠️ **IMPORTANT** : Ne jamais déployer en production avec `DEBUG=True`

### Checklist de Sécurité

1. ✅ Générer une nouvelle `SECRET_KEY` forte et unique
2. ✅ Définir `DEBUG=False` dans le `.env`
3. ✅ Configurer `ALLOWED_HOSTS` avec votre domaine
4. ✅ Utiliser HTTPS (SSL/TLS)
5. ✅ Configurer un serveur web (Nginx, Apache)
6. ✅ Utiliser Gunicorn ou uWSGI pour servir Django
7. ✅ Configurer les sauvegardes automatiques de la base de données
8. ✅ Activer un pare-feu
9. ✅ Mettre en place un système de monitoring

Consulter le fichier `DEPLOYMENT.md` pour plus de détails sur le déploiement en production.

---

## Support

Pour toute question ou problème :
- 📧 Email : support@legaldoc-suite.com
- 📚 Documentation : Consulter les fichiers dans le dossier `docs/`

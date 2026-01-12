# LegalDoc Suite v2.0 - README

## 🎯 Plateforme de Gestion Documentaire pour Cabinets d'Avocats

LegalDoc Suite est une solution complète et moderne de gestion documentaire conçue spécifiquement pour les cabinets d'avocats.

## ✨ Fonctionnalités Principales

### Gestion Documentaire
- 📄 Upload de documents (drag & drop)
- 🔍 OCR automatique (Tesseract)
- 🔎 Recherche plein-texte PostgreSQL
- 📁 Organisation par dossiers et clients
- 🏷️ **Système de tags avec couleurs**
- 📝 **Versions de documents**

### Gestion des Affaires
- 👥 Gestion des clients
- 📁 Gestion des dossiers juridiques
- 📅 **Échéances et rappels**
- 📊 Tableau de bord avec statistiques

### Sécurité & Conformité
- 🔐 Authentification JWT
- 👤 Gestion des utilisateurs et rôles
- 📋 Journal d'audit complet
- 🔒 Permissions granulaires
- ✅ RGPD ready

### Interface Moderne
- 🎨 Mode sombre/clair
- 🔔 Centre de notifications
- 📱 Design responsive
- ⚡ Animations fluides

## 🚀 Démarrage Rapide

### Prérequis
- Python 3.10+
- Node.js 16+
- PostgreSQL 15+
- Tesseract OCR

### Installation

**Backend** :
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend** :
```bash
cd frontend
npm install
npm start
```

### Accès
- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- Login : `admin` / `Admin123!`

## 📚 Documentation

- [Guide Utilisateur Complet](docs/GUIDE_UTILISATEUR.md)
- [Guide de Démarrage Rapide](docs/QUICK_START.md)
- [Installation](docs/INSTALLATION.md)

## 🎯 Nouveautés v2.0

### Échéances
- Gestion complète des échéances juridiques
- 5 types : Audience, Dépôt, Réponse, Délai, Autre
- Indicateurs visuels de statut
- Rappels configurables
- Filtrage avancé

### Tags
- Système de tags avec couleurs personnalisables
- 10 couleurs prédéfinies
- Statistiques d'utilisation
- Filtrage par tags

### Versions de Documents
- Historique complet des versions
- Numérotation automatique
- Commentaires par version
- API complète

## 🛠️ Technologies

**Backend** :
- Django 6.0
- Django REST Framework
- PostgreSQL (full-text search)
- Tesseract OCR
- JWT Authentication

**Frontend** :
- React 18
- Material-UI v5
- React Router v6
- Axios

## 👥 Utilisateurs de Démonstration

| Username | Password | Rôle |
|----------|----------|------|
| admin | Admin123! | Administrateur |
| sophie.bernard | Avocat123! | Avocat |
| pierre.dubois | Avocat123! | Avocat |
| julie.petit | Collab123! | Collaborateur |
| marc.roux | Secret123! | Secrétaire |
| lea.moreau | Stage123! | Stagiaire |

## 📊 Structure

```
LegalDoc Suite/
├── backend/           # Django API
│   ├── documents/     # App principale
│   ├── users/         # Gestion utilisateurs
│   └── legaldoc/      # Configuration
├── frontend/          # React App
│   ├── src/
│   │   ├── pages/     # Pages (Dashboard, Clients, etc.)
│   │   ├── components/# Composants réutilisables
│   │   └── services/  # API services
│   └── public/
└── docs/              # Documentation
```

## 🔌 APIs Principales

```
/api/clients/          # Gestion clients
/api/cases/            # Gestion dossiers
/api/documents/        # Gestion documents
/api/deadlines/        # Échéances ✨
/api/tags/             # Tags ✨
/api/versions/         # Versions documents ✨
/api/users/            # Utilisateurs
/api/audit/            # Journal d'audit
```

## 🎨 Captures d'Écran

- Mode clair/sombre
- Dashboard avec statistiques
- Gestion des échéances
- Système de tags
- Recherche plein-texte

## 🔒 Sécurité

- Authentification JWT avec refresh tokens
- Permissions granulaires par rôle
- Journal d'audit de toutes les actions
- Chiffrement AES-256 ready
- HTTPS/TLS ready

## 📈 Roadmap

### Prochainement
- Interface versions de documents
- Filtres avancés généralisés
- Authentification 2FA
- Commentaires sur documents
- Partage sécurisé

### Futur
- Application mobile
- WebSocket notifications temps réel
- Export rapports PDF/Excel
- IA et automatisation
- Portail client

## 🤝 Contribution

Ce projet est en développement actif. Les contributions sont les bienvenues !

## 📄 Licence

Propriétaire - Tous droits réservés

## 📞 Support

Pour toute question ou assistance :
- 📧 Email : support@legaldoc-suite.com
- 📚 Documentation : Voir dossier `docs/`

## ✨ Remerciements

Développé avec ❤️ pour les cabinets d'avocats

---

**Version 2.0.0** - Décembre 2024  
*Plateforme complète avec fonctionnalités avancées* 🚀

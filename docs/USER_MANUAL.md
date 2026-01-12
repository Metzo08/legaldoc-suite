# Guide Utilisateur - LegalDoc Suite

Bienvenue dans LegalDoc Suite, votre système de gestion documentaire sécurisée.

## Table des Matières

1. [Connexion](#connexion)
2. [Tableau de Bord](#tableau-de-bord)
3. [Gestion des Clients](#gestion-des-clients)
4. [Gestion des Dossiers](#gestion-des-dossiers)
5. [Gestion des Documents](#gestion-des-documents)
6. [Recherche](#recherche)
7. [Journal d'Audit](#journal-daudit)
8. [Sécurité et Confidentialité](#sécurité-et-confidentialité)

---

## Connexion

### Première Connexion

1. Accéder à l'URL de LegalDoc Suite (fournie par votre administrateur)
2. Entrer votre nom d'utilisateur et mot de passe
3. Cliquer sur **Se connecter**

> **Note**: En cas d'oubli de mot de passe, contacter votre administrateur.

### Rôles et Permissions

L'application dispose de plusieurs rôles :

- **Administrateur** : Accès complet, gestion des utilisateurs
- **Avocat** : Création/modification de dossiers et documents
- **Collaborateur** : Consultation et ajout de documents
- **Stagiaire** : Consultation uniquement
- **Secrétaire** : Gestion administrative

---

## Tableau de Bord

Le tableau de bord affiche :
- **Statistiques** : Nombre de clients, dossiers, documents
- **Documents récents** : Les 5 derniers documents ajoutés
- **Activité** : Évolution du nombre de documents

---

## Gestion des Clients

### Créer un Nouveau Client

1. Cliquer sur **Clients** dans le menu latéral
2. Cliquer sur **Nouveau client**
3. Remplir le formulaire :
   - **Nom** (obligatoire)
   - **Type de client** : Particulier, Entreprise, ou Association
   - **Email**, **Téléphone**, **Adresse**
   - **N° SIRET/SIREN** (pour les entreprises)
   - **Notes** (informations complémentaires)
4. Cliquer sur **Créer**

### Modifier un Client

1. Dans la liste des clients, cliquer sur l'icône ✏️ (crayon)
2. Modifier les informations
3. Cliquer sur **Modifier**

### Supprimer un Client

⚠️ **Attention** : La suppression d'un client supprime également tous ses dossiers et documents associés.

1. Cliquer sur l'icône 🗑️ (corbeille)
2. Confirmer la suppression

---

## Gestion des Dossiers

### Créer un Nouveau Dossier

1. Cliquer sur **Dossiers** dans le menu latéral
2. Cliquer sur **Nouveau dossier**
3. Remplir le formulaire :
   - **Référence** : Identifiant unique du dossier (ex: 2024-001)
   - **Intitulé de l'affaire**
   - **Client** : Sélectionner le client concerné
   - **Statut** : Ouvert, En cours, Suspendu, Clos, Archivé
   - **Date d'ouverture**
   - **Description**
4. Cliquer sur **Créer**

### Statuts des Dossiers

- **Ouvert** 🔵 : Nouveau dossier
- **En cours** 🟢 : Dossier en traitement actif
- **Suspendu** 🟠 : Dossier mis en attente temporairement
- **Clos** ✅ : Dossier terminé
- **Archivé** ⚪ : Dossier ancien, archivé

---

## Gestion des Documents

### Uploader un Document

1. Cliquer sur **Documents** dans le menu latéral
2. Cliquer sur **Uploader un document**
3. Glisser-déposer un fichier ou cliquer pour sélectionner
4. Remplir les informations :
   - **Titre** : Nom descriptif du document
   - **Dossier** : Sélectionner le dossier concerné
   - **Type de document** : Contrat, Courrier, Jugement, Pièce, Note, Mémoire, Autre
   - **Description** (facultatif)
5. Cliquer sur **Uploader**

### Formats de Fichiers Supportés

- **Documents** : PDF, DOC, DOCX, TXT, RTF
- **Images** : JPG, JPEG, PNG, GIF, TIFF, BMP

Taille maximale : **100 MB** par fichier

### OCR (Reconnaissance de Texte)

Tous les documents uploadés sont automatiquement traités par OCR :
- Le texte est extrait des PDF et images
- Ce texte devient recherchable
- Le traitement peut prendre quelques secondes à quelques minutes selon la taille

Un indicateur vous montre le statut :
- 🟡 **En attente** : OCR en cours
- 🟢 **Traité** : OCR terminé

### Télécharger un Document

1. Dans la liste des documents, cliquer sur l'icône ⬇️ (téléchargement)
2. Le fichier sera téléchargé sur votre ordinateur

> **Note** : Chaque téléchargement est enregistré dans le journal d'audit

---

## Recherche

La recherche plein-texte permet de retrouver n'importe quel document.

### Effectuer une Recherche

1. Cliquer sur **Recherche** dans le menu latéral
2. Entrer vos mots-clés dans la barre de recherche
3. Cliquer sur **Rechercher**

### Que recherche le moteur ?

Le moteur recherche dans :
- Le **titre** du document
- La **description**
- Le **texte extrait par OCR**
- Le **nom du fichier**

### Astuces de Recherche

- Utiliser plusieurs mots-clés pour affiner
- La recherche n'est pas sensible à la casse
- Les accents sont pris en compte
- Les résultats sont triés par pertinence

---

## Journal d'Audit

Le journal d'audit enregistre toutes les actions effectuées dans le système.

### Consulter le Journal

1. Cliquer sur **Journal d'audit** dans le menu latéral
2. Visualiser les actions récentes

### Informations Enregistrées

Pour chaque action, le système enregistre :
- **Date et heure** précise
- **Utilisateur** qui a effectué l'action
- **Type d'action** : Création, Consultation, Modification, Suppression, Téléchargement
- **Document/Dossier** concerné
- **Adresse IP** de l'utilisateur

### Filtrer le Journal

Utiliser le menu déroulant **Filtrer par action** pour afficher uniquement :
- Les créations
- Les consultations
- Les modifications
- Les suppressions
- Les téléchargements

> **Note** : Les utilisateurs non-administrateurs ne voient que leurs propres actions.

---

## Sécurité et Confidentialité

### Conformité RGPD

LegalDoc Suite est conçu pour être conforme au RGPD :
- ✅ Données chiffrées au repos (AES-256)
- ✅ Communications chiffrées (HTTPS/TLS)
- ✅ Journal d'audit complet
- ✅ Contrôle d'accès granulaire
- ✅ Droit à l'oubli respecté

### Bonnes Pratiques

1. **Ne jamais partager vos identifiants**
2. **Déconnectez-vous** après chaque session
3. **Utilisez un mot de passe fort** (minimum 8 caractères, majuscules, chiffres, symboles)
4. **Vérifiez les permissions** avant de partager un document
5. **Ne téléchargez des documents** que si nécessaire

### Secret Professionnel

Tous les documents sont marqués comme **confidentiels** par défaut.  
Le système garantit :
- Chiffrement des fichiers stockés
- Traçabilité de tous les accès
- Permissions granulaires par document

---

## Support

Pour toute question ou problème technique :

📧 **Email** : support@legaldoc-suite.com  
📚 **Documentation** : Consulter le dossier `docs/`  
👨‍💼 **Administrateur système** : Contacter votre responsable IT

---

© 2024 LegalDoc Suite - Tous droits réservés

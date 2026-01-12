# 📘 Guide Utilisateur Complet - LegalDoc Suite

## 🎯 Table des Matières

1. [Introduction](#introduction)
2. [Premiers Pas](#premiers-pas)
3. [Fonctionnalités Principales](#fonctionnalités-principales)
4. [Guide Détaillé par Module](#guide-détaillé-par-module)
5. [Astuces et Raccourcis](#astuces-et-raccourcis)
6. [FAQ](#faq)
7. [Dépannage](#dépannage)

---

## 📖 Introduction

### Qu'est-ce que LegalDoc Suite ?

**LegalDoc Suite** est une plateforme web sécurisée de gestion documentaire conçue spécifiquement pour les cabinets d'avocats. Elle permet de :

- 📁 Gérer tous vos clients et dossiers juridiques
- 📄 Stocker et organiser vos documents de manière sécurisée
- 🔍 Rechercher instantanément dans tous vos documents (même le contenu scanné)
- 👥 Collaborer avec votre équipe
- 📊 Suivre toutes les activités via un journal d'audit complet
- 🔒 Garantir la confidentialité et la conformité RGPD

### Pourquoi LegalDoc Suite ?

✅ **Sécurité maximale** : Chiffrement, authentification JWT, permissions granulaires  
✅ **Recherche intelligente** : OCR automatique + recherche plein-texte PostgreSQL  
✅ **Traçabilité complète** : Journal d'audit de toutes les actions  
✅ **Interface moderne** : Mode clair/sombre, design intuitif  
✅ **Conformité RGPD** : Privacy by design, droit à l'oubli

---

## 🚀 Premiers Pas

### 1. Connexion à la Plateforme

**URL d'accès** : http://localhost:3000 (ou l'URL fournie par votre administrateur)

#### Comptes de Démonstration

| Utilisateur | Mot de passe | Rôle | Accès |
|-------------|--------------|------|-------|
| `admin` | `Admin123!` | Administrateur | Accès complet |
| `sophie.bernard` | `Avocat123!` | Avocat | Gestion dossiers/documents |
| `pierre.dubois` | `Avocat123!` | Avocat | Gestion dossiers/documents |
| `julie.petit` | `Collab123!` | Collaborateur | Consultation + ajout documents |
| `marc.roux` | `Secret123!` | Secrétaire | Gestion administrative |
| `lea.moreau` | `Stage123!` | Stagiaire | Consultation uniquement |

#### Étapes de Connexion

1. Ouvrez votre navigateur web (Chrome, Firefox, Edge, Safari)
2. Accédez à l'URL de LegalDoc Suite
3. Entrez votre **nom d'utilisateur** et **mot de passe**
4. Cliquez sur **Se connecter**
5. Vous êtes redirigé vers le **Tableau de bord**

### 2. Découverte de l'Interface

#### Navigation Principale (Sidebar)

La barre latérale gauche contient tous les modules :

- 📊 **Tableau de bord** : Vue d'ensemble et statistiques
- 👥 **Clients** : Gestion de vos clients
- 📁 **Dossiers** : Gestion de vos affaires juridiques
- 📄 **Documents** : Bibliothèque de tous vos documents
- 🔍 **Recherche** : Recherche plein-texte avancée
- 👤 **Utilisateurs** : Gestion des utilisateurs (admin uniquement)
- 📋 **Journal d'audit** : Historique de toutes les actions

#### Barre Supérieure (AppBar)

- 🌓 **Toggle Mode Sombre/Clair** : Icône soleil/lune
- 👤 **Profil** : Avatar avec menu déroulant
  - Nom d'utilisateur
  - Déconnexion

### 3. Personnalisation

#### Changer le Thème

1. Cliquez sur l'icône **🌙** (lune) pour activer le mode sombre
2. Cliquez sur l'icône **☀️** (soleil) pour revenir au mode clair
3. Votre préférence est automatiquement sauvegardée

---

## 🎯 Fonctionnalités Principales

### 1. 📊 Tableau de Bord

**Accès** : Menu latéral → Tableau de bord

#### Que contient le tableau de bord ?

**Cartes Statistiques** (en haut) :
- 👥 **Clients** : Nombre total de clients
- 📁 **Dossiers** : Nombre total de dossiers
- 📄 **Documents** : Nombre total de documents
- 📈 **Activité** : Évolution récente (+12%)

**Documents Récents** (en bas) :
- Liste des 5 derniers documents ajoutés
- Affiche : Titre, Dossier, Client, Date

#### Utilisation

- **Vue d'ensemble rapide** : Consultez vos statistiques en un coup d'œil
- **Accès rapide** : Cliquez sur un document récent pour y accéder

---

### 2. 👥 Gestion des Clients

**Accès** : Menu latéral → Clients

#### Créer un Nouveau Client

1. Cliquez sur **Nouveau client** (bouton en haut à droite)
2. Remplissez le formulaire :
   - **Nom*** (obligatoire) : Nom du client
   - **Type de client*** : 
     - 🧑 Particulier
     - 🏢 Entreprise
     - 🏛️ Association
   - **Email** : Adresse email
   - **Téléphone** : Numéro de téléphone
   - **Adresse** : Adresse complète
   - **N° SIRET/SIREN** : Pour les entreprises uniquement
   - **Notes** : Informations complémentaires
3. Cliquez sur **Créer**

#### Modifier un Client

1. Dans la liste des clients, cliquez sur l'icône **✏️** (crayon)
2. Modifiez les informations
3. Cliquez sur **Modifier**

#### Supprimer un Client

⚠️ **ATTENTION** : La suppression d'un client supprime également tous ses dossiers et documents !

1. Cliquez sur l'icône **🗑️** (corbeille)
2. Confirmez la suppression

#### Rechercher un Client

- Utilisez la **barre de recherche** en haut du tableau
- Recherche dans : Nom, Email, N° SIRET

---

### 3. 📁 Gestion des Dossiers

**Accès** : Menu latéral → Dossiers

#### Créer un Nouveau Dossier

1. Cliquez sur **Nouveau dossier**
2. Remplissez le formulaire :
   - **Référence*** : Identifiant unique (ex: DOS-2024-001)
   - **Intitulé de l'affaire*** : Titre du dossier
   - **Client*** : Sélectionnez le client concerné
   - **Statut*** :
     - 🔵 **Ouvert** : Nouveau dossier
     - 🟢 **En cours** : Dossier actif
     - 🟠 **Suspendu** : Mis en attente
     - ✅ **Clos** : Dossier terminé
     - ⚪ **Archivé** : Dossier ancien
   - **Date d'ouverture*** : Date de création du dossier
   - **Date de clôture** : Si le dossier est clos
   - **Description** : Détails de l'affaire
   - **Utilisateurs assignés** : Sélectionnez les avocats responsables
3. Cliquez sur **Créer**

#### Filtrer les Dossiers

- **Par client** : Voir tous les dossiers d'un client
- **Par statut** : Filtrer par statut (Ouvert, En cours, etc.)
- **Par utilisateur** : Voir vos dossiers assignés

#### Modifier un Dossier

1. Cliquez sur l'icône **✏️** (crayon)
2. Modifiez les informations
3. Cliquez sur **Modifier**

#### Clôturer un Dossier

1. Modifiez le dossier
2. Changez le statut en **Clos**
3. Renseignez la **Date de clôture**
4. Sauvegardez

---

### 4. 📄 Gestion des Documents

**Accès** : Menu latéral → Documents

#### Uploader un Document

1. Cliquez sur **Uploader un document**
2. **Glissez-déposez** un fichier ou **cliquez pour sélectionner**
3. Remplissez les informations :
   - **Titre*** : Nom du document
   - **Dossier*** : Sélectionnez le dossier concerné
   - **Type de document*** :
     - 📝 Contrat
     - ✉️ Courrier
     - ⚖️ Jugement
     - 📎 Pièce
     - 📋 Note
     - 📄 Mémoire
     - 📁 Autre
   - **Description** : Détails supplémentaires
4. Cliquez sur **Uploader**

**Formats supportés** :
- 📄 Documents : PDF, DOC, DOCX, TXT, RTF
- 🖼️ Images : JPG, JPEG, PNG, GIF, TIFF, BMP
- **Taille max** : 100 MB par fichier

#### Traitement OCR Automatique

Après l'upload :
- Le système **extrait automatiquement le texte** des PDF et images
- Statut visible dans la colonne **OCR** :
  - 🟡 **En attente** : Traitement en cours
  - 🟢 **Traité** : OCR terminé
- Le texte extrait devient **recherchable**

#### Télécharger un Document

1. Dans la liste des documents, cliquez sur l'icône **⬇️** (téléchargement)
2. Le fichier est téléchargé sur votre ordinateur

⚠️ **Note** : Chaque téléchargement est enregistré dans le journal d'audit

#### Supprimer un Document

1. Cliquez sur l'icône **🗑️** (corbeille)
2. Confirmez la suppression

---

### 5. 🔍 Recherche Plein-Texte

**Accès** : Menu latéral → Recherche

#### Comment Rechercher ?

1. Entrez vos **mots-clés** dans la barre de recherche
2. Cliquez sur **Rechercher**
3. Les résultats s'affichent instantanément

#### Où Cherche le Moteur ?

La recherche s'effectue dans :
- ✅ **Titre** du document
- ✅ **Description** du document
- ✅ **Nom du fichier**
- ✅ **Contenu extrait par OCR** (texte dans les PDF et images)

#### Astuces de Recherche

- Utilisez **plusieurs mots-clés** pour affiner
- La recherche **n'est pas sensible à la casse**
- Les **accents sont pris en compte**
- Les résultats sont **triés par pertinence**

#### Exemple de Recherche

**Recherche** : `contrat location 2024`

**Résultats** :
- Tous les documents contenant ces mots
- Indication si trouvé dans le contenu OCR
- Affichage du dossier et client associés

---

### 6. 👤 Gestion des Utilisateurs

**Accès** : Menu latéral → Utilisateurs (⚠️ **Administrateurs uniquement**)

#### Rôles Disponibles

| Rôle | Permissions |
|------|-------------|
| 👑 **Administrateur** | Accès complet, gestion des utilisateurs |
| ⚖️ **Avocat** | Création/modification de dossiers et documents |
| 🤝 **Collaborateur** | Consultation et ajout de documents |
| 📋 **Secrétaire** | Gestion administrative |
| 🎓 **Stagiaire** | Consultation uniquement |

#### Créer un Utilisateur

1. Cliquez sur **Nouvel utilisateur**
2. Remplissez :
   - Nom d'utilisateur
   - Email
   - Mot de passe
   - Prénom / Nom
   - Rôle
   - Département
   - Téléphone
3. Cliquez sur **Créer**

#### Désactiver un Utilisateur

1. Cliquez sur **Désactiver**
2. L'utilisateur ne peut plus se connecter
3. Ses données restent dans le système

---

### 7. 📋 Journal d'Audit

**Accès** : Menu latéral → Journal d'audit

#### Que Contient le Journal ?

**Toutes les actions** sont enregistrées :
- 📝 **CREATE** : Création (client, dossier, document, utilisateur)
- 👁️ **VIEW** : Consultation de document
- ✏️ **UPDATE** : Modification
- 🗑️ **DELETE** : Suppression
- ⬇️ **DOWNLOAD** : Téléchargement de document
- 🔐 **PERMISSION** : Modification de permissions

#### Informations Enregistrées

Pour chaque action :
- 📅 **Date et heure** précise
- 👤 **Utilisateur** qui a effectué l'action
- 🎯 **Type d'action**
- 📄 **Document/Dossier** concerné
- 🌐 **Adresse IP** de l'utilisateur
- 💻 **User Agent** (navigateur)

#### Filtrer le Journal

- **Par utilisateur** : Voir les actions d'un utilisateur spécifique
- **Par type d'action** : Filtrer par CREATE, VIEW, etc.
- **Par document** : Voir l'historique d'un document

#### Permissions

- **Administrateurs** : Voient toutes les actions
- **Autres utilisateurs** : Voient uniquement leurs propres actions

---

## 💡 Astuces et Raccourcis

### Astuces Générales

1. **Recherche Rapide** : Utilisez la recherche plein-texte pour retrouver n'importe quel document en quelques secondes
2. **Tags et Descriptions** : Ajoutez des descriptions détaillées pour faciliter la recherche
3. **Nommage Cohérent** : Utilisez une convention de nommage pour les références de dossiers (ex: DOS-2024-XXX)
4. **OCR Automatique** : Scannez vos documents papier et uploadez-les, le texte sera automatiquement extrait
5. **Mode Sombre** : Activez-le pour réduire la fatigue oculaire lors de longues sessions

### Bonnes Pratiques

#### Pour les Avocats
- ✅ Créez un dossier dès l'ouverture d'une affaire
- ✅ Uploadez tous les documents au fur et à mesure
- ✅ Utilisez des descriptions claires et détaillées
- ✅ Vérifiez régulièrement le journal d'audit de vos dossiers

#### Pour les Secrétaires
- ✅ Créez les clients dès le premier contact
- ✅ Renseignez toutes les informations de contact
- ✅ Organisez les documents par type
- ✅ Vérifiez que l'OCR est bien traité

#### Pour les Administrateurs
- ✅ Créez des utilisateurs avec les bons rôles
- ✅ Surveillez le journal d'audit régulièrement
- ✅ Désactivez les comptes des utilisateurs partis
- ✅ Effectuez des sauvegardes régulières

### Sécurité

🔒 **Règles de Sécurité** :
1. **Ne partagez jamais vos identifiants**
2. **Déconnectez-vous** après chaque session
3. **Utilisez un mot de passe fort** (min. 8 caractères, majuscules, chiffres, symboles)
4. **Vérifiez les permissions** avant de partager un document
5. **Téléchargez uniquement** les documents nécessaires

---

## ❓ FAQ (Foire Aux Questions)

### Questions Générales

**Q : Puis-je accéder à LegalDoc Suite depuis mon mobile ?**  
R : Oui, l'interface est responsive et s'adapte aux mobiles et tablettes.

**Q : Mes documents sont-ils sécurisés ?**  
R : Oui, tous les documents sont chiffrés et l'accès est contrôlé par permissions.

**Q : Combien de documents puis-je stocker ?**  
R : Il n'y a pas de limite de nombre, seulement une limite de 100 MB par fichier.

**Q : L'OCR fonctionne-t-il sur tous les documents ?**  
R : Oui, sur les PDF et images (JPG, PNG, etc.). La qualité dépend de la lisibilité du scan.

### Questions Techniques

**Q : Quels navigateurs sont supportés ?**  
R : Chrome, Firefox, Edge, Safari (versions récentes).

**Q : Puis-je exporter mes données ?**  
R : Oui, contactez votre administrateur pour un export complet.

**Q : Comment récupérer un document supprimé ?**  
R : Les suppressions sont définitives. Contactez votre administrateur pour une restauration depuis backup.

**Q : Puis-je modifier un document uploadé ?**  
R : Non, mais vous pouvez uploader une nouvelle version et supprimer l'ancienne.

### Questions sur les Permissions

**Q : Qui peut voir mes documents ?**  
R : Seuls les utilisateurs ayant accès au dossier concerné.

**Q : Puis-je partager un document avec un client ?**  
R : Actuellement non, cette fonctionnalité est en développement.

**Q : Comment savoir qui a consulté un document ?**  
R : Consultez le journal d'audit et filtrez par le document concerné.

---

## 🔧 Dépannage

### Problèmes de Connexion

**Problème** : Je ne peux pas me connecter  
**Solutions** :
1. Vérifiez votre nom d'utilisateur et mot de passe
2. Vérifiez que votre compte n'est pas désactivé
3. Contactez votre administrateur

**Problème** : J'ai oublié mon mot de passe  
**Solution** : Contactez votre administrateur pour réinitialisation

### Problèmes d'Upload

**Problème** : Mon fichier ne s'uploade pas  
**Solutions** :
1. Vérifiez la taille (max 100 MB)
2. Vérifiez le format (PDF, DOC, DOCX, images)
3. Vérifiez votre connexion internet
4. Réessayez avec un autre navigateur

**Problème** : L'OCR ne fonctionne pas  
**Solutions** :
1. Attendez quelques minutes (traitement en cours)
2. Vérifiez la qualité du scan (doit être lisible)
3. Réessayez avec un PDF de meilleure qualité

### Problèmes de Recherche

**Problème** : La recherche ne trouve rien  
**Solutions** :
1. Vérifiez l'orthographe
2. Essayez avec moins de mots-clés
3. Vérifiez que l'OCR est traité (🟢)
4. Attendez quelques minutes après l'upload

### Problèmes d'Affichage

**Problème** : L'interface est cassée  
**Solutions** :
1. Rafraîchissez la page (F5)
2. Videz le cache du navigateur
3. Essayez un autre navigateur
4. Contactez le support technique

---

## 📞 Support

### Contacter le Support

📧 **Email** : support@legaldoc-suite.com  
📚 **Documentation** : Consultez ce guide  
👨‍💼 **Administrateur** : Contactez votre responsable IT

### Signaler un Bug

Incluez dans votre message :
1. Description du problème
2. Étapes pour reproduire
3. Navigateur utilisé
4. Captures d'écran si possible

---

## 🎓 Conclusion

**LegalDoc Suite** est un outil puissant qui simplifie la gestion documentaire de votre cabinet. Avec ce guide, vous avez toutes les clés pour :

✅ Gérer efficacement vos clients et dossiers  
✅ Organiser vos documents de manière sécurisée  
✅ Rechercher instantanément dans tous vos fichiers  
✅ Collaborer avec votre équipe  
✅ Garantir la conformité et la traçabilité  

**Bon travail avec LegalDoc Suite ! 🚀**

---

*Version du guide : 1.0 - Dernière mise à jour : Décembre 2024*

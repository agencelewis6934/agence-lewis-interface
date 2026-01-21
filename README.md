# 🏢 Agence Lewis - Interface de Gestion

Interface de gestion moderne pour Agence Lewis avec tableau de bord, gestion de projets, clients, finances, et **boîte de réception Gmail intégrée**.

![Dashboard](https://img.shields.io/badge/Status-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)

## ✨ Fonctionnalités

- 📊 **Dashboard** - Vue d'ensemble de l'activité de l'agence
- 📧 **Boîte de réception Gmail** - Emails en temps réel via n8n
- 👥 **Gestion des clients** - Suivi complet des clients
- 📁 **Gestion des projets** - Organisation et suivi des projets
- 💰 **Finances** - Gestion des revenus et factures
- 👨‍💼 **Équipe** - Gestion des membres de l'équipe
- 🔔 **Notifications** - Alertes en temps réel
- ⚙️ **Paramètres** - Configuration personnalisée

## 🚀 Déploiement sur Vercel

### Prérequis

- Un compte [Vercel](https://vercel.com)
- Un projet [Supabase](https://supabase.com) configuré
- Variables d'environnement Supabase

### Étapes de déploiement

1. **Importez le projet dans Vercel**
   - Allez sur https://vercel.com/new
   - Sélectionnez ce repository GitHub
   - Cliquez sur "Import"

2. **Configurez les variables d'environnement**
   
   Dans les settings du projet Vercel, ajoutez :
   
   ```env
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_cle_anonyme_supabase
   ```

3. **Déployez**
   - Cliquez sur "Deploy"
   - Attendez que le build se termine
   - Votre application sera disponible sur `https://votre-projet.vercel.app`

### Configuration automatique

Vercel détectera automatiquement :
- ✅ Framework: Vite
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`

## 📦 Installation locale

```bash
# Cloner le repository
git clone https://github.com/agencelewis6934/agence-lewis-interface.git
cd agence-lewis-interface

# Installer les dépendances
npm install

# Créer le fichier .env.local
cp .env.local.example .env.local

# Ajouter vos variables d'environnement dans .env.local
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

## 🗄️ Configuration Supabase

### 1. Créer les tables

Exécutez les scripts SQL dans votre dashboard Supabase :

- `supabase/schema.sql` - Tables principales
- `supabase/emails.sql` - Table pour la boîte de réception
- `supabase/analytics.sql` - Tables d'analytics

### 2. Activer Realtime

Dans Supabase Dashboard → Database → Replication :
- Activez la réplication pour la table `emails`

### 3. Configurer RLS (Row Level Security)

Les politiques RLS sont déjà incluses dans les scripts SQL.

## 📧 Configuration de la Boîte de Réception Gmail

### Prérequis n8n

1. **Créez un workflow n8n** avec :
   - Trigger: Gmail (New Email)
   - HTTP Request vers votre endpoint API

2. **Configurez le HTTP Request** :
   - Method: `POST`
   - URL: `https://votre-domaine.vercel.app/api/inbox`
   - Body:
   ```json
   {
     "messageId": "{{ $json.id }}",
     "threadId": "{{ $json.threadId }}",
     "fromName": "{{ $json.from.name }}",
     "fromEmail": "{{ $json.from.email }}",
     "subject": "{{ $json.subject }}",
     "snippet": "{{ $json.snippet }}",
     "body": "{{ $json.body }}",
     "source": "gmail",
     "status": "unread"
   }
   ```

3. **Activez le workflow**

Les emails apparaîtront automatiquement dans l'interface en temps réel !

## 🛠️ Stack Technique

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS + CSS Variables
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Authentification**: Supabase Auth
- **Déploiement**: Vercel
- **Intégration Email**: n8n + Gmail API

## 📁 Structure du Projet

```
agence-lewis-interface/
├── api/                    # API endpoints (Vercel Serverless)
│   └── inbox/             # Endpoint pour recevoir les emails
├── src/
│   ├── components/        # Composants réutilisables
│   │   ├── layout/       # Layout (Sidebar, Header)
│   │   └── ui/           # Composants UI (Button, Card, etc.)
│   ├── contexts/         # Contextes React (Auth, etc.)
│   ├── pages/            # Pages de l'application
│   ├── lib/              # Utilitaires et configuration
│   └── styles/           # Styles CSS
├── supabase/             # Scripts SQL
└── public/               # Assets statiques
```

## 🔐 Sécurité

- ✅ Row Level Security (RLS) activé sur toutes les tables
- ✅ Authentification requise pour les opérations sensibles
- ✅ Variables d'environnement pour les secrets
- ✅ HTTPS obligatoire en production

## 📝 Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run lint         # Linter le code
```

## 🐛 Dépannage

### L'application ne se connecte pas à Supabase

1. Vérifiez que les variables d'environnement sont correctement configurées
2. Vérifiez que votre URL Supabase est correcte
3. Vérifiez que la clé anonyme est valide

### Les emails n'apparaissent pas

1. Vérifiez que la table `emails` existe dans Supabase
2. Vérifiez que le workflow n8n est actif
3. Vérifiez les logs Vercel pour les erreurs API
4. Vérifiez que Realtime est activé pour la table `emails`

## 📞 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

## 📄 Licence

Propriétaire - Agence Lewis © 2026

---

**Développé avec ❤️ pour Agence Lewis**

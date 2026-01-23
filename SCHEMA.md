# LG Platform - Schéma Complet du Site

## 📋 Vue d'ensemble

**LG Platform** est une application web de gestion de devis et de produits pour une entreprise tunisienne, avec un système de rôles et de permissions pour différents types d'utilisateurs.

### Technologies utilisées
- **Framework**: Next.js 16.1.1 (React 19.2.3)
- **Langage**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, shadcn/ui
- **Charts**: Recharts
- **Database**: Prisma (PostgreSQL) - configuré mais non utilisé actuellement
- **State Management**: React Hooks, localStorage
- **Authentication**: Custom (localStorage + cookies)

---

## 🏗️ Architecture du Projet

### Structure des dossiers

```
lg-platforme/
├── app/                          # Next.js App Router
│   ├── admin/                    # Section Admin
│   │   ├── dashboard/            # Tableau de bord admin
│   │   ├── produits/             # Gestion produits
│   │   ├── devis/                # Liste des devis
│   │   └── etablissements/       # Gestion établissements
│   ├── etablissement/            # Section Établissement
│   │   ├── dashboard/            # Tableau de bord
│   │   ├── produits/             # Catalogue produits
│   │   └── devis/                # Gestion devis
│   ├── responsable/              # Section Responsable
│   │   ├── produits/             # Catalogue produits
│   │   └── devis/                # Gestion devis
│   ├── auth/                     # Authentification
│   │   └── login/                # Page de connexion
│   └── layout.tsx                 # Layout principal
├── components/                   # Composants React
│   ├── ui/                       # Composants UI de base
│   ├── app-sidebar.tsx           # Sidebar de navigation
│   ├── route-guard.tsx           # Protection des routes
│   ├── login-form.tsx            # Formulaire de connexion
│   └── [charts & cards]          # Composants de visualisation
├── lib/                          # Utilitaires
│   ├── auth.ts                   # Gestion authentification
│   ├── data/
│   │   └── menus.ts              # Configuration menus par rôle
│   └── utils.ts                  # Utilitaires généraux
├── middleware.ts                 # Middleware Next.js (protection routes)
└── prisma/                       # Configuration Prisma (non utilisé)

```

---

## 👥 Système de Rôles et Permissions

### Rôles disponibles

1. **ADMIN**
   - Accès complet à toutes les fonctionnalités
   - Gestion des produits, devis, établissements
   - Tableau de bord avec statistiques

2. **ETABLISSEMENT**
   - Consultation du catalogue produits
   - Création et gestion de devis
   - Visualisation de ses propres devis

3. **RESPONSABLE**
   - Consultation du catalogue produits
   - Création de devis
   - Validation/Approbation/Rejet de devis
   - Gestion des statuts de devis

### Protection des routes

- **Middleware** (`middleware.ts`): Protection au niveau serveur
- **RouteGuard** (`components/route-guard.tsx`): Protection côté client
- **Layouts par section**: Chaque section a son propre layout avec protection

---

## 🔐 Système d'Authentification

### Méthode
- Authentification basée sur fichier JSON (`app/auth/accounts.json`)
- Stockage de session dans `localStorage`
- Cookie `lg_user_role` pour le middleware

### Comptes par défaut

```json
{
  "ADMIN": {
    "email": "admin@example.com",
    "password": "admin123",
    "route": "/admin/dashboard"
  },
  "ETABLISSEMENT": {
    "email": "etablissement@example.com",
    "password": "etab123",
    "route": "/etablissement/produits"
  },
  "RESPONSABLE": {
    "email": "responsable@example.com",
    "password": "resp123",
    "route": "/responsable/produits"
  }
}
```

### Fonctionnalités
- Login/Logout
- Redirection automatique selon le rôle
- Protection des routes par rôle
- Session persistante (localStorage)

---

## 📱 Routes et Pages

### Routes publiques
- `/auth/login` - Page de connexion

### Routes ADMIN (`/admin/*`)
- `/admin/dashboard` - Tableau de bord avec statistiques
- `/admin/produits` - Liste et gestion des produits
- `/admin/produits/create` - Création de produit
- `/admin/devis` - Liste de tous les devis
- `/admin/etablissements` - Gestion des établissements
- `/admin/etablissements/create` - Création d'établissement

### Routes ETABLISSEMENT (`/etablissement/*`)
- `/etablissement/produits` - Catalogue produits avec panier
- `/etablissement/devis` - Liste des devis de l'établissement
- `/etablissement/devis/create` - Création de devis
- `/etablissement/dashboard` - Tableau de bord (vide actuellement)

### Routes RESPONSABLE (`/responsable/*`)
- `/responsable/produits` - Catalogue produits avec panier
- `/responsable/devis` - Liste des devis avec filtres et actions
- `/responsable/devis/create` - Création de devis

---

## 🎨 Composants Principaux

### Navigation
- **AppSidebar** (`components/app-sidebar.tsx`)
  - Menu de navigation dynamique selon le rôle
  - Logo LG
  - Menu utilisateur avec déconnexion
  - Effets hover sur les boutons

### Protection
- **RouteGuard** (`components/route-guard.tsx`)
  - Vérification du rôle utilisateur
  - Redirection automatique si non autorisé
  - Loader pendant la vérification

### Authentification
- **LoginForm** (`components/login-form.tsx`)
  - Formulaire de connexion
  - Validation des credentials
  - Gestion des erreurs

### Visualisation
- **CardRevenueRadial** - Cartes avec indicateurs radiaux
- **ChartDevisCard** - Graphique d'évolution des devis
- **ChartProductsDonut** - Graphique en donut pour produits
- **BarChartSimple** - Graphique en barres

---

## 📊 Modèles de Données

### Produit
```typescript
{
  id: number
  name: string
  description: string
  price: number
  currency: string (TND)
  category: string
  stock: number
  image: string
}
```

### Devis (Quote)
```typescript
{
  id: string
  date: string
  statut: "Brouillon" | "Envoyé" | "Approuvé" | "Suspendu" | "Rejeté"
  total: number
  client: {
    nom: string
    prenom: string
    email: string
    telephone: string
  }
  produits: Array<{
    nom: string
    quantite: number
    prix: number
  }>
}
```

### Établissement
```typescript
{
  id: string
  name: string
  address: string
  phone: string
  email: string
  devisCount: number
  revenue: number
  currency: string (TND)
  createdAt: string
}
```

### Session Utilisateur
```typescript
{
  email: string
  role: "ADMIN" | "ETABLISSEMENT" | "RESPONSABLE"
  route: string
}
```

---

## 🔧 Fonctionnalités par Section

### ADMIN

#### Dashboard
- **KPIs**: Produits, Devis, Établissements, Chiffre d'affaires
- **Graphiques**:
  - Évolution des devis (ligne)
  - Top produits (donut)
  - Évolution du chiffre d'affaires (ligne)
- **Données récentes**: Liste des devis récents

#### Produits
- Liste de tous les produits
- Création de produits
- Gestion des catégories
- Stock management

#### Devis
- Liste complète de tous les devis
- Filtrage par état
- Actions sur les devis

#### Établissements
- Liste des établissements
- Création d'établissements
- Statistiques par établissement
- Téléchargement des credentials

### ETABLISSEMENT

#### Produits
- Catalogue produits avec filtres par catégorie
- Panier d'achat (localStorage)
- Ajout/Suppression de produits
- Quantité modifiable
- Redirection vers création de devis avec panier

#### Devis
- Liste des devis de l'établissement
- Recherche de devis
- Visualisation des détails
- Actions: Télécharger, Envoyer, Contacter, Supprimer

#### Création Devis
- Sélection de produits avec filtres
- Informations client (nom, prénom, email, téléphone, adresse)
- Récapitulatif
- Génération de devis
- Téléchargement PDF (simulé)
- Partage (simulé)

### RESPONSABLE

#### Produits
- Identique à Établissement
- Catalogue avec panier
- Création de devis

#### Devis
- Liste des devis avec filtres par statut
- Recherche
- **Actions spéciales**:
  - Approuver
  - Suspendre
  - Rejeter
  - Supprimer
- Visualisation détaillée

#### Création Devis
- Identique à Établissement
- Sélection produits
- Informations client
- Génération

---

## 🎯 Flux Utilisateur

### Connexion
1. Utilisateur accède à `/auth/login`
2. Saisit email et mot de passe
3. Vérification dans `accounts.json`
4. Création de session (localStorage + cookie)
5. Redirection vers la route par défaut du rôle

### Navigation
1. Utilisateur clique sur un élément du menu
2. Vérification du rôle par RouteGuard
3. Vérification du middleware
4. Affichage de la page si autorisé
5. Redirection si non autorisé

### Création de Devis
1. Consultation du catalogue produits
2. Ajout de produits au panier
3. Redirection vers `/devis/create`
4. Remplissage des informations client
5. Génération du devis
6. Sauvegarde (actuellement console.log)

---

## 🔒 Sécurité

### Protection des Routes
- **Middleware Next.js**: Vérification au niveau serveur
- **RouteGuard**: Vérification côté client
- **Layouts protégés**: Chaque section a son layout avec protection

### Stockage
- **Session**: localStorage (côté client)
- **Cookie**: `lg_user_role` (pour middleware)
- **Données**: Fichiers JSON (à remplacer par base de données)

### Limitations actuelles
- Pas de hashage de mots de passe
- Authentification basée sur fichier JSON
- Pas de tokens JWT
- Pas de refresh tokens
- Données en JSON (non persistantes)

---

## 📦 Dépendances Principales

### UI & Styling
- `@radix-ui/*` - Composants UI accessibles
- `tailwindcss` - Framework CSS
- `lucide-react` - Icônes
- `@tabler/icons-react` - Icônes supplémentaires

### Charts & Data
- `recharts` - Graphiques
- `@tanstack/react-table` - Tables

### Utilitaires
- `class-variance-authority` - Variants de classes
- `clsx` & `tailwind-merge` - Gestion des classes
- `zod` - Validation de schémas

### Drag & Drop
- `@dnd-kit/*` - Système de drag & drop

---

## 🗄️ Données (Actuellement JSON)

### Fichiers de données
- `app/auth/accounts.json` - Comptes utilisateurs
- `app/admin/dashboard/data.json` - Données dashboard admin
- `app/admin/produits/products.json` - Produits
- `app/admin/etablissements/etablissements.json` - Établissements
- `app/admin/devis/quotes.json` - Devis admin
- `app/etablissement/devis/quotes.json` - Devis établissement
- `app/responsable/devis/quotes.json` - Devis responsable
- `app/*/produits/products.json` - Produits par section

### Structure Prisma (Configurée mais non utilisée)
- Prisma configuré avec PostgreSQL
- Schema vide (à compléter)
- Client généré dans `lib/generated/prisma`

---

## 🎨 Design System

### Composants UI
Tous les composants suivent le système de design shadcn/ui:
- Button, Card, Input, Dialog, Select, Badge, etc.
- Thème cohérent avec variables CSS
- Mode sombre supporté (next-themes)

### Couleurs
- Primary, Secondary, Accent
- Destructive, Muted
- Sidebar colors
- Chart colors

### Typographie
- Geist Sans (principal)
- Geist Mono (code)

---

## 🚀 Améliorations Futures Recommandées

### Base de données
- [ ] Migrer de JSON vers Prisma/PostgreSQL
- [ ] Implémenter les modèles de données
- [ ] API Routes Next.js pour CRUD

### Authentification
- [ ] Hashage des mots de passe (bcrypt)
- [ ] Tokens JWT
- [ ] Refresh tokens
- [ ] OAuth (optionnel)

### Fonctionnalités
- [ ] Notifications en temps réel
- [ ] Export PDF réel des devis
- [ ] Email automatique
- [ ] Historique des modifications
- [ ] Audit trail

### Performance
- [ ] Optimisation des images
- [ ] Lazy loading
- [ ] Caching
- [ ] Pagination

### Tests
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests E2E

---

## 📝 Notes Techniques

### État actuel
- Application fonctionnelle avec données mockées
- Authentification basique fonctionnelle
- Protection des routes implémentée
- UI/UX moderne et responsive

### Points d'attention
- Les données sont stockées en JSON (non persistantes)
- Pas de base de données active
- Authentification simplifiée (à renforcer)
- Pas de gestion d'erreurs globale
- Pas de logging système

---

## 📞 Support

Pour toute question ou amélioration, référez-vous à la documentation du code source.

---

**Dernière mise à jour**: Janvier 2025
**Version**: 0.1.0

# Guide de Configuration de la Base de Données

## 📋 Prérequis

1. **XAMPP installé** avec MySQL démarré
2. **Base de données créée** dans phpMyAdmin (nom: `lg_platform`)

## 🚀 Étapes de Configuration

### 1. Créer la base de données

1. Ouvrir phpMyAdmin (http://localhost/phpmyadmin)
2. Créer une nouvelle base de données nommée `lg_platform`
3. Choisir la collation `utf8mb4_unicode_ci`

### 2. Configurer les variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
DATABASE_URL="mysql://root:@localhost:3306/lg_platform"
```

**Note:** 
- Si vous avez un mot de passe pour MySQL, utilisez: `mysql://root:votre_mot_de_passe@localhost:3306/lg_platform`
- Si MySQL utilise un port différent, ajustez le port (par défaut: 3306)

### 3. Générer le client Prisma

```bash
npx prisma generate
```

Cette commande génère le client Prisma dans `lib/generated/prisma`.

### 4. Créer les tables (Migration)

```bash
npx prisma migrate dev --name init
```

Cette commande :
- Crée toutes les tables dans votre base de données MySQL
- Génère les fichiers de migration dans `prisma/migrations`

### 5. (Optionnel) Peupler la base de données

Si vous avez un fichier seed, vous pouvez l'exécuter :

```bash
npx prisma db seed
```

## ✅ Vérification

Après la migration, vous devriez voir ces tables dans phpMyAdmin :
- `users`
- `categories`
- `products`
- `etablissements`
- `clients`
- `devis`
- `devis_products`
- `audit_logs`

## 🔧 Utilisation

### Créer un produit

1. Aller sur `/admin/produits/create`
2. Remplir le formulaire
3. Cliquer sur "Créer le produit"
4. Le produit sera enregistré dans la base de données

### API Routes disponibles

- `GET /api/categories` - Liste toutes les catégories
- `POST /api/categories` - Crée une nouvelle catégorie
- `GET /api/products` - Liste tous les produits
- `POST /api/products` - Crée un nouveau produit

## 🐛 Dépannage

### Erreur: "Cannot find module"

Si vous obtenez une erreur concernant le module Prisma :
```bash
npx prisma generate
```

### Erreur de connexion à la base de données

1. Vérifier que MySQL est démarré dans XAMPP
2. Vérifier que la base de données `lg_platform` existe
3. Vérifier le fichier `.env` avec la bonne URL de connexion

### Réinitialiser la base de données

```bash
npx prisma migrate reset
```

**Attention:** Cette commande supprime toutes les données !

## 📝 Notes

- Le client Prisma est configuré pour être réutilisé entre les requêtes (singleton)
- Les logs de Prisma sont activés en mode développement
- Les migrations sont stockées dans `prisma/migrations`

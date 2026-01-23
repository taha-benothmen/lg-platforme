# Schéma de Base de Données - LG Platform

## 📊 Vue d'ensemble

Ce document décrit le schéma complet de la base de données PostgreSQL pour la plateforme LG. Le schéma utilise Prisma ORM et suit les meilleures pratiques de normalisation.

---

## 🗄️ Diagramme des Relations

```
┌─────────────┐
│    User     │
│─────────────│
│ id (PK)     │
│ email       │◄─────────┐
│ password    │          │
│ role        │          │
│ firstName   │          │
│ lastName    │          │
└─────────────┘          │
       │                 │
       │ 1:1             │
       │                 │
       ▼                 │
┌─────────────┐          │
│Etablissement│          │
│─────────────│          │
│ id (PK)     │          │
│ code        │          │
│ name        │          │
│ userId (FK) │──────────┘
└─────────────┘
       │
       │ 1:N
       │
       ▼
┌─────────────┐
│   Client    │
│─────────────│
│ id (PK)     │
│ nom         │
│ prenom      │
│ email       │
│ etablissementId (FK)
└─────────────┘
       │
       │ 1:N
       │
       ▼
┌─────────────┐
│    Devis    │
│─────────────│
│ id (PK)     │
│ numero      │
│ statut      │
│ total       │
│ clientId (FK)
│ createdById (FK) ────┐
│ validatedById (FK) ──┼───► User
│ etablissementId (FK) │
└─────────────┘        │
       │               │
       │ 1:N           │
       │               │
       ▼               │
┌─────────────┐        │
│DevisProduct │        │
│─────────────│        │
│ id (PK)     │        │
│ devisId (FK)│────────┘
│ productId (FK) ────┐
│ quantite    │      │
│ prixUnitaire│      │
└─────────────┘      │
       │            │
       │ N:1        │
       │            │
       ▼            │
┌─────────────┐     │
│  Product   │     │
│─────────────│     │
│ id (PK)     │◄────┘
│ name        │
│ price       │
│ categoryId (FK) ──┐
└─────────────┘      │
       │             │
       │ N:1         │
       │             │
       ▼             │
┌─────────────┐      │
│  Category   │      │
│─────────────│      │
│ id (PK)     │◄─────┘
│ name        │
│ description │
└─────────────┘
```

---

## 📋 Tables Détaillées

### 1. **users** - Utilisateurs du système

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid() | Identifiant unique |
| email | String | UNIQUE, NOT NULL | Email de connexion |
| password | String | NOT NULL | Mot de passe hashé (bcrypt) |
| role | UserRole | NOT NULL | ADMIN, ETABLISSEMENT, RESPONSABLE |
| firstName | String | NULL | Prénom |
| lastName | String | NULL | Nom |
| phone | String | NULL | Téléphone |
| isActive | Boolean | DEFAULT true | Compte actif ou non |
| createdAt | DateTime | DEFAULT now() | Date de création |
| updatedAt | DateTime | AUTO UPDATE | Date de modification |

**Index:**
- `email` (unique)
- `role`

**Relations:**
- 1:1 avec `Etablissement` (si role = ETABLISSEMENT)
- 1:N avec `Devis` (createdBy)
- 1:N avec `Devis` (validatedBy)

---

### 2. **categories** - Catégories de produits

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | Int | PK, AUTO_INCREMENT | Identifiant unique |
| name | String | UNIQUE, NOT NULL | Nom de la catégorie |
| description | String | NULL | Description |
| createdAt | DateTime | DEFAULT now() | Date de création |
| updatedAt | DateTime | AUTO UPDATE | Date de modification |

**Relations:**
- 1:N avec `Product`

**Exemples:**
- Laptop
- Desktop
- Monitor
- Accessories

---

### 3. **products** - Produits du catalogue

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | Int | PK, AUTO_INCREMENT | Identifiant unique |
| name | String | NOT NULL | Nom du produit |
| description | String | NULL | Description |
| price | Decimal(10,2) | NOT NULL | Prix unitaire |
| currency | String | DEFAULT 'TND' | Devise (TND) |
| stock | Int | DEFAULT 0 | Stock disponible |
| image | String | NULL | Chemin vers l'image |
| isActive | Boolean | DEFAULT true | Produit actif |
| categoryId | Int | FK, NOT NULL | Référence à Category |
| createdAt | DateTime | DEFAULT now() | Date de création |
| updatedAt | DateTime | AUTO UPDATE | Date de modification |

**Index:**
- `categoryId`
- `name`

**Relations:**
- N:1 avec `Category`
- 1:N avec `DevisProduct`

---

### 4. **etablissements** - Établissements

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid() | Identifiant unique |
| code | String | UNIQUE, NOT NULL | Code unique (ETB001) |
| name | String | NOT NULL | Nom de l'établissement |
| address | String | NOT NULL | Adresse complète |
| phone | String | NOT NULL | Téléphone |
| email | String | UNIQUE, NOT NULL | Email |
| city | String | NULL | Ville |
| postalCode | String | NULL | Code postal |
| isActive | Boolean | DEFAULT true | Établissement actif |
| userId | UUID | FK, UNIQUE, NOT NULL | Référence à User |
| createdAt | DateTime | DEFAULT now() | Date de création |
| updatedAt | DateTime | AUTO UPDATE | Date de modification |

**Index:**
- `code` (unique)
- `email` (unique)
- `userId` (unique)

**Relations:**
- 1:1 avec `User`
- 1:N avec `Client`
- 1:N avec `Devis`

---

### 5. **clients** - Clients

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid() | Identifiant unique |
| nom | String | NOT NULL | Nom de famille |
| prenom | String | NOT NULL | Prénom |
| email | String | NULL | Email |
| telephone | String | NOT NULL | Téléphone |
| entreprise | String | NULL | Nom de l'entreprise |
| adresse | String | NULL | Adresse |
| codePostal | String | NULL | Code postal |
| ville | String | NULL | Ville |
| notes | Text | NULL | Notes additionnelles |
| etablissementId | UUID | FK, NULL | Référence à Etablissement |
| createdAt | DateTime | DEFAULT now() | Date de création |
| updatedAt | DateTime | AUTO UPDATE | Date de modification |

**Index:**
- `email`
- `telephone`
- `etablissementId`

**Relations:**
- N:1 avec `Etablissement` (optionnel)
- 1:N avec `Devis`

---

### 6. **devis** - Devis/Quotations

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid() | Identifiant unique |
| numero | String | UNIQUE, NOT NULL | Numéro de devis (DV-001) |
| date | DateTime | DEFAULT now() | Date du devis |
| statut | DevisStatus | DEFAULT BROUILLON | Statut du devis |
| total | Decimal(10,2) | NOT NULL | Montant total |
| notes | Text | NULL | Notes additionnelles |
| pdfPath | String | NULL | Chemin vers PDF généré |
| sentAt | DateTime | NULL | Date d'envoi |
| validatedAt | DateTime | NULL | Date de validation |
| validatedById | UUID | FK, NULL | Responsable qui a validé |
| clientId | UUID | FK, NOT NULL | Référence à Client |
| createdById | UUID | FK, NOT NULL | Créateur du devis |
| etablissementId | UUID | FK, NULL | Établissement associé |
| createdAt | DateTime | DEFAULT now() | Date de création |
| updatedAt | DateTime | AUTO UPDATE | Date de modification |

**Index:**
- `numero` (unique)
- `statut`
- `date`
- `clientId`
- `createdById`
- `etablissementId`

**Relations:**
- N:1 avec `Client`
- N:1 avec `User` (createdBy)
- N:1 avec `User` (validatedBy)
- N:1 avec `Etablissement`
- 1:N avec `DevisProduct`

**Statuts possibles:**
- `BROUILLON` - Devis en cours de création
- `ENVOYE` - Devis envoyé au client
- `APPROUVE` - Devis approuvé par le responsable
- `SUSPENDU` - Devis suspendu
- `REJETE` - Devis rejeté
- `ACCEPTE` - Devis accepté par le client

---

### 7. **devis_products** - Table de liaison Devis ↔ Product

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid() | Identifiant unique |
| devisId | UUID | FK, NOT NULL | Référence à Devis |
| productId | Int | FK, NOT NULL | Référence à Product |
| quantite | Int | DEFAULT 1 | Quantité |
| prixUnitaire | Decimal(10,2) | NOT NULL | Prix unitaire au moment de la création |
| total | Decimal(10,2) | NOT NULL | Total (quantite × prixUnitaire) |
| createdAt | DateTime | DEFAULT now() | Date de création |

**Contraintes:**
- UNIQUE(devisId, productId) - Un produit ne peut apparaître qu'une fois par devis

**Index:**
- `devisId`
- `productId`

**Relations:**
- N:1 avec `Devis`
- N:1 avec `Product`

**Note:** Le `prixUnitaire` est stocké pour conserver le prix au moment de la création du devis, même si le prix du produit change ensuite.

---

### 8. **audit_logs** - Logs d'audit

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid() | Identifiant unique |
| userId | UUID | FK, NULL | Utilisateur qui a effectué l'action |
| action | String | NOT NULL | Type d'action (CREATE_DEVIS, etc.) |
| entity | String | NOT NULL | Entité concernée (Devis, Product, etc.) |
| entityId | String | NOT NULL | ID de l'entité |
| oldValue | JSON | NULL | Ancienne valeur (si modification) |
| newValue | JSON | NULL | Nouvelle valeur |
| ipAddress | String | NULL | Adresse IP |
| userAgent | String | NULL | User agent du navigateur |
| createdAt | DateTime | DEFAULT now() | Date de l'action |

**Index:**
- `userId`
- `entity, entityId`
- `createdAt`

**Actions possibles:**
- `CREATE_DEVIS`
- `UPDATE_DEVIS`
- `DELETE_DEVIS`
- `VALIDATE_DEVIS`
- `REJECT_DEVIS`
- `CREATE_PRODUCT`
- `UPDATE_PRODUCT`
- `DELETE_PRODUCT`
- `CREATE_ETABLISSEMENT`
- `UPDATE_ETABLISSEMENT`
- `LOGIN`
- `LOGOUT`

---

## 🔑 Enums

### UserRole
```prisma
enum UserRole {
  ADMIN          // Administrateur système
  ETABLISSEMENT  // Utilisateur établissement
  RESPONSABLE    // Responsable validation
}
```

### DevisStatus
```prisma
enum DevisStatus {
  BROUILLON      // En cours de création
  ENVOYE         // Envoyé au client
  APPROUVE       // Approuvé par responsable
  SUSPENDU      // Suspendu
  REJETE        // Rejeté
  ACCEPTE       // Accepté par le client
}
```

---

## 🔗 Relations Clés

### User → Etablissement (1:1)
- Un utilisateur avec le rôle `ETABLISSEMENT` peut avoir un établissement associé
- Relation optionnelle (nullable)

### Etablissement → Client (1:N)
- Un établissement peut avoir plusieurs clients
- Relation optionnelle (un client peut exister sans établissement)

### Client → Devis (1:N)
- Un client peut avoir plusieurs devis
- Relation obligatoire

### Devis → User (N:1) - createdBy
- Chaque devis est créé par un utilisateur
- Relation obligatoire

### Devis → User (N:1) - validatedBy
- Un devis peut être validé par un responsable
- Relation optionnelle

### Devis → DevisProduct (1:N)
- Un devis contient plusieurs produits
- Relation obligatoire

### Product → DevisProduct (1:N)
- Un produit peut apparaître dans plusieurs devis
- Relation obligatoire

### Category → Product (1:N)
- Une catégorie contient plusieurs produits
- Relation obligatoire

---

## 📊 Requêtes SQL Utiles

### Statistiques Dashboard Admin

```sql
-- Nombre total de produits
SELECT COUNT(*) FROM products WHERE isActive = true;

-- Nombre total de devis
SELECT COUNT(*) FROM devis;

-- Nombre d'établissements
SELECT COUNT(*) FROM etablissements WHERE isActive = true;

-- Chiffre d'affaires total
SELECT SUM(total) FROM devis WHERE statut IN ('APPROUVE', 'ACCEPTE');

-- Devis par statut
SELECT statut, COUNT(*) as count 
FROM devis 
GROUP BY statut;

-- Top 5 produits les plus vendus
SELECT 
  p.name,
  SUM(dp.quantite) as total_quantite,
  SUM(dp.total) as total_revenue
FROM devis_products dp
JOIN products p ON dp.productId = p.id
JOIN devis d ON dp.devisId = d.id
WHERE d.statut IN ('APPROUVE', 'ACCEPTE')
GROUP BY p.id, p.name
ORDER BY total_quantite DESC
LIMIT 5;

-- Devis par établissement
SELECT 
  e.name,
  COUNT(d.id) as devis_count,
  SUM(d.total) as revenue
FROM etablissements e
LEFT JOIN devis d ON e.id = d.etablissementId
WHERE e.isActive = true
GROUP BY e.id, e.name
ORDER BY revenue DESC;
```

### Requêtes pour Établissement

```sql
-- Devis d'un établissement
SELECT * FROM devis 
WHERE etablissementId = :etablissementId
ORDER BY date DESC;

-- Clients d'un établissement
SELECT * FROM clients 
WHERE etablissementId = :etablissementId
ORDER BY createdAt DESC;
```

### Requêtes pour Responsable

```sql
-- Devis en attente de validation
SELECT * FROM devis 
WHERE statut = 'ENVOYE'
ORDER BY date DESC;

-- Historique des validations d'un responsable
SELECT * FROM devis 
WHERE validatedById = :responsableId
ORDER BY validatedAt DESC;
```

---

## 🔐 Contraintes de Sécurité

### Niveaux d'accès par rôle

**ADMIN:**
- Accès complet à toutes les tables
- Peut créer/modifier/supprimer: produits, catégories, établissements, utilisateurs
- Peut voir tous les devis

**ETABLISSEMENT:**
- Peut voir ses propres devis uniquement
- Peut créer des devis pour ses clients
- Peut voir le catalogue produits (lecture seule)
- Peut gérer ses propres clients

**RESPONSABLE:**
- Peut voir tous les devis
- Peut valider/rejeter/suspendre les devis
- Peut créer des devis
- Peut voir le catalogue produits (lecture seule)

---

## 📝 Notes d'Implémentation

### Migration depuis JSON

1. **Users**: Migrer depuis `accounts.json`
   - Hasher les mots de passe avec bcrypt
   - Créer les utilisateurs avec leurs rôles

2. **Categories**: Migrer depuis `products.json`
   - Extraire les catégories uniques
   - Créer les enregistrements

3. **Products**: Migrer depuis `products.json`
   - Associer chaque produit à sa catégorie
   - Conserver les images

4. **Etablissements**: Migrer depuis `etablissements.json`
   - Créer les utilisateurs associés
   - Créer les établissements

5. **Clients & Devis**: Migrer depuis `quotes.json`
   - Extraire les clients uniques
   - Créer les devis avec leurs produits

### Génération des numéros

- **Devis**: Format `DV-XXX` (auto-incrémenté)
- **Etablissement**: Format `ETBXXX` (auto-incrémenté)

### Soft Delete

Les tables principales (`products`, `etablissements`, `users`) utilisent `isActive` pour le soft delete plutôt que la suppression physique.

---

## 🚀 Commandes Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name init

# Appliquer les migrations
npx prisma migrate deploy

# Ouvrir Prisma Studio
npx prisma studio

# Réinitialiser la base de données
npx prisma migrate reset
```

---

**Dernière mise à jour**: Janvier 2025

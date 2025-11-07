# 🎉 TV Tracker API v2 - Projet Final

API RESTful professionnelle pour la gestion de films et séries avec MongoDB, JWT, Swagger et configuration multi-environnement.

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement
Copiez et configurez le fichier `env.local` :
```bash
# Configuration de l'environnement
NODE_ENV=development  # ou production

# Configuration MongoDB
MONGO_URI_DEV=mongodb://localhost:27017/tv_tracker_v2_dev  # Dev: MongoDB local
MONGO_URI_PROD=mongodb+srv://user:password@cluster.mongodb.net/tv_tracker_v2  # Prod: Cluster MongoDB

# Configuration JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Configuration CORS
CORS_ORIGIN=http://localhost:3000
CORS_ORIGIN_PROD=https://yourdomain.com  # Production: CORS restreint
```

### 3. Démarrage du serveur

**Développement (MongoDB local) :**
```bash
npm run dev
```

**Production (Cluster MongoDB) :**
```bash
npm run prod
```

### 4. Peupler la base de données
```bash
# Peupler la base de développement
npm run seed

# Peupler la base de production
npm run seed:prod
```

### 5. Accès à l'API
- **API** : http://localhost:3000
- **Swagger v1 (deprecated)** : http://localhost:3000/docs/v1
- **Swagger v2 (active)** : http://localhost:3000/docs/v2
- **Health check** : http://localhost:3000/health

## 📊 Configuration des Environnements

### Développement (Development)
- **Base de données** : MongoDB local (`mongodb://localhost:27017/tv_tracker_v2_dev`)
- **CORS** : Permissif (`http://localhost:3000`)
- **Rate limiting** : 100 requêtes / 15 minutes
- **HTTPS** : Désactivé

### Production
- **Base de données** : Cluster MongoDB Atlas (`tv_tracker_v2`)
- **CORS** : Restreint (configuré via `CORS_ORIGIN_PROD`)
- **Rate limiting** : 50 requêtes / 15 minutes
- **HTTPS** : Redirect activé (si `HTTPS_ENABLED=true`)

## 🎯 Endpoints API

### Authentification
- `POST /api/v2/auth/register` - Inscription (rate limit: 5 req/15min)
- `POST /api/v2/auth/login` - Connexion (rate limit: 5 req/15min)
- `GET /api/v2/auth/me` - Profil (JWT requis)

### Films
- `GET /api/v2/movies` - Liste des films avec **pagination et filtres**
  - Query params: `title`, `genre`, `minYear`, `maxYear`, `minDuration`, `maxDuration`, `page`, `limit`
  - Réponse: `{items, pagination: {page, limit, total, pages}}`
- `GET /api/v2/movies/:id` - Détails d'un film
- `POST /api/v2/movies` - Créer un film (Admin, JWT requis)
- `PATCH /api/v2/movies/:id` - Modifier un film (Admin, JWT requis)
- `DELETE /api/v2/movies/:id` - Supprimer un film (Admin, JWT requis)

### Notes (Ratings)
- `POST /api/v2/ratings` - Créer une note (JWT requis)
  - Body: `{target: 'movie'|'series', targetId: string, score: 1-10, review?: string}`
- `GET /api/v2/ratings/my` - Mes notes avec **pagination** (JWT requis)
  - Query params: `page`, `limit`
  - Réponse: `{items, pagination: {page, limit, total, pages}}`
- `GET /api/v2/ratings/avg/:target/:targetId` - Moyenne des notes d'un film/série
  - Réponse: `{averageScore, totalRatings, distribution}`
- `PATCH /api/v2/ratings/:id` - Modifier une note (Auteur ou Admin, JWT requis)
- `DELETE /api/v2/ratings/:id` - Supprimer une note (Auteur ou Admin, JWT requis)

## 📚 Documentation Swagger Interactive

### Accès à la Documentation
1. **Démarrez le serveur** : `npm run dev` ou `npm run prod`
2. **Ouvrez votre navigateur** :
   - **v1 (deprecated)** : http://localhost:3000/docs/v1
   - **v2 (active)** : http://localhost:3000/docs/v2

### Utilisation de l'Authentification dans Swagger
1. **Inscription** : `POST /api/v2/auth/register`
2. **Connexion** : `POST /api/v2/auth/login`
3. **Copiez le token** retourné dans la réponse
4. **Dans Swagger** : Cliquez sur "Authorize" → "bearerAuth" → Collez le token
5. **Testez les endpoints protégés** avec "Try it out"

### Fonctionnalités Swagger
- ✅ **v1 (deprecated)** : Marqué comme deprecated, route `getAll` testable
- ✅ **v2 (active)** : Toutes les routes documentées
- ✅ **Schémas complets** : User, Movie, Rating, Pagination, Error
- ✅ **Propriété score** : Documentée avec min/max (1-10), exemples
- ✅ **Validations** : Toutes les validations documentées (required, min, max, etc.)
- ✅ **Routes protégées** : `bearerAuth` configuré, testable dans Swagger
- ✅ **Pagination** : Format `{items, total, page, pages}` documenté
- ✅ **Filtres** : Tous les filtres de recherche documentés

## 🗄️ Schémas MongoDB (Mongoose)

### Modèles Disponibles

#### User (Authentification)
```typescript
{
  email: string;           // Email unique
  username: string;        // Nom d'utilisateur unique
  password: string;        // Mot de passe hashé (bcrypt)
  role: 'admin' | 'user';  // Rôle utilisateur
}
```

#### Movie (Films)
```typescript
{
  title: string;           // Titre du film
  genres: string[];        // Genres du film
  synopsis?: string;       // Synopsis (optionnel)
  releaseDate?: Date;      // Date de sortie (optionnel)
  durationMin: number;     // Durée en minutes
}
```

#### Rating (Notes)
```typescript
{
  userId: ObjectId;         // Référence vers l'utilisateur
  target: 'movie' | 'series'; // Type de cible
  targetId: ObjectId;      // ID de la cible
  score: number;           // Note (1-10) - Validation: min: 1, max: 10
  review?: string;         // Avis (optionnel, max 1000 caractères)
}
```

### Index MongoDB Optimisés
```javascript
// Index sur les titres pour la recherche
{ title: "text" }

// Index sur les genres pour le filtrage
{ genres: 1 }

// Index sur les relations
{ userId: 1, targetId: 1 }  // Unique pour éviter les doublons
{ target: 1, targetId: 1 }  // Pour les moyennes
```

## 🌱 Scripts de Seed

### Script TypeScript Principal
```bash
# Peupler la base de développement
npm run seed

# Peupler la base de production
npm run seed:prod
```

**Fichier** : `seed-simple.ts`

**Fonctionnalités** :
- Détection automatique de l'environnement (dev/prod)
- Utilise la même logique que `server-fixed.ts` pour choisir la base de données
- Création d'utilisateurs (admin et user)
- Films avec genres et métadonnées
- Notes et avis utilisateurs
- Nettoyage automatique avant peuplement

### Données de Test Créées
- **Utilisateurs** : 
  - `admin@tvtracker.com` / `admin123` (role: admin)
  - `user@tvtracker.com` / `user123` (role: user)
- **Films** : 5 films populaires (Avatar, Interstellar, The Matrix, Forrest Gump, Le Seigneur des Anneaux)
- **Notes** : 10 notes (2 par film)

## 🔧 Configuration

### Variables d'Environnement (`env.local`)
```bash
# Environnement
NODE_ENV=development  # ou production

# MongoDB
MONGO_URI_DEV=mongodb://localhost:27017/tv_tracker_v2_dev
MONGO_URI_PROD=mongodb+srv://user:password@cluster.mongodb.net/tv_tracker_v2

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_ORIGIN_PROD=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_WINDOW_MS=900000
RATE_LIMIT_AUTH_MAX=5

# HTTPS (production)
HTTPS_ENABLED=false
```

## 🛡️ Sécurité

### JWT (JSON Web Tokens)
- **Expiration** : 7 jours (dev) / 1 jour (prod)
- **Secret** : Configuré via `JWT_SECRET`
- **Format** : `Bearer <token>`

### Rôles
- **Admin** : Accès complet (CRUD films, gestion utilisateurs)
- **User** : Lecture + création/modification de ses propres notes

### Rate Limiting
- **Général** : 100 req/15min (dev) / 50 req/15min (prod)
- **Authentification** : 5 tentatives / 15 minutes
- **Headers** : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

### CORS
- **Development** : Permissif (`http://localhost:3000`)
- **Production** : Restreint (configuré via `CORS_ORIGIN_PROD`)

### HTTPS
- **Production** : Redirect automatique HTTP → HTTPS (si `HTTPS_ENABLED=true`)
- **Localhost** : Désactivé automatiquement (même en production)

### Helmet
- Headers de sécurité configurés
- Content Security Policy
- Protection contre XSS, clickjacking, etc.

## 📁 Structure du Projet

```
├── server-fixed.ts          # Serveur principal (utilisé)
├── seed-simple.ts           # Script de seed
├── package.json             # Dépendances et scripts
├── env.local                # Variables d'environnement (non commité)
├── tsconfig.json            # Configuration TypeScript
├── v1/                      # Version 1 (dépréciée)
│   ├── src/
│   └── package.json
├── v2/                      # Version 2 (active)
│   ├── src/
│   │   ├── models/          # Schémas Mongoose
│   │   ├── controllers/     # Contrôleurs
│   │   ├── routes/          # Routes Express
│   │   ├── middlewares/     # Middlewares
│   │   └── services/        # Services
│   ├── config/              # Configuration multi-env
│   ├── docs/                # Documentation Swagger
│   │   ├── swagger-v1.json  # v1 (deprecated)
│   │   └── swagger-v2.json  # v2 (active)
│   └── collections_postman/ # Collections Postman
│       ├── TV_Tracker_API_Collection.postman_collection.json
│       └── TV_Tracker_API_v2_Collection.postman_collection.json
└── README.md                # Ce fichier
```

## 🧪 Tests

### Test de l'API
```bash
# Test de santé
curl http://localhost:3000/health

# Test de l'endpoint racine
curl http://localhost:3000/

# Test avec pagination
curl "http://localhost:3000/api/v2/movies?page=1&limit=5"

# Test avec filtres
curl "http://localhost:3000/api/v2/movies?title=Avatar&genre=Action"
```

### Test avec Postman
1. **Import** : `v2/collections_postman/TV_Tracker_API_v2_Collection.postman_collection.json`
2. **Variables** : Configurer `{{baseUrl}}` = `http://localhost:3000`
3. **Authentification** : Exécuter "Register" ou "Login" pour obtenir le token
4. **Tests** : Exécuter la collection complète avec tests automatiques

## 🚀 Commandes Utiles

```bash
# Développement (MongoDB local)
npm run dev

# Production (Cluster MongoDB)
npm run prod

# Peupler la base de données
npm run seed          # Dev
npm run seed:prod     # Prod

# Build TypeScript
npm run build

# Tests
npm run test:typescript
```

## 📋 Checklist des Fonctionnalités

### ✅ Documentation OpenAPI
- [x] v1 (Swagger) : deprecated + route getAll testable
- [x] v2 (Swagger) : toutes les routes documentées
- [x] UI : `/docs/v1` & `/docs/v2` routes documentées
- [x] V2 : schémas complets (montrer les schémas + explorer la propriété score pour rating)
- [x] Les validations implémentées et documentées
- [x] Routes protégées sur swagger : bearerAuth + tester un accès à une route protégée sans authentification
- [x] Tester exemple avec user (route sans autorisation + une avec autorisation)
- [x] Créer 2 ratings pour un film (avec 1 ou 2 users)
- [x] Tester exemple avec admin
- [x] Montrer et tester une route avec la pagination et les filtres (montrer {items,total,page,pages} dans le résultat)
- [x] Moyenne film ou moyenne série

### ✅ Sécurité (JWT, rôles, CORS, rate-limit, HTTPS)
- [x] CORS restreint (production)
- [x] Rate-limit (général + authentification)
- [x] HTTPS prod (redirect activé si configuré)

### ✅ Environnements
- [x] Dev : MongoDB local (ou cluster avec base `tv_tracker_v2_dev`)
- [x] Prod : Cluster MongoDB (base `tv_tracker_v2`)
- [x] Scripts npm : `dev`, `prod`, `seed`, `seed:prod`

## 🎉 Projet Prêt !

**Le serveur est opérationnel avec :**
- ✅ MongoDB connecté (dev/prod séparés)
- ✅ Documentation Swagger interactive (v1 + v2)
- ✅ Authentification JWT complète
- ✅ Sécurité complète (CORS, rate-limit, HTTPS, Helmet)
- ✅ Scripts de seed fonctionnels
- ✅ Configuration multi-environnement
- ✅ Pagination et filtres
- ✅ Moyenne des notes

---

Ce projet est développé dans le cadre académique du cours de Collecte et Interprétation des Données.

**Auteur** : Andy L  
**Version** : 2.0.0

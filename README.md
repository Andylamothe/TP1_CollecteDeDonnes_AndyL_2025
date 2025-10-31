#  TV Tracker API v2 - Projet Final

API RESTful professionnelle pour la gestion de films et séries avec MongoDB, JWT, Swagger et configuration multi-environnement.

##  Démarrage Rapide


# 1. Installation des dépendances
```bash
npm run install:all
```
# 2. Configuration de l'environnement
```bash
cp v2/env.example .env
```
# Éditer .env avec vos valeurs MongoDB

# 3. Démarrage du serveur TypeScript
```bash
npm run dev
```
# Cloner le repository
```bash
git clone https://github.com/Andylamothe/TP1_CollecteDeDonnes_AndyL_2025
cd TP1_CollecteDeDonnes_AndyL_2025
```
# 4. Peupler la base de données
```bash
npm run seed
```
# 5. Accès à l'API
# API: http://localhost:3000
# Swagger: http://localhost:3000/docs
# Santé: http://localhost:3000/health


##  Vérification des Livrables

###  **1. Code Complet (Repository)**
- **Structure** : `v1/` (dépréciée) + `v2/` (active) en TypeScript
- **Configuration** : Multi-environnement dans `v2/config/`
- **Scripts** : `package.json` avec scripts npm complets
- **Documentation** : Ce README avec instructions complètes

**Vérification** :
```bash
# Vérifier la structure
ls -la v1/ v2/
# Vérifier les scripts
npm run --silent
```

###  **2. OpenAPI Documentation (Swagger)**
- **Fichiers** : `v2/docs/swagger-v1.json` (deprecated) + `v2/docs/swagger-v2.json` (active)
- **Interface** : http://localhost:3000/docs
- **Authentification** : JWT Bearer token intégré
- **Schémas** : Modèles complets avec exemples

**Vérification** :
```bash
# Démarrer le serveur
npm run dev
```
# Tester l'accès Swagger
```
curl http://localhost:3000/docs
```
# Doit retourner du HTML Swagger UI

# Tester l'API de santé
```
curl http://localhost:3000/health
```
# Doit retourner {"status":"ok","database":"connected"}


###  **3. MongoDB - Schémas et Connexion**
- **Modèles** : `v2/src/models/` (User, Movie, Series, Season, Episode, Rating)
- **Index** : Optimisés pour la recherche (title, genres, relations)
- **Seed** : `npm run seed` pour peupler la base
- **Connexion** : MongoDB Atlas configurée

**Vérification** :
```bash
# Exécuter le seed
npm run seed

# Doit afficher " Base de données peuplée avec succès"

# Vérifier la connexion
curl http://localhost:3000/health
# database: "connected"
```

###  **4. Sécurité Opérationnelle**
- **JWT** : Authentification avec tokens (7 jours)
- **Rôles** : Admin (CRUD) / User (lecture + notes)
- **CORS** : Configuré par environnement
- **Rate Limiting** : Protection contre les abus
- **Helmet** : Headers de sécurité

**Vérification** :
```bash
# Test d'inscription
curl -X POST http://localhost:3000/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"test123"}'

# Test de connexion
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
# Copier le token retourné

# Test d'authentification
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/v2/auth/me
```

###  **5. Collection Postman**
- **Fichier** : `v2/TV_Tracker_API_v2_Collection.postman_collection.json`
- **Tests** : Cas de succès/erreur/rôles/pagination/filtres
- **Variables** : `{{baseUrl}}` et `{{jwt_token}}` automatiques

**Vérification** :
1. **Importer** : Ouvrir Postman → Import → `v2/TV_Tracker_API_v2_Collection.postman_collection.json`
2. **Configurer** : Variables `baseUrl` = `http://localhost:3000`
3. **Exécuter** : Collection complète avec tests automatiques

##  Documentation Swagger Interactive

### Accès à la Documentation
1. **Démarrez le serveur** : `npm run dev`
2. **Ouvrez votre navigateur** : http://localhost:3000/docs
3. **Explorez l'API** : Testez directement les endpoints

### Utilisation de l'Authentification
1. **Inscription** : `POST /api/v2/auth/register`
2. **Connexion** : `POST /api/v2/auth/login`
3. **Copiez le token** retourné
4. **Dans Swagger** : Cliquez sur "Authorize" → "Bearer" → Collez le token
5. **Testez les endpoints protégés**

##  Schémas MongoDB (Mongoose)

### Modèles Disponibles

#### User (Authentification)
```typescript
// v2/src/models/User.ts
{
  email: string;           // Email unique
  username: string;        // Nom d'utilisateur unique
  password: string;        // Mot de passe hashé
  role: 'admin' | 'user';  // Rôle utilisateur
  favorites?: string[];    // Favoris (optionnel)
}
```

#### Movie (Films)
```typescript
// v2/src/models/Movie.ts
{
  title: string;           // Titre du film
  genres: string[];        // Genres du film
  synopsis?: string;       // Synopsis (optionnel)
  releaseDate?: Date;      // Date de sortie (optionnel)
  durationMin: number;     // Durée en minutes
}
```

#### Series (Séries)
```typescript
// v2/src/models/Series.ts
{
  title: string;           // Titre de la série
  genres: string[];        // Genres de la série
  status: 'en_attente' | 'en_cours' | 'terminee';
  synopsis?: string;       // Synopsis (optionnel)
  releaseDate?: Date;      // Date de sortie (optionnel)
}
```

#### Season (Saisons)
```typescript
// v2/src/models/Season.ts
{
  seriesId: ObjectId;      // Référence vers la série
  seasonNo: number;         // Numéro de saison
  episodes: ObjectId[];     // Références vers les épisodes
}
```

#### Episode (Épisodes)
```typescript
// v2/src/models/Episode.ts
{
  seriesId: ObjectId;       // Référence vers la série
  seasonId: ObjectId;       // Référence vers la saison
  epNo: number;           // Numéro d'épisode
  title: string;           // Titre de l'épisode
  durationMin: number;     // Durée en minutes
}
```

#### Rating (Notes)
```typescript
// v2/src/models/Rating.ts
{
  userId: ObjectId;         // Référence vers l'utilisateur
  target: 'movie' | 'series'; // Type de cible
  targetId: ObjectId;      // ID de la cible
  score: number;           // Note (1-10)
  review?: string;        // Avis (optionnel)
}
```

### Index MongoDB Optimisés
```javascript
// Index sur les titres pour la recherche
{ title: "text" }

// Index sur les genres pour le filtrage
{ genres: 1 }

// Index sur les relations
{ seriesId: 1, seasonId: 1 }
{ userId: 1, targetId: 1 }
```

##  Scripts de Seed

### Script TypeScript Principal
```bash
# Exécuter le script de seed TypeScript
npm run seed
```

**Fichier** : `v2/scripts/seed.ts` (script principal)

**Fonctionnalités** :
- Création d'utilisateurs (admin et user)
- Films avec genres et métadonnées
- Séries avec saisons et épisodes
- Notes et avis utilisateurs
- Index MongoDB optimisés

### Données de Test Créées
- **Utilisateurs** : Admin et utilisateurs de test
- **Films** : Films populaires avec genres
- **Séries** : Séries avec saisons complètes
- **Notes** : Notes et avis variés
- **Relations** : Liens entre toutes les entités

## 🔧 Configuration

### Variables d'Environnement
```bash
# .env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/tv_tracker_v2
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=http://localhost:3000
```

### Configuration Multi-Environnement
- **Développement** : `v2/config/development.json`
- **Test** : `v2/config/test.json`
- **Production** : `v2/config/production.json`
- **Variables d'environnement** : `v2/config/custom-environment-variables.json`

##  Endpoints API

### Authentification
- `POST /api/v2/auth/register` - Inscription
- `POST /api/v2/auth/login` - Connexion
- `GET /api/v2/auth/me` - Profil (JWT requis)

### Films
- `GET /api/v2/movies` - Liste des films
- `POST /api/v2/movies` - Créer un film (Admin, JWT requis)
- `GET /api/v2/movies/:id` - Détails d'un film
- `PATCH /api/v2/movies/:id` - Modifier un film (Admin, JWT requis)
- `DELETE /api/v2/movies/:id` - Supprimer un film (Admin, JWT requis)

### Notes
- `POST /api/v2/ratings` - Créer une note (JWT requis)
- `GET /api/v2/ratings/my` - Mes notes (JWT requis)
- `GET /api/v2/ratings/avg/movie/:movieId` - Moyenne des notes d'un film
- `GET /api/v2/ratings/avg/series/:seriesId` - Moyenne des notes d'une série

##  Sécurité

- **JWT** : Authentification avec tokens (7 jours)
- **Rôles** : Admin (CRUD complet) / User (lecture + notes)
- **Rate Limiting** : Protection contre les abus
- **CORS** : Configuration par environnement
- **Helmet** : Headers de sécurité
- **Validation** : Validation des données d'entrée

##  Structure du Projet

```
├── v1/                          # Version 1 (dépréciée)
│   ├── src/                     # Code source v1
│   ├── package.json
│   └── README.md
├── v2/                          # Version 2 (active)
│   ├── src/
│   │   ├── models/             # Schémas Mongoose
│   │   ├── controllers/        # Contrôleurs
│   │   ├── routes/            # Routes Express
│   │   ├── middlewares/       # Middlewares
│   │   └── services/          # Services
│   ├── config/                # Configuration multi-env
│   ├── docs/                  # Documentation Swagger
│   └── scripts/               # Scripts de seed
├── server-simple.ts           # Serveur principal TypeScript
├── seed.js                    # Script de seed JavaScript
├── package.json               # Dépendances et scripts
└── README.md                  # Ce fichier
```

##  Tests

### Test de l'API
```bash
# Test de santé
curl http://localhost:3000/health

# Test de l'endpoint racine
curl http://localhost:3000/
```

### Test avec Postman
1. **Import** : `v2/TV_Tracker_API_v2_Collection.postman_collection.json`
2. **Variables** : Configurer `{{baseUrl}}` et `{{jwt_token}}`
3. **Tests** : Exécuter la collection complète

##  Commandes Utiles

```bash
# Développement (TypeScript avec rechargement)
npm run dev

# Test
npm run test

# Production
npm run build && npm run prod

# Seed de la base de données
npm run seed

# Installation des dépendances
npm run install:all
```

## 🎉 Projet Prêt !

**Le serveur TypeScript est opérationnel avec :**
- ✅ MongoDB Atlas connecté
- ✅ Documentation Swagger interactive
- ✅ Authentification JWT
- ✅ Sécurité complète
- ✅ Scripts de seed fonctionnels
- ✅ Configuration multi-environnement


Ce projet est développé dans le cadre académique du cours de Collecte et Interprétation des Données.

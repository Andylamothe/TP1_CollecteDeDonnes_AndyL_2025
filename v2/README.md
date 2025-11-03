# TV Tracker API v2

API RESTful professionnelle pour la gestion de films et séries avec MongoDB, JWT, Swagger et configuration multi-environnement.

## 🚀 Fonctionnalités

- **MongoDB** avec Mongoose pour la persistance des données
- **Authentification JWT** avec système de rôles (admin/user)
- **Documentation Swagger** complète
- **Configuration multi-environnement** (dev/test/prod)
- **Sécurité avancée** : CORS, rate limiting, validation
- **Gestion d'erreurs** standardisée avec Winston
- **Agrégations MongoDB** pour les statistiques
- **API versionnée** avec préfixe `/api/v2`

## 📋 Prérequis

- Node.js 18+
- MongoDB 5.0+
- npm ou yarn

## 🛠️ Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd v2
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier .env avec vos valeurs
nano .env
```

4. **Démarrer MongoDB**
```bash
# Avec Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Ou installer MongoDB localement
```

5. **Peupler la base de données (optionnel)**
```bash
npm run seed
```

## 🚀 Démarrage

### Développement
```bash
npm run dev
```

### Test
```bash
npm run test
```

### Production
```bash
npm run build
npm run prod
```

## 📚 Documentation API

### Swagger UI
- **v2** : http://localhost:3000/docs/v2
- **v1** : http://localhost:3000/docs/v1 (lecture seule, dépréciée)

### Endpoints principaux

#### Authentification
- `POST /api/v2/auth/register` - Inscription
- `POST /api/v2/auth/login` - Connexion
- `GET /api/v2/auth/me` - Profil utilisateur
- `PATCH /api/v2/auth/me` - Mise à jour profil

#### Films
- `GET /api/v2/movies` - Liste des films (avec filtres)
- `GET /api/v2/movies/:id` - Détails d'un film
- `POST /api/v2/movies` - Créer un film (admin)
- `PATCH /api/v2/movies/:id` - Modifier un film (admin)
- `DELETE /api/v2/movies/:id` - Supprimer un film (admin)

#### Notes
- `POST /api/v2/ratings` - Créer une note
- `GET /api/v2/ratings/avg/:target/:targetId` - Moyenne des notes
- `GET /api/v2/ratings/my` - Mes notes
- `PATCH /api/v2/ratings/:id` - Modifier une note
- `DELETE /api/v2/ratings/:id` - Supprimer une note

## 🔐 Authentification

### Inscription
```bash
curl -X POST http://localhost:3000/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "john_doe",
    "password": "password123"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Utilisation du token
```bash
curl -X GET http://localhost:3000/api/v2/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|---------|
| `NODE_ENV` | Environnement | `development` |
| `PORT` | Port du serveur | `3000` |
| `MONGO_URI` | URI MongoDB | `mongodb://localhost:27017/tv_tracker_v2` |
| `JWT_SECRET` | Clé secrète JWT | **Requis** |
| `JWT_EXPIRES_IN` | Durée du token | `7d` |
| `CORS_ORIGIN` | Origines CORS | `http://localhost:3000` |
| `LOG_LEVEL` | Niveau de log | `info` |

### Fichiers de configuration

- `config/default.json` - Configuration par défaut
- `config/development.json` - Configuration développement
- `config/test.json` - Configuration test
- `config/production.json` - Configuration production
- `config/custom-environment-variables.json` - Mapping des variables d'environnement

## 🗄️ Modèles de données

### User
```typescript
{
  email: string;
  username: string;
  password: string; // hashé
  role: 'admin' | 'user';
  favorites?: string[];
}
```

### Movie
```typescript
{
  title: string;
  genres: string[];
  synopsis?: string;
  releaseDate?: Date;
  durationMin: number;
}
```

### Series
```typescript
{
  title: string;
  genres: string[];
  status: 'en_attente' | 'en_cours' | 'terminee';
  synopsis?: string;
  releaseDate?: Date;
}
```

### Rating
```typescript
{
  userId: ObjectId;
  target: 'movie' | 'series';
  targetId: ObjectId;
  score: number; // 1-10
  review?: string;
}
```

## 🔍 Filtres et recherche

### Films
```bash
# Recherche par titre
GET /api/v2/movies?title=inception

# Filtre par genre
GET /api/v2/movies?genre=Action

# Filtre par année
GET /api/v2/movies?minYear=2010&maxYear=2020

# Filtre par durée
GET /api/v2/movies?minDuration=120&maxDuration=180

# Pagination
GET /api/v2/movies?page=1&limit=10
```

## 📊 Agrégations MongoDB

### Moyenne des notes par film
```javascript
db.ratings.aggregate([
  { $match: { target: 'movie', targetId: ObjectId('...') } },
  { $group: { _id: null, averageScore: { $avg: '$score' } } }
])
```

### Statistiques des séries
```javascript
db.ratings.aggregate([
  { $match: { target: 'series' } },
  { $group: { _id: '$targetId', averageScore: { $avg: '$score' } } }
])
```

## 🛡️ Sécurité

- **JWT** pour l'authentification
- **Rôles** : admin (CRUD complet) / user (lecture + notes)
- **Rate limiting** : 100 req/15min, 5 auth/15min, 10 ratings/15min
- **CORS** configuré
- **Helmet** pour les headers de sécurité
- **Validation** des données d'entrée
- **Sanitisation** des inputs

## 📝 Logging

- **Winston** pour les logs structurés
- **Niveaux** : error, warn, info, debug
- **Fichiers** : rotation automatique (10MB, 5 fichiers)
- **Console** : format coloré en développement

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Couverture de code
npm run test:coverage
```

## 🚀 Déploiement

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "prod"]
```

### Variables d'environnement production
```bash
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb://mongo:27017/tv_tracker_prod
JWT_SECRET=your_super_secret_key_here
CORS_ORIGIN=https://yourdomain.com
```

## 📈 Monitoring

### Santé de l'API
```bash
curl http://localhost:3000/health
```

### Métriques
- Temps de réponse
- Taux d'erreur
- Utilisation de la base de données
- Logs d'audit

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence ISC.

## 👥 Auteur

**Andy Lamothe** - TP2 Collecte et Interprétation des Données

## 🔗 Liens utiles

- [Documentation MongoDB](https://docs.mongodb.com/)
- [Documentation Mongoose](https://mongoosejs.com/docs/)
- [Documentation JWT](https://jwt.io/)
- [Documentation Swagger](https://swagger.io/docs/)
- [Documentation Express](https://expressjs.com/)
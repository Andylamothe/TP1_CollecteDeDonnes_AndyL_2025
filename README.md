# TP1 — API RESTful TV Tracker

## Description
Ce projet implémente une API RESTful complète en TypeScript avec Node.js et Express pour la gestion d'un système de suivi de médias (films et séries). L'API respecte les spécifications du TP1 avec authentification, validation, logging et persistance des données.

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (version 14 ou supérieure)
- npm

### Installation
```bash
# Cloner le repository
git clone https://github.com/Andylamothe/TP1_CollecteDeDonnes_AndyL_2025
cd TP1_CollecteDeDonnes_AndyL_2025

# Installer les dépendances
npm install
```

### Démarrage
```bash
# Démarrer le serveur en mode développement
npm run start
```

Le serveur sera accessible sur `http://localhost:3000`

## 📁 Structure du Projet

```
src/
├── controllers/          # Contrôleurs de l'API
│   ├── MediaController.ts
│   ├── FilmController.ts
│   ├── SerieController.ts
│   ├── SaisonController.ts
│   ├── EpisodeController.ts
│   └── LogController.ts
├── models/              # Modèles POO
│   ├── Media.ts         # Classe abstraite
│   ├── Film.ts          # Hérite de Media
│   ├── Serie.ts         # Hérite de Media
│   ├── Saison.ts        # Contient des épisodes
│   ├── Episode.ts       # Épisode individuel
│   └── User.ts          # Utilisateur
├── routes/              # Définition des routes
│   ├── medias.routes.ts
│   ├── films.routes.ts
│   ├── series.routes.ts
│   ├── seasons.routes.ts
│   ├── episodes.routes.ts
│   └── logs.routes.ts
├── middlewares/         # Middlewares personnalisés
│   ├── auth.middleware.ts      # Authentification et autorisation
│   ├── validation.middleware.ts # Validation des données
│   └── error.middleware.ts     # Gestion des erreurs
├── services/            # Services métier
│   ├── StorageService.ts       # Persistance des données
│   └── LoggerService.ts        # Logging avec Winston
├── data/                # Données persistantes
│   └── db.json          # Base de données JSON
└── logs/                # Fichiers de logs
    ├── operations.log   # Logs des opérations
    └── errors.log       # Logs des erreurs
```

## 🔌 API Endpoints

### Base
- `GET /` - Informations sur l'API et endpoints disponibles

### Médias (Routes principales)
- `GET /api/medias` - Liste tous les médias (avec filtres optionnels)
  - Query params: `type` (film|serie), `genre`, `year`
- `GET /api/medias/:id` - Récupère un média par ID
- `POST /api/medias` - Crée un nouveau média (admin seulement)
- `PUT /api/medias/:id` - Met à jour un média (admin seulement)
- `DELETE /api/medias/:id` - Supprime un média (admin seulement)

### Films
- `POST /api/films` - Crée un nouveau film (admin seulement)

### Séries
- `POST /api/series` - Crée une nouvelle série (admin seulement)

### Saisons
- `POST /api/seasons` - Crée une nouvelle saison (admin seulement)

### Épisodes
- `POST /api/episodes` - Crée un nouvel épisode (admin seulement)
- `PATCH /api/episodes/:id` - Met à jour un épisode (admin seulement)

### Routes spéciales
- `GET /api/series/:id/episodes` - Récupère tous les épisodes d'une série
- `GET /api/users/:id/medias` - Récupère tous les médias d'un utilisateur
- `GET /api/logs` - Récupère la dernière opération depuis operations.log

## 🔐 Authentification et Autorisation

### Header d'authentification
L'API utilise le header `x-user-id` pour l'authentification :

```bash
# Pour les opérations admin
curl -H "x-user-id: admin-001" http://localhost:3000/api/medias

# Pour les opérations utilisateur
curl -H "x-user-id: user-001" http://localhost:3000/api/medias
```

### Rôles utilisateur
- **admin** : Peut créer, modifier et supprimer des médias
- **user** : Peut seulement consulter les médias

### Utilisateurs de test
- `admin-001` : Administrateur (rôle admin)
- `user-001` : Utilisateur Test (rôle user)
- `user-002` : Alice Martin (rôle user)

## 📊 Modèles de Données

### Media (abstrait)
```typescript
{
  id: string;
  titre: string;
  plateforme: string;
  userId: string;
}
```

### Film (hérite de Media)
```typescript
{
  id: string;
  titre: string;
  plateforme: string;
  userId: string;
  duree: number;        // en minutes
  genre: string;
  annee: number;
}
```

### Serie (hérite de Media)
```typescript
{
  id: string;
  titre: string;
  plateforme: string;
  userId: string;
  statut: "en_attente" | "en_cours" | "terminee";
  saisons: Saison[];
}
```

### Saison
```typescript
{
  numero: number;
  episodes: Episode[];
}
```

### Episode
```typescript
{
  id: string;
  titre: string;
  numero: number;
  duree: number;        // en minutes
  watched?: boolean;
}
```

### User
```typescript
{
  id: string;
  nom: string;
  role: "admin" | "user";
}
```

## ✅ Validation des Données

L'API valide automatiquement les données selon les règles suivantes :

| Champ | Règle | Exemple |
|-------|-------|---------|
| **titre** | `^[A-Za-z0-9 ]+$` | "Inception", "Breaking Bad" |
| **plateforme** | `^[A-Za-z]+$` | "Netflix", "HBO" |
| **duree** | Entier positif | 148, 45 |
| **statut** | `en_attente\|en_cours\|terminee` | "en_cours" |
| **annee** | ≤ année actuelle | 2023, 2010 |

Les requêtes avec des données invalides retournent un code 400 avec les détails des erreurs.

## 📝 Logging

### Configuration Winston
- **operations.log** : Logs des opérations (format JSON)
- **errors.log** : Logs des erreurs (format JSON)
- **Console** : Affichage coloré pour le développement

### Format des logs
```json
{
  "level": "info",
  "message": "Operation",
  "action": "CREATE_FILM",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "filmId": "film-001",
  "userId": "admin-001"
}
```

## 💾 Persistance des Données

### Fichiers de données
- **`src/data/db.json`** : Base de données JSON principale
- **`src/logs/operations.log`** : Historique des opérations
- **`src/logs/errors.log`** : Historique des erreurs

### Garanties
- ✅ Écriture automatique sur `db.json` après chaque mutation
- ✅ Sauvegarde atomique (tout ou rien)
- ✅ Gestion des erreurs de persistance

## 🧪 Données de Test

Le fichier `db.json` contient des données de test prêtes à l'emploi :

### Films
- **Inception** (2010) - Science Fiction - 148 min
- **The Dark Knight** (2008) - Action - 152 min

### Séries
- **Breaking Bad** - Terminée - 2 saisons avec épisodes
- **Stranger Things** - En cours - 1 saison avec épisodes

### Utilisateurs
- 1 administrateur
- 2 utilisateurs normaux

## 🔧 Exemples d'Utilisation

### Créer un film (admin)
```bash
curl -X POST http://localhost:3000/api/films \
  -H "Content-Type: application/json" \
  -H "x-user-id: admin-001" \
  -d '{
    "titre": "Interstellar",
    "plateforme": "Netflix",
    "duree": 169,
    "genre": "Science Fiction",
    "annee": 2014,
    "userId": "user-001"
  }'
```

### Lister les médias avec filtres
```bash
# Tous les films
curl "http://localhost:3000/api/medias?type=film"

# Films de science fiction
curl "http://localhost:3000/api/medias?type=film&genre=Science Fiction"

# Films de 2010
curl "http://localhost:3000/api/medias?type=film&year=2010"
```

### Récupérer la dernière opération
```bash
curl http://localhost:3000/api/logs
```

## 🚨 Gestion des Erreurs

L'API retourne des codes d'erreur appropriés :

- **400** : Données de validation invalides
- **401** : Non autorisé (header x-user-id manquant)
- **403** : Accès interdit (rôle insuffisant)
- **404** : Ressource non trouvée
- **500** : Erreur interne du serveur

## 📋 Checklist TP1

- ✅ **Dépendances** : express, winston, typescript, ts-node-dev, @types/*
- ✅ **Modèles POO** : Media (abstrait), Film, Serie, Saison, Episode, User
- ✅ **Persistence** : StorageService avec CRUD et écriture sur db.json
- ✅ **Validation** : Middleware avec regex selon spécifications
- ✅ **Auth** : Middleware x-user-id et requireAdmin
- ✅ **Logger** : Winston avec operations.log, errors.log, console
- ✅ **Endpoint logs** : GET /api/logs retourne dernière action
- ✅ **Routes** : Toutes les routes spécifiées + routes additionnelles
- ✅ **Données test** : db.json avec admin, films, séries, épisodes
- ✅ **Documentation** : README complet avec exemples

## 👨‍💻 Auteur

**Andy L.** - TP1 Collecte et Interprétation des Données  
Automne 2025

## 📄 Licence

Ce projet est développé dans le cadre académique du cours de Collecte et Interprétation des Données.

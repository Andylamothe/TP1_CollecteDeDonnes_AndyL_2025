import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import swaggerJsdoc from 'swagger-jsdoc';
import * as swaggerUi from 'swagger-ui-express';
import * as dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import swagerSpec from './v2/docs/swagger-v1.json'
import swagerSpec2 from './v2/docs/swagger-v2.json'

// Charger les variables d'environnement
dotenv.config({ path: './env.local' });
const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Configuration MongoDB selon l'environnement
// Dev : MongoDB local, Prod : Cluster MongoDB
const getMongoUri = (): string => {
    if (isProduction) {
        // Production : utiliser le cluster MongoDB
        return process.env.MONGO_URI || process.env.MONGO_URI_PROD || '';
    } else {
        // Development : utiliser MongoDB local
        return process.env.MONGO_URI_DEV || 'mongodb://localhost:27017/tv_tracker_v2_dev';
    }
};

// Configuration CORS selon l'environnement
const getCorsOrigin = (): string | string[] => {
    if (isProduction) {
        // Production : CORS restreint
        return process.env.CORS_ORIGIN_PROD ? process.env.CORS_ORIGIN_PROD.split(',') : [];
    } else {
        // Development : CORS permissif
        return process.env.CORS_ORIGIN || 'http://localhost:3000';
    }
};

// Middleware HTTPS redirect pour la production
// Seulement si HTTPS est explicitement activé et qu'on n'est pas en localhost
if (isProduction && process.env.HTTPS_ENABLED === 'true') {
    app.use((req, res, next) => {
        // Ne pas rediriger si on est en localhost (développement local)
        const host = req.header('host') || '';
        if (host.includes('localhost') || host.includes('127.0.0.1')) {
            return next();
        }
        
        // Rediriger HTTP vers HTTPS en production réelle
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${host}${req.url}`);
        } else {
            next();
        }
    });
}

// Middlewares de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors({ 
    origin: getCorsOrigin(), 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting général
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isProduction ? '50' : '100')),
    message: {
        message: 'Trop de requêtes, veuillez réessayer plus tard',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting pour l'authentification (plus strict)
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
    message: {
        message: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Appliquer le rate limiting général
app.use(generalLimiter);


const swaggerSpecv2 = swagerSpec2;
const swaggerSpecv1 = swagerSpec;
// Routes Swagger
app.use('/docs/v2', swaggerUi.serveFiles(swaggerSpecv2), swaggerUi.setup(swaggerSpecv2, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TV Tracker API v2 - Documentation'
}));

app.use('/docs/v1', swaggerUi.serveFiles(swaggerSpecv1), swaggerUi.setup(swaggerSpecv1, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TV Tracker API v1 - Documentation'
}));

// Modèles Mongoose
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    genres: [{ type: String, required: true }],
    synopsis: String,
    releaseDate: Date,
    durationMin: { type: Number, required: true }
}, { timestamps: true });

const ratingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: String, enum: ['movie', 'series'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, min: 1, max: 10, required: true },
    review: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Movie = mongoose.model('Movie', movieSchema);
const Rating = mongoose.model('Rating', ratingSchema);

// Interface pour l'utilisateur authentifié
interface AuthenticatedUser {
    userId: string;
    email: string;
    role: string;
}

// Middleware d'authentification
const authenticateToken = (req: any, res: any, next: any): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Token d\'authentification requis' });
        return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({ message: 'JWT_SECRET non configuré' });
        return;
    }

    jwt.verify(token, secret, (err: any, user: any) => {
        if (err) {
            res.status(403).json({ message: 'Token invalide' });
            return;
        }
        req.user = user;
        next();
    });
};

// Routes de base
app.get('/', (req, res) => {
    res.json({
        message: 'TV Tracker API v2 - Serveur TypeScript opérationnel',
        version: '2.0.0',
        status: 'ok',
        timestamp: new Date().toISOString(),
        documentation: '/docs',
        endpoints: {
            auth: '/api/v2/auth/*',
            movies: '/api/v2/movies/*',
            ratings: '/api/v2/ratings/*'
        }
    });
});

app.get('/health', (req, res) => {
    // Protection contre mongoose.connection undefined
    let dbStatus = 'unknown';
    try {
        const readyState = mongoose && (mongoose as any).connection ? (mongoose as any).connection.readyState : undefined;
        if (readyState === 1) dbStatus = 'connected';
        else if (readyState === 2) dbStatus = 'connecting';
        else if (typeof readyState === 'number') dbStatus = 'disconnected';
        else dbStatus = 'unknown';
    } catch (e) {
        dbStatus = 'unknown';
    }

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Routes d'authentification avec rate limiting
app.post('/api/v2/auth/register', authLimiter, async (req, res) => {
    try {
        const { email, username, password } = req.body;
        
        if (!email || !username || !password) {
            res.status(400).json({ message: 'Email, nom d\'utilisateur et mot de passe sont requis' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email,
            username,
            password: hashedPassword,
            role: 'user'
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            },
            token
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/v2/auth/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            res.status(400).json({ message: 'Email et mot de passe sont requis' });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            return;
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Connexion réussie',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            },
            token
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/v2/auth/me', authenticateToken, async (req: any, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            res.status(404).json({ message: 'Utilisateur non trouvé' });
            return;
        }

        res.json({
            message: 'Profil récupéré avec succès',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// Routes des films
app.get('/api/v2/movies', async (req, res) => {
    try {
        const {
            title,
            genre,
            minYear,
            maxYear,
            minDuration,
            maxDuration,
            page = 1,
            limit = 10
        } = req.query;

        // Construction du filtre
        const filter: any = {};

        if (title) {
            filter.$or = [
                { title: { $regex: title, $options: 'i' } },
                { synopsis: { $regex: title, $options: 'i' } }
            ];
        }

        if (genre) {
            filter.genres = { $in: Array.isArray(genre) ? genre : [genre] };
        }

        if (minYear || maxYear) {
            filter.releaseDate = {};
            if (minYear) filter.releaseDate.$gte = new Date(`${minYear}-01-01`);
            if (maxYear) filter.releaseDate.$lte = new Date(`${maxYear}-12-31`);
        }

        if (minDuration || maxDuration) {
            filter.durationMin = {};
            if (minDuration) filter.durationMin.$gte = Number(minDuration);
            if (maxDuration) filter.durationMin.$lte = Number(maxDuration);
        }

        // Calcul de la pagination
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        // Exécution de la requête
        const [movies, total] = await Promise.all([
            Movie.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Movie.countDocuments(filter)
        ]);

        res.json({
            message: 'Films récupérés avec succès',
            items: movies,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/v2/movies/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            res.status(404).json({ message: 'Film non trouvé' });
            return;
        }
        res.json({
            message: 'Film récupéré avec succès',
            data: movie
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// POST movie — ajouté return pour satisfaire TS et cohérence
app.post('/api/v2/movies', authenticateToken, async (req: any, res: any): Promise<any> => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permissions insuffisantes' });
        }

        const { title, genres, synopsis, releaseDate, durationMin } = req.body;
        const movie = new Movie({
            title,
            genres,
            synopsis,
            releaseDate: releaseDate ? new Date(releaseDate) : undefined,
            durationMin
        });

        await movie.save();

        return res.status(201).json({
            message: 'Film créé avec succès',
            data: movie
        });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
});

// --- PATCH & DELETE endpoints pour movies ---
app.patch('/api/v2/movies/:id', authenticateToken, async (req: any, res: any): Promise<any> => {
    try {
        // seulement admin peut modifier un film
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permissions insuffisantes' });
        }

        const updates = req.body;
        // runValidators pour que les validations mongoose s'appliquent aux champs mis à jour
        const movie = await Movie.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

        if (!movie) {
            return res.status(404).json({ message: 'Film non trouvé' });
        }

        return res.json({ message: 'Film mis à jour avec succès', data: movie });
    } catch (error: any) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID invalide' });
        }
        return res.status(400).json({ message: error.message });
    }
});

app.delete('/api/v2/movies/:id', authenticateToken, async (req: any, res: any): Promise<any> => {
    try {
        // seulement admin peut supprimer un film
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permissions insuffisantes' });
        }

        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: 'Film non trouvé' });
        }

        return res.json({ message: 'Film supprimé avec succès', data: { id: req.params.id } });
    } catch (error: any) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID invalide' });
        }
        return res.status(400).json({ message: error.message });
    }
});

// Routes des notes
// POST rating — ajouté return pour satisfaire TS et cohérence
app.post('/api/v2/ratings', authenticateToken, async (req: any, res: any): Promise<any> => {
    try {
        const { target, targetId, score, review } = req.body;
        
        const rating = new Rating({
            userId: req.user.userId,
            target,
            targetId,
            score,
            review
        });

        await rating.save();

        return res.status(201).json({
            message: 'Note créée avec succès',
            data: rating
        });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
});

app.get('/api/v2/ratings/my', authenticateToken, async (req: any, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [ratings, total] = await Promise.all([
            Rating.find({ userId: req.user.userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Rating.countDocuments({ userId: req.user.userId })
        ]);

        res.json({
            message: 'Notes récupérées avec succès',
            items: ratings,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// Route pour obtenir la moyenne des notes d'un film ou d'une série
app.get('/api/v2/ratings/avg/:target/:targetId', async (req: any, res: any): Promise<any> => {
    try {
        const { target, targetId } = req.params;

        if (!['movie', 'series'].includes(target)) {
            return res.status(400).json({ message: 'Le type de cible doit être "movie" ou "series"' });
        }

        // Vérifier que la cible existe
        const targetExists = target === 'movie'
            ? await Movie.findById(targetId).exec()
            : null; // Pour l'instant, on ne gère que les films

        if (!targetExists) {
            return res.status(404).json({ message: `${target === 'movie' ? 'Film' : 'Série'} non trouvé` });
        }

        // Calculer la moyenne des notes
        const result = await Rating.aggregate([
            {
                $match: {
                    target,
                    targetId: new mongoose.Types.ObjectId(targetId)
                }
            },
            {
                $group: {
                    _id: null,
                    averageScore: { $avg: '$score' },
                    totalRatings: { $sum: 1 },
                    scoreDistribution: {
                        $push: '$score'
                    }
                }
            }
        ]);

        const ratingData = result[0] || {
            averageScore: 0,
            totalRatings: 0,
            scoreDistribution: []
        };

        // Calculer la distribution des notes
        const distribution = ratingData.scoreDistribution.reduce((acc: any, score: number) => {
            acc[score] = (acc[score] || 0) + 1;
            return acc;
        }, {});

        return res.json({
            message: 'Moyenne des notes récupérée avec succès',
            data: {
                target,
                targetId,
                averageScore: Math.round(ratingData.averageScore * 10) / 10,
                totalRatings: ratingData.totalRatings,
                distribution
            }
        });
    } catch (error: any) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID invalide' });
        }
        return res.status(400).json({ message: error.message });
    }
});

// --- PATCH & DELETE endpoints pour ratings ---
// PATCH: l'auteur de la note ou admin peut modifier
app.patch('/api/v2/ratings/:id', authenticateToken, async (req: any, res: any): Promise<any> => {
    try {
        const rating = await Rating.findById(req.params.id);
        if (!rating) {
            return res.status(404).json({ message: 'Note non trouvée' });
        }

        const userIdStr = req.user.userId ? String(req.user.userId) : null;
        const ratingOwnerId = rating.userId ? String(rating.userId) : null;

        if (req.user.role !== 'admin' && userIdStr !== ratingOwnerId) {
            return res.status(403).json({ message: 'Permissions insuffisantes pour modifier cette note' });
        }

        const updates = req.body;
        // On autorise uniquement certains champs à être mis à jour (sécurité)
        const allowed = ['score', 'review'];
        const filtered: any = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) filtered[key] = updates[key];
        }

        const updatedRating = await Rating.findByIdAndUpdate(req.params.id, filtered, { new: true, runValidators: true });
        return res.json({ message: 'Note mise à jour avec succès', data: updatedRating });
    } catch (error: any) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID invalide' });
        }
        return res.status(400).json({ message: error.message });
    }
});

// DELETE: l'auteur de la note ou admin peut supprimer
app.delete('/api/v2/ratings/:id', authenticateToken, async (req: any, res: any): Promise<any> => {
    try {
        const rating = await Rating.findById(req.params.id);
        if (!rating) {
            return res.status(404).json({ message: 'Note non trouvée' });
        }

        const userIdStr = req.user.userId ? String(req.user.userId) : null;
        const ratingOwnerId = rating.userId ? String(rating.userId) : null;

        if (req.user.role !== 'admin' && userIdStr !== ratingOwnerId) {
            return res.status(403).json({ message: 'Permissions insuffisantes pour supprimer cette note' });
        }

        await Rating.findByIdAndDelete(req.params.id);
        return res.json({ message: 'Note supprimée avec succès', data: { id: req.params.id } });
    } catch (error: any) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID invalide' });
        }
        return res.status(400).json({ message: error.message });
    }
});

// Fonction de connexion à MongoDB
async function connectToMongoDB() {
    try {
        const mongoUri = getMongoUri();
        const env = isProduction ? 'Production (Cluster MongoDB)' : 'Development (MongoDB local)';
        
        console.log(` Connexion à MongoDB (${env})...`);
        console.log(` URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Masquer les credentials
        
        await mongoose.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log(` Connexion à MongoDB réussie ! (${env})`);
        const dbName = mongoose.connection?.db?.databaseName || '(inconnue)';
        console.log(` Base de données: ${dbName}`);
    } catch (error: any) {
        console.error(' Erreur de connexion MongoDB:', error.message);
        process.exit(1);
    }
}

// Global error handler pour attraper erreurs non gérées dans les routes
app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
    res.status(err?.status || 500).json({
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err?.message || err : undefined
    });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectToMongoDB();
        
        app.listen(PORT, () => {
            const env = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';
            const protocol = isProduction ? 'https' : 'http';
            const mongoEnv = isProduction ? 'Cluster MongoDB' : 'MongoDB local';
            
            console.log(`\n╔══════════════════════════════════════════════════════════╗`);
            console.log(`║   Serveur TV Tracker API v2 démarré avec succès            ║`);
            console.log(`╚══════════════════════════════════════════════════════════╝\n`);
            console.log(` Environnement: ${env}`);
            console.log(` Port: ${PORT}`);
            console.log(` Base de données: ${mongoEnv}`);
            console.log(` API disponible sur ${protocol}://localhost:${PORT}`);
            console.log(` Documentation Swagger:`);
            console.log(`   - v1 (deprecated): ${protocol}://localhost:${PORT}/docs/v1`);
            console.log(`   - v2 (active):     ${protocol}://localhost:${PORT}/docs/v2`);
            console.log(`\n Endpoints disponibles :`);
            console.log(`   POST   /api/v2/auth/register          - Inscription`);
            console.log(`   POST   /api/v2/auth/login               - Connexion`);
            console.log(`   GET    /api/v2/auth/me                   - Profil (JWT requis)`);
            console.log(`   GET    /api/v2/movies                   - Liste des films (pagination + filtres)`);
            console.log(`   GET    /api/v2/movies/:id               - Film par ID`);
            console.log(`   POST   /api/v2/movies                   - Créer un film (Admin, JWT requis)`);
            console.log(`   PATCH  /api/v2/movies/:id               - Mettre à jour un film (Admin, JWT requis)`);
            console.log(`   DELETE /api/v2/movies/:id               - Supprimer un film (Admin, JWT requis)`);
            console.log(`   POST   /api/v2/ratings                  - Créer une note (JWT requis)`);
            console.log(`   GET    /api/v2/ratings/my               - Mes notes (JWT requis, pagination)`);
            console.log(`   GET    /api/v2/ratings/avg/:target/:id  - Moyenne des notes (film/série)`);
            console.log(`   PATCH  /api/v2/ratings/:id               - Mettre à jour une note (Auteur ou Admin)`);
            console.log(`   DELETE /api/v2/ratings/:id               - Supprimer une note (Auteur ou Admin)`);
            console.log(`\n Sécurité:`);
            console.log(`   - Rate limiting: ${isProduction ? 'Strict (50 req/15min)' : 'Permissif (100 req/15min)'}`);
            console.log(`   - CORS: ${isProduction ? 'Restreint' : 'Permissif'}`);
            console.log(`   - HTTPS: ${isProduction ? 'Activé (redirect)' : 'Désactivé'}`);
        });
    } catch (error: any) {
        console.error(' Erreur lors du démarrage:', error);
        process.exit(1);
    }
}

startServer();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: './env.local' });

const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Configuration Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TV Tracker API v2',
            version: '2.0.0',
            description: 'API RESTful professionnelle pour la gestion de films et séries avec MongoDB, JWT et Swagger'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Serveur de développement'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./server-simple.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Routes Swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TV Tracker API v2 - Documentation'
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

// Interface pour la requête avec utilisateur authentifié
interface AuthenticatedRequest extends express.Request {
    user: AuthenticatedUser;
}

// Middleware d'authentification
const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Token d\'authentification requis' });
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
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
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

/**
 * @swagger
 * /api/v2/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               username:
 *                 type: string
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 */
app.post('/api/v2/auth/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        
        if (!email || !username || !password) {
            return res.status(400).json({ message: 'Email, nom d\'utilisateur et mot de passe sont requis' });
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

/**
 * @swagger
 * /api/v2/auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants incorrects
 */
app.post('/api/v2/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe sont requis' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
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

/**
 * @swagger
 * /api/v2/auth/me:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *       401:
 *         description: Non authentifié
 */
app.get('/api/v2/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
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

/**
 * @swagger
 * /api/v2/movies:
 *   get:
 *     summary: Récupérer la liste des films
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Liste des films récupérée avec succès
 */
app.get('/api/v2/movies', async (req, res) => {
    try {
        const movies = await Movie.find().limit(10);
        res.json({
            message: 'Films récupérés avec succès',
            data: movies
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/v2/movies/{id}:
 *   get:
 *     summary: Récupérer un film par son ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du film
 *     responses:
 *       200:
 *         description: Film récupéré avec succès
 *       404:
 *         description: Film non trouvé
 */
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

/**
 * @swagger
 * /api/v2/movies:
 *   post:
 *     summary: Créer un nouveau film (Admin uniquement)
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - genres
 *               - durationMin
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Inception"
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Action", "Sci-Fi"]
 *               synopsis:
 *                 type: string
 *                 example: "Un voleur qui entre dans les rêves..."
 *               releaseDate:
 *                 type: string
 *                 format: date
 *                 example: "2010-07-16"
 *               durationMin:
 *                 type: integer
 *                 example: 148
 *     responses:
 *       201:
 *         description: Film créé avec succès
 *       403:
 *         description: Permissions insuffisantes
 */
app.post('/api/v2/movies', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
    try {
        if (req.user.role !== 'admin') {
            res.status(403).json({ message: 'Permissions insuffisantes' });
            return;
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

        res.status(201).json({
            message: 'Film créé avec succès',
            data: movie
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/v2/ratings:
 *   post:
 *     summary: Créer une nouvelle note
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target
 *               - targetId
 *               - score
 *             properties:
 *               target:
 *                 type: string
 *                 enum: [movie, series]
 *                 example: "movie"
 *               targetId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 8
 *               review:
 *                 type: string
 *                 example: "Excellent film !"
 *     responses:
 *       201:
 *         description: Note créée avec succès
 *       401:
 *         description: Non authentifié
 */
app.post('/api/v2/ratings', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
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

        res.status(201).json({
            message: 'Note créée avec succès',
            data: rating
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

/**
 * @swagger
 * /api/v2/ratings/my:
 *   get:
 *     summary: Récupérer les notes de l'utilisateur connecté
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notes récupérées avec succès
 *       401:
 *         description: Non authentifié
 */
app.get('/api/v2/ratings/my', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
    try {
        const ratings = await Rating.find({ userId: req.user.userId });
        res.json({
            message: 'Notes récupérées avec succès',
            data: ratings
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
});

// Fonction de connexion à MongoDB
async function connectToMongoDB() {
    try {
        console.log('🔄 Connexion à MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI!, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connexion à MongoDB Atlas réussie !');
        console.log('📊 Base de données:', mongoose.connection.name);
    } catch (error: any) {
        console.error('❌ Erreur de connexion MongoDB:', error.message);
        process.exit(1);
    }
}

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectToMongoDB();
        
        app.listen(PORT, () => {
            console.log(`🚀 Serveur TV Tracker v2 TypeScript démarré sur le port ${PORT}`);
            console.log(`📖 API disponible sur http://localhost:${PORT}`);
            console.log(`📚 Documentation Swagger: http://localhost:${PORT}/docs`);
            console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\n🎯 Endpoints disponibles :`);
            console.log(`   POST /api/v2/auth/register  - Inscription`);
            console.log(`   POST /api/v2/auth/login     - Connexion`);
            console.log(`   GET  /api/v2/auth/me        - Profil (JWT requis)`);
            console.log(`   GET  /api/v2/movies         - Liste des films`);
            console.log(`   POST /api/v2/movies         - Créer un film (Admin, JWT requis)`);
            console.log(`   POST /api/v2/ratings        - Créer une note (JWT requis)`);
            console.log(`   GET  /api/v2/ratings/my     - Mes notes (JWT requis)`);
        });
    } catch (error: any) {
        console.error('❌ Erreur lors du démarrage:', error);
        process.exit(1);
    }
}

startServer();

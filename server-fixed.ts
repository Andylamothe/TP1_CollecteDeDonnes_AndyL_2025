import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import swaggerJsdoc from 'swagger-jsdoc';
import * as swaggerUi from 'swagger-ui-express';
import * as dotenv from 'dotenv';
import swagerSpec from './v2/docs/swagger-v1.json'
import swagerSpec2 from './v2/docs/swagger-v2.json'

// Charger les variables d'environnement
dotenv.config({ path: './env.local' });
const app = express();

// middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());


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

// Routes d'authentification
app.post('/api/v2/auth/register', async (req, res) => {
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

app.post('/api/v2/auth/login', async (req, res) => {
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
        const movies = await Movie.find().limit(10);
        res.json({
            message: 'Films récupérés avec succès',
            data: movies
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
        const ratings = await Rating.find({ userId: req.user.userId });
        res.json({
            message: 'Notes récupérées avec succès',
            data: ratings
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
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
        console.log(' Connexion à MongoDB Atlas...');
        await mongoose.connect(process.env.MONGO_URI!, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(' Connexion à MongoDB Atlas réussie !');
        const dbName = mongoose.connection?.db?.databaseName || '(inconnue)';
        console.log(' Base de données:', dbName);
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
            console.log(` Serveur TV Tracker v2 TypeScript démarré sur le port ${PORT}`);
            console.log(` API disponible sur http://localhost:${PORT}`);
            console.log(` Documentation Swagger: http://localhost:${PORT}/docs`);
            console.log(` Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\n Endpoints disponibles :`);
            console.log(`   POST /api/v2/auth/register  - Inscription`);
            console.log(`   POST /api/v2/auth/login     - Connexion`);
            console.log(`   GET  /api/v2/auth/me        - Profil (JWT requis)`);
            console.log(`   GET  /api/v2/movies         - Liste des films`);
            console.log(`   GET  /api/v2/movies/:id     - Film par ID`);
            console.log(`   POST /api/v2/movies         - Créer un film (Admin, JWT requis)`);
            console.log(`   PATCH /api/v2/movies/:id    - Mettre à jour un film (Admin, JWT requis)`);
            console.log(`   DELETE /api/v2/movies/:id   - Supprimer un film (Admin, JWT requis)`);
            console.log(`   POST /api/v2/ratings        - Créer une note (JWT requis)`);
            console.log(`   PATCH /api/v2/ratings/:id   - Mettre à jour une note (Auteur ou Admin)`);
            console.log(`   DELETE /api/v2/ratings/:id  - Supprimer une note (Auteur ou Admin)`);
            console.log(`   GET  /api/v2/ratings/my     - Mes notes (JWT requis)`);
        });
    } catch (error: any) {
        console.error(' Erreur lors du démarrage:', error);
        process.exit(1);
    }
}

startServer();
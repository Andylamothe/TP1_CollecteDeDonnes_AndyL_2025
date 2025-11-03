import express from 'express';
import config from 'config';
import dotenv from 'dotenv';
import { DatabaseService } from './src/services/DatabaseService';
import { LoggerService } from './src/services/LoggerService';
import { SecurityMiddleware } from './src/middlewares/security.middleware';
import { ErrorMiddleware } from './src/middlewares/error.middleware';

// Import des routes
import authRoutes from './src/routes/auth.routes';
import movieRoutes from './src/routes/movies.routes';
import ratingRoutes from './src/routes/ratings.routes';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const logger = LoggerService.getInstance();

// Middlewares de sécurité
app.use(SecurityMiddleware.setupHelmet());
app.use(SecurityMiddleware.setupCors());
app.use(SecurityMiddleware.setupRateLimit());
app.use(SecurityMiddleware.setupRequestLogging());

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes de l'API v2
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/movies', movieRoutes);
app.use('/api/v2/ratings', ratingRoutes);

// Route de base
app.get('/', (req, res) => {
    res.json({
        message: 'API RESTful TV Tracker - Version 2',
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            auth: '/api/v2/auth',
            movies: '/api/v2/movies',
            ratings: '/api/v2/ratings',
            documentation: '/docs/v2'
        },
        features: [
            'MongoDB avec Mongoose',
            'Authentification JWT',
            'Système de rôles (admin/user)',
            'Rate limiting',
            'CORS configuré',
            'Validation des données',
            'Gestion d\'erreurs standardisée',
            'Logging avec Winston'
        ]
    });
});

// Route de santé
app.get('/health', (req, res) => {
    const dbStatus = DatabaseService.getInstance().getConnectionStatus();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Middleware de gestion des erreurs
app.use(ErrorMiddleware.handleError.bind(ErrorMiddleware));

// Middleware pour les routes non trouvées
app.use(ErrorMiddleware.notFound.bind(ErrorMiddleware));

// Fonction d'initialisation
async function initializeServices(): Promise<void> {
    try {
        // Initialiser la base de données
        await DatabaseService.getInstance().connect();
        logger.logOperation('SERVER_INIT', { message: 'Services initialisés avec succès' });
    } catch (error) {
        logger.logError('SERVER_INIT_ERROR', error);
        throw error;
    }
}

// Démarrage du serveur
const PORT = config.get<number>('server.port');
const HOST = config.get<string>('server.host');

async function startServer(): Promise<void> {
    try {
        await initializeServices();
        
        app.listen(PORT, HOST, () => {
            logger.logOperation('SERVER_START', {
                message: 'Serveur démarré avec succès',
                port: PORT,
                host: HOST,
                environment: process.env.NODE_ENV || 'development'
            });
            
            console.log(`🚀 Serveur v2 démarré sur ${HOST}:${PORT}`);
            console.log(`📖 API disponible sur http://${HOST}:${PORT}`);
            console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Base de données: ${config.get<string>('db.uri')}`);
        });

    } catch (error) {
        logger.logError('SERVER_START_ERROR', error);
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}

// Gestion des signaux de fermeture
process.on('SIGTERM', async () => {
    logger.logOperation('SERVER_SHUTDOWN', { message: 'Signal SIGTERM reçu' });
    await DatabaseService.getInstance().disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.logOperation('SERVER_SHUTDOWN', { message: 'Signal SIGINT reçu' });
    await DatabaseService.getInstance().disconnect();
    process.exit(0);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    logger.logError('UNHANDLED_REJECTION', { reason, promise });
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.logError('UNCAUGHT_EXCEPTION', error);
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Démarrer le serveur
startServer().catch(error => {
    logger.logError('SERVER_STARTUP_ERROR', error);
    console.error('❌ Erreur critique lors du démarrage:', error);
    process.exit(1);
});
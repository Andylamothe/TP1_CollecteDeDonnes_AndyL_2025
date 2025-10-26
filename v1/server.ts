import express, { Request, Response } from 'express';
import { StorageService } from './services/StorageService';
import { LoggerService } from './services/LoggerService';
import { ErrorMiddleware } from './middlewares/error.middleware';

// Import des routes
import mediasRoutes from './routes/medias.routes';
import filmsRoutes from './routes/films.routes';
import seriesRoutes from './routes/series.routes';
import seasonsRoutes from './routes/seasons.routes';
import episodesRoutes from './routes/episodes.routes';
import logsRoutes from './routes/logs.routes';

const app = express();

// Middleware de parsing du JSON
app.use(express.json());

// Initialisation des services
async function initializeServices() {
    try {
        await StorageService.getInstance().initialize();
        console.log('✅ StorageService initialisé');
        
        const loggerService = LoggerService.getInstance();
        loggerService.logOperation('SERVER_START', { message: 'Serveur démarré' });
        console.log('✅ LoggerService initialisé');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des services:', error);
        process.exit(1);
    }
}

// Routes de l'API
app.use('/api/medias', mediasRoutes);
app.use('/api/films', filmsRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/seasons', seasonsRoutes);
app.use('/api/episodes', episodesRoutes);
app.use('/api/logs', logsRoutes);

// Route de base
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'API RESTful TV Tracker - TP1 Collecte et Interprétation des Données',
        version: '1.0.0',
        endpoints: {
            medias: '/api/medias',
            films: '/api/films',
            series: '/api/series',
            seasons: '/api/seasons',
            episodes: '/api/episodes',
            logs: '/api/logs'
        },
        documentation: 'Consultez le README.md pour plus d\'informations'
    });
});

// Middleware de gestion des erreurs
app.use(ErrorMiddleware.handleError);

// Middleware pour les routes non trouvées
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route non trouvée',
        message: `La route ${req.method} ${req.originalUrl} n'existe pas`
    });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

async function startServer() {
    await initializeServices();
    
    app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur le port ${PORT}`);
        console.log(`📖 API disponible sur http://localhost:${PORT}`);
        console.log(`📋 Documentation disponible dans le README.md`);
    });
}

startServer().catch(error => {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
});
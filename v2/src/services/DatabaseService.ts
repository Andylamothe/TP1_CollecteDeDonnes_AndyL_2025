import mongoose from 'mongoose';
import config from 'config';
import { LoggerService } from './LoggerService';

export class DatabaseService {
    private static instance: DatabaseService;
    private logger = LoggerService.getInstance();

    private constructor() {}

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async connect(): Promise<void> {
        try {
            const mongoUri = config.get<string>('db.uri');
            
            await mongoose.connect(mongoUri, {
                // Options de connexion recommandées
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            this.logger.logOperation('DATABASE_CONNECT', {
                message: 'Connexion à MongoDB réussie',
                uri: mongoUri.replace(/\/\/.*@/, '//***:***@') // Masquer les credentials
            });

            // Gestion des événements de connexion
            mongoose.connection.on('error', (error) => {
                this.logger.logError('DATABASE_ERROR', error);
            });

            mongoose.connection.on('disconnected', () => {
                this.logger.logOperation('DATABASE_DISCONNECT', {
                    message: 'Déconnexion de MongoDB'
                });
            });

            mongoose.connection.on('reconnected', () => {
                this.logger.logOperation('DATABASE_RECONNECT', {
                    message: 'Reconnexion à MongoDB réussie'
                });
            });

        } catch (error) {
            this.logger.logError('DATABASE_CONNECT_ERROR', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await mongoose.disconnect();
            this.logger.logOperation('DATABASE_DISCONNECT', {
                message: 'Déconnexion de MongoDB réussie'
            });
        } catch (error) {
            this.logger.logError('DATABASE_DISCONNECT_ERROR', error);
            throw error;
        }
    }

    public getConnectionStatus(): string {
        return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    }
}

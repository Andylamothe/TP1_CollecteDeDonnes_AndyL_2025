import winston from 'winston';
import path from 'path';

export class LoggerService {
    private static instance: LoggerService;
    private logger: winston.Logger;

    private constructor() {
        // Configuration des transports selon les spécifications du TP
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(), // Format JSON (1 objet JSON par ligne)
            transports: [
                // Transport pour les opérations
                new winston.transports.File({
                    filename: path.join(__dirname, '../logs/operations.log'),
                    level: 'info',
                    format: winston.format.json()
                }),
                // Transport pour les erreurs
                new winston.transports.File({
                    filename: path.join(__dirname, '../logs/errors.log'),
                    level: 'error',
                    format: winston.format.json()
                }),
                // Transport pour la console
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            ]
        });
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    // Helper pour logger les opérations
    public logOperation(action: string, meta: any = {}): void {
        this.logger.info('Operation', {
            action,
            timestamp: new Date().toISOString(),
            ...meta
        });
    }

    // Helper pour logger les erreurs
    public logError(err: Error | string, meta: any = {}): void {
        const errorMessage = err instanceof Error ? err.message : err;
        const errorStack = err instanceof Error ? err.stack : undefined;
        
        this.logger.error('Error', {
            message: errorMessage,
            stack: errorStack,
            timestamp: new Date().toISOString(),
            ...meta
        });
    }

    // Méthode pour récupérer la dernière action depuis operations.log
    public async getLastOperation(): Promise<any | null> {
        const fs = require('fs').promises;
        const operationsLogPath = path.join(__dirname, '../logs/operations.log');
        
        try {
            const data = await fs.readFile(operationsLogPath, 'utf-8');
            const lines = data.trim().split('\n').filter((line: string) => line.trim());
            
            if (lines.length === 0) {
                return null;
            }
            
            // Récupérer la dernière ligne
            const lastLine = lines[lines.length - 1];
            return JSON.parse(lastLine);
        } catch (error) {
            this.logError('Erreur lors de la lecture du fichier operations.log', { error });
            return null;
        }
    }

    // Méthode pour récupérer toutes les opérations
    public async getAllOperations(): Promise<any[]> {
        const fs = require('fs').promises;
        const operationsLogPath = path.join(__dirname, '../logs/operations.log');
        
        try {
            const data = await fs.readFile(operationsLogPath, 'utf-8');
            const lines = data.trim().split('\n').filter((line: string) => line.trim());
            
            return lines.map((line: string) => {
                try {
                    return JSON.parse(line);
                } catch (error) {
                    return null;
                }
            }).filter((operation: any) => operation !== null);
        } catch (error) {
            this.logError('Erreur lors de la lecture du fichier operations.log', { error });
            return [];
        }
    }
}

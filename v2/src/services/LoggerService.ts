import winston from 'winston';
import config from 'config';

export class LoggerService {
    private static instance: LoggerService;
    private logger: winston.Logger;

    private constructor() {
        this.logger = winston.createLogger({
            level: config.get<string>('logging.level'),
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'tv-tracker-api' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            ]
        });

        // Ajouter le transport fichier si activé
        if (config.get<boolean>('logging.file.enabled')) {
            this.logger.add(new winston.transports.File({
                filename: config.get<string>('logging.file.path'),
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5,
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                )
            }));
        }
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    public logOperation(operation: string, data: any): void {
        this.logger.info('OPERATION', {
            operation,
            data,
            timestamp: new Date().toISOString()
        });
    }

    public logError(operation: string, error: any): void {
        this.logger.error('ERROR', {
            operation,
            error: error.message || error,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    public logAuth(operation: string, userId?: string, success: boolean = true): void {
        this.logger.info('AUTH', {
            operation,
            userId,
            success,
            timestamp: new Date().toISOString()
        });
    }

    public logRequest(method: string, url: string, statusCode: number, responseTime: number, userId?: string): void {
        this.logger.info('REQUEST', {
            method,
            url,
            statusCode,
            responseTime,
            userId,
            timestamp: new Date().toISOString()
        });
    }
}
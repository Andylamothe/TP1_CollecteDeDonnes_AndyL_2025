import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/LoggerService';

export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
}

export class ErrorMiddleware {
    private static logger = LoggerService.getInstance();

    public static handleError(error: ApiError, req: Request, res: Response, next: NextFunction): void {
        // Log de l'erreur
        this.logger.logError('API_ERROR', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            userId: req.user?.userId
        });

        // Déterminer le code de statut
        const statusCode = error.statusCode || 500;
        const code = error.code || 'INTERNAL_SERVER_ERROR';

        // Construire la réponse d'erreur
        const errorResponse: any = {
            message: error.message || 'Erreur interne du serveur',
            code,
            timestamp: new Date().toISOString()
        };

        // Ajouter les détails si disponibles
        if (error.details) {
            errorResponse.details = error.details;
        }

        // Ajouter la stack trace en développement
        if (process.env.NODE_ENV === 'development' && error.stack) {
            errorResponse.stack = error.stack;
        }

        res.status(statusCode).json(errorResponse);
    }

    public static notFound(req: Request, res: Response): void {
        this.logger.logError('ROUTE_NOT_FOUND', {
            url: req.url,
            method: req.method,
            userId: req.user?.userId
        });

        res.status(404).json({
            message: 'Route non trouvée',
            code: 'ROUTE_NOT_FOUND',
            details: {
                method: req.method,
                url: req.originalUrl
            },
            timestamp: new Date().toISOString()
        });
    }

    public static asyncHandler(fn: Function) {
        return (req: Request, res: Response, next: NextFunction) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    // Erreurs personnalisées
    public static createError(message: string, statusCode: number = 500, code: string = 'CUSTOM_ERROR', details?: any): ApiError {
        const error = new Error(message) as ApiError;
        error.statusCode = statusCode;
        error.code = code;
        error.details = details;
        return error;
    }

    public static validationError(message: string, details?: any): ApiError {
        return this.createError(message, 400, 'VALIDATION_ERROR', details);
    }

    public static notFoundError(message: string = 'Ressource non trouvée'): ApiError {
        return this.createError(message, 404, 'NOT_FOUND');
    }

    public static unauthorizedError(message: string = 'Non autorisé'): ApiError {
        return this.createError(message, 401, 'UNAUTHORIZED');
    }

    public static forbiddenError(message: string = 'Accès interdit'): ApiError {
        return this.createError(message, 403, 'FORBIDDEN');
    }

    public static conflictError(message: string, details?: any): ApiError {
        return this.createError(message, 409, 'CONFLICT', details);
    }
}
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/LoggerService';

export class ErrorMiddleware {
    private static loggerService = LoggerService.getInstance();

    public static handleError(err: Error, req: Request, res: Response, next: NextFunction): void {
        // Logger l'erreur
        ErrorMiddleware.loggerService.logError(err, {
            url: req.url,
            method: req.method,
            body: req.body,
            params: req.params,
            query: req.query
        });

        // Répondre avec l'erreur appropriée
        if (res.headersSent) {
            return next(err);
        }

        res.status(500).json({
            error: 'Erreur interne du serveur',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
        });
    }
}
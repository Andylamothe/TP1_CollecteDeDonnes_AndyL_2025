import { Request, Response, NextFunction } from 'express';
import { ErrorMiddleware } from './error.middleware';

export class ValidationMiddleware {
    public static validateEmail(email: string): boolean {
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        return emailRegex.test(email);
    }

    public static validatePassword(password: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        if (password.length < 6) {
            errors.push('Le mot de passe doit contenir au moins 6 caractères');
        }
        
        if (password.length > 128) {
            errors.push('Le mot de passe ne peut pas dépasser 128 caractères');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public static validatePagination(req: Request, res: Response, next: NextFunction): void {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        if (page < 1) {
            return next(ErrorMiddleware.validationError('Le numéro de page doit être supérieur à 0'));
        }

        if (limit < 1 || limit > 100) {
            return next(ErrorMiddleware.validationError('La limite doit être entre 1 et 100'));
        }

        req.query.page = page.toString();
        req.query.limit = limit.toString();
        next();
    }

    public static validateMovieFilters(req: Request, res: Response, next: NextFunction): void {
        const { minYear, maxYear, minDuration, maxDuration } = req.query;

        if (minYear && (isNaN(Number(minYear)) || Number(minYear) < 1900)) {
            return next(ErrorMiddleware.validationError('L\'année minimale doit être un nombre valide supérieur à 1900'));
        }

        if (maxYear && (isNaN(Number(maxYear)) || Number(maxYear) > new Date().getFullYear())) {
            return next(ErrorMiddleware.validationError('L\'année maximale doit être un nombre valide inférieur ou égal à l\'année actuelle'));
        }

        if (minYear && maxYear && Number(minYear) > Number(maxYear)) {
            return next(ErrorMiddleware.validationError('L\'année minimale ne peut pas être supérieure à l\'année maximale'));
        }

        if (minDuration && (isNaN(Number(minDuration)) || Number(minDuration) < 1)) {
            return next(ErrorMiddleware.validationError('La durée minimale doit être un nombre valide supérieur à 0'));
        }

        if (maxDuration && (isNaN(Number(maxDuration)) || Number(maxDuration) > 600)) {
            return next(ErrorMiddleware.validationError('La durée maximale doit être un nombre valide inférieur à 600 minutes'));
        }

        if (minDuration && maxDuration && Number(minDuration) > Number(maxDuration)) {
            return next(ErrorMiddleware.validationError('La durée minimale ne peut pas être supérieure à la durée maximale'));
        }

        next();
    }

    public static validateRating(req: Request, res: Response, next: NextFunction): void {
        const { score } = req.body;

        if (score === undefined || score === null) {
            return next(ErrorMiddleware.validationError('La note est requise'));
        }

        if (isNaN(Number(score)) || Number(score) < 1 || Number(score) > 10) {
            return next(ErrorMiddleware.validationError('La note doit être un nombre entre 1 et 10'));
        }

        next();
    }

    public static validateObjectId(req: Request, res: Response, next: NextFunction): void {
        const { id } = req.params;
        
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            return next(ErrorMiddleware.validationError('ID invalide'));
        }

        next();
    }

    public static sanitizeInput(req: Request, res: Response, next: NextFunction): void {
        // Nettoyer les chaînes de caractères
        const sanitizeString = (str: string): string => {
            return str.trim().replace(/[<>]/g, '');
        };

        // Appliquer la sanitisation aux body, query et params
        if (req.body) {
            for (const key in req.body) {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = sanitizeString(req.body[key]);
                }
            }
        }

        if (req.query) {
            for (const key in req.query) {
                if (typeof req.query[key] === 'string') {
                    req.query[key] = sanitizeString(req.query[key] as string);
                }
            }
        }

        next();
    }
}
import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
    field: string;
    message: string;
}

export class ValidationMiddleware {
    // Regex patterns selon les spécifications du TP
    private static readonly TITRE_PATTERN = /^[A-Za-z0-9 ]+$/;
    private static readonly PLATEFORME_PATTERN = /^[A-Za-z]+$/;
    private static readonly STATUT_PATTERN = /^(en_attente|en_cours|terminee)$/;

    // Validation pour les films
    public static validateFilm(req: Request, res: Response, next: NextFunction): void {
        const errors: ValidationError[] = [];
        const { titre, plateforme, duree, genre, annee, userId } = req.body;

        // Validation du titre
        if (!titre || typeof titre !== 'string' || !ValidationMiddleware.TITRE_PATTERN.test(titre)) {
            errors.push({
                field: 'titre',
                message: 'Le titre doit contenir uniquement des lettres, chiffres et espaces'
            });
        }

        // Validation de la plateforme
        if (!plateforme || typeof plateforme !== 'string' || !ValidationMiddleware.PLATEFORME_PATTERN.test(plateforme)) {
            errors.push({
                field: 'plateforme',
                message: 'La plateforme doit contenir uniquement des lettres'
            });
        }

        // Validation de la durée
        if (!duree || typeof duree !== 'number' || duree <= 0 || !Number.isInteger(duree)) {
            errors.push({
                field: 'duree',
                message: 'La durée doit être un entier positif'
            });
        }

        // Validation du genre
        if (!genre || typeof genre !== 'string' || !ValidationMiddleware.TITRE_PATTERN.test(genre)) {
            errors.push({
                field: 'genre',
                message: 'Le genre doit contenir uniquement des lettres, chiffres et espaces'
            });
        }

        // Validation de l'année
        const currentYear = new Date().getFullYear();
        if (!annee || typeof annee !== 'number' || annee > currentYear || annee < 1900) {
            errors.push({
                field: 'annee',
                message: `L'année doit être un nombre entre 1900 et ${currentYear}`
            });
        }

        // Validation du userId
        if (!userId || typeof userId !== 'string') {
            errors.push({
                field: 'userId',
                message: 'Le userId est requis et doit être une chaîne de caractères'
            });
        }

        if (errors.length > 0) {
            res.status(400).json({
                error: 'Données de validation invalides',
                details: errors
            });
            return;
        }

        next();
    }

    // Validation pour les séries
    public static validateSerie(req: Request, res: Response, next: NextFunction): void {
        const errors: ValidationError[] = [];
        const { titre, plateforme, statut, userId } = req.body;

        // Validation du titre
        if (!titre || typeof titre !== 'string' || !ValidationMiddleware.TITRE_PATTERN.test(titre)) {
            errors.push({
                field: 'titre',
                message: 'Le titre doit contenir uniquement des lettres, chiffres et espaces'
            });
        }

        // Validation de la plateforme
        if (!plateforme || typeof plateforme !== 'string' || !ValidationMiddleware.PLATEFORME_PATTERN.test(plateforme)) {
            errors.push({
                field: 'plateforme',
                message: 'La plateforme doit contenir uniquement des lettres'
            });
        }

        // Validation du statut
        if (!statut || typeof statut !== 'string' || !ValidationMiddleware.STATUT_PATTERN.test(statut)) {
            errors.push({
                field: 'statut',
                message: 'Le statut doit être: en_attente, en_cours ou terminee'
            });
        }

        // Validation du userId
        if (!userId || typeof userId !== 'string') {
            errors.push({
                field: 'userId',
                message: 'Le userId est requis et doit être une chaîne de caractères'
            });
        }

        if (errors.length > 0) {
            res.status(400).json({
                error: 'Données de validation invalides',
                details: errors
            });
            return;
        }

        next();
    }

    // Validation pour les saisons
    public static validateSaison(req: Request, res: Response, next: NextFunction): void {
        const errors: ValidationError[] = [];
        const { numero } = req.body;

        // Validation du numéro
        if (!numero || typeof numero !== 'number' || numero <= 0 || !Number.isInteger(numero)) {
            errors.push({
                field: 'numero',
                message: 'Le numéro de saison doit être un entier positif'
            });
        }

        if (errors.length > 0) {
            res.status(400).json({
                error: 'Données de validation invalides',
                details: errors
            });
            return;
        }

        next();
    }

    // Validation pour les épisodes
    public static validateEpisode(req: Request, res: Response, next: NextFunction): void {
        const errors: ValidationError[] = [];
        const { titre, numero, duree } = req.body;

        // Validation du titre
        if (!titre || typeof titre !== 'string' || !ValidationMiddleware.TITRE_PATTERN.test(titre)) {
            errors.push({
                field: 'titre',
                message: 'Le titre doit contenir uniquement des lettres, chiffres et espaces'
            });
        }

        // Validation du numéro
        if (!numero || typeof numero !== 'number' || numero <= 0 || !Number.isInteger(numero)) {
            errors.push({
                field: 'numero',
                message: 'Le numéro d\'épisode doit être un entier positif'
            });
        }

        // Validation de la durée
        if (!duree || typeof duree !== 'number' || duree <= 0 || !Number.isInteger(duree)) {
            errors.push({
                field: 'duree',
                message: 'La durée doit être un entier positif'
            });
        }

        if (errors.length > 0) {
            res.status(400).json({
                error: 'Données de validation invalides',
                details: errors
            });
            return;
        }

        next();
    }

    // Validation pour les utilisateurs
    public static validateUser(req: Request, res: Response, next: NextFunction): void {
        const errors: ValidationError[] = [];
        const { nom, role } = req.body;

        // Validation du nom
        if (!nom || typeof nom !== 'string' || !ValidationMiddleware.TITRE_PATTERN.test(nom)) {
            errors.push({
                field: 'nom',
                message: 'Le nom doit contenir uniquement des lettres, chiffres et espaces'
            });
        }

        // Validation du rôle
        if (!role || (role !== 'admin' && role !== 'user')) {
            errors.push({
                field: 'role',
                message: 'Le rôle doit être "admin" ou "user"'
            });
        }

        if (errors.length > 0) {
            res.status(400).json({
                error: 'Données de validation invalides',
                details: errors
            });
            return;
        }

        next();
    }

    // Validation générique pour les IDs
    public static validateId(req: Request, res: Response, next: NextFunction): void {
        const { id } = req.params;
        
        if (!id || typeof id !== 'string' || id.trim() === '') {
            res.status(400).json({
                error: 'ID invalide',
                message: 'L\'ID doit être une chaîne de caractères non vide'
            });
            return;
        }

        next();
    }
}

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { ErrorMiddleware } from '../middlewares/error.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';

export class AuthController {
    private static authService = AuthService.getInstance();

    public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, username, password } = req.body;

            // Validation des données
            if (!email || !username || !password) {
                throw ErrorMiddleware.validationError('Email, nom d\'utilisateur et mot de passe sont requis');
            }

            if (!ValidationMiddleware.validateEmail(email)) {
                throw ErrorMiddleware.validationError('Format d\'email invalide');
            }

            const passwordValidation = ValidationMiddleware.validatePassword(password);
            if (!passwordValidation.isValid) {
                throw ErrorMiddleware.validationError('Mot de passe invalide', passwordValidation.errors);
            }

            if (username.length < 3 || username.length > 30) {
                throw ErrorMiddleware.validationError('Le nom d\'utilisateur doit contenir entre 3 et 30 caractères');
            }

            const result = await AuthController.authService.register(email, username, password);

            res.status(201).json({
                message: 'Utilisateur créé avec succès',
                user: {
                    id: result.user._id,
                    email: result.user.email,
                    username: result.user.username,
                    role: result.user.role,
                    createdAt: result.user.createdAt
                },
                token: result.token
            });

        } catch (error) {
            next(error);
        }
    }

    public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;

            // Validation des données
            if (!email || !password) {
                throw ErrorMiddleware.validationError('Email et mot de passe sont requis');
            }

            if (!ValidationMiddleware.validateEmail(email)) {
                throw ErrorMiddleware.validationError('Format d\'email invalide');
            }

            const result = await AuthController.authService.login(email, password);

            res.json({
                message: 'Connexion réussie',
                user: {
                    id: result.user._id,
                    email: result.user.email,
                    username: result.user.username,
                    role: result.user.role,
                    createdAt: result.user.createdAt
                },
                token: result.token
            });

        } catch (error) {
            next(error);
        }
    }

    public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await AuthController.authService.getUserById(req.user!.userId);
            
            if (!user) {
                throw ErrorMiddleware.notFoundError('Utilisateur non trouvé');
            }

            res.json({
                message: 'Profil récupéré avec succès',
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    favorites: user.favorites,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });

        } catch (error) {
            next(error);
        }
    }

    public static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { username, email } = req.body;
            const userId = req.user!.userId;

            const user = await AuthController.authService.getUserById(userId);
            if (!user) {
                throw ErrorMiddleware.notFoundError('Utilisateur non trouvé');
            }

            // Validation des données
            if (username && (username.length < 3 || username.length > 30)) {
                throw ErrorMiddleware.validationError('Le nom d\'utilisateur doit contenir entre 3 et 30 caractères');
            }

            if (email && !ValidationMiddleware.validateEmail(email)) {
                throw ErrorMiddleware.validationError('Format d\'email invalide');
            }

            // Mettre à jour les champs
            if (username) user.username = username;
            if (email) user.email = email;

            await user.save();

            res.json({
                message: 'Profil mis à jour avec succès',
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    favorites: user.favorites,
                    updatedAt: user.updatedAt
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

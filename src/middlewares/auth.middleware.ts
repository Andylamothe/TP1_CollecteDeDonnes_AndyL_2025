import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/StorageService';
import { User } from '../models/User';

// Extension de l'interface Request pour inclure l'utilisateur
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export class AuthMiddleware {
    private static storageService = StorageService.getInstance();

    // Middleware pour lire x-user-id et relier l'utilisateur à la requête
    public static async authenticateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.headers['x-user-id'] as string;

            if (!userId) {
                res.status(401).json({
                    error: 'Non autorisé',
                    message: 'Header x-user-id manquant'
                });
                return;
            }

            const user = await AuthMiddleware.storageService.getUserById(userId);
            
            if (!user) {
                res.status(401).json({
                    error: 'Non autorisé',
                    message: 'Utilisateur non trouvé'
                });
                return;
            }

            // relier l'utilisateur à la requête
            req.user = user;
            next();
        } catch (error) {
            res.status(500).json({
                error: 'Erreur interne',
                message: 'Erreur lors de l\'authentification'
            });
        }
    }

    // Middleware pour vérifier que l'utilisateur est admin
    public static requireAdmin(req: Request, res: Response, next: NextFunction): void {
        if (!req.user) {
            res.status(401).json({
                error: 'Non autorisé',
                message: 'Utilisateur non authentifié'
            });
            return;
        }

        if (req.user.role !== 'admin') {
            res.status(403).json({
                error: 'Accès interdit',
                message: 'Seuls les administrateurs peuvent effectuer cette action'
            });
            return;
        }

        next();
    }

    // Middleware optionnel pour l'authentification (n'échoue pas si pas d'utilisateur)
    public static async optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.headers['x-user-id'] as string;

            if (userId) {
                const user = await AuthMiddleware.storageService.getUserById(userId);
                if (user) {
                    req.user = user;
                }
            }

            next();
        } catch (error) {
            // En cas d'erreur, on continue sans utilisateur
            next();
        }
    }
}

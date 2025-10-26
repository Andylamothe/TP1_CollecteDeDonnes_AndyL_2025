import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { LoggerService } from '../services/LoggerService';

// Étendre l'interface Request pour inclure les propriétés d'authentification
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
            };
        }
    }
}

export class AuthMiddleware {
    private static authService = AuthService.getInstance();
    private static logger = LoggerService.getInstance();

    public static async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({
                    message: 'Token d\'authentification requis',
                    code: 'AUTH_TOKEN_REQUIRED'
                });
                return;
            }

            const token = authHeader.substring(7); // Enlever "Bearer "
            
            try {
                const payload = this.authService.verifyToken(token);
                
                // Vérifier que l'utilisateur existe toujours
                const user = await this.authService.getUserById(payload.userId);
                if (!user) {
                    res.status(401).json({
                        message: 'Utilisateur non trouvé',
                        code: 'USER_NOT_FOUND'
                    });
                    return;
                }

                req.user = payload;
                next();

            } catch (error) {
                this.logger.logError('AUTH_TOKEN_VERIFY_ERROR', error);
                res.status(401).json({
                    message: 'Token invalide ou expiré',
                    code: 'INVALID_TOKEN'
                });
                return;
            }

        } catch (error) {
            this.logger.logError('AUTH_MIDDLEWARE_ERROR', error);
            res.status(500).json({
                message: 'Erreur interne du serveur',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    public static requireRole(roles: string[]) {
        return (req: Request, res: Response, next: NextFunction): void => {
            if (!req.user) {
                res.status(401).json({
                    message: 'Authentification requise',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }

            if (!roles.includes(req.user.role)) {
                res.status(403).json({
                    message: 'Permissions insuffisantes',
                    code: 'INSUFFICIENT_PERMISSIONS',
                    details: {
                        required: roles,
                        current: req.user.role
                    }
                });
                return;
            }

            next();
        };
    }

    public static optionalAuth(req: Request, res: Response, next: NextFunction): void {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }

        const token = authHeader.substring(7);
        
        try {
            const payload = this.authService.verifyToken(token);
            req.user = payload;
        } catch (error) {
            // Ignorer l'erreur pour l'authentification optionnelle
        }
        
        next();
    }
}
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from 'config';

export class SecurityMiddleware {
    public static setupHelmet() {
        return helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false
        });
    }

    public static setupCors() {
        const corsOptions = {
            origin: config.get<string[]>('cors.origin'),
            credentials: config.get<boolean>('cors.credentials'),
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            optionsSuccessStatus: 200
        };

        return cors(corsOptions);
    }

    public static setupRateLimit() {
        const rateLimitConfig = config.get<any>('rateLimit');
        
        return rateLimit({
            windowMs: rateLimitConfig.windowMs,
            max: rateLimitConfig.max,
            message: {
                message: 'Trop de requêtes, veuillez réessayer plus tard',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req: Request, res: Response) => {
                res.status(429).json({
                    message: 'Trop de requêtes, veuillez réessayer plus tard',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    public static setupAuthRateLimit() {
        const rateLimitConfig = config.get<any>('rateLimit');
        
        return rateLimit({
            windowMs: rateLimitConfig.authWindowMs,
            max: rateLimitConfig.authMax,
            message: {
                message: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
                code: 'AUTH_RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(rateLimitConfig.authWindowMs / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req: Request, res: Response) => {
                res.status(429).json({
                    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
                    code: 'AUTH_RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil(rateLimitConfig.authWindowMs / 1000),
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    public static setupRatingRateLimit() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // 10 notes par 15 minutes
            message: {
                message: 'Trop de notes soumises, veuillez réessayer plus tard',
                code: 'RATING_RATE_LIMIT_EXCEEDED',
                retryAfter: 900 // 15 minutes en secondes
            },
            standardHeaders: true,
            legacyHeaders: false,
            handler: (req: Request, res: Response) => {
                res.status(429).json({
                    message: 'Trop de notes soumises, veuillez réessayer plus tard',
                    code: 'RATING_RATE_LIMIT_EXCEEDED',
                    retryAfter: 900,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    public static setupHttpsRedirect() {
        return (req: Request, res: Response, next: NextFunction): void => {
            if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
                res.redirect(`https://${req.header('host')}${req.url}`);
            } else {
                next();
            }
        };
    }

    public static setupRequestLogging() {
        return (req: Request, res: Response, next: NextFunction): void => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                const { method, originalUrl } = req;
                const { statusCode } = res;
                
                // Log seulement les requêtes importantes
                if (statusCode >= 400 || duration > 1000) {
                    console.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
                }
            });
            
            next();
        };
    }
}

import { Router } from 'express';
import { SerieController } from '../controllers/SerieController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';

const router = Router();

// Route protégée (admin seulement)
router.post('/', 
    AuthMiddleware.authenticateUser, 
    AuthMiddleware.requireAdmin, 
    ValidationMiddleware.validateSerie, 
    SerieController.createSerie
);

export default router;

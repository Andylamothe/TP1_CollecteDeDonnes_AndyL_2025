import { Router } from 'express';
import { SaisonController } from '../controllers/SaisonController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';

const router = Router();

// Route protégée (admin seulement)
router.post('/', 
    AuthMiddleware.authenticateUser, 
    AuthMiddleware.requireAdmin, 
    ValidationMiddleware.validateSaison, 
    SaisonController.createSaison
);

export default router;

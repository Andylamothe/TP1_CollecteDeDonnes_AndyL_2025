import { Router } from 'express';
import { EpisodeController } from '../controllers/EpisodeController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';

const router = Router();

// Routes protégées (admin seulement)
router.post('/', 
    AuthMiddleware.authenticateUser, 
    AuthMiddleware.requireAdmin, 
    ValidationMiddleware.validateEpisode, 
    EpisodeController.createEpisode
);

router.patch('/:id', 
    AuthMiddleware.authenticateUser, 
    AuthMiddleware.requireAdmin, 
    ValidationMiddleware.validateId, 
    EpisodeController.updateEpisode
);

export default router;

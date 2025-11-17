import { Router } from 'express';
import { MediaController } from '../controllers/MediaController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';

const router = Router();

// Routes publiques (avec authentification optionnelle)
router.get('/', AuthMiddleware.optionalAuth, MediaController.getMedias);
router.get('/:id', AuthMiddleware.optionalAuth, ValidationMiddleware.validateId, MediaController.getMediaById);
router.get('/series/:id/episodes', AuthMiddleware.optionalAuth, ValidationMiddleware.validateId, MediaController.getSerieEpisodes);
router.get('/users/:id/medias', AuthMiddleware.optionalAuth, ValidationMiddleware.validateId, MediaController.getUserMedias);

// Routes protégées (admin seulement)
router.post('/', 
    AuthMiddleware.authenticateUser, 
    AuthMiddleware.requireAdmin, 
    MediaController.createMedia
);

router.put('/:id', 
    AuthMiddleware.authenticateUser, 
    AuthMiddleware.requireAdmin, 
    ValidationMiddleware.validateId, 
    MediaController.updateMedia
);

router.delete('/:id', 
    AuthMiddleware.authenticateUser, 
    AuthMiddleware.requireAdmin, 
    ValidationMiddleware.validateId, 
    MediaController.deleteMedia
);

export default router;

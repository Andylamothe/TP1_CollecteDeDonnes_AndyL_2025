import { Router } from 'express';
import { FilmController } from '../controllers/FilmController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';

const router = Router();

// Route publique pour lister les films
router.get('/', FilmController.getFilms);

// Route publique pour récupérer un film par ID
router.get('/:id', FilmController.getFilmById);

// Route protégée (admin seulement)
router.post('/', 
    AuthMiddleware.authenticateUser, 
    AuthMiddleware.requireAdmin, 
    ValidationMiddleware.validateFilm, 
    FilmController.createFilm
);

export default router;

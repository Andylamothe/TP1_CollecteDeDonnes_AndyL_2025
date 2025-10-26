import { Router } from 'express';
import { MovieController } from '../controllers/MovieController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { ErrorMiddleware } from '../middlewares/error.middleware';

const router = Router();

/**
 * @swagger
 * /api/v2/movies:
 *   get:
 *     summary: Récupérer la liste des films avec filtres
 *     tags: [Movies]
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Recherche par titre
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filtrer par genre
 *       - in: query
 *         name: minYear
 *         schema:
 *           type: integer
 *         description: Année minimale
 *       - in: query
 *         name: maxYear
 *         schema:
 *           type: integer
 *         description: Année maximale
 *       - in: query
 *         name: minDuration
 *         schema:
 *           type: integer
 *         description: Durée minimale en minutes
 *       - in: query
 *         name: maxDuration
 *         schema:
 *           type: integer
 *         description: Durée maximale en minutes
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des films récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *                 pagination:
 *                   type: object
 */
router.get('/',
    ValidationMiddleware.validatePagination,
    ValidationMiddleware.validateMovieFilters,
    ErrorMiddleware.asyncHandler(MovieController.getAllMovies)
);

/**
 * @swagger
 * /api/v2/movies/{id}:
 *   get:
 *     summary: Récupérer un film par son ID
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du film
 *     responses:
 *       200:
 *         description: Film récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Movie'
 *       404:
 *         description: Film non trouvé
 */
router.get('/:id',
    ValidationMiddleware.validateObjectId,
    ErrorMiddleware.asyncHandler(MovieController.getMovieById)
);

/**
 * @swagger
 * /api/v2/movies:
 *   post:
 *     summary: Créer un nouveau film (Admin uniquement)
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - genres
 *               - durationMin
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Inception"
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Action", "Sci-Fi"]
 *               synopsis:
 *                 type: string
 *                 example: "Un voleur qui entre dans les rêves..."
 *               releaseDate:
 *                 type: string
 *                 format: date
 *                 example: "2010-07-16"
 *               durationMin:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 600
 *                 example: 148
 *     responses:
 *       201:
 *         description: Film créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 */
router.post('/',
    AuthMiddleware.authenticate,
    AuthMiddleware.requireRole(['admin']),
    ValidationMiddleware.sanitizeInput,
    ErrorMiddleware.asyncHandler(MovieController.createMovie)
);

/**
 * @swagger
 * /api/v2/movies/{id}:
 *   patch:
 *     summary: Mettre à jour un film (Admin uniquement)
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du film
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               genres:
 *                 type: array
 *                 items:
 *                   type: string
 *               synopsis:
 *                 type: string
 *               releaseDate:
 *                 type: string
 *                 format: date
 *               durationMin:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 600
 *     responses:
 *       200:
 *         description: Film mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Film non trouvé
 */
router.patch('/:id',
    AuthMiddleware.authenticate,
    AuthMiddleware.requireRole(['admin']),
    ValidationMiddleware.validateObjectId,
    ValidationMiddleware.sanitizeInput,
    ErrorMiddleware.asyncHandler(MovieController.updateMovie)
);

/**
 * @swagger
 * /api/v2/movies/{id}:
 *   delete:
 *     summary: Supprimer un film (Admin uniquement)
 *     tags: [Movies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du film
 *     responses:
 *       200:
 *         description: Film supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Permissions insuffisantes
 *       404:
 *         description: Film non trouvé
 */
router.delete('/:id',
    AuthMiddleware.authenticate,
    AuthMiddleware.requireRole(['admin']),
    ValidationMiddleware.validateObjectId,
    ErrorMiddleware.asyncHandler(MovieController.deleteMovie)
);

export default router;

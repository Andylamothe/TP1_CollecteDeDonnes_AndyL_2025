import { Router } from 'express';
import { RatingController } from '../controllers/RatingController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { SecurityMiddleware } from '../middlewares/security.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { ErrorMiddleware } from '../middlewares/error.middleware';

const router = Router();

/**
 * @swagger
 * /api/v2/ratings:
 *   post:
 *     summary: Créer une nouvelle note
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target
 *               - targetId
 *               - score
 *             properties:
 *               target:
 *                 type: string
 *                 enum: [movie, series]
 *                 example: "movie"
 *               targetId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 example: 8
 *               review:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Excellent film avec une histoire captivante"
 *     responses:
 *       201:
 *         description: Note créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Cible non trouvée
 *       409:
 *         description: Note déjà existante
 */
router.post('/',
    AuthMiddleware.authenticate,
    SecurityMiddleware.setupRatingRateLimit(),
    ValidationMiddleware.sanitizeInput,
    ValidationMiddleware.validateRating,
    ErrorMiddleware.asyncHandler(RatingController.createRating)
);

/**
 * @swagger
 * /api/v2/ratings/avg/{target}/{targetId}:
 *   get:
 *     summary: Récupérer la moyenne des notes pour une cible
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: target
 *         required: true
 *         schema:
 *           type: string
 *           enum: [movie, series]
 *         description: Type de cible
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la cible
 *     responses:
 *       200:
 *         description: Moyenne des notes récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     target:
 *                       type: string
 *                     targetId:
 *                       type: string
 *                     averageScore:
 *                       type: number
 *                     totalRatings:
 *                       type: integer
 *                     distribution:
 *                       type: object
 *       404:
 *         description: Cible non trouvée
 */
router.get('/avg/:target/:targetId',
    ValidationMiddleware.validateObjectId,
    ErrorMiddleware.asyncHandler(RatingController.getAverageRating)
);

/**
 * @swagger
 * /api/v2/ratings/my:
 *   get:
 *     summary: Récupérer les notes de l'utilisateur connecté
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Notes de l'utilisateur récupérées avec succès
 *       401:
 *         description: Non authentifié
 */
router.get('/my',
    AuthMiddleware.authenticate,
    ValidationMiddleware.validatePagination,
    ErrorMiddleware.asyncHandler(RatingController.getUserRatings)
);

/**
 * @swagger
 * /api/v2/ratings/{id}:
 *   patch:
 *     summary: Mettre à jour une note
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               review:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Note mise à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Note non trouvée
 */
router.patch('/:id',
    AuthMiddleware.authenticate,
    ValidationMiddleware.validateObjectId,
    ValidationMiddleware.sanitizeInput,
    ErrorMiddleware.asyncHandler(RatingController.updateRating)
);

/**
 * @swagger
 * /api/v2/ratings/{id}:
 *   delete:
 *     summary: Supprimer une note
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la note
 *     responses:
 *       200:
 *         description: Note supprimée avec succès
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Note non trouvée
 */
router.delete('/:id',
    AuthMiddleware.authenticate,
    ValidationMiddleware.validateObjectId,
    ErrorMiddleware.asyncHandler(RatingController.deleteRating)
);

export default router;

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { SecurityMiddleware } from '../middlewares/security.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { ErrorMiddleware } from '../middlewares/error.middleware';

const router = Router();

/**
 * @swagger
 * /api/v2/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Utilisateur déjà existant
 */
router.post('/register',
    SecurityMiddleware.setupAuthRateLimit(),
    ValidationMiddleware.sanitizeInput,
    ErrorMiddleware.asyncHandler(AuthController.register)
);

/**
 * @swagger
 * /api/v2/auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       401:
 *         description: Identifiants incorrects
 */
router.post('/login',
    SecurityMiddleware.setupAuthRateLimit(),
    ValidationMiddleware.sanitizeInput,
    ErrorMiddleware.asyncHandler(AuthController.login)
);

/**
 * @swagger
 * /api/v2/auth/me:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Non authentifié
 */
router.get('/me',
    AuthMiddleware.authenticate,
    ErrorMiddleware.asyncHandler(AuthController.getProfile)
);

/**
 * @swagger
 * /api/v2/auth/me:
 *   patch:
 *     summary: Mettre à jour le profil de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */
router.patch('/me',
    AuthMiddleware.authenticate,
    ValidationMiddleware.sanitizeInput,
    ErrorMiddleware.asyncHandler(AuthController.updateProfile)
);

export default router;

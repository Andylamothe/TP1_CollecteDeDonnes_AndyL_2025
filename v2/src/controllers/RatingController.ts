import { Request, Response, NextFunction } from 'express';
import { Rating, IRating } from '../models/Rating';
import { Movie } from '../models/Movie';
import { Series } from '../models/Series';
import { ErrorMiddleware } from '../middlewares/error.middleware';
import { LoggerService } from '../services/LoggerService';
import mongoose from 'mongoose';

export class RatingController {
    private static logger = LoggerService.getInstance();

    public static async createRating(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { target, targetId, score, review } = req.body;
            const userId = req.user!.userId;

            // Validation des données
            if (!target || !targetId || !score) {
                throw ErrorMiddleware.validationError('Type de cible, ID de cible et note sont requis');
            }

            if (!['movie', 'series'].includes(target)) {
                throw ErrorMiddleware.validationError('Le type de cible doit être "movie" ou "series"');
            }

            if (score < 1 || score > 10) {
                throw ErrorMiddleware.validationError('La note doit être entre 1 et 10');
            }

            // Vérifier que la cible existe
            const targetExists = target === 'movie'
                ? await Movie.findById(targetId).exec()
                : await Series.findById(targetId).exec();
            if (!targetExists) {
                throw ErrorMiddleware.notFoundError(`${target === 'movie' ? 'Film' : 'Série'} non trouvé`);
            }

            // Vérifier si l'utilisateur a déjà noté cette cible
            const existingRating = await Rating.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                target,
                targetId: new mongoose.Types.ObjectId(targetId)
            });

            if (existingRating) {
                throw ErrorMiddleware.conflictError('Vous avez déjà noté cette cible');
            }

            const rating = new Rating({
                userId: new mongoose.Types.ObjectId(userId),
                target,
                targetId: new mongoose.Types.ObjectId(targetId),
                score,
                review
            });

            await rating.save();

            this.logger.logOperation('CREATE_RATING', {
                ratingId: rating._id,
                target,
                targetId,
                score,
                userId
            });

            res.status(201).json({
                message: 'Note créée avec succès',
                data: rating
            });

        } catch (error) {
            next(error);
        }
    }

    public static async getAverageRating(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { target, targetId } = req.params as { target: 'movie' | 'series'; targetId: string };

            if (!['movie', 'series'].includes(target)) {
                throw ErrorMiddleware.validationError('Le type de cible doit être "movie" ou "series"');
            }

            // Vérifier que la cible existe
            const targetExists = target === 'movie'
                ? await Movie.findById(targetId).exec()
                : await Series.findById(targetId).exec();
            if (!targetExists) {
                throw ErrorMiddleware.notFoundError(`${target === 'movie' ? 'Film' : 'Série'} non trouvé`);
            }

            // Calculer la moyenne des notes
            const result = await Rating.aggregate([
                {
                    $match: {
                        target,
                        targetId: new mongoose.Types.ObjectId(targetId)
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageScore: { $avg: '$score' },
                        totalRatings: { $sum: 1 },
                        scoreDistribution: {
                            $push: '$score'
                        }
                    }
                }
            ]);

            const ratingData = result[0] || {
                averageScore: 0,
                totalRatings: 0,
                scoreDistribution: []
            };

            // Calculer la distribution des notes
            const distribution = ratingData.scoreDistribution.reduce((acc: any, score: number) => {
                acc[score] = (acc[score] || 0) + 1;
                return acc;
            }, {});

            this.logger.logOperation('GET_AVERAGE_RATING', {
                target,
                targetId,
                averageScore: ratingData.averageScore,
                totalRatings: ratingData.totalRatings
            });

            res.json({
                message: 'Moyenne des notes récupérée avec succès',
                data: {
                    target,
                    targetId,
                    averageScore: Math.round(ratingData.averageScore * 100) / 100,
                    totalRatings: ratingData.totalRatings,
                    distribution
                }
            });

        } catch (error) {
            next(error);
        }
    }

    public static async getUserRatings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const { page = 1, limit = 10 } = req.query;

            const skip = (Number(page) - 1) * Number(limit);

            const [ratings, total] = await Promise.all([
                Rating.find({ userId: new mongoose.Types.ObjectId(userId) })
                    .populate('targetId')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                Rating.countDocuments({ userId: new mongoose.Types.ObjectId(userId) })
            ]);

            this.logger.logOperation('GET_USER_RATINGS', {
                userId,
                page: Number(page),
                limit: Number(limit),
                total
            });

            res.json({
                message: 'Notes de l\'utilisateur récupérées avec succès',
                data: ratings,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            });

        } catch (error) {
            next(error);
        }
    }

    public static async updateRating(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const { score, review } = req.body;
            const userId = req.user!.userId;

            if (score && (score < 1 || score > 10)) {
                throw ErrorMiddleware.validationError('La note doit être entre 1 et 10');
            }

            const rating = await Rating.findOne({
                _id: new mongoose.Types.ObjectId(id),
                userId: new mongoose.Types.ObjectId(userId)
            });

            if (!rating) {
                throw ErrorMiddleware.notFoundError('Note non trouvée ou vous n\'avez pas l\'autorisation de la modifier');
            }

            if (score !== undefined) rating.score = score;
            if (review !== undefined) rating.review = review;

            await rating.save();

            this.logger.logOperation('UPDATE_RATING', {
                ratingId: id,
                score,
                review,
                userId
            });

            res.json({
                message: 'Note mise à jour avec succès',
                data: rating
            });

        } catch (error) {
            next(error);
        }
    }

    public static async deleteRating(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user!.userId;

            const rating = await Rating.findOneAndDelete({
                _id: new mongoose.Types.ObjectId(id),
                userId: new mongoose.Types.ObjectId(userId)
            });

            if (!rating) {
                throw ErrorMiddleware.notFoundError('Note non trouvée ou vous n\'avez pas l\'autorisation de la supprimer');
            }

            this.logger.logOperation('DELETE_RATING', {
                ratingId: id,
                userId
            });

            res.json({
                message: 'Note supprimée avec succès'
            });

        } catch (error) {
            next(error);
        }
    }
}

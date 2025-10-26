import { Request, Response, NextFunction } from 'express';
import { Movie, IMovie } from '../models/Movie';
import { ErrorMiddleware } from '../middlewares/error.middleware';
import { LoggerService } from '../services/LoggerService';

export class MovieController {
    private static logger = LoggerService.getInstance();

    public static async getAllMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {
                title,
                genre,
                minYear,
                maxYear,
                minDuration,
                maxDuration,
                page = 1,
                limit = 10
            } = req.query;

            // Construction du filtre
            const filter: any = {};

            if (title) {
                filter.$or = [
                    { title: { $regex: title, $options: 'i' } },
                    { synopsis: { $regex: title, $options: 'i' } }
                ];
            }

            if (genre) {
                filter.genres = { $in: Array.isArray(genre) ? genre : [genre] };
            }

            if (minYear || maxYear) {
                filter.releaseDate = {};
                if (minYear) filter.releaseDate.$gte = new Date(`${minYear}-01-01`);
                if (maxYear) filter.releaseDate.$lte = new Date(`${maxYear}-12-31`);
            }

            if (minDuration || maxDuration) {
                filter.durationMin = {};
                if (minDuration) filter.durationMin.$gte = Number(minDuration);
                if (maxDuration) filter.durationMin.$lte = Number(maxDuration);
            }

            // Calcul de la pagination
            const skip = (Number(page) - 1) * Number(limit);

            // Exécution de la requête
            const [movies, total] = await Promise.all([
                Movie.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                Movie.countDocuments(filter)
            ]);

            this.logger.logOperation('GET_MOVIES', {
                filter,
                page: Number(page),
                limit: Number(limit),
                total,
                userId: req.user?.userId
            });

            res.json({
                message: 'Films récupérés avec succès',
                data: movies,
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

    public static async getMovieById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const movie = await Movie.findById(id);
            
            if (!movie) {
                throw ErrorMiddleware.notFoundError('Film non trouvé');
            }

            this.logger.logOperation('GET_MOVIE', {
                movieId: id,
                userId: req.user?.userId
            });

            res.json({
                message: 'Film récupéré avec succès',
                data: movie
            });

        } catch (error) {
            next(error);
        }
    }

    public static async createMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { title, genres, synopsis, releaseDate, durationMin } = req.body;

            // Validation des données
            if (!title || !genres || !durationMin) {
                throw ErrorMiddleware.validationError('Titre, genres et durée sont requis');
            }

            if (!Array.isArray(genres) || genres.length === 0) {
                throw ErrorMiddleware.validationError('Au moins un genre est requis');
            }

            if (durationMin < 1 || durationMin > 600) {
                throw ErrorMiddleware.validationError('La durée doit être entre 1 et 600 minutes');
            }

            const movie = new Movie({
                title,
                genres,
                synopsis,
                releaseDate: releaseDate ? new Date(releaseDate) : undefined,
                durationMin
            });

            await movie.save();

            this.logger.logOperation('CREATE_MOVIE', {
                movieId: movie._id,
                title,
                userId: req.user?.userId
            });

            res.status(201).json({
                message: 'Film créé avec succès',
                data: movie
            });

        } catch (error) {
            next(error);
        }
    }

    public static async updateMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const movie = await Movie.findById(id);
            if (!movie) {
                throw ErrorMiddleware.notFoundError('Film non trouvé');
            }

            // Validation des données de mise à jour
            if (updateData.durationMin && (updateData.durationMin < 1 || updateData.durationMin > 600)) {
                throw ErrorMiddleware.validationError('La durée doit être entre 1 et 600 minutes');
            }

            if (updateData.genres && (!Array.isArray(updateData.genres) || updateData.genres.length === 0)) {
                throw ErrorMiddleware.validationError('Au moins un genre est requis');
            }

            Object.assign(movie, updateData);
            await movie.save();

            this.logger.logOperation('UPDATE_MOVIE', {
                movieId: id,
                updateData,
                userId: req.user?.userId
            });

            res.json({
                message: 'Film mis à jour avec succès',
                data: movie
            });

        } catch (error) {
            next(error);
        }
    }

    public static async deleteMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const movie = await Movie.findByIdAndDelete(id);
            if (!movie) {
                throw ErrorMiddleware.notFoundError('Film non trouvé');
            }

            this.logger.logOperation('DELETE_MOVIE', {
                movieId: id,
                title: movie.title,
                userId: req.user?.userId
            });

            res.json({
                message: 'Film supprimé avec succès'
            });

        } catch (error) {
            next(error);
        }
    }
}

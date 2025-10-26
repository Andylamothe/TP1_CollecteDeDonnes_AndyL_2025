import { Request, Response } from 'express';
import { StorageService } from '../services/StorageService';
import { LoggerService } from '../services/LoggerService';
import { Film } from '../models/Film';
import { v4 as uuidv4 } from 'uuid';

export class FilmController {
    private static storageService = StorageService.getInstance();
    private static loggerService = LoggerService.getInstance();

    // GET /api/films - Liste tous les films
    public static async getFilms(req: Request, res: Response): Promise<void> {
        try {
            const films = await FilmController.storageService.listFilms();

            FilmController.loggerService.logOperation('GET_FILMS', {
                count: films.length
            });

            res.json(films);
        } catch (error) {
            FilmController.loggerService.logError(error as Error, { operation: 'GET_FILMS' });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }

    // GET /api/films/:id - Récupère un film par ID
    public static async getFilmById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            if (!id) {
                res.status(400).json({ error: 'ID du film requis' });
                return;
            }

            const film = await FilmController.storageService.getFilmById(id);

            if (!film) {
                res.status(404).json({ error: 'Film non trouvé' });
                return;
            }

            FilmController.loggerService.logOperation('GET_FILM_BY_ID', {
                filmId: id
            });

            res.json(film);
        } catch (error) {
            FilmController.loggerService.logError(error as Error, { operation: 'GET_FILM_BY_ID' });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }

    // POST /api/films - Crée un nouveau film (admin seulement)
    public static async createFilm(req: Request, res: Response): Promise<void> {
        try {
            const { titre, plateforme, duree, genre, annee, userId } = req.body;
            const filmUserId = req.user?.id || userId;

            const id = uuidv4();
            const film = new Film(
                id,
                titre,
                plateforme,
                filmUserId,
                duree,
                genre,
                annee
            );

            await FilmController.storageService.addFilm(film);

            FilmController.loggerService.logOperation('CREATE_FILM', {
                filmId: id,
                userId: req.user?.id
            });

            res.status(201).json(film);
        } catch (error) {
            FilmController.loggerService.logError(error as Error, { operation: 'CREATE_FILM' });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }
}

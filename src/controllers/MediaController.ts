import { Request, Response } from 'express';
import { StorageService } from '../services/StorageService';
import { LoggerService } from '../services/LoggerService';
import { Media } from '../models/Media';
import { Film } from '../models/Film';
import { Serie } from '../models/Serie';
import { v4 as uuidv4 } from 'uuid';

export class MediaController {
    private static storageService = StorageService.getInstance();
    private static loggerService = LoggerService.getInstance();

    // GET /api/medias - Liste tous les médias avec filtres optionnels
    public static async getMedias(req: Request, res: Response): Promise<void> {
        try {
            const { type, genre, year } = req.query;
            let medias = await MediaController.storageService.listMedias();

            // Appliquer les filtres
            if (type === 'film') {
                medias = medias.filter((media: any) => media.type === 'film' || ('duree' in media && 'genre' in media && 'annee' in media));
            } else if (type === 'serie') {
                medias = medias.filter((media: any) => media.type === 'serie' || ('statut' in media && 'saisons' in media));
            }

            if (genre) {
                medias = medias.filter((media: any) => {
                    if (media.type === 'film' || ('duree' in media && 'genre' in media && 'annee' in media)) {
                        return media.genre === genre;
                    }
                    return false;
                });
            }

            if (year) {
                const yearNum = parseInt(year as string);
                medias = medias.filter((media: any) => {
                    if (media.type === 'film' || ('duree' in media && 'genre' in media && 'annee' in media)) {
                        return media.annee === yearNum;
                    }
                    return false;
                });
            }

            MediaController.loggerService.logOperation('GET_MEDIAS', {
                filters: { type, genre, year },
                count: medias.length
            });

            res.json(medias);
        } catch (error) {
            MediaController.loggerService.logError(error as Error, { operation: 'GET_MEDIAS' });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }

    // GET /api/medias/:id - Récupère un média par ID
    public static async getMediaById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            if (!id) {
                res.status(400).json({ error: 'ID manquant' });
                return;
            }
            
            // Chercher d'abord dans les films
            let media: Media | null = await MediaController.storageService.getFilmById(id);
            
            // Si pas trouvé, chercher dans les séries
            if (!media) {
                const serie = await MediaController.storageService.getSerieById(id);
                media = serie;
            }

            if (!media) {
                res.status(404).json({ error: 'Média non trouvé' });
                return;
            }

            MediaController.loggerService.logOperation('GET_MEDIA_BY_ID', { mediaId: id });

            res.json(media);
        } catch (error) {
            MediaController.loggerService.logError(error as Error, { operation: 'GET_MEDIA_BY_ID', mediaId: req.params.id });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }

    // POST /api/medias - Crée un nouveau média (admin seulement)
    public static async createMedia(req: Request, res: Response): Promise<void> {
        try {
            const { type, ...mediaData } = req.body;
            const userId = req.user?.id || mediaData.userId;

            if (!type || (type !== 'film' && type !== 'serie')) {
                res.status(400).json({ error: 'Type de média invalide. Doit être "film" ou "serie"' });
                return;
            }

            const id = uuidv4();
            let media;

            if (type === 'film') {
                media = new Film(
                    id,
                    mediaData.titre,
                    mediaData.plateforme,
                    userId,
                    mediaData.duree,
                    mediaData.genre,
                    mediaData.annee
                );
                await MediaController.storageService.addFilm(media);
            } else if (type === 'serie') {
                media = new Serie(
                    id,
                    mediaData.titre,
                    mediaData.plateforme,
                    userId,
                    mediaData.statut || 'en_attente',
                    []
                );
                await MediaController.storageService.addSerie(media);
            }

            MediaController.loggerService.logOperation('CREATE_MEDIA', {
                mediaId: id,
                type,
                userId: req.user?.id
            });

            res.status(201).json(media);
        } catch (error) {
            MediaController.loggerService.logError(error as Error, { operation: 'CREATE_MEDIA' });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }

    // PUT /api/medias/:id - Met à jour un média (admin seulement)
    public static async updateMedia(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!id) {
                res.status(400).json({ error: 'ID manquant' });
                return;
            }

            // Chercher d'abord dans les films
            let media = await MediaController.storageService.getFilmById(id);
            let updatedMedia: Media | null = null;

            if (media) {
                updatedMedia = await MediaController.storageService.updateFilm(id, updateData);
            } else {
                // Chercher dans les séries
                const serie = await MediaController.storageService.getSerieById(id);
                if (serie) {
                    updatedMedia = await MediaController.storageService.updateSerie(id, updateData);
                }
            }

            if (!updatedMedia) {
                res.status(404).json({ error: 'Média non trouvé' });
                return;
            }

            MediaController.loggerService.logOperation('UPDATE_MEDIA', {
                mediaId: id,
                userId: req.user?.id
            });

            res.json(updatedMedia);
        } catch (error) {
            MediaController.loggerService.logError(error as Error, { operation: 'UPDATE_MEDIA', mediaId: req.params.id });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }

    // DELETE /api/medias/:id - Supprime un média (admin seulement)
    public static async deleteMedia(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ error: 'ID manquant' });
                return;
            }

            // Chercher d'abord dans les films
            let deleted = await MediaController.storageService.deleteFilm(id);
            
            if (!deleted) {
                // Chercher dans les séries
                deleted = await MediaController.storageService.deleteSerie(id);
            }

            if (!deleted) {
                res.status(404).json({ error: 'Média non trouvé' });
                return;
            }

            MediaController.loggerService.logOperation('DELETE_MEDIA', {
                mediaId: id,
                userId: req.user?.id
            });

            res.status(204).send();
        } catch (error) {
            MediaController.loggerService.logError(error as Error, { operation: 'DELETE_MEDIA', mediaId: req.params.id });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }

    // GET /api/series/:id/episodes - Récupère tous les épisodes d'une série
    public static async getSerieEpisodes(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            if (!id) {
                res.status(400).json({ error: 'ID manquant' });
                return;
            }
            
            const episodes = await MediaController.storageService.getEpisodesBySerieId(id);

            MediaController.loggerService.logOperation('GET_SERIE_EPISODES', {
                serieId: id,
                count: episodes.length
            });

            res.json(episodes);
        } catch (error) {
            MediaController.loggerService.logError(error as Error, { operation: 'GET_SERIE_EPISODES', serieId: req.params.id });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }

    // GET /api/users/:id/medias - Récupère tous les médias d'un utilisateur
    public static async getUserMedias(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            if (!id) {
                res.status(400).json({ error: 'ID manquant' });
                return;
            }
            
            const medias = await MediaController.storageService.getMediasByUserId(id);

            MediaController.loggerService.logOperation('GET_USER_MEDIAS', {
                userId: id,
                count: medias.length
            });

            res.json(medias);
        } catch (error) {
            MediaController.loggerService.logError(error as Error, { operation: 'GET_USER_MEDIAS', userId: req.params.id });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }
}

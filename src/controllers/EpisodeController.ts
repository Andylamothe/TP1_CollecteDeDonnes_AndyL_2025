import { Request, Response } from 'express';
import { StorageService } from '../services/StorageService';
import { LoggerService } from '../services/LoggerService';
import { Episode } from '../models/Episode';
import { v4 as uuidv4 } from 'uuid';

export class EpisodeController {
    private static storageService = StorageService.getInstance();
    private static loggerService = LoggerService.getInstance();

    // POST /api/episodes - Crée un nouvel épisode (admin seulement)
    public static async createEpisode(req: Request, res: Response): Promise<void> {
        try {
            const { titre, numero, duree, watched } = req.body;

            const id = uuidv4();
            const episode = new Episode(
                id,
                titre,
                numero,
                duree,
                watched
            );

            await EpisodeController.storageService.addEpisode(episode);

            EpisodeController.loggerService.logOperation('CREATE_EPISODE', {
                episodeId: id,
                userId: req.user?.id
            });

            res.status(201).json(episode);
        } catch (error) {
            EpisodeController.loggerService.logError(error as Error, { operation: 'CREATE_EPISODE' });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }

    // PATCH /api/episodes/:id - Met à jour un épisode (admin seulement)
    public static async updateEpisode(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (!id) {
                res.status(400).json({ error: 'ID manquant' });
                return;
            }

            const updatedEpisode = await EpisodeController.storageService.updateEpisode(id, updateData);

            if (!updatedEpisode) {
                res.status(404).json({ error: 'Épisode non trouvé' });
                return;
            }

            EpisodeController.loggerService.logOperation('UPDATE_EPISODE', {
                episodeId: id,
                userId: req.user?.id
            });

            res.json(updatedEpisode);
        } catch (error) {
            EpisodeController.loggerService.logError(error as Error, { operation: 'UPDATE_EPISODE', episodeId: req.params.id });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }
}

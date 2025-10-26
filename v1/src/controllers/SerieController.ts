import { Request, Response } from 'express';
import { StorageService } from '../services/StorageService';
import { LoggerService } from '../services/LoggerService';
import { Serie } from '../models/Serie';
import { v4 as uuidv4 } from 'uuid';

export class SerieController {
    private static storageService = StorageService.getInstance();
    private static loggerService = LoggerService.getInstance();

    // POST /api/series - Crée une nouvelle série (admin seulement)
    public static async createSerie(req: Request, res: Response): Promise<void> {
        try {
            const { titre, plateforme, statut, userId } = req.body;
            const serieUserId = req.user?.id || userId;

            const id = uuidv4();
            const serie = new Serie(
                id,
                titre,
                plateforme,
                serieUserId,
                statut || 'en_attente',
                []
            );

            await SerieController.storageService.addSerie(serie);

            SerieController.loggerService.logOperation('CREATE_SERIE', {
                serieId: id,
                userId: req.user?.id
            });

            res.status(201).json(serie);
        } catch (error) {
            SerieController.loggerService.logError(error as Error, { operation: 'CREATE_SERIE' });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }
}

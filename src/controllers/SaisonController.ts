import { Request, Response } from 'express';
import { StorageService } from '../services/StorageService';
import { LoggerService } from '../services/LoggerService';
import { Saison } from '../models/Saison';

export class SaisonController {
    private static storageService = StorageService.getInstance();
    private static loggerService = LoggerService.getInstance();

    // POST /api/seasons - Crée une nouvelle saison (admin seulement)
    public static async createSaison(req: Request, res: Response): Promise<void> {
        try {
            const { numero } = req.body;

            const saison = new Saison(numero, []);

            await SaisonController.storageService.addSaison(saison);

            SaisonController.loggerService.logOperation('CREATE_SAISON', {
                saisonNumero: numero,
                userId: req.user?.id
            });

            res.status(201).json(saison);
        } catch (error) {
            SaisonController.loggerService.logError(error as Error, { operation: 'CREATE_SAISON' });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }
}

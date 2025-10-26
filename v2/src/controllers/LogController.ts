import { Request, Response } from 'express';
import { LoggerService } from '../services/LoggerService';

export class LogController {
    private static loggerService = LoggerService.getInstance();

    // GET /api/logs - Récupère la dernière action depuis operations.log
    public static async getLastOperation(req: Request, res: Response): Promise<void> {
        try {
            const lastOperation = await LogController.loggerService.getLastOperation();

            if (!lastOperation) {
                res.status(404).json({ error: 'Aucune opération trouvée' });
                return;
            }

            res.json(lastOperation);
        } catch (error) {
            LogController.loggerService.logError(error as Error, { operation: 'GET_LAST_OPERATION' });
            res.status(500).json({ error: 'Erreur interne du serveur' });
        }
    }
}

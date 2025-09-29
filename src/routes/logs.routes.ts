import { Router } from 'express';
import { LogController } from '../controllers/LogController';

const router = Router();

// Route publique pour récupérer les logs
router.get('/', LogController.getLastOperation);

export default router;

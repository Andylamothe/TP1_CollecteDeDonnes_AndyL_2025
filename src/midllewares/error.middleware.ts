import express, { Request, Response, NextFunction } from 'express';

const app = express();
const port = 3000;

// Middleware de gestion des erreurs
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Une erreur est survenue', error: err.message });
});

// Exemple de route qui provoque une erreur
app.get('/error', (req: Request, res: Response) => {
  throw new Error('Erreur simulée!');
});

app.listen(port, () => {
  console.log(`Serveur en écoute sur http://localhost:${port}`);
});
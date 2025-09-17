import express, { Request, Response } from 'express';

const app = express();
const port = 3000;

// Middleware de parsing du JSON
app.use(express.json());

// Route de base
app.get('/', (req: Request, res: Response) => {
  res.send('Hello, TypeScript with Express!');
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur <http://localhost>:${port}`);
});
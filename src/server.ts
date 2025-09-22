import express, {Request, Response} from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import users from './routes/users';
import usersID from './routes/usersId';
const app = express();

// Définir les options de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User API',
      version: '1.0.0',
      description: 'A simple API to manage users ',
    },
  },
  apis: ['./src/routes/*.ts'], // Fichier où les routes de l'API sont définies
};

// Générer la documentation à partir des options
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Servir la documentation Swagger via '/api-docs'
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Autres routes et middleware Express
app.use(express.json());
app.use(users)
app.use(usersID)

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript with Express! Connexion sécurisée.');
});

// Exemple de route
// app.get('/users', (req, res) => {
//   res.json([
//     { id: 1, name: 'John Doe' },
//     { id: 2, name: 'Jane Doe' },
//   ]);
// });

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
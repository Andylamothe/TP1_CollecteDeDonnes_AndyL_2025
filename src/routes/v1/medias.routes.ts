import { Media } from "../../models/Media";
import express, { Request, Response } from 'express';


const app = express();
const port = 3000;

const medias: Media[] = [
    {
        id: '1', 
        title: "Lost", 
        genre: "drame",
        year: 2010,
        rating: 4,
    },
    {
        id: '2', 
        title: "Breaking Bad", 
        genre: "drame",
        year: 2012,
        rating: 5,
    }
];
//Routes pour les medias
app.get('/medias',(req: Request, res: Response) => {
    res.json(medias)
});
app.get('/medias/:id', (req: Request, res: Response) => {
    const mediaId = (req.params.id, "10");
    const media = medias.find(m => m.id === mediaId);
  
    if (media) {
      res.json(media);
    } else {
      res.status(404).send('Media not found');
    }
  });
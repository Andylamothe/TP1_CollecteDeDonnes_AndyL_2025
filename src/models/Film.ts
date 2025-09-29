import { Media } from "./Media";

export class Film extends Media {
    duree: number;
    genre: string;
    annee: number;

    constructor(id: string, titre: string, plateforme: string, userId: string, duree: number, genre: string, annee: number) {
        super(id, titre, plateforme, userId, "film");
        this.duree = duree;
        this.genre = genre;
        this.annee = annee;
    }
}
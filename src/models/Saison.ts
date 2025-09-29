import { Episode } from "./Episode";

export class Saison {
    numero: number;
    episodes: Episode[];

    constructor(numero: number, episodes: Episode[] = []) {
        this.numero = numero;
        this.episodes = episodes;
    }
}
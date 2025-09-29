import { Media } from "./Media";
import { Saison } from "./Saison";

export class Serie extends Media {
    statut: "en_attente" | "en_cours" | "terminee";
    saisons: Saison[];

    constructor(id: string, titre: string, plateforme: string, userId: string, statut: "en_attente" | "en_cours" | "terminee", saisons: Saison[] = []) {
        super(id, titre, plateforme, userId, "serie");
        this.statut = statut;
        this.saisons = saisons;
    }
}
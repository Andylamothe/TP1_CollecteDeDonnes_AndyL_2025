export abstract class Media {
    id: string;
    titre: string;
    plateforme: string;
    userId: string;
    type: "film" | "serie";

    constructor(id: string, titre: string, plateforme: string, userId: string, type: "film" | "serie") {
        this.id = id;
        this.titre = titre;
        this.plateforme = plateforme;
        this.userId = userId;
        this.type = type;
    }
}
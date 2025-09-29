export class User {
    id: string;
    nom: string;
    role: "admin" | "user";

    constructor(id: string, nom: string, role: "admin" | "user") {
        this.id = id;
        this.nom = nom;
        this.role = role;
    }
}

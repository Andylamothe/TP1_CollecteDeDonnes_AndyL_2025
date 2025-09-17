

export class Saison {
    seasonNumber:number;
    releaseDate:Date;
    //episodes:Episode[]
    //Pas finis, Je sais pas d'ou il doit extends
    //Une série contient plusieurs saisons, chaque saison plusieurs épisodes.
    constructor(seasonNumber:number,releaseDate:Date){
        this.releaseDate = releaseDate;
        this.seasonNumber = seasonNumber;

    }

}
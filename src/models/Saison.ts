import { Episode } from "./Episode";


export class Saison extends Episode{
    seasonNumber:number;
    releaseDate:Date;
    episodes:Episode[];

    //episodes:Episode[]
    //Pas finis, Je sais pas d'ou il doit extends
    //Une série contient plusieurs saisons, chaque saison plusieurs épisodes.
    constructor(episodes:Episode[],id: string,title: string,duration: number,episodeNumber: number,watched: boolean,seasonNumber:number,releaseDate:Date){
        super(id,title,duration,episodeNumber,watched)
        this.id = id;
        this.title = title;
        this.duration = duration;
        this.episodeNumber = episodeNumber;
        this.watched = watched;
        this.releaseDate = releaseDate;
        this.seasonNumber = seasonNumber;
        this.episodes = episodes;

    }

}
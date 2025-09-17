import { Media } from "./Media";

export class Film extends Media {

    duration:number;
    watched:boolean;

    constructor( id:string,title:string,genre:string,year:number,rating:number,duration:number,watched:boolean){
        super(id,title,genre,year,rating);
        this.duration = duration;
        this.watched = watched;
    }
}
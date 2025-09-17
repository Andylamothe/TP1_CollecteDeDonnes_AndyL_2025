export abstract class Media{

    id:string;
    title:string;
    genre:string;
    year:number;
    rating:number;


    constructor( id:string,title:string,genre:string,year:number,rating:number){
        this.id = id;
        this.title = title;
        this.genre = genre;
        this.year = year;
        this.rating = rating;
    }

}
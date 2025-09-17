import { Media } from "./Media";

export class User{

    id:string;
    email:string;
    password:string;
    role:"admin" | "user";
    favorites:Media[];

    constructor(id:string, email:string,password:string, role:"admin" | "user",favorites:Media[]){
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
        this.favorites = favorites;
    }
    

}

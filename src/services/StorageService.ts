import { promises as fs } from 'fs';
import path from 'path';
import { User } from '../models/User';
import { Media } from '../models/Media';
import { Film } from '../models/Film';
import { Serie } from '../models/Serie';
import { Saison } from '../models/Saison';
import { Episode } from '../models/Episode';

export interface Database {
    users: User[];
    medias: Media[];
    films: Film[];
    series: Serie[];
    saisons: Saison[];
    episodes: Episode[];
}

export class StorageService {
    private static instance: StorageService;
    private dbPath: string;
    private data: Database;

    private constructor() {
        this.dbPath = path.join(__dirname, '../data/db.json');
        this.data = {
            users: [],
            medias: [],
            films: [],
            series: [],
            saisons: [],
            episodes: []
        };
    }

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    // Initialiser la base de données
    public async initialize(): Promise<void> {
        try {
            await fs.access(this.dbPath);
            const fileContent = await fs.readFile(this.dbPath, 'utf-8');
            this.data = JSON.parse(fileContent);
        } catch (error) {
            // Si le fichier n'existe pas, créer la structure par défaut
            await this.save();
        }
    }

    // Sauvegarder les données dans le fichier
    private async save(): Promise<void> {
        try {
            const dir = path.dirname(this.dbPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            throw new Error(`Erreur lors de la sauvegarde: ${error}`);
        }
    }

    // CRUD pour Users
    public async listUsers(): Promise<User[]> {
        return [...this.data.users];
    }

    public async getUserById(id: string): Promise<User | null> {
        return this.data.users.find(user => user.id === id) || null;
    }

    public async addUser(user: User): Promise<User> {
        this.data.users.push(user);
        await this.save();
        return user;
    }

    public async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
        const index = this.data.users.findIndex(user => user.id === id);
        if (index === -1) return null;
        
        const existingUser = this.data.users[index]!;
        this.data.users[index] = new User(
            userData.id || existingUser.id,
            userData.nom || existingUser.nom,
            userData.role || existingUser.role
        );
        await this.save();
        return this.data.users[index];
    }

    public async deleteUser(id: string): Promise<boolean> {
        const index = this.data.users.findIndex(user => user.id === id);
        if (index === -1) return false;
        
        this.data.users.splice(index, 1);
        await this.save();
        return true;
    }

    // CRUD pour Films
    public async listFilms(): Promise<Film[]> {
        return [...this.data.films];
    }

    public async getFilmById(id: string): Promise<Film | null> {
        return this.data.films.find(film => film.id === id) || null;
    }

    public async addFilm(film: Film): Promise<Film> {
        this.data.films.push(film);
        this.data.medias.push(film);
        await this.save();
        return film;
    }

    public async updateFilm(id: string, filmData: Partial<Film>): Promise<Film | null> {
        const index = this.data.films.findIndex(film => film.id === id);
        if (index === -1) return null;
        
        const existingFilm = this.data.films[index]!;
        this.data.films[index] = new Film(
            filmData.id || existingFilm.id,
            filmData.titre || existingFilm.titre,
            filmData.plateforme || existingFilm.plateforme,
            filmData.userId || existingFilm.userId,
            filmData.duree || existingFilm.duree,
            filmData.genre || existingFilm.genre,
            filmData.annee || existingFilm.annee
        );
        
        // Mettre à jour aussi dans medias
        const mediaIndex = this.data.medias.findIndex(media => media.id === id);
        if (mediaIndex !== -1) {
            this.data.medias[mediaIndex] = this.data.films[index];
        }
        
        await this.save();
        return this.data.films[index];
    }

    public async deleteFilm(id: string): Promise<boolean> {
        const filmIndex = this.data.films.findIndex(film => film.id === id);
        if (filmIndex === -1) return false;
        
        this.data.films.splice(filmIndex, 1);
        
        // Supprimer aussi de medias
        const mediaIndex = this.data.medias.findIndex(media => media.id === id);
        if (mediaIndex !== -1) {
            this.data.medias.splice(mediaIndex, 1);
        }
        
        await this.save();
        return true;
    }

    // CRUD pour Series
    public async listSeries(): Promise<Serie[]> {
        return [...this.data.series];
    }

    public async getSerieById(id: string): Promise<Serie | null> {
        return this.data.series.find(serie => serie.id === id) || null;
    }

    public async addSerie(serie: Serie): Promise<Serie> {
        this.data.series.push(serie);
        this.data.medias.push(serie);
        await this.save();
        return serie;
    }

    public async updateSerie(id: string, serieData: Partial<Serie>): Promise<Serie | null> {
        const index = this.data.series.findIndex(serie => serie.id === id);
        if (index === -1) return null;
        
        const existingSerie = this.data.series[index]!;
        this.data.series[index] = new Serie(
            serieData.id || existingSerie.id,
            serieData.titre || existingSerie.titre,
            serieData.plateforme || existingSerie.plateforme,
            serieData.userId || existingSerie.userId,
            serieData.statut || existingSerie.statut,
            serieData.saisons || existingSerie.saisons
        );
        
        // Mettre à jour aussi dans medias
        const mediaIndex = this.data.medias.findIndex(media => media.id === id);
        if (mediaIndex !== -1) {
            this.data.medias[mediaIndex] = this.data.series[index];
        }
        
        await this.save();
        return this.data.series[index];
    }

    public async deleteSerie(id: string): Promise<boolean> {
        const serieIndex = this.data.series.findIndex(serie => serie.id === id);
        if (serieIndex === -1) return false;
        
        this.data.series.splice(serieIndex, 1);
        
        // Supprimer aussi de medias
        const mediaIndex = this.data.medias.findIndex(media => media.id === id);
        if (mediaIndex !== -1) {
            this.data.medias.splice(mediaIndex, 1);
        }
        
        await this.save();
        return true;
    }

    // CRUD pour Saisons
    public async listSaisons(): Promise<Saison[]> {
        return [...this.data.saisons];
    }

    public async getSaisonByNumero(numero: number): Promise<Saison | null> {
        return this.data.saisons.find(saison => saison.numero === numero) || null;
    }

    public async addSaison(saison: Saison): Promise<Saison> {
        this.data.saisons.push(saison);
        await this.save();
        return saison;
    }

    public async updateSaison(numero: number, saisonData: Partial<Saison>): Promise<Saison | null> {
        const index = this.data.saisons.findIndex(saison => saison.numero === numero);
        if (index === -1) return null;
        
        const existingSaison = this.data.saisons[index]!;
        this.data.saisons[index] = new Saison(
            saisonData.numero || existingSaison.numero,
            saisonData.episodes || existingSaison.episodes
        );
        await this.save();
        return this.data.saisons[index];
    }

    public async deleteSaison(numero: number): Promise<boolean> {
        const index = this.data.saisons.findIndex(saison => saison.numero === numero);
        if (index === -1) return false;
        
        this.data.saisons.splice(index, 1);
        await this.save();
        return true;
    }

    // CRUD pour Episodes
    public async listEpisodes(): Promise<Episode[]> {
        return [...this.data.episodes];
    }

    public async getEpisodeById(id: string): Promise<Episode | null> {
        return this.data.episodes.find(episode => episode.id === id) || null;
    }

    public async addEpisode(episode: Episode): Promise<Episode> {
        this.data.episodes.push(episode);
        await this.save();
        return episode;
    }

    public async updateEpisode(id: string, episodeData: Partial<Episode>): Promise<Episode | null> {
        const index = this.data.episodes.findIndex(episode => episode.id === id);
        if (index === -1) return null;
        
        const existingEpisode = this.data.episodes[index]!;
        this.data.episodes[index] = new Episode(
            episodeData.id || existingEpisode.id,
            episodeData.titre || existingEpisode.titre,
            episodeData.numero || existingEpisode.numero,
            episodeData.duree || existingEpisode.duree,
            episodeData.watched !== undefined ? episodeData.watched : existingEpisode.watched
        );
        await this.save();
        return this.data.episodes[index];
    }

    public async deleteEpisode(id: string): Promise<boolean> {
        const index = this.data.episodes.findIndex(episode => episode.id === id);
        if (index === -1) return false;
        
        this.data.episodes.splice(index, 1);
        await this.save();
        return true;
    }

    // Méthodes utilitaires
    public async listMedias(): Promise<Media[]> {
        return [...this.data.medias];
    }

    public async getMediasByUserId(userId: string): Promise<Media[]> {
        return this.data.medias.filter(media => media.userId === userId);
    }

    public async getEpisodesBySerieId(serieId: string): Promise<Episode[]> {
        const serie = await this.getSerieById(serieId);
        if (!serie) return [];
        
        const allEpisodes: Episode[] = [];
        for (const saison of serie.saisons) {
            allEpisodes.push(...saison.episodes);
        }
        return allEpisodes;
    }
}

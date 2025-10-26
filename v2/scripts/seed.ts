import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { Movie } from '../src/models/Movie';
import { Series } from '../src/models/Series';
import { Season } from '../src/models/Season';
import { Episode } from '../src/models/Episode';
import { Rating } from '../src/models/Rating';


/**
 * Cette seed ne marche pas car il faut mettre les variables d'environnement dans le fichier .env.local
 * et le fichier .env.local est dans le dossier parent.
 * Donc on doit mettre le chemin du fichier .env.local dans le fichier .env.
 * Mais comme on est dans le dossier v2, on doit mettre le chemin du fichier .env.local dans le fichier .env.
 * Donc on doit mettre le chemin du fichier .env.local dans le fichier .env.
 */
dotenv.config({ path: '../../../env.local' });

// Données de test
const sampleUsers = [
    {
        email: 'admin@tvtracker.com',
        username: 'admin',
        password: 'admin123',
        role: 'admin'
    },
    {
        email: 'user@tvtracker.com',
        username: 'user',
        password: 'user123',
        role: 'user'
    },
    {
        email: 'john@example.com',
        username: 'john_doe',
        password: 'password123',
        role: 'user'
    }
];

const sampleMovies = [
    {
        title: 'Inception',
        genres: ['Action', 'Sci-Fi', 'Thriller'],
        synopsis: 'Un voleur qui entre dans les rêves des gens pour voler leurs secrets.',
        releaseDate: new Date('2010-07-16'),
        durationMin: 148
    },
    {
        title: 'The Dark Knight',
        genres: ['Action', 'Crime', 'Drama'],
        synopsis: 'Batman doit affronter le Joker, un criminel psychotique.',
        releaseDate: new Date('2008-07-18'),
        durationMin: 152
    },
    {
        title: 'Pulp Fiction',
        genres: ['Crime', 'Drama'],
        synopsis: 'Les histoires entrelacées de plusieurs personnages dans le monde du crime.',
        releaseDate: new Date('1994-10-14'),
        durationMin: 154
    },
    {
        title: 'The Matrix',
        genres: ['Action', 'Sci-Fi'],
        synopsis: 'Un programmeur découvre que la réalité est une simulation informatique.',
        releaseDate: new Date('1999-03-31'),
        durationMin: 136
    },
    {
        title: 'Forrest Gump',
        genres: ['Drama', 'Romance'],
        synopsis: 'L\'histoire de Forrest Gump, un homme simple qui vit des événements historiques.',
        releaseDate: new Date('1994-07-06'),
        durationMin: 142
    }
];

const sampleSeries = [
    {
        title: 'Breaking Bad',
        genres: ['Crime', 'Drama', 'Thriller'],
        status: 'terminee',
        synopsis: 'Un professeur de chimie se lance dans la fabrication de méthamphétamine.',
        releaseDate: new Date('2008-01-20')
    },
    {
        title: 'Game of Thrones',
        genres: ['Action', 'Adventure', 'Drama'],
        status: 'terminee',
        synopsis: 'Les familles nobles se battent pour le contrôle du Trône de Fer.',
        releaseDate: new Date('2011-04-17')
    },
    {
        title: 'Stranger Things',
        genres: ['Drama', 'Fantasy', 'Horror'],
        status: 'en_cours',
        synopsis: 'Des enfants découvrent des phénomènes surnaturels dans leur petite ville.',
        releaseDate: new Date('2016-07-15')
    }
];

async function seedDatabase(): Promise<void> {
    try {
        // Connexion à MongoDB
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI non définie dans les variables d\'environnement');
        }
        await mongoose.connect(mongoUri);
        console.log('✅ Connexion à MongoDB réussie');

        // Nettoyer la base de données
        await Promise.all([
            User.deleteMany({}),
            Movie.deleteMany({}),
            Series.deleteMany({}),
            Season.deleteMany({}),
            Episode.deleteMany({}),
            Rating.deleteMany({})
        ]);
        console.log('✅ Base de données nettoyée');

        // Créer les utilisateurs
        const users = await User.insertMany(sampleUsers);
        console.log(`✅ ${users.length} utilisateurs créés`);

        // Créer les films
        const movies = await Movie.insertMany(sampleMovies);
        console.log(`✅ ${movies.length} films créés`);

        // Créer les séries
        const series = await Series.insertMany(sampleSeries);
        console.log(`✅ ${series.length} séries créées`);

        // Créer des saisons pour les séries
        const seasons = [];
        for (let i = 0; i < series.length; i++) {
            const serie = series[i];
            if (!serie) continue;
            
            const seasonCount = serie.title === 'Breaking Bad' ? 5 : 
                              serie.title === 'Game of Thrones' ? 8 : 4;
            
            for (let j = 1; j <= seasonCount; j++) {
                const season = new Season({
                    seriesId: serie._id,
                    seasonNo: j,
                    title: `Saison ${j}`,
                    episodeCount: j === seasonCount ? 6 : 10, // Dernière saison plus courte
                    releaseDate: new Date((serie.releaseDate?.getFullYear() || 2020) + j - 1, 0, 1)
                });
                seasons.push(season);
            }
        }
        await Season.insertMany(seasons);
        console.log(`✅ ${seasons.length} saisons créées`);

        // Créer des épisodes pour les saisons
        const episodes = [];
        for (const season of seasons) {
            const episodeCount = season.episodeCount;
            for (let k = 1; k <= episodeCount; k++) {
                const episode = new Episode({
                    seriesId: season.seriesId,
                    seasonId: season._id,
                    epNo: k,
                    title: `Épisode ${k}`,
                    synopsis: `Description de l'épisode ${k} de la saison ${season.seasonNo}`,
                    durationMin: 45 + Math.floor(Math.random() * 15), // 45-60 minutes
                    releaseDate: new Date(season.releaseDate!.getTime() + (k - 1) * 7 * 24 * 60 * 60 * 1000) // Une semaine entre chaque épisode
                });
                episodes.push(episode);
            }
        }
        await Episode.insertMany(episodes);
        console.log(`✅ ${episodes.length} épisodes créés`);

        // Créer des notes aléatoires
        const ratings = [];
        const userIds = users.map(u => u._id);
        const movieIds = movies.map(m => m._id);
        const seriesIds = series.map(s => s._id);

        // Notes pour les films
        for (const movieId of movieIds) {
            const numRatings = Math.floor(Math.random() * 5) + 1; // 1-5 notes par film
            for (let i = 0; i < numRatings; i++) {
                const userId = userIds[Math.floor(Math.random() * userIds.length)];
                const rating = new Rating({
                    userId,
                    target: 'movie',
                    targetId: movieId,
                    score: Math.floor(Math.random() * 5) + 6, // Notes entre 6-10
                    review: `Excellente critique pour ${movies.find(m => m._id.toString() === movieId.toString())?.title}`
                });
                ratings.push(rating);
            }
        }

        // Notes pour les séries
        for (const seriesId of seriesIds) {
            const numRatings = Math.floor(Math.random() * 3) + 1; // 1-3 notes par série
            for (let i = 0; i < numRatings; i++) {
                const userId = userIds[Math.floor(Math.random() * userIds.length)];
                const rating = new Rating({
                    userId,
                    target: 'series',
                    targetId: seriesId,
                    score: Math.floor(Math.random() * 5) + 6, // Notes entre 6-10
                    review: `Excellente critique pour ${series.find(s => s._id.toString() === seriesId.toString())?.title}`
                });
                ratings.push(rating);
            }
        }

        await Rating.insertMany(ratings);
        console.log(`✅ ${ratings.length} notes créées`);

        console.log('\n🎉 Base de données peuplée avec succès !');
        console.log('\n📊 Résumé :');
        console.log(`- ${users.length} utilisateurs`);
        console.log(`- ${movies.length} films`);
        console.log(`- ${series.length} séries`);
        console.log(`- ${seasons.length} saisons`);
        console.log(`- ${episodes.length} épisodes`);
        console.log(`- ${ratings.length} notes`);

        console.log('\n👤 Comptes de test :');
        console.log('- Admin: admin@tvtracker.com / admin123');
        console.log('- User: user@tvtracker.com / user123');
        console.log('- John: john@example.com / password123');

    } catch (error) {
        console.error('❌ Erreur lors du peuplement de la base de données:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('✅ Déconnexion de MongoDB');
    }
}

// Exécuter le script si appelé directement
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('✅ Script de seed terminé');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur dans le script de seed:', error);
            process.exit(1);
        });
}

export { seedDatabase };

import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './env.local' });

// Types des documents
interface IUser {
    email: string;
    username: string;
    password: string;
    role: 'admin' | 'user';
    createdAt: Date;
    updatedAt: Date;
}

interface IMovie {
    title: string;
    genres: string[];
    synopsis?: string;
    releaseDate?: Date;
    durationMin: number;
    createdAt: Date;
    updatedAt: Date;
}

interface IRating {
    userId: mongoose.Types.ObjectId;
    target: 'movie' | 'series';
    targetId: mongoose.Types.ObjectId;
    score: number;
    review?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Schémas Mongoose
const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

const movieSchema = new Schema<IMovie>({
    title: { type: String, required: true },
    genres: [{ type: String, required: true }],
    synopsis: String,
    releaseDate: Date,
    durationMin: { type: Number, required: true }
}, { timestamps: true });

const ratingSchema = new Schema<IRating>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: String, enum: ['movie', 'series'], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    score: { type: Number, min: 1, max: 10, required: true },
    review: String
}, { timestamps: true });

const User = mongoose.model<IUser>('User', userSchema);
const Movie = mongoose.model<IMovie>('Movie', movieSchema);
const Rating = mongoose.model<IRating>('Rating', ratingSchema);

// Données de test
const sampleUsers: Array<Pick<IUser, 'email' | 'username' | 'password' | 'role'>> = [
    { email: 'admin@tvtracker.com', username: 'admin', password: 'admin123', role: 'admin' },
    { email: 'user@tvtracker.com', username: 'user', password: 'user123', role: 'user' }
];

const sampleMovies: Array<Pick<IMovie, 'title' | 'genres' | 'synopsis' | 'releaseDate' | 'durationMin'>> = [
    {
        title: 'Avatar',
        genres: ['Action', 'Adventure', 'Fantasy'],
        synopsis: 'Un marine paraplégique envoyé sur une lune lointaine pour extraire un minerai précieux.',
        releaseDate: new Date('2009-12-18'),
        durationMin: 162
    },
    {
        title: 'Interstellar',
        genres: ['Adventure', 'Drama', 'Sci-Fi'],
        synopsis: 'Un groupe d\'astronautes voyage à travers un trou de ver dans l\'espace.',
        releaseDate: new Date('2014-11-07'),
        durationMin: 169
    },
    {
        title: 'The Matrix',
        genres: ['Action', 'Sci-Fi'],
        synopsis: 'Un programmeur informatique découvre que la réalité est une simulation.',
        releaseDate: new Date('1999-03-31'),
        durationMin: 136
    },
    {
        title: 'Forrest Gump',
        genres: ['Drama', 'Romance'],
        synopsis: 'L\'histoire d\'un homme simple qui vit des événements historiques majeurs.',
        releaseDate: new Date('1994-07-06'),
        durationMin: 142
    },
    {
        title: 'The Lord of the Rings: The Fellowship of the Ring',
        genres: ['Adventure', 'Drama', 'Fantasy'],
        synopsis: 'Un hobbit entreprend un voyage épique pour détruire un anneau magique.',
        releaseDate: new Date('2001-12-19'),
        durationMin: 178
    }
];

async function seedDatabase(): Promise<void> {
    try {
        console.log('🔄 Connexion à MongoDB...');
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI non définie');
        }
        await mongoose.connect(mongoUri);
        console.log('✅ Connexion à MongoDB réussie');

        // Nettoyer la base de données
        console.log('🧹 Nettoyage de la base de données...');
        await Promise.all([
            User.deleteMany({}),
            Movie.deleteMany({}),
            Rating.deleteMany({})
        ]);

        // Créer les utilisateurs
        console.log('👤 Création des utilisateurs...');
        const users: mongoose.Types.ObjectId[] = [];
        for (const userData of sampleUsers) {
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            const user = new User({ ...userData, password: hashedPassword });
            await user.save();
            users.push(user._id as mongoose.Types.ObjectId);
            console.log(`✅ Utilisateur créé: ${userData.email}`);
        }

        // Créer les films
        console.log('🎬 Création des films...');
        const movies: mongoose.Types.ObjectId[] = [];
        for (const movieData of sampleMovies) {
            const movie = new Movie(movieData);
            await movie.save();
            movies.push(movie._id as mongoose.Types.ObjectId);
            console.log(`✅ Film créé: ${movieData.title}`);
        }

        // Créer des notes
        console.log('⭐ Création des notes...');
        const ratingsSeed = [
            { userId: users[0], target: 'movie', targetId: movies[0], score: 9, review: 'Avatar - Visuellement époustouflant !' },
            { userId: users[1], target: 'movie', targetId: movies[0], score: 8, review: 'Avatar - Très bon film, effets spéciaux incroyables.' },
            { userId: users[0], target: 'movie', targetId: movies[1], score: 10, review: 'Interstellar - Chef-d\'œuvre de Nolan !' },
            { userId: users[1], target: 'movie', targetId: movies[1], score: 9, review: 'Interstellar - Science-fiction brillante.' },
            { userId: users[0], target: 'movie', targetId: movies[2], score: 10, review: 'The Matrix - Révolutionnaire !' },
            { userId: users[1], target: 'movie', targetId: movies[2], score: 9, review: 'The Matrix - Classique de la science-fiction.' },
            { userId: users[0], target: 'movie', targetId: movies[3], score: 8, review: 'Forrest Gump - Touchant et inspirant.' },
            { userId: users[1], target: 'movie', targetId: movies[3], score: 7, review: 'Forrest Gump - Bon film, un peu long.' },
            { userId: users[0], target: 'movie', targetId: movies[4], score: 10, review: 'Le Seigneur des Anneaux - Épique et magnifique !' },
            { userId: users[1], target: 'movie', targetId: movies[4], score: 9, review: 'Le Seigneur des Anneaux - Fantasy parfaite.' }
        ] as Array<Pick<IRating, 'userId' | 'target' | 'targetId' | 'score' | 'review'>>;

        for (const ratingData of ratingsSeed) {
            const rating = new Rating(ratingData);
            await rating.save();
            console.log(`✅ Note créée: ${ratingData.score}/10`);
        }

        console.log('🎉 Base de données peuplée avec succès !');
        console.log('📊 Résumé:');
        console.log(`   - ${users.length} utilisateurs`);
        console.log(`   - ${movies.length} films`);
        console.log(`   - ${ratingsSeed.length} notes`);
    } catch (error: any) {
        console.error('❌ Erreur lors du peuplement de la base de données:', error.message || error);
    } finally {
        console.log('✅ Déconnexion de MongoDB');
        await mongoose.disconnect();
    }
}

void seedDatabase().catch((error) => {
    console.error('❌ Erreur dans le script de seed:', error);
    process.exit(1);
});



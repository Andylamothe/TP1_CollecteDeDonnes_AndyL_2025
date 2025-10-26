const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './env.local' });

// Schémas Mongoose
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    genres: [{ type: String, required: true }],
    synopsis: String,
    releaseDate: Date,
    durationMin: { type: Number, required: true }
}, { timestamps: true });

const ratingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: String, enum: ['movie', 'series'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    score: { type: Number, min: 1, max: 10, required: true },
    review: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Movie = mongoose.model('Movie', movieSchema);
const Rating = mongoose.model('Rating', ratingSchema);

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
    }
];

const sampleMovies = [
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

async function seedDatabase() {
    try {
        console.log('🔄 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
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
        const users = [];
        for (const userData of sampleUsers) {
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            const user = new User({
                ...userData,
                password: hashedPassword
            });
            await user.save();
            users.push(user);
            console.log(`✅ Utilisateur créé: ${userData.email}`);
        }

        // Créer les films
        console.log('🎬 Création des films...');
        const movies = [];
        for (const movieData of sampleMovies) {
            const movie = new Movie(movieData);
            await movie.save();
            movies.push(movie);
            console.log(`✅ Film créé: ${movieData.title}`);
        }

        // Créer des notes
        console.log('⭐ Création des notes...');
        const ratings = [
            {
                userId: users[0]._id,
                target: 'movie',
                targetId: movies[0]._id,
                score: 9,
                review: 'Avatar - Visuellement époustouflant !'
            },
            {
                userId: users[1]._id,
                target: 'movie',
                targetId: movies[0]._id,
                score: 8,
                review: 'Avatar - Très bon film, effets spéciaux incroyables.'
            },
            {
                userId: users[0]._id,
                target: 'movie',
                targetId: movies[1]._id,
                score: 10,
                review: 'Interstellar - Chef-d\'œuvre de Nolan !'
            },
            {
                userId: users[1]._id,
                target: 'movie',
                targetId: movies[1]._id,
                score: 9,
                review: 'Interstellar - Science-fiction brillante.'
            },
            {
                userId: users[0]._id,
                target: 'movie',
                targetId: movies[2]._id,
                score: 10,
                review: 'The Matrix - Révolutionnaire !'
            },
            {
                userId: users[1]._id,
                target: 'movie',
                targetId: movies[2]._id,
                score: 9,
                review: 'The Matrix - Classique de la science-fiction.'
            },
            {
                userId: users[0]._id,
                target: 'movie',
                targetId: movies[3]._id,
                score: 8,
                review: 'Forrest Gump - Touchant et inspirant.'
            },
            {
                userId: users[1]._id,
                target: 'movie',
                targetId: movies[3]._id,
                score: 7,
                review: 'Forrest Gump - Bon film, un peu long.'
            },
            {
                userId: users[0]._id,
                target: 'movie',
                targetId: movies[4]._id,
                score: 10,
                review: 'Le Seigneur des Anneaux - Épique et magnifique !'
            },
            {
                userId: users[1]._id,
                target: 'movie',
                targetId: movies[4]._id,
                score: 9,
                review: 'Le Seigneur des Anneaux - Fantasy parfaite.'
            }
        ];

        for (const ratingData of ratings) {
            const rating = new Rating(ratingData);
            await rating.save();
            console.log(`✅ Note créée: ${ratingData.score}/10`);
        }

        console.log('🎉 Base de données peuplée avec succès !');
        console.log(`📊 Résumé:`);
        console.log(`   - ${users.length} utilisateurs`);
        console.log(`   - ${movies.length} films`);
        console.log(`   - ${ratings.length} notes`);

    } catch (error) {
        console.error('❌ Erreur lors du peuplement de la base de données:', error.message);
    } finally {
        console.log('✅ Déconnexion de MongoDB');
        await mongoose.disconnect();
    }
}

// Exécuter le script
seedDatabase().catch(error => {
    console.error('❌ Erreur dans le script de seed:', error);
    process.exit(1);
});

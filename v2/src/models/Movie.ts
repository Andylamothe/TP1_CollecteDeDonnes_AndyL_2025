import mongoose, { Document, Schema } from 'mongoose';

export interface IMovie extends Document {
    _id: string;
    title: string;
    genres: string[];
    synopsis?: string;
    releaseDate?: Date;
    durationMin: number;
    createdAt: Date;
    updatedAt: Date;
}

const movieSchema = new Schema<IMovie>({
    title: {
        type: String,
        required: [true, 'Le titre est requis'],
        trim: true,
        minlength: [1, 'Le titre ne peut pas être vide'],
        maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
    },
    genres: [{
        type: String,
        required: [true, 'Au moins un genre est requis'],
        trim: true,
        enum: [
            'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary',
            'Drama', 'Family', 'Fantasy', 'Film-Noir', 'History', 'Horror', 'Music',
            'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
        ]
    }],
    synopsis: {
        type: String,
        trim: true,
        maxlength: [2000, 'La synopsis ne peut pas dépasser 2000 caractères']
    },
    releaseDate: {
        type: Date,
        validate: {
            validator: function(date: Date) {
                return !date || date <= new Date();
            },
            message: 'La date de sortie ne peut pas être dans le futur'
        }
    },
    durationMin: {
        type: Number,
        required: [true, 'La durée est requise'],
        min: [1, 'La durée doit être d\'au moins 1 minute'],
        max: [600, 'La durée ne peut pas dépasser 600 minutes (10 heures)']
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes
movieSchema.index({ title: 'text', synopsis: 'text' });
movieSchema.index({ genres: 1 });
movieSchema.index({ releaseDate: 1 });
movieSchema.index({ durationMin: 1 });

export const Movie = mongoose.model<IMovie>('Movie', movieSchema);

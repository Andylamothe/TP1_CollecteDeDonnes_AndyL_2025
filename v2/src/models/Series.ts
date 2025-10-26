import mongoose, { Document, Schema } from 'mongoose';

export interface ISeries extends Document {
    _id: string;
    title: string;
    genres: string[];
    status: 'en_attente' | 'en_cours' | 'terminee';
    synopsis?: string;
    releaseDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const seriesSchema = new Schema<ISeries>({
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
    status: {
        type: String,
        required: [true, 'Le statut est requis'],
        enum: ['en_attente', 'en_cours', 'terminee'],
        default: 'en_attente'
    },
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
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes
seriesSchema.index({ title: 'text', synopsis: 'text' });
seriesSchema.index({ genres: 1 });
seriesSchema.index({ status: 1 });
seriesSchema.index({ releaseDate: 1 });

export const Series = mongoose.model<ISeries>('Series', seriesSchema);

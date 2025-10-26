import mongoose, { Document, Schema } from 'mongoose';

export interface IRating extends Document {
    _id: string;
    userId: mongoose.Types.ObjectId;
    target: 'movie' | 'series';
    targetId: mongoose.Types.ObjectId;
    score: number;
    review?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ratingSchema = new Schema<IRating>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'ID de l\'utilisateur est requis']
    },
    target: {
        type: String,
        required: [true, 'Le type de cible est requis'],
        enum: ['movie', 'series']
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: [true, 'L\'ID de la cible est requis']
    },
    score: {
        type: Number,
        required: [true, 'La note est requise'],
        min: [1, 'La note doit être au moins 1'],
        max: [10, 'La note ne peut pas dépasser 10']
    },
    review: {
        type: String,
        trim: true,
        maxlength: [1000, 'La critique ne peut pas dépasser 1000 caractères']
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes
ratingSchema.index({ userId: 1, target: 1, targetId: 1 }, { unique: true });
ratingSchema.index({ target: 1, targetId: 1 });
ratingSchema.index({ score: 1 });
ratingSchema.index({ createdAt: -1 });

export const Rating = mongoose.model<IRating>('Rating', ratingSchema);

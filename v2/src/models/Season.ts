import mongoose, { Document, Schema } from 'mongoose';

export interface ISeason extends Document {
    _id: string;
    seriesId: mongoose.Types.ObjectId;
    seasonNo: number;
    title?: string;
    synopsis?: string;
    releaseDate?: Date;
    episodeCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const seasonSchema = new Schema<ISeason>({
    seriesId: {
        type: Schema.Types.ObjectId,
        ref: 'Series',
        required: [true, 'L\'ID de la série est requis']
    },
    seasonNo: {
        type: Number,
        required: [true, 'Le numéro de saison est requis'],
        min: [1, 'Le numéro de saison doit être au moins 1']
    },
    title: {
        type: String,
        trim: true,
        maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
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
    },
    episodeCount: {
        type: Number,
        default: 0,
        min: [0, 'Le nombre d\'épisodes ne peut pas être négatif']
    }
}, {
    timestamps: true
});

// Index pour optimiser les requêtes
seasonSchema.index({ seriesId: 1, seasonNo: 1 }, { unique: true });
seasonSchema.index({ seriesId: 1 });
seasonSchema.index({ seasonNo: 1 });

export const Season = mongoose.model<ISeason>('Season', seasonSchema);

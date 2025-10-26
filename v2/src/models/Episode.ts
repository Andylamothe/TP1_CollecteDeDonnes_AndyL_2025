import mongoose, { Document, Schema } from 'mongoose';

export interface IEpisode extends Document {
    _id: string;
    seriesId: mongoose.Types.ObjectId;
    seasonId: mongoose.Types.ObjectId;
    epNo: number;
    title: string;
    synopsis?: string;
    durationMin: number;
    releaseDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const episodeSchema = new Schema<IEpisode>({
    seriesId: {
        type: Schema.Types.ObjectId,
        ref: 'Series',
        required: [true, 'L\'ID de la série est requis']
    },
    seasonId: {
        type: Schema.Types.ObjectId,
        ref: 'Season',
        required: [true, 'L\'ID de la saison est requis']
    },
    epNo: {
        type: Number,
        required: [true, 'Le numéro d\'épisode est requis'],
        min: [1, 'Le numéro d\'épisode doit être au moins 1']
    },
    title: {
        type: String,
        required: [true, 'Le titre est requis'],
        trim: true,
        minlength: [1, 'Le titre ne peut pas être vide'],
        maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
    },
    synopsis: {
        type: String,
        trim: true,
        maxlength: [2000, 'La synopsis ne peut pas dépasser 2000 caractères']
    },
    durationMin: {
        type: Number,
        required: [true, 'La durée est requise'],
        min: [1, 'La durée doit être d\'au moins 1 minute'],
        max: [180, 'La durée ne peut pas dépasser 180 minutes (3 heures)']
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
episodeSchema.index({ seriesId: 1, seasonId: 1, epNo: 1 }, { unique: true });
episodeSchema.index({ seriesId: 1 });
episodeSchema.index({ seasonId: 1 });
episodeSchema.index({ epNo: 1 });
episodeSchema.index({ durationMin: 1 });

export const Episode = mongoose.model<IEpisode>('Episode', episodeSchema);
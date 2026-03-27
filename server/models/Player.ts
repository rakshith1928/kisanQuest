import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  language: string;
  region: string;
  farmState: string;
  financialScore: number;
  completedScenarios: string[];
  badges: string[];
  lastSyncAt: Date;
}

const PlayerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    language: { type: String, required: true },
    region: { type: String, required: true },
    farmState: { type: String, default: 'SETUP' },
    financialScore: { type: Number, default: 0 },
    completedScenarios: [{ type: String }],
    badges: [{ type: String }],
    lastSyncAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PlayerSchema.index({ financialScore: -1 });
PlayerSchema.index({ region: 1 });

export default mongoose.model<IPlayer>('Player', PlayerSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IDecision {
  scenarioId: string;
  nodeId: string;
  choiceId: string;
  timestamp: Date;
}

export interface ISeasonHistory {
  seasonStr: string;
  finalCash: number;
  finalDebt: number;
  yield: number;
}

export interface IGameState extends Document {
  playerId: mongoose.Types.ObjectId;
  currentSeason: string;
  cash: number;
  debt: number;
  insurance: boolean;
  crops: string[];
  decisions: IDecision[];
  seasonHistory: ISeasonHistory[];
}

const DecisionSchema = new Schema({
  scenarioId: { type: String, required: true },
  nodeId: { type: String, required: true },
  choiceId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const SeasonHistorySchema = new Schema({
  seasonStr: { type: String, required: true },
  finalCash: { type: Number, required: true },
  finalDebt: { type: Number, required: true },
  yield: { type: Number, required: true },
});

const GameStateSchema = new Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
      unique: true,
    },
    currentSeason: { type: String, default: 'Kharif_Year1' },
    cash: { type: Number, default: 5000 },
    debt: { type: Number, default: 0 },
    insurance: { type: Boolean, default: false },
    crops: [{ type: String }],
    decisions: [DecisionSchema],
    seasonHistory: [SeasonHistorySchema],
  },
  { timestamps: true }
);

export default mongoose.model<IGameState>('GameState', GameStateSchema);

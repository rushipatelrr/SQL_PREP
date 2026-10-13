import { Schema, model, Document } from 'mongoose';

export interface ITopic {
  order: number;
  title: string;
  what: string;
  why?: string;
  syntax?: string;
  example?: string;
  exampleExplain?: string;
  example2?: string;
  example2Explain?: string;
  whenToUse?: string;
  mistake?: string;
  remember?: string[];
}

export interface ILevel extends Document {
  levelId: string; // stable id, e.g. "level-1" — never a frontend array index
  order: number; // 0-based position in the course sequence
  title: string;
  concept: string;
  description?: string;
  topics: ITopic[];
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    order: { type: Number, required: true },
    title: { type: String, required: true },
    what: { type: String, required: true },
    why: String,
    syntax: String,
    example: String,
    exampleExplain: String,
    example2: String,
    example2Explain: String,
    whenToUse: String,
    mistake: String,
    remember: [String],
  },
  { _id: false }
);

const levelSchema = new Schema<ILevel>(
  {
    levelId: { type: String, required: true, unique: true, index: true },
    order: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    concept: { type: String, required: true },
    description: String,
    topics: { type: [topicSchema], default: [] },
  },
  { timestamps: true }
);

export const Level = model<ILevel>('Level', levelSchema);

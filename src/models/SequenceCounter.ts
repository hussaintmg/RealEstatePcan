import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISequenceCounter extends Document {
  key: string;
  sequence: number;
  updatedAt: Date;
}

const SequenceCounterSchema = new Schema<ISequenceCounter>(
  {
    key: { type: String, required: true, unique: true, index: true },
    sequence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SequenceCounter: Model<ISequenceCounter> =
  mongoose.models.SequenceCounter ||
  mongoose.model<ISequenceCounter>('SequenceCounter', SequenceCounterSchema);

/**
 * Atomically increments and retrieves the next number in sequence for the specified key.
 */
export async function getNextSequenceNumber(key: string): Promise<number> {
  const counter = await SequenceCounter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return counter.sequence;
}

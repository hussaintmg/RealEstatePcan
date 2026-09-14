import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  providerUsed?: string;
  timestamp: Date;
}

export interface IAiConversationMemory extends Document {
  sessionId: string;
  userId?: mongoose.Types.ObjectId;
  messages: IConversationMessage[];
  summary?: string;
  totalTokens?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AiConversationMemorySchema = new Schema<IAiConversationMemory>(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, required: true },
        providerUsed: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    summary: { type: String, default: '' },
    totalTokens: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AiConversationMemory: Model<IAiConversationMemory> =
  mongoose.models.AiConversationMemory ||
  mongoose.model<IAiConversationMemory>('AiConversationMemory', AiConversationMemorySchema);

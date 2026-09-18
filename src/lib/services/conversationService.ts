import { CrmActivity, ICrmActivity, CrmRelatedType, CrmActivityType } from '@/models/CrmActivity';
import { connectToDatabase } from '@/lib/db';
import mongoose from 'mongoose';

export interface LogActivityParams {
  relatedType: CrmRelatedType;
  relatedId: string | mongoose.Types.ObjectId;
  type: CrmActivityType;
  title: string;
  content?: string;
  authorId?: string | mongoose.Types.ObjectId;
  authorName?: string;
  visibility?: 'internal' | 'customer_facing';
  metadata?: Record<string, any>;
}

export class ConversationService {
  /**
   * Records a business-facing activity or communication note on an entity's timeline.
   */
  static async logActivity(params: LogActivityParams): Promise<ICrmActivity> {
    await connectToDatabase();
    return await CrmActivity.create({
      relatedType: params.relatedType,
      relatedId: new mongoose.Types.ObjectId(params.relatedId.toString()),
      type: params.type,
      title: params.title,
      content: params.content || '',
      authorId: params.authorId ? new mongoose.Types.ObjectId(params.authorId.toString()) : undefined,
      authorName: params.authorName || 'System',
      visibility: params.visibility || 'internal',
      metadata: params.metadata || {},
    });
  }

  /**
   * Adds an authorized staff note to a Lead, Customer, Deal, or Property.
   */
  static async addStaffNote(params: {
    relatedType: CrmRelatedType;
    relatedId: string;
    content: string;
    authorId: string;
    authorName: string;
    visibility?: 'internal' | 'customer_facing';
  }): Promise<ICrmActivity> {
    return this.logActivity({
      relatedType: params.relatedType,
      relatedId: params.relatedId,
      type: 'internal_note',
      title: 'Staff Note',
      content: params.content,
      authorId: params.authorId,
      authorName: params.authorName,
      visibility: params.visibility || 'internal',
    });
  }

  /**
   * Retrieves chronological activity timeline for an entity.
   * If `visibility` is specified (e.g. 'customer_facing' for Customer Portal), internal notes are filtered out.
   */
  static async getEntityTimeline(
    relatedType: CrmRelatedType,
    relatedId: string,
    options: {
      visibility?: 'internal' | 'customer_facing';
      limit?: number;
    } = {}
  ): Promise<ICrmActivity[]> {
    await connectToDatabase();
    const filter: any = {
      relatedType,
      relatedId: new mongoose.Types.ObjectId(relatedId),
    };

    if (options.visibility === 'customer_facing') {
      filter.visibility = 'customer_facing';
    }

    return (await CrmActivity.find(filter)
      .sort({ createdAt: -1 })
      .limit(options.limit || 50)
      .lean()) as unknown as ICrmActivity[];
  }
}

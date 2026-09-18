import { Property, IProperty } from '@/models/Property';
import { connectToDatabase } from '@/lib/db';
import { ConversationService } from './conversationService';
import { paginateQuery } from '@/lib/datagrid/paginateQuery';
import mongoose from 'mongoose';

export interface CreatePropertyInput {
  title: string;
  slug?: string;
  description?: string;
  price: number;
  currency?: string;
  propertyType: string;
  status?: 'available' | 'sold' | 'reserved' | 'pending';
  location: {
    address: string;
    city: string;
    state?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  specs?: {
    bedrooms: number;
    bathrooms: number;
    areaSqFt: number;
    yearBuilt?: number;
  };
  amenities?: string[];
  gallery?: string[];
  model3dUrl?: string;
  videoFramesUrl?: string;
  featured?: boolean;
  assignedAgent?: string;
}

export class PropertyService {
  /**
   * Generates a safe slug from a title.
   */
  static slugify(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Creates a new property with unique slug and logs activity.
   */
  static async createProperty(input: CreatePropertyInput, userId: string): Promise<IProperty> {
    await connectToDatabase();

    let slug = input.slug ? this.slugify(input.slug) : this.slugify(input.title);
    // Ensure slug uniqueness
    const existing = await Property.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const property = await Property.create({
      ...input,
      slug,
      createdBy: new mongoose.Types.ObjectId(userId),
      assignedAgent: input.assignedAgent ? new mongoose.Types.ObjectId(input.assignedAgent) : undefined,
    });

    await ConversationService.logActivity({
      relatedType: 'property',
      relatedId: property._id.toString(),
      type: 'system_event',
      title: 'Property Listed',
      content: `Property "${property.title}" listed with status ${property.status} at ${property.price} ${property.currency}.`,
      authorId: userId,
      visibility: 'internal',
    });

    return property;
  }

  /**
   * Updates property data.
   */
  static async updateProperty(id: string, updates: Partial<CreatePropertyInput>, userId: string): Promise<IProperty> {
    await connectToDatabase();
    const property = await Property.findById(id);
    if (!property) throw new Error('Property not found');

    if (updates.title && updates.title !== property.title && !updates.slug) {
      updates.slug = this.slugify(updates.title);
    }

    Object.assign(property, updates);
    await property.save();

    await ConversationService.logActivity({
      relatedType: 'property',
      relatedId: property._id.toString(),
      type: 'system_event',
      title: 'Property Updated',
      content: `Property "${property.title}" details updated.`,
      authorId: userId,
      visibility: 'internal',
    });

    return property;
  }

  /**
   * Updates property status with deliberate state transitions.
   */
  static async updateStatus(
    id: string,
    newStatus: 'available' | 'sold' | 'reserved' | 'pending',
    userId?: string
  ): Promise<IProperty> {
    await connectToDatabase();
    const property = await Property.findById(id);
    if (!property) throw new Error('Property not found');

    const prevStatus = property.status;
    property.status = newStatus;
    await property.save();

    await ConversationService.logActivity({
      relatedType: 'property',
      relatedId: property._id.toString(),
      type: 'system_event',
      title: 'Status Transition',
      content: `Property status changed from ${prevStatus} to ${newStatus}.`,
      authorId: userId,
      visibility: 'customer_facing',
    });

    return property;
  }

  /**
   * Assigns an agent to a property.
   */
  static async assignAgent(id: string, agentId: string, userId: string): Promise<IProperty> {
    await connectToDatabase();
    const property = await Property.findById(id);
    if (!property) throw new Error('Property not found');

    property.assignedAgent = new mongoose.Types.ObjectId(agentId);
    await property.save();

    await ConversationService.logActivity({
      relatedType: 'property',
      relatedId: property._id.toString(),
      type: 'system_event',
      title: 'Agent Assigned',
      content: `Assigned agent updated for ${property.title}.`,
      authorId: userId,
      visibility: 'internal',
    });

    return property;
  }

  /**
   * Returns properties for public query, strictly enforcing 'available' status and omitting internal metadata.
   */
  static async getPublicProperties(options: {
    page?: number;
    limit?: number;
    search?: string;
    propertyType?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    await connectToDatabase();
    const filter: any = {
      status: 'available',
    };

    if (options.propertyType) filter.propertyType = options.propertyType;
    if (options.city) filter['location.city'] = new RegExp(options.city, 'i');
    if (options.search) {
      filter.$or = [
        { title: new RegExp(options.search, 'i') },
        { description: new RegExp(options.search, 'i') },
        { 'location.address': new RegExp(options.search, 'i') },
      ];
    }
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      filter.price = {};
      if (options.minPrice !== undefined) filter.price.$gte = options.minPrice;
      if (options.maxPrice !== undefined) filter.price.$lte = options.maxPrice;
    }

    return await paginateQuery(Property, {
      page: options.page || 1,
      limit: options.limit || 12,
      filter,
      select: 'title slug description price currency propertyType status location specs amenities gallery model3dUrl videoFramesUrl featured createdAt',
    });
  }
}

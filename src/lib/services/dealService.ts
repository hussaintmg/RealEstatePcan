import { Deal, IDeal, DealStage, IDealMilestone } from '@/models/Deal';
import { Property } from '@/models/Property';
import { Customer } from '@/models/Customer';
import { connectToDatabase } from '@/lib/db';
import { validateAndCalculateMilestones, MilestoneInput } from '@/lib/money';
import { ConversationService } from './conversationService';
import mongoose from 'mongoose';

export interface CreateDealInput {
  title: string;
  propertyId: string;
  customerId: string;
  leadId?: string;
  assignedAgentId?: string;
  dealValue: number;
  agreedPrice?: number;
  bookingAmount?: number;
  discount?: number;
  currency?: string;
  expectedCloseDate?: string | Date;
  commissionRate?: number;
  commissionAmount?: number;
  paymentPlanType?: 'full_payment' | 'milestone_plan' | 'custom';
  milestones?: MilestoneInput[];
  notes?: string;
}

export class DealService {
  /**
   * Creates a new deal / sale record with milestone validation and property availability sync.
   */
  static async createDeal(input: CreateDealInput, performedByUserId: string): Promise<IDeal> {
    await connectToDatabase();

    const property = await Property.findById(input.propertyId);
    if (!property) throw new Error('Property not found');

    const customer = await Customer.findById(input.customerId);
    if (!customer) throw new Error('Customer not found');

    const agreedPrice = input.agreedPrice || input.dealValue;

    // Validate milestones if payment plan is milestone_plan
    let milestones: IDealMilestone[] = [];
    if (input.paymentPlanType === 'milestone_plan' && input.milestones && input.milestones.length > 0) {
      const calcResult = validateAndCalculateMilestones(agreedPrice, input.milestones, true);
      if (!calcResult.valid) {
        throw new Error(`Milestone calculation error: ${calcResult.error}`);
      }
      milestones = calcResult.milestones;
    } else {
      // Default single 100% full payment milestone
      milestones = [
        {
          title: 'Full Settlement',
          percentage: 100,
          amount: agreedPrice,
          dueDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined,
          status: 'pending',
          sequence: 1,
        },
      ];
    }

    const deal = await Deal.create({
      title: input.title.trim(),
      propertyId: new mongoose.Types.ObjectId(input.propertyId),
      customerId: new mongoose.Types.ObjectId(input.customerId),
      leadId: input.leadId ? new mongoose.Types.ObjectId(input.leadId) : undefined,
      assignedAgentId: input.assignedAgentId ? new mongoose.Types.ObjectId(input.assignedAgentId) : undefined,
      stage: 'inquiry',
      dealValue: agreedPrice,
      agreedPrice,
      bookingAmount: input.bookingAmount || 0,
      discount: input.discount || 0,
      currency: input.currency || property.currency || 'USD',
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined,
      commissionRate: input.commissionRate || 0,
      commissionAmount: input.commissionAmount || 0,
      paymentPlanType: input.paymentPlanType || 'milestone_plan',
      milestones,
      notes: input.notes || '',
      createdBy: new mongoose.Types.ObjectId(performedByUserId),
    });

    // Ensure property is linked to Customer
    if (!customer.linkedProperties.some((p) => p.toString() === property._id.toString())) {
      customer.linkedProperties.push(property._id);
      await customer.save();
    }

    // Log timeline activity
    await ConversationService.logActivity({
      relatedType: 'deal',
      relatedId: deal._id.toString(),
      type: 'deal_created',
      title: 'Deal Initiated',
      content: `Sale transaction initiated for "${property.title}" with agreed price of ${deal.currency} ${deal.dealValue.toLocaleString()}.`,
      authorId: performedByUserId,
      visibility: 'internal',
    });

    await ConversationService.logActivity({
      relatedType: 'customer',
      relatedId: customer._id.toString(),
      type: 'system_event',
      title: 'Contract Drafted',
      content: `New sale deal drafted for property ${property.title}.`,
      authorId: performedByUserId,
      visibility: 'customer_facing',
    });

    return deal;
  }

  /**
   * Advances the deal stage and automatically synchronizes Property availability.
   */
  static async updateDealStage(dealId: string, newStage: DealStage, performedByUserId: string): Promise<IDeal> {
    await connectToDatabase();
    const deal = await Deal.findById(dealId);
    if (!deal) throw new Error('Deal not found');

    const property = await Property.findById(deal.propertyId);
    const prevStage = deal.stage;
    deal.stage = newStage;
    await deal.save();

    // Synchronize Property status based on deal stage
    if (property) {
      if (newStage === 'under_contract' || newStage === 'deposit_received') {
        property.status = 'reserved';
        await property.save();
      } else if (newStage === 'closed_won') {
        property.status = 'sold';
        await property.save();
      } else if (newStage === 'closed_lost' && property.status === 'reserved') {
        property.status = 'available';
        await property.save();
      }
    }

    // Log timeline activity
    await ConversationService.logActivity({
      relatedType: 'deal',
      relatedId: deal._id.toString(),
      type: 'stage_changed',
      title: 'Deal Stage Advanced',
      content: `Deal transitioned from "${prevStage}" to "${newStage}".`,
      authorId: performedByUserId,
      visibility: 'customer_facing',
    });

    return deal;
  }
}

import { Customer, ICustomer } from '@/models/Customer';
import { Property } from '@/models/Property';
import { Deal } from '@/models/Deal';
import { Invoice } from '@/models/Invoice';
import { Payment } from '@/models/Payment';
import { Appointment } from '@/models/Appointment';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/db';
import { ConversationService } from './conversationService';
import crypto from 'crypto';
import mongoose from 'mongoose';

export interface CreateCustomerInput {
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  linkedPropertyId?: string;
}

export class CustomerService {
  /**
   * Normalizes email for duplicate matching.
   */
  static normalizeEmail(email: string): string {
    return email ? email.trim().toLowerCase() : '';
  }

  /**
   * Normalizes phone numbers (handles international and Pakistani numbers, removes dashes/spaces).
   */
  static normalizePhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
  }

  /**
   * Checks whether a customer already exists by normalized email or phone.
   */
  static async findExistingMatch(email: string, phone: string): Promise<ICustomer | null> {
    await connectToDatabase();
    const normEmail = this.normalizeEmail(email);
    const normPhone = this.normalizePhone(phone);

    return await Customer.findOne({
      $or: [
        { email: normEmail },
        { phone: normPhone },
      ],
    });
  }

  /**
   * Creates a customer directly from the dashboard with duplicate prevention.
   */
  static async createCustomer(input: CreateCustomerInput, performedByUserId: string): Promise<ICustomer> {
    await connectToDatabase();
    const normEmail = this.normalizeEmail(input.email);
    const normPhone = this.normalizePhone(input.phone);

    const existing = await this.findExistingMatch(normEmail, normPhone);
    if (existing) {
      throw new Error(`Customer already exists with matching email (${existing.email}) or phone (${existing.phone}).`);
    }

    const linkedProperties = input.linkedPropertyId
      ? [new mongoose.Types.ObjectId(input.linkedPropertyId)]
      : [];

    const customer = await Customer.create({
      fullName: input.fullName.trim(),
      email: normEmail,
      phone: normPhone,
      notes: input.notes || '',
      linkedProperties,
      invoices: [],
      status: 'active',
      portalStatus: 'pending_invite',
      createdBy: new mongoose.Types.ObjectId(performedByUserId),
    });

    await ConversationService.logActivity({
      relatedType: 'customer',
      relatedId: customer._id.toString(),
      type: 'system_event',
      title: 'Customer Created',
      content: `Customer profile directly registered.`,
      authorId: performedByUserId,
      visibility: 'internal',
    });

    return customer;
  }

  /**
   * Generates a signed, expiring portal invitation token for an existing customer.
   */
  static async generatePortalInvitation(customerId: string, performedByUserId: string): Promise<{ token: string; expiresAt: Date }> {
    await connectToDatabase();
    const customer = await Customer.findById(customerId);
    if (!customer) throw new Error('Customer not found');

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    customer.portalInviteToken = token;
    customer.portalInviteExpires = expiresAt;
    customer.portalStatus = 'invited';
    await customer.save();

    await ConversationService.logActivity({
      relatedType: 'customer',
      relatedId: customer._id.toString(),
      type: 'system_event',
      title: 'Portal Invitation Issued',
      content: `Portal activation link generated (expires in 7 days).`,
      authorId: performedByUserId,
      visibility: 'internal',
    });

    return { token, expiresAt };
  }

  /**
   * Retrieves complete organized customer record: overview, properties, deals, invoices, payments, appointments, activity.
   */
  static async getCustomerDetails(customerId: string) {
    await connectToDatabase();
    const customer = await Customer.findById(customerId).populate('linkedProperties');
    if (!customer) throw new Error('Customer not found');

    const custObjId = customer._id;

    const [deals, invoices, payments, appointments, timeline] = await Promise.all([
      Deal.find({ customerId: custObjId }).populate('propertyId').sort({ createdAt: -1 }).lean(),
      Invoice.find({ customerId: custObjId }).populate('propertyId').sort({ createdAt: -1 }).lean(),
      Payment.find({ customerId: custObjId }).sort({ createdAt: -1 }).lean(),
      Appointment.find({ customerId: custObjId }).populate('propertyId').sort({ date: -1 }).lean(),
      ConversationService.getEntityTimeline('customer', customerId, { limit: 20 }),
    ]);

    return {
      customer,
      deals,
      invoices,
      payments,
      appointments,
      timeline,
    };
  }
}

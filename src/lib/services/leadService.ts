import { Lead, ILead } from '../../models/Lead';
import { Customer } from '../../models/Customer';
import { User } from '../../models/User';
import { hashPassword } from '../auth';
import { connectToDatabase } from '../db';
import { ConversationService } from './conversationService';
import crypto from 'crypto';
import mongoose from 'mongoose';

export interface CreateLeadInput {
  fullName: string;
  email: string;
  phone: string;
  budget?: number;
  propertyInterest?: string;
  source?: string;
  notes?: string;
  assignedAgent?: string;
}

export interface ConvertLeadResult {
  customer: any;
  user: any;
  generatedPassword: string;
  portalInviteToken: string;
}

/**
 * Creates a new lead directly from the dashboard or public inquiry.
 */
export async function createLead(input: CreateLeadInput, performedByUserId: string): Promise<ILead> {
  await connectToDatabase();

  const lead = await Lead.create({
    fullName: input.fullName.trim(),
    email: input.email.toLowerCase().trim(),
    phone: input.phone.trim(),
    budget: input.budget || 0,
    propertyInterest: input.propertyInterest ? new mongoose.Types.ObjectId(input.propertyInterest) : undefined,
    source: input.source || 'manual',
    notes: input.notes || '',
    assignedAgent: input.assignedAgent ? new mongoose.Types.ObjectId(input.assignedAgent) : undefined,
    status: 'new',
    createdBy: new mongoose.Types.ObjectId(performedByUserId),
  });

  await ConversationService.logActivity({
    relatedType: 'lead',
    relatedId: lead._id.toString(),
    type: 'lead_created',
    title: 'Lead Registered',
    content: `Lead created for ${lead.fullName} via ${lead.source}.`,
    authorId: performedByUserId,
    visibility: 'internal',
  });

  return lead;
}

/**
 * Assigns a lead to an agent and logs an activity timeline entry.
 */
export async function assignLead(leadId: string, agentId: string, performedByUserId: string): Promise<ILead> {
  await connectToDatabase();
  const lead = await Lead.findById(leadId);
  if (!lead) throw new Error('Lead not found');

  const agent = await User.findById(agentId);
  if (!agent) throw new Error('Assigned agent user not found');

  lead.assignedAgent = new mongoose.Types.ObjectId(agentId);
  await lead.save();

  await ConversationService.logActivity({
    relatedType: 'lead',
    relatedId: lead._id.toString(),
    type: 'lead_assigned',
    title: 'Lead Assigned',
    content: `Lead assigned to ${agent.fullName || agent.email}.`,
    authorId: performedByUserId,
    visibility: 'internal',
  });

  return lead;
}

/**
 * Idempotently converts a lead to a Customer account with high-entropy invitation credentials.
 */
export async function convertLeadToCustomer(leadId: string, performedByUserId: string): Promise<ConvertLeadResult> {
  await connectToDatabase();

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new Error('Lead not found');
  }

  if (lead.status === 'converted' && lead.convertedToCustomer) {
    throw new Error('This lead has already been converted to a customer.');
  }

  // Generate cryptographically secure invitation token and high-entropy credentials
  const portalInviteToken = crypto.randomBytes(32).toString('hex');
  const portalInviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const generatedPassword = crypto.randomBytes(18).toString('base64url');
  const passwordHash = await hashPassword(generatedPassword);

  // Check if User already exists with this email
  let user = await User.findOne({ email: lead.email.toLowerCase() });
  if (!user) {
    user = await User.create({
      fullName: lead.fullName,
      email: lead.email.toLowerCase(),
      phone: lead.phone,
      passwordHash,
      isDeveloper: false,
      isOwner: false,
      isActive: true,
      createdBy: performedByUserId,
    });
  }

  // Create or link Customer
  let customer = await Customer.findOne({ $or: [{ userId: user._id }, { email: lead.email.toLowerCase() }] });
  if (!customer) {
    customer = await Customer.create({
      userId: user._id,
      leadId: lead._id,
      fullName: lead.fullName,
      email: lead.email.toLowerCase(),
      phone: lead.phone,
      linkedProperties: lead.propertyInterest ? [lead.propertyInterest] : [],
      invoices: [],
      status: 'active',
      portalStatus: 'invited',
      portalInviteToken,
      portalInviteExpires,
      createdBy: performedByUserId,
    });
  } else {
    if (!customer.userId) customer.userId = user._id;
    customer.portalInviteToken = portalInviteToken;
    customer.portalInviteExpires = portalInviteExpires;
    customer.portalStatus = 'invited';
    if (lead.propertyInterest && !customer.linkedProperties.some(p => p.toString() === lead.propertyInterest!.toString())) {
      customer.linkedProperties.push(lead.propertyInterest);
    }
    await customer.save();
  }

  // Update Lead status
  lead.status = 'converted';
  lead.convertedToCustomer = customer._id;
  await lead.save();

  // Log activity on both Lead and Customer timelines
  await ConversationService.logActivity({
    relatedType: 'lead',
    relatedId: lead._id.toString(),
    type: 'lead_converted',
    title: 'Lead Converted to Customer',
    content: `Converted into Customer account (${customer.fullName}). User Portal invitation issued.`,
    authorId: performedByUserId,
    visibility: 'internal',
  });

  await ConversationService.logActivity({
    relatedType: 'customer',
    relatedId: customer._id.toString(),
    type: 'system_event',
    title: 'Customer Onboarded',
    content: `Customer profile established from Lead conversion.`,
    authorId: performedByUserId,
    visibility: 'internal',
  });

  return {
    customer,
    user,
    generatedPassword,
    portalInviteToken,
  };
}

export class LeadService {
  static createLead = createLead;
  static assignLead = assignLead;
  static convertLeadToCustomer = convertLeadToCustomer;
}

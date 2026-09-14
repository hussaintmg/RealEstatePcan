import { Lead } from '../../models/Lead';
import { Customer } from '../../models/Customer';
import { User } from '../../models/User';
import { hashPassword } from '../auth';
import { connectToDatabase } from '../db';
import crypto from 'crypto';

export interface ConvertLeadResult {
  customer: any;
  user: any;
  generatedPassword: string;
}

export async function convertLeadToCustomer(leadId: string, performedByUserId: string): Promise<ConvertLeadResult> {
  await connectToDatabase();

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new Error('Lead not found');
  }

  if (lead.status === 'converted' && lead.convertedToCustomer) {
    throw new Error('This lead has already been converted to a customer.');
  }

  // Generate secure temporary password
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  const generatedPassword = `Portal@${randomSuffix}!`;
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
  let customer = await Customer.findOne({ userId: user._id });
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
      createdBy: performedByUserId,
    });
  } else if (lead.propertyInterest && !customer.linkedProperties.includes(lead.propertyInterest)) {
    customer.linkedProperties.push(lead.propertyInterest);
    await customer.save();
  }

  // Update Lead status
  lead.status = 'converted';
  lead.convertedToCustomer = customer._id;
  await lead.save();

  return {
    customer,
    user,
    generatedPassword,
  };
}

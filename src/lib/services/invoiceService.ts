import { Invoice, IInvoice } from '@/models/Invoice';
import { Deal } from '@/models/Deal';
import { Customer } from '@/models/Customer';
import { getNextSequenceNumber } from '@/models/SequenceCounter';
import { connectToDatabase } from '@/lib/db';
import { ConversationService } from './conversationService';
import mongoose from 'mongoose';

export class InvoiceService {
  /**
   * Generates a collision-safe invoice number: INV-YYYY-000123
   */
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await getNextSequenceNumber(`invoice_${year}`);
    return `INV-${year}-${String(seq).padStart(6, '0')}`;
  }

  /**
   * Generates a formal tax invoice from a valid deal milestone.
   */
  static async generateInvoiceForMilestone(
    dealId: string,
    milestoneIndex: number,
    performedByUserId: string
  ): Promise<IInvoice> {
    await connectToDatabase();

    const deal = await Deal.findById(dealId);
    if (!deal) throw new Error('Deal not found');

    if (!deal.milestones || !deal.milestones[milestoneIndex]) {
      throw new Error(`Milestone at index ${milestoneIndex} does not exist in Deal.`);
    }

    const milestone = deal.milestones[milestoneIndex];
    if (milestone.invoiceId) {
      const existing = await Invoice.findById(milestone.invoiceId);
      if (existing) {
        throw new Error(`An invoice (${existing.invoiceNumber}) has already been issued for this milestone.`);
      }
    }

    const invoiceNumber = await this.generateInvoiceNumber();
    const dueDate = milestone.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days default

    const invoice = await Invoice.create({
      invoiceNumber,
      customerId: deal.customerId,
      dealId: deal._id,
      propertyId: deal.propertyId,
      milestoneTitle: milestone.title,
      amount: milestone.amount,
      paidAmount: 0,
      balance: milestone.amount,
      currency: deal.currency || 'USD',
      status: 'pending',
      dueDate,
      milestones: [
        {
          name: milestone.title,
          percentage: milestone.percentage,
          amount: milestone.amount,
          dueDate,
          isPaid: false,
        },
      ],
      createdBy: new mongoose.Types.ObjectId(performedByUserId),
    });

    // Update Deal milestone with invoice link
    milestone.invoiceId = invoice._id;
    milestone.status = 'invoiced';
    deal.invoices.push(invoice._id);
    await deal.save();

    // Link to Customer
    const customer = await Customer.findById(deal.customerId);
    if (customer && !customer.invoices.includes(invoice._id)) {
      customer.invoices.push(invoice._id);
      await customer.save();
    }

    // Log timeline activity
    await ConversationService.logActivity({
      relatedType: 'deal',
      relatedId: deal._id.toString(),
      type: 'invoice_issued',
      title: 'Invoice Issued',
      content: `Invoice ${invoiceNumber} issued for milestone "${milestone.title}" (${deal.currency} ${milestone.amount.toLocaleString()}).`,
      authorId: performedByUserId,
      visibility: 'customer_facing',
    });

    if (customer) {
      await ConversationService.logActivity({
        relatedType: 'customer',
        relatedId: customer._id.toString(),
        type: 'invoice_issued',
        title: 'Billing Demand Issued',
        content: `Invoice ${invoiceNumber} for ${deal.currency} ${milestone.amount.toLocaleString()} is now due by ${new Date(dueDate).toLocaleDateString()}.`,
        authorId: performedByUserId,
        visibility: 'customer_facing',
      });
    }

    return invoice;
  }

  /**
   * Voids an invoice with mandatory audit rationale.
   */
  static async voidInvoice(invoiceId: string, reason: string, performedByUserId: string): Promise<IInvoice> {
    await connectToDatabase();
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.status === 'paid') {
      throw new Error('Cannot void an invoice that has already been fully paid.');
    }

    invoice.status = 'cancelled';
    await invoice.save();

    await ConversationService.logActivity({
      relatedType: 'invoice',
      relatedId: invoice._id.toString(),
      type: 'system_event',
      title: 'Invoice Voided',
      content: `Invoice ${invoice.invoiceNumber} voided. Reason: ${reason}`,
      authorId: performedByUserId,
      visibility: 'internal',
    });

    return invoice;
  }
}

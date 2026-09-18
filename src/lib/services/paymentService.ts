import { Payment, IPayment, PaymentMethod, PaymentStatus } from '@/models/Payment';
import { Invoice } from '@/models/Invoice';
import { Deal } from '@/models/Deal';
import { Customer } from '@/models/Customer';
import { connectToDatabase } from '@/lib/db';
import { addMoney, subtractMoney } from '@/lib/money';
import { ConversationService } from './conversationService';
import { recordAuditEvent } from '@/lib/auditLogger';
import mongoose from 'mongoose';
import crypto from 'crypto';

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  notes?: string;
  paidAt?: Date | string;
}

export class PaymentService {
  /**
   * Generates a unique transaction reference if none is provided.
   */
  static generateTransactionRef(prefix = 'TXN'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Records a payment transaction against an invoice, updating balances and milestone statuses safely.
   */
  static async recordPayment(input: RecordPaymentInput, performedByUserId: string): Promise<IPayment> {
    await connectToDatabase();

    if (!input.amount || input.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const invoice = await Invoice.findById(input.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    if (invoice.status === 'cancelled') {
      throw new Error('Cannot record payment against a cancelled/void invoice.');
    }

    if (invoice.status === 'paid' || invoice.balance <= 0) {
      throw new Error('Invoice has already been fully paid.');
    }

    // Overpayment prevention
    if (input.amount > invoice.balance) {
      throw new Error(
        `Payment amount (${invoice.currency} ${input.amount.toLocaleString()}) exceeds the remaining balance of ${invoice.currency} ${invoice.balance.toLocaleString()}.`
      );
    }

    // Transaction reference collision check
    const reference = input.transactionReference?.trim() || this.generateTransactionRef();
    const existingPayment = await Payment.findOne({ transactionReference: reference });
    if (existingPayment) {
      throw new Error(`A payment with transaction reference "${reference}" has already been recorded.`);
    }

    // 1. Create Payment record
    const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
    const payment = await Payment.create({
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      dealId: invoice.dealId,
      amount: input.amount,
      currency: invoice.currency || 'USD',
      paymentMethod: input.paymentMethod || 'wire_transfer',
      status: 'completed',
      transactionReference: reference,
      notes: input.notes || '',
      paidAt,
      createdBy: new mongoose.Types.ObjectId(performedByUserId),
    });

    // 2. Update Invoice balance and paidAmount using exact minor-unit arithmetic
    const newPaidAmount = addMoney(invoice.paidAmount || 0, input.amount);
    const newBalance = subtractMoney(invoice.balance, input.amount);

    invoice.paidAmount = newPaidAmount;
    invoice.balance = newBalance;

    const isFullyPaid = newBalance <= 0;
    if (isFullyPaid) {
      invoice.status = 'paid';
      invoice.paidAt = paidAt;
    }
    await invoice.save();

    // 3. If linked to a Deal milestone, update the milestone status
    if (invoice.dealId) {
      const deal = await Deal.findById(invoice.dealId);
      if (deal && deal.milestones) {
        const milestone = deal.milestones.find(
          (m) => m.invoiceId && m.invoiceId.toString() === invoice._id.toString()
        );
        if (milestone && isFullyPaid) {
          milestone.status = 'paid';
          await deal.save();
        }
      }
    }

    // 4. Log business activity timeline
    const formattedAmount = `${invoice.currency} ${input.amount.toLocaleString()}`;
    await ConversationService.logActivity({
      relatedType: 'invoice',
      relatedId: invoice._id.toString(),
      type: 'payment_recorded',
      title: 'Payment Received',
      content: `Received payment of ${formattedAmount} via ${payment.paymentMethod} (Ref: ${reference}). Remaining balance: ${invoice.currency} ${newBalance.toLocaleString()}.`,
      authorId: performedByUserId,
      visibility: 'customer_facing',
      metadata: { paymentId: payment._id.toString(), reference },
    });

    if (invoice.customerId) {
      await ConversationService.logActivity({
        relatedType: 'customer',
        relatedId: invoice.customerId.toString(),
        type: 'payment_recorded',
        title: 'Payment Credited',
        content: `Payment of ${formattedAmount} credited toward invoice ${invoice.invoiceNumber}.`,
        authorId: performedByUserId,
        visibility: 'customer_facing',
        metadata: { invoiceNumber: invoice.invoiceNumber },
      });
    }

    if (invoice.dealId) {
      await ConversationService.logActivity({
        relatedType: 'deal',
        relatedId: invoice.dealId.toString(),
        type: 'payment_recorded',
        title: 'Milestone Payment Settled',
        content: `Payment of ${formattedAmount} settled for milestone "${invoice.milestoneTitle || invoice.invoiceNumber}".`,
        authorId: performedByUserId,
        visibility: 'customer_facing',
      });
    }

    // 5. Record security audit event
    recordAuditEvent({
      actorUserId: performedByUserId,
      actorRole: 'staff',
      action: 'payment.recorded',
      resourceType: 'payment',
      resourceId: payment._id.toString(),
      route: 'service:paymentService:recordPayment',
      status: 200,
      metadata: {
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        amount: input.amount,
        reference,
        newBalance,
        isFullyPaid,
      },
    });

    return payment;
  }

  /**
   * Reverses / refunds a recorded payment without destroying historical records.
   */
  static async reversePayment(
    paymentId: string,
    reason: string,
    performedByUserId: string
  ): Promise<IPayment> {
    await connectToDatabase();

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment record not found.');
    }

    if (payment.status === 'refunded') {
      throw new Error('This payment has already been reversed / refunded.');
    }

    const invoice = await Invoice.findById(payment.invoiceId);
    if (!invoice) {
      throw new Error('Associated invoice not found.');
    }

    // Mark payment as refunded
    payment.status = 'refunded';
    payment.notes = payment.notes ? `${payment.notes}\n[Refunded]: ${reason}` : `[Refunded]: ${reason}`;
    await payment.save();

    // Recalculate invoice balance
    invoice.paidAmount = Math.max(0, subtractMoney(invoice.paidAmount, payment.amount));
    invoice.balance = addMoney(invoice.balance, payment.amount);
    if (invoice.status === 'paid') {
      invoice.status = 'pending';
      invoice.paidAt = undefined;
    }
    await invoice.save();

    // If linked to Deal milestone, revert milestone status to invoiced
    if (invoice.dealId) {
      const deal = await Deal.findById(invoice.dealId);
      if (deal && deal.milestones) {
        const milestone = deal.milestones.find(
          (m) => m.invoiceId && m.invoiceId.toString() === invoice._id.toString()
        );
        if (milestone) {
          milestone.status = 'invoiced';
          await deal.save();
        }
      }
    }

    // Log activity
    await ConversationService.logActivity({
      relatedType: 'invoice',
      relatedId: invoice._id.toString(),
      type: 'system_event',
      title: 'Payment Reversed / Refunded',
      content: `Payment of ${invoice.currency} ${payment.amount.toLocaleString()} reversed. Reason: ${reason}`,
      authorId: performedByUserId,
      visibility: 'internal',
    });

    // Record audit event
    recordAuditEvent({
      actorUserId: performedByUserId,
      actorRole: 'staff',
      action: 'payment.refunded',
      resourceType: 'payment',
      resourceId: payment._id.toString(),
      route: 'service:paymentService:reversePayment',
      status: 200,
      metadata: {
        paymentId,
        invoiceId: invoice._id.toString(),
        amount: payment.amount,
        reason,
      },
    });

    return payment;
  }
}

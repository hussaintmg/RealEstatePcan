import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError, getCachedSystemFeatures } from '@/lib/authGuard';
import { Customer } from '@/models/Customer';
import { Deal } from '@/models/Deal';
import { Invoice } from '@/models/Invoice';
import { Payment } from '@/models/Payment';
import { Appointment } from '@/models/Appointment';
import { ConversationService } from '@/lib/services/conversationService';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user } = authRes;

    // 1. Feature Flag check
    const features = await getCachedSystemFeatures();
    if (features.customerPortal === false) {
      return standardError('FEATURE_DISABLED', 'The Customer Portal is currently disabled by platform settings.', 403);
    }

    // 2. Derive Customer identity strictly from authenticated session
    const customer = await Customer.findOne({
      $or: [
        { userId: user.userId },
        { email: user.email.toLowerCase() },
      ],
    }).populate('linkedProperties');

    if (!customer) {
      return standardError(
        'PORTAL_CUSTOMER_NOT_FOUND',
        'No customer profile is linked to this authenticated account.',
        404
      );
    }

    const customerId = customer._id;

    // 3. Fetch customer's own deals, invoices, payments, appointments, and customer-facing timeline in parallel
    const [deals, invoices, payments, appointments, timeline] = await Promise.all([
      Deal.find({ customerId })
        .populate('propertyId', 'title slug price currency location status gallery')
        .sort({ createdAt: -1 })
        .lean(),
      Invoice.find({ customerId })
        .populate('propertyId', 'title slug location')
        .sort({ createdAt: -1 })
        .lean(),
      Payment.find({ customerId })
        .populate('invoiceId', 'invoiceNumber milestoneTitle')
        .sort({ paidAt: -1 })
        .lean(),
      Appointment.find({
        $or: [
          { customerId },
          { attendeeEmail: customer.email.toLowerCase() },
        ],
      })
        .populate('propertyId', 'title slug location')
        .sort({ date: 1 })
        .lean(),
      ConversationService.getEntityTimeline('customer', customerId.toString(), {
        visibility: 'customer_facing',
        limit: 30,
      }),
    ]);

    // Aggregate milestones across customer's active deals
    const milestones = deals.flatMap((deal) =>
      (deal.milestones || []).map((m: any) => ({
        ...m,
        dealId: deal._id,
        dealTitle: deal.title,
        currency: deal.currency,
        propertyTitle: (deal.propertyId as any)?.title,
      }))
    );

    return NextResponse.json({
      success: true,
      customer: {
        id: customer._id.toString(),
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        portalStatus: customer.portalStatus,
        linkedProperties: customer.linkedProperties,
      },
      deals,
      invoices,
      payments,
      milestones,
      appointments,
      timeline,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid customer portal session required.', 401);
    }
    console.error('Error in GET /api/portal/me:', err);
    return standardError('INTERNAL_ERROR', err.message || 'Failed to fetch customer portal data.', 500);
  }
}

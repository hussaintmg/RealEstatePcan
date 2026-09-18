import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can, applyDataScope } from '@/lib/rbac';
import { Appointment } from '@/models/Appointment';
import { AppointmentService } from '@/lib/services/appointmentService';
import { paginateQuery } from '@/lib/datagrid/paginateQuery';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { connectToDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    // Viewing appointments requires lead.view, customer.view, or deal.view
    if (!can(user, role, 'lead.view') && !can(user, role, 'customer.view')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to view viewings and appointments.', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const propertyId = searchParams.get('propertyId') || '';
    const leadId = searchParams.get('leadId') || '';
    const customerId = searchParams.get('customerId') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';

    let baseFilter: Record<string, any> = {};

    if (propertyId) baseFilter.propertyId = propertyId;
    if (leadId) baseFilter.leadId = leadId;
    if (customerId) baseFilter.customerId = customerId;
    if (status) baseFilter.status = status;
    if (type) baseFilter.type = type;
    if (search.trim()) {
      baseFilter.$or = [
        { attendeeName: { $regex: search.trim(), $options: 'i' } },
        { attendeeEmail: { $regex: search.trim(), $options: 'i' } },
        { title: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const scopedFilter = await applyDataScope(baseFilter, user, role, 'lead.view');

    const result = await paginateQuery(Appointment, {
      page,
      limit,
      filter: scopedFilter,
      populate: [
        { path: 'propertyId', select: 'title slug location price currency gallery' },
        { path: 'leadId', select: 'fullName email phone status' },
        { path: 'customerId', select: 'fullName email phone' },
        { path: 'assignedAgentId', select: 'fullName email' },
      ],
      sort: { date: 1, createdAt: -1 },
    });

    return NextResponse.json({
      success: true,
      appointments: result.items,
      pagination: {
        total: result.totalItems,
        page: result.currentPage,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in GET /api/appointments:', err);
    return standardError('INTERNAL_ERROR', err.message || 'Failed to fetch appointments.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    if (!can(user, role, 'lead.edit') && !can(user, role, 'customer.edit')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to schedule viewings.', 403);
    }

    const body = await request.json();
    if (!body.title || !body.attendeeName || !body.attendeeEmail || !body.attendeePhone || !body.date || !body.timeSlot) {
      return standardError(
        'VALIDATION_ERROR',
        'Title, attendeeName, attendeeEmail, attendeePhone, date, and timeSlot are required.',
        422
      );
    }

    const appointment = await AppointmentService.createAppointment(body, user.userId);

    recordAuditEvent({
      actorUserId: user.userId,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'appointment.created',
      resourceType: 'appointment',
      resourceId: appointment._id.toString(),
      route: '/api/appointments',
      status: 201,
      changes: computeSafeDiff({}, appointment.toObject()),
      metadata: {
        title: appointment.title,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        attendeeName: appointment.attendeeName,
      },
    });

    return NextResponse.json({ success: true, appointment }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in POST /api/appointments:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to schedule appointment.', 400);
  }
}

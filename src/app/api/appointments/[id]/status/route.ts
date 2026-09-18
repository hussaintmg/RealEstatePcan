import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { can } from '@/lib/rbac';
import { Appointment } from '@/models/Appointment';
import { AppointmentService } from '@/lib/services/appointmentService';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { connectToDatabase } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;
    const { user, role } = authRes;

    if (!can(user, role, 'lead.edit') && !can(user, role, 'customer.edit')) {
      return standardError('FORBIDDEN', 'Insufficient permissions to update appointment status.', 403);
    }

    const appointment = await Appointment.findById(params.id);
    if (!appointment) {
      return standardError('NOT_FOUND', 'Appointment not found.', 404);
    }

    const body = await request.json();
    if (!body.status) {
      return standardError('VALIDATION_ERROR', 'Target status is required.', 422);
    }

    const beforeStatus = appointment.status;
    const updated = await AppointmentService.updateStatus(params.id, body.status, user.userId);

    recordAuditEvent({
      actorUserId: user.userId,
      actorRole: user.isDeveloper ? 'developer' : user.isOwner ? 'owner' : 'staff',
      action: 'appointment.status_changed',
      resourceType: 'appointment',
      resourceId: params.id,
      route: `/api/appointments/${params.id}/status`,
      status: 200,
      changes: computeSafeDiff({ status: beforeStatus }, { status: body.status }),
      metadata: { from: beforeStatus, to: body.status, title: appointment.title },
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') {
      return standardError('UNAUTHENTICATED', 'Valid authentication session required.', 401);
    }
    console.error('Error in PUT /api/appointments/[id]/status:', err);
    return standardError('BAD_REQUEST', err.message || 'Failed to update appointment status.', 400);
  }
}

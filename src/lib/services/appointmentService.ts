import { Appointment, IAppointment, AppointmentStatus, AppointmentType } from '@/models/Appointment';
import { Property } from '@/models/Property';
import { Customer } from '@/models/Customer';
import { Lead } from '@/models/Lead';
import { connectToDatabase } from '@/lib/db';
import { ConversationService } from './conversationService';
import mongoose from 'mongoose';

export interface CreateAppointmentInput {
  title: string;
  type?: AppointmentType;
  propertyId?: string;
  leadId?: string;
  customerId?: string;
  assignedAgentId?: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  date: string | Date;
  timeSlot: string;
  notes?: string;
  source?: 'website_form' | 'dashboard' | 'phone';
}

export class AppointmentService {
  /**
   * Schedules a new appointment or viewing with agent conflict detection.
   */
  static async createAppointment(input: CreateAppointmentInput, performedByUserId?: string): Promise<IAppointment> {
    await connectToDatabase();

    const apptDate = new Date(input.date);
    // Start of day & end of day UTC for conflict checking
    const dayStart = new Date(apptDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(apptDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    // Conflict detection for assigned agent on identical date and time slot
    if (input.assignedAgentId) {
      const conflict = await Appointment.findOne({
        assignedAgentId: new mongoose.Types.ObjectId(input.assignedAgentId),
        date: { $gte: dayStart, $lte: dayEnd },
        timeSlot: input.timeSlot,
        status: { $in: ['pending', 'confirmed'] },
      });

      if (conflict) {
        throw new Error(
          `Scheduling conflict: The assigned agent already has a confirmed viewing (${conflict.title}) at ${input.timeSlot} on this date.`
        );
      }
    }

    const appointment = await Appointment.create({
      title: input.title.trim(),
      type: input.type || 'in_person_viewing',
      propertyId: input.propertyId ? new mongoose.Types.ObjectId(input.propertyId) : undefined,
      leadId: input.leadId ? new mongoose.Types.ObjectId(input.leadId) : undefined,
      customerId: input.customerId ? new mongoose.Types.ObjectId(input.customerId) : undefined,
      assignedAgentId: input.assignedAgentId ? new mongoose.Types.ObjectId(input.assignedAgentId) : undefined,
      attendeeName: input.attendeeName.trim(),
      attendeeEmail: input.attendeeEmail.toLowerCase().trim(),
      attendeePhone: input.attendeePhone.trim(),
      date: apptDate,
      timeSlot: input.timeSlot,
      status: 'pending',
      notes: input.notes || '',
      source: input.source || 'dashboard',
      createdBy: performedByUserId ? new mongoose.Types.ObjectId(performedByUserId) : undefined,
    });

    // Cross-link activity logging
    const logParams = {
      type: 'viewing_scheduled' as const,
      title: 'Viewing Scheduled',
      content: `${appointment.title} scheduled for ${apptDate.toLocaleDateString()} at ${appointment.timeSlot} with ${appointment.attendeeName}.`,
      authorId: performedByUserId,
      visibility: 'customer_facing' as const,
    };

    if (input.propertyId) {
      await ConversationService.logActivity({ ...logParams, relatedType: 'property', relatedId: input.propertyId });
    }
    if (input.customerId) {
      await ConversationService.logActivity({ ...logParams, relatedType: 'customer', relatedId: input.customerId });
    }
    if (input.leadId) {
      await ConversationService.logActivity({ ...logParams, relatedType: 'lead', relatedId: input.leadId });
    }

    return appointment;
  }

  /**
   * Transitions appointment status (e.g. confirmed, completed, cancelled).
   */
  static async updateStatus(id: string, newStatus: AppointmentStatus, performedByUserId?: string): Promise<IAppointment> {
    await connectToDatabase();
    const appointment = await Appointment.findById(id);
    if (!appointment) throw new Error('Appointment not found');

    const prevStatus = appointment.status;
    appointment.status = newStatus;
    await appointment.save();

    const title = `Appointment ${newStatus.toUpperCase()}`;
    const content = `Status changed from ${prevStatus} to ${newStatus}.`;

    if (appointment.customerId) {
      await ConversationService.logActivity({
        relatedType: 'customer',
        relatedId: appointment.customerId.toString(),
        type: 'system_event',
        title,
        content,
        authorId: performedByUserId,
        visibility: 'customer_facing',
      });
    }

    return appointment;
  }
}

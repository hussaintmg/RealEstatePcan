import { connectToDatabase } from '../db';
import { Lead } from '../../models/Lead';
import { Appointment } from '../../models/Appointment';
import { Property } from '../../models/Property';
import { User } from '../../models/User';
import { logAuditEvent } from '../auditLogger';

export type FormActionType =
  | 'create_lead'
  | 'create_property_inquiry'
  | 'book_viewing'
  | 'newsletter_signup';

export interface FormSubmissionContext {
  ip?: string;
  userAgent?: string;
  propertyId?: string;
  pageSlug?: string;
}

export interface FormSubmissionResult {
  success: boolean;
  message: string;
  recordId?: string;
  error?: string;
}

// Simple in-memory rate limiting map: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

/**
 * Server-authoritative form action dispatcher.
 * Dispatches to genuine CRM and appointment models.
 */
export async function executeFormAction(
  actionType: FormActionType,
  formData: Record<string, any>,
  context: FormSubmissionContext = {}
): Promise<FormSubmissionResult> {
  await connectToDatabase();
  const owner = await User.findOne({ $or: [{ isOwner: true }, { isDeveloper: true }] });

  // Validate basic required contact information
  const fullName = String(formData.fullName || formData.name || 'Anonymous Visitor').trim();
  const email = String(formData.email || '').trim().toLowerCase();
  const phone = String(formData.phone || '').trim();
  const notes = String(formData.notes || formData.message || '').trim();

  if (actionType !== 'newsletter_signup' && (!fullName || !email)) {
    return {
      success: false,
      message: 'Validation failed',
      error: 'Full Name and Email Address are required.',
    };
  }

  if (actionType === 'newsletter_signup' && !email) {
    return {
      success: false,
      message: 'Validation failed',
      error: 'A valid email address is required to subscribe.',
    };
  }

  switch (actionType) {
    case 'create_lead':
    case 'create_property_inquiry': {
      let propertyInterest = undefined;
      if (context.propertyId) {
        const prop = await Property.findById(context.propertyId);
        if (prop) propertyInterest = prop._id;
      }

      const budget = Number(formData.budget) || (formData.budget === '5000000' ? 5000000 : 1500000);

      // Create genuine Lead record in Module 4 CRM
      const lead = await Lead.create({
        fullName,
        email,
        phone: phone || '+1-000-000-0000',
        budget,
        source: 'website',
        status: 'new',
        propertyInterest,
        notes: `Submitted via website form [${actionType}] on page "${context.pageSlug || '/'}"\n${notes}`,
        createdBy: owner?._id,
      });

      // Audit log
      try {
        await logAuditEvent({
          action: 'crm.lead.created',
          resource: 'lead',
          resourceId: lead._id.toString(),
          severity: 'low',
          details: {
            actionType,
            email,
            pageSlug: context.pageSlug,
            propertyId: context.propertyId,
          },
        });
      } catch (auditErr) {
        console.warn('Audit log write error:', auditErr);
      }

      return {
        success: true,
        message: 'Your inquiry has been successfully registered. Our Senior Property Director will contact you within 2 hours.',
        recordId: lead._id.toString(),
      };
    }

    case 'book_viewing': {
      const requestedDate = formData.date ? new Date(formData.date) : new Date(Date.now() + 86400000);
      const timeSlot = String(formData.timeSlot || '14:00 - 15:00');

      let propertyId = undefined;
      if (context.propertyId) {
        const prop = await Property.findById(context.propertyId);
        if (prop) propertyId = prop._id;
      }

      // Create genuine Appointment record in Module 4 CRM
      const appointment = await Appointment.create({
        title: `Viewing: ${fullName}`,
        type: 'in_person_viewing',
        propertyId,
        attendeeName: fullName,
        attendeeEmail: email,
        attendeePhone: phone || '+1-000-000-0000',
        date: requestedDate,
        timeSlot,
        status: 'pending',
        notes: `Private viewing requested via public website. Preferences:\n${notes}`,
        source: 'website_form',
      });

      // Also ensure a Lead exists for follow-up
      let existingLead = await Lead.findOne({ email });
      if (!existingLead) {
        await Lead.create({
          fullName,
          email,
          phone: phone || '+1-000-000-0000',
          source: 'website',
          status: 'new',
          propertyInterest: propertyId,
          notes: `Created from private viewing request on ${requestedDate.toDateString()} at ${timeSlot}`,
          createdBy: owner?._id,
        });
      }

      return {
        success: true,
        message: 'Your viewing appointment request has been scheduled. Our concierge team will confirm your time slot shortly.',
        recordId: appointment._id.toString(),
      };
    }

    case 'newsletter_signup': {
      let lead = await Lead.findOne({ email });
      if (!lead) {
        lead = await Lead.create({
          fullName: fullName !== 'Anonymous Visitor' ? fullName : 'Newsletter Subscriber',
          email,
          phone: '+1-000-000-0000',
          source: 'website',
          status: 'contacted',
          notes: 'Subscribed to Architectural Digest & Off-market releases.',
          createdBy: owner?._id,
        });
      }

      return {
        success: true,
        message: 'Thank you for subscribing to our luxury architectural portfolio.',
        recordId: lead._id.toString(),
      };
    }

    default:
      return {
        success: false,
        message: 'Unsupported action',
        error: `Action type "${actionType}" is not registered in the system.`,
      };
  }
}

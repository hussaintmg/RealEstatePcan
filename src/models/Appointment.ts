import mongoose, { Schema, Document, Model } from 'mongoose';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'in_person_viewing' | 'virtual_3d_walkthrough' | 'investment_consultation' | 'contract_signing';

export interface IAppointment extends Document {
  title: string;
  type: AppointmentType;
  propertyId?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  assignedAgentId?: mongoose.Types.ObjectId;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  date: Date;
  timeSlot: string; // e.g. "14:00 - 15:00"
  status: AppointmentStatus;
  notes?: string;
  source: 'website_form' | 'dashboard' | 'phone';
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['in_person_viewing', 'virtual_3d_walkthrough', 'investment_consultation', 'contract_signing'],
      default: 'in_person_viewing',
    },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: 'User' },
    attendeeName: { type: String, required: true, trim: true },
    attendeeEmail: { type: String, required: true, lowercase: true, trim: true },
    attendeePhone: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true,
    },
    notes: { type: String, default: '' },
    source: {
      type: String,
      enum: ['website_form', 'dashboard', 'phone'],
      default: 'website_form',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  propertyType: string;
  status: 'available' | 'sold' | 'reserved' | 'pending';
  location: {
    address: string;
    city: string;
    state?: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  specs: {
    bedrooms: number;
    bathrooms: number;
    areaSqFt: number;
    yearBuilt?: number;
  };
  amenities: string[];
  gallery: string[];
  model3dUrl?: string;
  videoFramesUrl?: string;
  featured: boolean;
  assignedAgent?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    propertyType: { type: String, required: true, default: 'Villa' },
    status: {
      type: String,
      enum: ['available', 'sold', 'reserved', 'pending'],
      default: 'available',
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      country: { type: String, default: 'Pakistan' },
      lat: { type: Number },
      lng: { type: Number },
    },
    specs: {
      bedrooms: { type: Number, default: 3 },
      bathrooms: { type: Number, default: 2 },
      areaSqFt: { type: Number, default: 2000 },
      yearBuilt: { type: Number, default: 2024 },
    },
    amenities: [{ type: String }],
    gallery: [{ type: String }],
    model3dUrl: { type: String, default: '' },
    videoFramesUrl: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Property: Model<IProperty> =
  mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Property } from '@/models/Property';
import { PropertyScan } from '@/models/PropertyScan';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  await connectToDatabase();

  try {
    // Find or create a system user to attach createdBy
    let user = await User.findOne({ isDeveloper: true });
    if (!user) {
      user = await User.findOne({});
    }

    const userId = user?._id || new mongoose.Types.ObjectId();

    // 1. Ensure The Skyview Horizon Villa (Ready with 3D Scan)
    let prop1 = await Property.findOne({ slug: 'the-skyview-horizon-villa' });
    if (!prop1) {
      prop1 = await Property.create({
        title: 'The Skyview Horizon Villa',
        slug: 'the-skyview-horizon-villa',
        description: 'Spectacular contemporary hillside villa featuring panoramic Margalla views, double-height floor-to-ceiling glass, private infinity pool, and smart home automation.',
        price: 1850000,
        currency: 'USD',
        propertyType: 'Villa',
        status: 'available',
        location: {
          address: 'Plot 42, Margalla Hillside Avenue',
          city: 'Islamabad',
          state: 'Federal Capital',
          country: 'Pakistan',
        },
        specs: {
          bedrooms: 5,
          bathrooms: 6,
          areaSqFt: 5200,
          yearBuilt: 2024,
        },
        amenities: ['3D Virtual Tour', 'Private Pool', 'Smart Home', 'Panoramic Views', 'Italian Kitchen', 'Solar Powered'],
        gallery: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        createdBy: userId,
      });
    }

    // Ensure Scan for Prop 1 (Ready)
    let scan1 = await PropertyScan.findOne({ propertyId: prop1._id });
    if (!scan1) {
      scan1 = await PropertyScan.create({
        propertyId: prop1._id,
        title: 'Ground & First Floor Spatial Scan',
        status: 'ready',
        currentStage: 'completed',
        roomsCount: 4,
        totalFramesCount: 185,
        totalSizeBytes: 14200000,
        storagePrefix: `scans/${prop1._id}/master`,
        metrics: {
          totalAreaSqFt: 5200,
          totalAreaSqMeters: 483,
          ceilingHeightMeters: 3.2,
          reconstructionAccuracyCm: 1.2,
        },
        isPublic: true,
        createdBy: userId,
      });
    } else if (scan1.status !== 'ready') {
      scan1.status = 'ready';
      scan1.currentStage = 'completed';
      await scan1.save();
    }

    // 2. Ensure Azure Bayfront Modern Mansion (Queued / Incomplete Scan)
    let prop2 = await Property.findOne({ slug: 'azure-bayfront-modern-mansion' });
    if (!prop2) {
      prop2 = await Property.create({
        title: 'Azure Bayfront Modern Mansion',
        slug: 'azure-bayfront-modern-mansion',
        description: 'Elite coastal residence with private yacht slip, cantilevered glass terraces, temperature-controlled wine cellar, and master suite overlooking Creek Marina.',
        price: 2400000,
        currency: 'USD',
        propertyType: 'Mansion',
        status: 'available',
        location: {
          address: 'Marina Boulevard, Creek Precinct',
          city: 'Karachi',
          state: 'Sindh',
          country: 'Pakistan',
        },
        specs: {
          bedrooms: 6,
          bathrooms: 7,
          areaSqFt: 6800,
          yearBuilt: 2025,
        },
        amenities: ['Private Marina Slip', 'Home Theater', 'Elevator', 'Wine Cellar', 'Spa & Sauna'],
        gallery: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        createdBy: userId,
      });
    }

    // Ensure Queued Scan for Prop 2 (To test "Resume Capture & Upload")
    let scan2 = await PropertyScan.findOne({ propertyId: prop2._id });
    if (!scan2) {
      scan2 = await PropertyScan.create({
        propertyId: prop2._id,
        title: 'Marina Wing Capture (Queued)',
        status: 'draft',
        currentStage: 'upload_interrupted',
        roomsCount: 2,
        totalFramesCount: 48,
        totalSizeBytes: 4200000,
        storagePrefix: `scans/${prop2._id}/queued`,
        createdBy: userId,
      });
    }

    // 3. Ensure Elysian Golf Estate Residence (Failed Scan - test Retry)
    let prop3 = await Property.findOne({ slug: 'elysian-golf-estate-residence' });
    if (!prop3) {
      prop3 = await Property.create({
        title: 'Elysian Golf Estate Residence',
        slug: 'elysian-golf-estate-residence',
        description: 'Championship golf course facing luxury estate with Japanese zen garden, outdoor kitchen, and expansive master suite.',
        price: 1350000,
        currency: 'USD',
        propertyType: 'Estate',
        status: 'available',
        location: {
          address: 'Fairways Road, DHA Phase 6',
          city: 'Lahore',
          state: 'Punjab',
          country: 'Pakistan',
        },
        specs: {
          bedrooms: 4,
          bathrooms: 5,
          areaSqFt: 4400,
          yearBuilt: 2023,
        },
        amenities: ['Golf Course View', 'Zen Garden', 'Outdoor BBQ Kitchen', 'Smart Security'],
        gallery: [
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        featured: true,
        createdBy: userId,
      });
    }

    // Ensure Failed Scan for Prop 3 (To test "Retry Reconstruction")
    let scan3 = await PropertyScan.findOne({ propertyId: prop3._id });
    if (!scan3) {
      scan3 = await PropertyScan.create({
        propertyId: prop3._id,
        title: 'Garden Suite Scan (Failed)',
        status: 'failed',
        currentStage: 'feature_matching_failed',
        roomsCount: 1,
        totalFramesCount: 32,
        totalSizeBytes: 2100000,
        storagePrefix: `scans/${prop3._id}/failed`,
        createdBy: userId,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Demo properties and test scans seeded successfully!',
      properties: [
        { id: prop1._id, title: prop1.title, scanStatus: scan1.status },
        { id: prop2._id, title: prop2.title, scanStatus: scan2.status },
        { id: prop3._id, title: prop3.title, scanStatus: scan3.status },
      ],
    });
  } catch (err: any) {
    console.error('Seed demo error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to seed demo data' },
      { status: 500 }
    );
  }
}

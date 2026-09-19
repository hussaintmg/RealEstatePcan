'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { DynamicCmsTopbar } from '@/components/navigation/DynamicCmsTopbar';
import { DynamicCmsNavbar } from '@/components/navigation/DynamicCmsNavbar';
import { DynamicCmsFooter } from '@/components/navigation/DynamicCmsFooter';
import { RealEstate3DViewer } from '@/components/3d/RealEstate3DViewer';
import { MortgageCalculator } from '@/components/properties/MortgageCalculator';
import { CmsSectionRenderer } from '@/components/cms/CmsSectionRenderer';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  Loader2,
  Box,
  Eye,
  X,
  Clock,
} from 'lucide-react';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const propertyId = Array.isArray(id) ? id[0] : id;

  const [property, setProperty] = useState<any>(null);
  const [cmsTemplate, setCmsTemplate] = useState<any>(null);
  const [experience3d, setExperience3d] = useState<any>(null);
  const [is3DActivated, setIs3DActivated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Inquiry & Viewing Booking Modal
  const [selectedUnitForViewing, setSelectedUnitForViewing] = useState<any>(null);
  const [viewingForm, setViewingForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredDate: '',
    notes: '',
  });
  const [viewingSubmitted, setViewingSubmitted] = useState(false);
  const [submittingViewing, setSubmittingViewing] = useState(false);

  // General Lead Form
  const [leadForm, setLeadForm] = useState({ fullName: '', email: '', phone: '', notes: '' });
  const [inquirySent, setInquirySent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch Property record from API
        const propRes = await fetch(`/api/properties/${propertyId}`);
        if (propRes.ok) {
          const propJson = await propRes.json();
          if (propJson.property) {
            setProperty(propJson.property);
          }
        }
      } catch (err) {
        console.warn('Could not fetch real property record:', err);
      }

      try {
        // 2. Fetch Published 3D Experience
        const experienceRes = await fetch(`/api/properties/${propertyId}/3d/public`);
        if (experienceRes.ok) {
          const expJson = await experienceRes.json();
          if (expJson.success && expJson.available) {
            setExperience3d(expJson.experience);
          }
        }
      } catch (err) {
        console.warn('No 3D experience active for this property:', err);
      }

      try {
        // 3. Fetch CMS Template
        const templateRes = await fetch('/api/cms/pages?slug=property-detail-template');
        if (templateRes.ok) {
          const templateJson = await templateRes.json();
          if (templateJson.page?.sections?.length > 0) {
            setCmsTemplate(templateJson.page);
          }
        }
      } catch (err) {
        console.warn('Could not load CMS template:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [propertyId]);

  // Handle General Inquiry
  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadForm, propertyInterest: propertyId, source: 'website' }),
      });
      setInquirySent(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle 3D Unit Viewing Booking
  const handleBookViewing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingViewing(true);
    try {
      // 1. Create Appointment / Viewing
      const scheduledTime = viewingForm.preferredDate
        ? new Date(viewingForm.preferredDate).toISOString()
        : new Date(Date.now() + 86400000).toISOString();

      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          unitId: selectedUnitForViewing?.propertyUnitId || selectedUnitForViewing?.nodeName,
          title: `VIP 3D Viewing: ${selectedUnitForViewing?.unitName || property?.title}`,
          scheduledTime,
          durationMinutes: 45,
          type: 'in_person',
          notes: `Booked via 3D Spatial Walkthrough. Visitor: ${viewingForm.fullName} (${viewingForm.phone})`,
        }),
      });

      // 2. Also register lead in CRM
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: viewingForm.fullName,
          email: viewingForm.email,
          phone: viewingForm.phone,
          propertyInterest: propertyId,
          source: '3d_viewer',
          notes: `Interested in unit: ${selectedUnitForViewing?.unitName || selectedUnitForViewing?.nodeName}`,
        }),
      });

      setViewingSubmitted(true);
    } catch (err) {
      console.error('Error booking viewing:', err);
    } finally {
      setSubmittingViewing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Fallback property data if database had no record
  const currentProperty = property || {
    _id: propertyId,
    title: 'Aura Heights Signature Architectural Villa',
    price: 1850000,
    propertyType: 'Villa',
    status: 'Available',
    location: { city: 'Islamabad', address: 'Margalla Foothills, Sector E-7' },
    specs: { bedrooms: 5, bathrooms: 6, areaSqFt: 5200, yearBuilt: 2025 },
    amenities: [
      'Interactive 3D Virtual Walkthrough',
      'Private Swimming Pool',
      'Smart Home Automation',
      'Panoramic Margalla Vistas',
    ],
    description:
      'A bespoke luxury architectural estate with double-height atrium spaces, imported stone finishes, and floor-to-ceiling panoramic mountain glazing.',
  };

  const dataContext = {
    property: {
      ...currentProperty,
      name: currentProperty.title,
      price: typeof currentProperty.price === 'number' ? `$${currentProperty.price.toLocaleString()}` : currentProperty.price,
      location:
        typeof currentProperty.location === 'object'
          ? `${currentProperty.location.address || ''}, ${currentProperty.location.city || ''}`
          : currentProperty.location,
    },
    brand: {
      name: 'Aura Heights Luxury Estates',
      logo: { primary: '/images/luxury-logo.svg' },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14] text-white">
      <DynamicCmsTopbar />
      <DynamicCmsNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        {cmsTemplate?.sections && cmsTemplate.sections.length > 0 ? (
          <div className="space-y-14">
            {cmsTemplate.sections.map((sec: any) => (
              <CmsSectionRenderer key={sec.id || sec._id} section={sec} dataContext={dataContext} />
            ))}
          </div>
        ) : (
          <>
            {/* Header Title Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentProperty.propertyType || 'Villa'} • Verified Luxury Listing</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {currentProperty.title}
                </h1>
                <div className="flex items-center space-x-2 text-slate-400 text-xs sm:text-sm">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span>
                    {currentProperty.location?.address}, {currentProperty.location?.city}
                  </span>
                </div>
              </div>

              <div className="text-left md:text-right">
                <span className="text-xs text-slate-400 uppercase tracking-widest block">Asking Price</span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                  ${typeof currentProperty.price === 'number' ? currentProperty.price.toLocaleString() : currentProperty.price}
                </span>
              </div>
            </motion.div>

            {/* 3D PlayCanvas Interactive Spatial Experience */}
            {experience3d ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Box className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                      {experience3d.title || 'PlayCanvas 3D Virtual Walkthrough'}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Drag to rotate • Pinch/scroll to zoom • Select unit to view availability
                  </span>
                </div>

                {!is3DActivated ? (
                  <div className="relative h-[480px] w-full rounded-3xl overflow-hidden border border-white/10 bg-[#0d121f] group shadow-2xl">
                    <img
                      src={experience3d.previewImageUrl || '/images/hero-building.jpg'}
                      alt={currentProperty.title}
                      className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center p-6 text-center space-y-4">
                      <div className="p-4 bg-blue-600/30 border border-blue-500/40 rounded-full backdrop-blur-md animate-pulse">
                        <Box className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-1 max-w-md">
                        <h4 className="text-xl font-bold text-white">Explore in 3D Spatial Walkthrough</h4>
                        <p className="text-xs text-slate-300">
                          Inspect floors, live unit availability, and architectural finishes in real-time.
                        </p>
                      </div>
                      <button
                        onClick={() => setIs3DActivated(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-extrabold shadow-xl shadow-blue-600/40 transition-all flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Launch 3D Experience</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <RealEstate3DViewer
                    modelUrl={experience3d.modelUrl}
                    title={experience3d.title}
                    cameraSettings={experience3d.cameraSettings}
                    sceneSettings={experience3d.sceneSettings}
                    bookmarks={experience3d.bookmarks}
                    floorMappings={experience3d.floorMappings}
                    unitMappings={experience3d.unitMappings}
                    hotspots={experience3d.hotspots}
                    mode="public"
                    onInquireUnit={(unit) => setSelectedUnitForViewing(unit)}
                    className="h-[580px] w-full"
                  />
                )}
              </motion.div>
            ) : null}

            {/* Specs & Description Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-2 space-y-8"
              >
                {/* Specs Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-3">
                    <Bed className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-xs text-slate-400">Bedrooms</div>
                      <div className="text-sm font-bold text-white">{currentProperty.specs?.bedrooms || 4} Suites</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Bath className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-xs text-slate-400">Bathrooms</div>
                      <div className="text-sm font-bold text-white">{currentProperty.specs?.bathrooms || 5} Baths</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Maximize2 className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-xs text-slate-400">Living Area</div>
                      <div className="text-sm font-bold text-white">{currentProperty.specs?.areaSqFt || 4200} Sq Ft</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-xs text-slate-400">Year Built</div>
                      <div className="text-sm font-bold text-white">{currentProperty.specs?.yearBuilt || 2025}</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-white">Architectural Overview</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{currentProperty.description}</p>
                </div>

                {/* Features & Amenities */}
                {currentProperty.amenities && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">Features &amp; Smart Amenities</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentProperty.amenities.map((item: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-center space-x-2.5 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-200"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <MortgageCalculator propertyPrice={currentProperty.price} />
              </motion.div>

              {/* Right Col: Booking & Inquiry Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="sticky top-24 bg-[#101522] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white">Schedule a Private Viewing</h3>
                    <p className="text-xs text-slate-400 mt-1">Connect directly with the authorized listing director.</p>
                  </div>

                  {inquirySent ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                      <p className="text-xs font-semibold text-emerald-300">
                        Viewing request registered. We will contact you shortly.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleInquiry} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={leadForm.fullName}
                          onChange={(e) => setLeadForm({ ...leadForm, fullName: e.target.value })}
                          placeholder="e.g. Asad Ullah"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={leadForm.email}
                          onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                          placeholder="asad@domain.com"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1">Phone / WhatsApp</label>
                        <input
                          type="tel"
                          required
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                          placeholder="+92 300 0000000"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Request VIP Viewing</span>}
                      </button>
                    </form>
                  )}

                  <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      <span>Direct Hotline: +92 51 880-9911</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>advisors@auraheights.local</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </main>

      {/* 3D Unit Viewing Modal */}
      {selectedUnitForViewing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-[#101522] border border-white/20 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">
                  Schedule Private Walkthrough
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedUnitForViewing.unitName || selectedUnitForViewing.name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedUnitForViewing(null);
                  setViewingSubmitted(false);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingSubmitted ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Viewing Appointment Requested</h4>
                <p className="text-xs text-slate-300">
                  Your appointment for {selectedUnitForViewing.unitName} has been booked in our CRM. A sales director
                  will contact you to confirm the time slot.
                </p>
                <button
                  onClick={() => setSelectedUnitForViewing(null)}
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookViewing} className="space-y-3 text-xs">
                <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Unit Status</span>
                    <span className="font-bold text-emerald-400 uppercase text-[11px]">
                      {selectedUnitForViewing.status || 'Available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Asking Price</span>
                    <span className="font-bold text-blue-400 text-[11px]">
                      {selectedUnitForViewing.price ? `$${selectedUnitForViewing.price.toLocaleString()}` : 'Upon Request'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Your Name</label>
                  <input
                    type="text"
                    required
                    value={viewingForm.fullName}
                    onChange={(e) => setViewingForm({ ...viewingForm, fullName: e.target.value })}
                    placeholder="Full legal name"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    required
                    value={viewingForm.email}
                    onChange={(e) => setViewingForm({ ...viewingForm, email: e.target.value })}
                    placeholder="client@domain.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={viewingForm.phone}
                    onChange={(e) => setViewingForm({ ...viewingForm, phone: e.target.value })}
                    placeholder="+92 300 0000000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Preferred Viewing Date</label>
                  <input
                    type="date"
                    value={viewingForm.preferredDate}
                    onChange={(e) => setViewingForm({ ...viewingForm, preferredDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingViewing}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 mt-2"
                >
                  {submittingViewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm VIP Viewing Request</span>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <DynamicCmsFooter />
    </div>
  );
}

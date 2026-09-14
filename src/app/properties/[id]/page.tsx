'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { DynamicCmsTopbar } from '@/components/navigation/DynamicCmsTopbar';
import { DynamicCmsNavbar } from '@/components/navigation/DynamicCmsNavbar';
import { DynamicCmsFooter } from '@/components/navigation/DynamicCmsFooter';
import { PlayCanvasViewer } from '@/components/3d/PlayCanvasViewer';
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
} from 'lucide-react';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [cmsTemplate, setCmsTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Inquiry form
  const [leadForm, setLeadForm] = useState({ fullName: '', email: '', phone: '', notes: '' });
  const [inquirySent, setInquirySent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch CMS Property Detail Template
        const res = await fetch('/api/cms/pages?slug=property-detail-template');
        if (res.ok) {
          const json = await res.json();
          if (json.page && json.page.sections?.length > 0) {
            setCmsTemplate(json.page);
          }
        }
      } catch (err) {
        console.warn('Could not load CMS property template:', err);
      }

      // 2. Fetch or load property data
      setProperty({
        _id: id,
        title: 'The Skyview Horizon Villa • Signature Estate',
        name: 'The Skyview Horizon Villa • Signature Estate',
        price: 1850000,
        propertyType: 'Villa',
        status: 'Available',
        location: { city: 'Islamabad', address: 'Margalla Hillside Avenue, Sector E-7' },
        specs: { bedrooms: 5, bathrooms: 6, areaSqFt: 5200, yearBuilt: 2025 },
        bedrooms: 5,
        bathrooms: 6,
        area: 5200,
        amenities: [
          'Interactive 3D Virtual Walkthrough',
          'Private Swimming Pool',
          'Smart Home Automation',
          'Floor-to-Ceiling Panoramic Glass',
          'Rooftop BBQ Pavilion',
          'Servant Quarters & 4-Car Garage',
        ],
        description:
          'A bespoke architectural triumph sculpted into the scenic Margalla foothill ridge. Featuring seamless open-plan living, double-height atrium ceilings, high-end imported Italian stone, and panoramic mountain vistas from every suite.',
        model3dUrl: '',
        featuredImage: '/images/hero-building.jpg',
      });
      setLoading(false);
    }

    loadData();
  }, [id]);

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadForm, propertyInterest: id }),
      });
      setInquirySent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !property) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const dataContext = property
    ? {
        property: {
          ...property,
          name: property.title || property.name,
          title: property.title || property.name,
          bedrooms: property.specs?.bedrooms || property.bedrooms || 5,
          bathrooms: property.specs?.bathrooms || property.bathrooms || 6,
          area: property.specs?.areaSqFt || property.area || 5200,
          price: typeof property.price === 'number' ? `$${property.price.toLocaleString()}` : property.price,
          location:
            typeof property.location === 'object'
              ? `${property.location.address || ''}, ${property.location.city || ''}`
              : property.location,
          description: property.description,
          amenities: property.amenities || [],
          gallery: property.gallery || [],
          featuredImage: property.featuredImage || '/images/hero-building.jpg',
          model3dUrl: property.model3dUrl || '',
          specs: property.specs || {},
        },
        brand: {
          name: 'Skyline Residences',
          logo: { primary: '/images/luxury-logo.svg' },
        },
        settings: {
          phone: '+92 51 880-9911',
          email: 'advisors@auraheights.local',
          whatsapp: 'https://wa.me/923000000000',
          address: 'Margalla Hillside Avenue, Sector E-7, Islamabad',
        },
      }
    : {};

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14] text-white">
      <DynamicCmsTopbar />
      <DynamicCmsNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-12">
        {cmsTemplate?.sections && cmsTemplate.sections.length > 0 ? (
          <div className="space-y-14">
            {cmsTemplate.sections.map((sec: any) => (
              <CmsSectionRenderer
                key={sec.id || sec._id}
                section={sec}
                dataContext={dataContext}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Fallback Static Structure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6"
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{property.propertyType} • Verified Luxury Listing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {property.title}
            </h1>
            <div className="flex items-center space-x-2 text-slate-400 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>{property.location.address}, {property.location.city}</span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400 uppercase tracking-widest block">Asking Price</span>
            <span className="text-3xl sm:text-4xl font-black text-emerald-400">
              ${property.price.toLocaleString()}
            </span>
          </div>
        </motion.div>

        {/* 3D PlayCanvas Interactive Model Walkthrough */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              PlayCanvas 3D Virtual Walkthrough
            </h3>
            <span className="text-xs text-slate-400">Drag to rotate • Click room buttons to jump</span>
          </div>
          <PlayCanvasViewer modelUrl={property.model3dUrl} title={property.title} />
        </motion.div>

        {/* Specs & Description Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left 2 Cols: Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Specs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg shadow-black/20">
              <div className="flex items-center space-x-3">
                <Bed className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Bedrooms</div>
                  <div className="text-sm font-bold text-white">{property.specs.bedrooms} Suites</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Bath className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Bathrooms</div>
                  <div className="text-sm font-bold text-white">{property.specs.bathrooms} Baths</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Maximize2 className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Living Area</div>
                  <div className="text-sm font-bold text-white">{property.specs.areaSqFt} Sq Ft</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs text-slate-400">Year Built</div>
                  <div className="text-sm font-bold text-white">{property.specs.yearBuilt}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white">Architectural Overview</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{property.description}</p>
            </div>

              {/* Amenities */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Features &amp; Smart Amenities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.amenities.map((item: string, i: number) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                      className="flex items-center space-x-2.5 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-200 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Interactive Mortgage & Financing Calculator */}
              <MortgageCalculator propertyPrice={property.price} />
            </motion.div>

          {/* Right Col: Booking / Inquiry Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="sticky top-24 bg-[#101522] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5 shadow-blue-950/20">
              <div>
                <h3 className="text-base font-bold text-white">Schedule a Private Viewing</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect directly with the authorized listing director.
                </p>
              </div>

              {inquirySent ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="text-xs font-semibold text-emerald-300">
                    Viewing request registered. We will call you within 2 hours.
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
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500/50 transition-colors"
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
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500/50 transition-colors"
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
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Request VIP Viewing</span>}
                  </motion.button>
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

      <DynamicCmsFooter />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { DynamicCmsTopbar } from '@/components/navigation/DynamicCmsTopbar';
import { DynamicCmsNavbar } from '@/components/navigation/DynamicCmsNavbar';
import { DynamicCmsFooter } from '@/components/navigation/DynamicCmsFooter';
import { Search, MapPin, Bed, Bath, Maximize2, ArrowRight, Loader2, Layers } from 'lucide-react';
import { PropertyComparisonDrawer, ComparisonProperty } from '@/components/properties/PropertyComparisonDrawer';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, damping: 20, stiffness: 260 },
  },
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [city, setCity] = useState('');
  const [comparisonList, setComparisonList] = useState<ComparisonProperty[]>([]);

  const toggleCompare = (prop: any) => {
    setComparisonList((prev) => {
      const exists = prev.some((p) => p._id === prop._id);
      if (exists) {
        return prev.filter((p) => p._id !== prop._id);
      }
      if (prev.length >= 3) {
        alert('You can compare up to 3 properties at a time.');
        return prev;
      }
      return [...prev, prop];
    });
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (propertyType) params.append('propertyType', propertyType);
      if (city) params.append('city', city);

      const res = await fetch(`/api/properties?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProperties(data.items || []);
      }
    } catch {
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [search, propertyType, city]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14] text-white">
      <DynamicCmsTopbar />
      <DynamicCmsNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-2"
        >
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
            Portfolio Showcase
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Explore Signature Properties
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Filtered listings featuring interactive 3D PlayCanvas models, transparent specs, and virtual floor plans.
          </p>
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-2xl shadow-lg shadow-black/40"
        >
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, address, or neighborhood..."
              className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:border-blue-500/50 outline-none transition-colors"
            />
          </div>

          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="bg-white/[0.04] border border-white/10 rounded-xl text-xs text-slate-300 py-2 px-3 focus:border-blue-500/50 outline-none"
          >
            <option value="">All Property Types</option>
            <option value="Villa" className="bg-slate-900">Villas</option>
            <option value="Penthouse" className="bg-slate-900">Penthouses</option>
            <option value="Apartment" className="bg-slate-900">Apartments</option>
            <option value="Commercial" className="bg-slate-900">Commercial</option>
          </select>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-white/[0.04] border border-white/10 rounded-xl text-xs text-slate-300 py-2 px-3 focus:border-blue-500/50 outline-none"
          >
            <option value="">All Cities</option>
            <option value="Islamabad" className="bg-slate-900">Islamabad</option>
            <option value="Lahore" className="bg-slate-900">Lahore</option>
            <option value="Karachi" className="bg-slate-900">Karachi</option>
          </select>
        </motion.div>

        {/* Listings Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading listings...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white/[0.01] border border-white/5 rounded-2xl">
            <p className="text-sm text-slate-400">No properties found matching your criteria.</p>
            <button
              onClick={() => { setSearch(''); setPropertyType(''); setCity(''); }}
              className="text-xs text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {properties.map((prop) => (
              <motion.div
                key={prop._id}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { type: 'spring', damping: 15 } }}
                className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-xl hover:shadow-2xl hover:shadow-blue-950/30"
              >
                <div className="relative h-56 w-full overflow-hidden bg-slate-900">
                  <img
                    src={prop.gallery?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-400 border border-white/10 shadow-lg">
                    ${prop.price?.toLocaleString()}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center space-x-1 text-slate-400 text-xs mb-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{prop.location?.address}, {prop.location?.city}</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {prop.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-y border-white/5 text-xs text-slate-300">
                    <div className="flex items-center space-x-1">
                      <Bed className="w-4 h-4 text-slate-400" />
                      <span>{prop.specs?.bedrooms || 3} Beds</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Bath className="w-4 h-4 text-slate-400" />
                      <span>{prop.specs?.bathrooms || 2} Baths</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Maximize2 className="w-4 h-4 text-slate-400" />
                      <span>{prop.specs?.areaSqFt || 2500} sq ft</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => toggleCompare(prop)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 border ${
                        comparisonList.some((p) => p._id === prop._id)
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{comparisonList.some((p) => p._id === prop._id) ? 'Added' : 'Compare'}</span>
                    </button>

                    <Link
                      href={`/properties/${prop._id}`}
                      className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold text-center transition-all flex items-center justify-center space-x-2 group-hover:shadow-lg group-hover:shadow-blue-600/30"
                    >
                      <span>3D Tour</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Side-by-Side Comparison Drawer */}
      <PropertyComparisonDrawer
        properties={comparisonList}
        onRemove={(id) => setComparisonList((prev) => prev.filter((p) => p._id !== id))}
        onClear={() => setComparisonList([])}
      />

      <DynamicCmsFooter />
    </div>
  );
}

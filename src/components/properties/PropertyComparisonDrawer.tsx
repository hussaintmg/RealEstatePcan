'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, ArrowRight, Check, Minus, Bed, Bath, Maximize2, Compass } from 'lucide-react';
import Link from 'next/link';

export interface ComparisonProperty {
  _id: string;
  title: string;
  price: number;
  location: { city: string; address: string };
  specs: { bedrooms: number; bathrooms: number; areaSqFt: number; yearBuilt?: number };
  amenities?: string[];
  gallery?: string[];
}

interface PropertyComparisonDrawerProps {
  properties: ComparisonProperty[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const PropertyComparisonDrawer: React.FC<PropertyComparisonDrawerProps> = ({
  properties,
  onRemove,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (properties.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Comparison Indicator Bar */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-3 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-2xl shadow-blue-600/50 border border-white/20 text-xs font-bold transition-all"
        >
          <Layers className="w-4 h-4" />
          <span>Compare Properties ({properties.length})</span>
        </motion.button>
      </div>

      {/* Comparison Modal Backdrop & Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="w-full max-w-5xl bg-[#0e131f] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Side-by-Side Estate Comparison</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluate pricing, dimensions, and specifications across selected luxury residences.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClear}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="flex-1 overflow-x-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[700px]">
                  {properties.map((prop) => (
                    <div
                      key={prop._id}
                      className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">
                            Verified Estate
                          </span>
                          <button
                            onClick={() => onRemove(prop._id)}
                            className="text-slate-400 hover:text-rose-400"
                            title="Remove from comparison"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="relative h-36 rounded-xl overflow-hidden bg-slate-900">
                          <img
                            src={
                              prop.gallery?.[0] ||
                              'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
                            }
                            alt={prop.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white line-clamp-1">{prop.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">{prop.location.city}</p>
                          <div className="text-2xl font-black text-emerald-400 mt-2">
                            ${prop.price.toLocaleString()}
                          </div>
                        </div>

                        <div className="divide-y divide-white/5 text-xs text-slate-300 pt-2">
                          <div className="py-2 flex items-center justify-between">
                            <span className="text-slate-400">Bedrooms</span>
                            <span className="font-semibold text-white">{prop.specs.bedrooms} Suites</span>
                          </div>
                          <div className="py-2 flex items-center justify-between">
                            <span className="text-slate-400">Bathrooms</span>
                            <span className="font-semibold text-white">{prop.specs.bathrooms} Baths</span>
                          </div>
                          <div className="py-2 flex items-center justify-between">
                            <span className="text-slate-400">Living Area</span>
                            <span className="font-semibold text-white">{prop.specs.areaSqFt} sq ft</span>
                          </div>
                          <div className="py-2 flex items-center justify-between">
                            <span className="text-slate-400">3D Virtual Tour</span>
                            <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                              <Compass className="w-3.5 h-3.5" />
                              <span>Available</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/properties/${prop._id}`}
                        onClick={() => setIsOpen(false)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center space-x-1.5"
                      >
                        <span>View Walkthrough</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

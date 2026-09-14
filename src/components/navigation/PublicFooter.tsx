'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#070a0f] border-t border-white/10 pt-16 pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1 */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              AURA<span className="text-blue-500">HEIGHTS</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pioneering interactive 3D WebGL property discovery and verified luxury real estate transactions with zero ambiguity.
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Government Verified & Licensed Real Estate Brokerage</span>
          </div>
        </div>

        {/* Col 2 */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Quick Navigation</h4>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:text-white transition-colors">Home Experience</Link></li>
            <li><Link href="/properties" className="hover:text-white transition-colors">Exclusive Listings</Link></li>
            <li><Link href="/#virtual-tour" className="hover:text-white transition-colors">3D PlayCanvas Tours</Link></li>
            <li><Link href="/portal" className="hover:text-white transition-colors">Verified Customer Portal</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Property Types</h4>
          <ul className="space-y-2">
            <li><Link href="/properties?propertyType=Villa" className="hover:text-white transition-colors">Signature Villas</Link></li>
            <li><Link href="/properties?propertyType=Penthouse" className="hover:text-white transition-colors">Skyline Penthouses</Link></li>
            <li><Link href="/properties?propertyType=Apartment" className="hover:text-white transition-colors">Smart High-Rise Residences</Link></li>
            <li><Link href="/properties?propertyType=Commercial" className="hover:text-white transition-colors">Prime Commercial Suites</Link></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white">Direct Advisory</h4>
          <div className="space-y-2 text-slate-300">
            <div className="flex items-center space-x-2">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>+92 (51) 880-9911 / WhatsApp</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>concierge@auraheights.local</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Blue Area, Islamabad Capital Territory</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
        <span>&copy; 2026 Aura Heights Ltd. Powered by PlayCanvas 3D Engine & Next.js.</span>
        <span>Strict Privacy & Encrypted Document Retention.</span>
      </div>
    </footer>
  );
};

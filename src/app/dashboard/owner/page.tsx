'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Users, UserCheck, FileText, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export default function OwnerOverviewPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Executive Control Room</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">Live</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Agency Operations &amp; Performance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real estate pipeline, customer conversions, PlayCanvas 3D listings, and financial milestones.
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Listings</span>
            <Home className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white">24 Estates</div>
          <div className="text-[10px] text-emerald-400">100% 3D Walkthrough Equipped</div>
        </div>

        <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>VIP Leads Intake</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">68 Inquiries</div>
          <div className="text-[10px] text-blue-400">8 Ready for 1-Click Conversion</div>
        </div>

        <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Verified Customers</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">42 Clients</div>
          <div className="text-[10px] text-slate-400">Active in User Portal</div>
        </div>

        <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Payment Pipeline</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-white">$14.8M</div>
          <div className="text-[10px] text-purple-300">Across 36 Milestone Invoices</div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Link
          href="/dashboard/properties"
          className="group p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-blue-500/30 rounded-xl transition-all flex flex-col justify-between space-y-3"
        >
          <div className="space-y-1.5">
            <div className="p-2.5 bg-blue-500/10 rounded-lg w-fit text-blue-400">
              <Home className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
              Manage Properties &amp; 3D Models
            </h3>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              Upload PlayCanvas GLB models, scroll video frame scrubbers, and manage listing prices.
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-blue-400 pt-1 border-t border-white/5">
            <span>Open Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/dashboard/leads"
          className="group p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-500/30 rounded-xl transition-all flex flex-col justify-between space-y-3"
        >
          <div className="space-y-1.5">
            <div className="p-2.5 bg-amber-500/10 rounded-lg w-fit text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              1-Click Lead Conversion
            </h3>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              Convert prospects into customer accounts, automatically generating secure portal credentials.
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-amber-400 pt-1 border-t border-white/5">
            <span>Open Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/dashboard/owner/audit-feed"
          className="group p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-emerald-500/30 rounded-xl transition-all flex flex-col justify-between space-y-3"
        >
          <div className="space-y-1.5">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg w-fit text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              Real-Time Security Feed
            </h3>
            <p className="text-[11px] text-slate-400 line-clamp-2">
              Inspect live incoming API hits, latencies, authorization decisions, and error logs.
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-400 pt-1 border-t border-white/5">
            <span>Open Live Feed</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}

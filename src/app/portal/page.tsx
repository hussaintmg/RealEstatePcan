'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { PlayCanvasViewer } from '@/components/3d/PlayCanvasViewer';
import {
  Building2,
  Home,
  FileText,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  LogOut,
  Send,
  Loader2,
  Compass,
} from 'lucide-react';

export default function UserPortalPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'properties' | 'invoices' | 'chat'>('properties');

  // Customer Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'advisor' | 'client'; text: string; time: string }>>([
    {
      sender: 'advisor',
      text: `Welcome to your private client portal, ${user?.fullName || 'Valued Client'}. I am your dedicated Property Director. How can I assist you today?`,
      time: '10:00 AM',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSendMsg = () => {
    if (!inputMsg.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'client', text: inputMsg, time }]);
    setInputMsg('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'advisor',
          text: 'Thank you for your message. Your advisor has been notified via WhatsApp and will reply promptly.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white flex flex-col">
      {/* Top Portal Navbar */}
      <header className="h-16 border-b border-white/10 bg-[#070a0f] px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">
              AURA<span className="text-blue-500">HEIGHTS</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">
              Verified Client Portal
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-white">{user?.fullName || 'Verified Client'}</div>
            <div className="text-[11px] text-slate-400">{user?.email}</div>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 rounded-xl text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Portal Canvas */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Welcome Card */}
        <div className="p-6 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-blue-500/20 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified VIP Client Status</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              Welcome Back, {user?.fullName || 'Client'}
            </h1>
            <p className="text-xs text-slate-300">
              Review your reserved architectural estates, inspect interactive 3D PlayCanvas models, and track milestone invoices.
            </p>
          </div>

          {/* Tab Controls with Framer Motion active pill */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 self-start md:self-auto relative">
            {[
              { id: 'properties', label: 'My Estates', icon: Home },
              { id: 'invoices', label: 'Invoices', icon: FileText },
              { id: 'chat', label: 'Advisor Desk', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors z-10 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="portalTabPill"
                      className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30"
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panes with AnimatePresence */}
        <AnimatePresence mode="wait">
          {/* Tab 1: My Estates (with PlayCanvas 3D Tour) */}
          {activeTab === 'properties' && (
            <motion.div
              key="properties"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Your Reserved Property</h2>
                  <p className="text-xs text-slate-400">
                    The Skyview Horizon Villa • Margalla Hillside Avenue, Sector E-7, Islamabad
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                  Contract Confirmed
                </span>
              </div>

              {/* Embedded 3D PlayCanvas Interactive Walkthrough */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-blue-400 font-semibold">
                  <Compass className="w-4 h-4" />
                  <span>Explore your living space in 3D WebGL:</span>
                </div>
                <PlayCanvasViewer title="The Skyview Horizon Villa • Client View" />
              </div>
            </motion.div>
          )}

          {/* Tab 2: Invoices & Milestones */}
          {activeTab === 'invoices' && (
            <motion.div
              key="invoices"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-lg font-bold text-white">Transaction Milestones &amp; Billing</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-3">Invoice #</th>
                      <th className="py-3">Milestone</th>
                      <th className="py-3">Due Date</th>
                      <th className="py-3">Amount</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    <tr>
                      <td className="py-3 font-mono text-blue-400">INV-2026-001</td>
                      <td className="py-3">Down Payment &amp; Escrow Deposit</td>
                      <td className="py-3">Paid on Sep 01, 2026</td>
                      <td className="py-3 font-bold text-white">$250,000</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          PAID
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 font-mono text-blue-400">INV-2026-002</td>
                      <td className="py-3">Structural Foundation Milestone</td>
                      <td className="py-3">November 15, 2026</td>
                      <td className="py-3 font-bold text-white">$400,000</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                          UPCOMING
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Direct Advisor Chat */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="bg-[#101522] border border-white/10 rounded-3xl h-[520px] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
                    AD
                  </div>
                  <div>
                    <div className="font-bold text-white">Aura Executive Advisory Desk</div>
                    <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Active on WhatsApp &amp; Portal</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-3.5 rounded-2xl ${
                        msg.sender === 'client'
                          ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                          : 'bg-white/[0.05] text-slate-200 rounded-bl-none border border-white/5'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="text-[10px] opacity-60 mt-1 block text-right">{msg.time}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-3 border-t border-white/10 bg-black/20 flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMsg()}
                  placeholder="Message your personal property director..."
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMsg}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-md shadow-blue-600/30"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

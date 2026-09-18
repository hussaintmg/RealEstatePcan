'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Home,
  FileText,
  CreditCard,
  Calendar,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  LogOut,
  Send,
  Loader2,
  Clock,
  AlertCircle,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { formatMoney } from '@/lib/money';

interface PortalData {
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    status: string;
    portalStatus?: string;
    linkedProperties?: any[];
  };
  deals: any[];
  invoices: any[];
  payments: any[];
  milestones: any[];
  appointments: any[];
  timeline: any[];
}

export default function UserPortalPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'invoices' | 'payments' | 'appointments' | 'chat'>('overview');

  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureDisabled, setFeatureDisabled] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'advisor' | 'client'; text: string; time: string }>>([
    {
      sender: 'advisor',
      text: `Welcome to your private client portal. I am your dedicated Property Director. How can I assist you today?`,
      time: '10:00 AM',
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  useEffect(() => {
    async function fetchPortalData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/portal/me');
        if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          if (errData.error?.code === 'FEATURE_DISABLED') {
            setFeatureDisabled(true);
            setLoading(false);
            return;
          }
        }
        if (!res.ok) {
          throw new Error('Failed to load your client portal profile.');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Error connecting to client portal');
      } finally {
        setLoading(false);
      }
    }

    fetchPortalData();
  }, []);

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
          text: 'Thank you for your message. Your property director has received your request and will follow up shortly.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1000);
  };

  if (featureDisabled) {
    return (
      <div className="min-h-screen bg-[#070a0f] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Customer Portal Unavailable</h2>
        <p className="text-sm text-slate-400 max-w-md mt-2">
          The verified customer portal is currently deactivated in platform configuration settings. Please contact your sales director for assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex flex-col">
      {/* Top Portal Navbar */}
      <header className="h-16 border-b border-white/10 bg-[#0a0d14] px-6 flex items-center justify-between sticky top-0 z-30">
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
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{data?.customer?.fullName || user?.fullName || 'Valued Client'}</span>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Portal Navigation Tabs */}
      <div className="border-b border-white/10 bg-[#0a0d14]/80 px-6 py-2 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex space-x-2">
          {[
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'deals', label: 'Deals & Milestones', icon: Briefcase, count: data?.deals?.length },
            { id: 'invoices', label: 'Invoices & Demands', icon: FileText, count: data?.invoices?.length },
            { id: 'payments', label: 'Payments', icon: CreditCard, count: data?.payments?.length },
            { id: 'appointments', label: 'Viewings & Schedule', icon: Calendar, count: data?.appointments?.length },
            { id: 'chat', label: 'Advisor Desk', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading your client portfolio...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Client Portfolio Access Error</h3>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Client Welcome Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900/40 to-slate-900/20 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 inline-block mb-2">
                      Verified Client
                    </span>
                    <h2 className="text-xl font-bold text-white">Welcome back, {data?.customer?.fullName}</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Registered account: {data?.customer?.email} • {data?.customer?.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-center">
                      <div className="text-slate-400 text-[10px]">Active Deals</div>
                      <div className="text-lg font-bold text-white mt-0.5">{data?.deals?.length || 0}</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-center">
                      <div className="text-slate-400 text-[10px]">Invoices Due</div>
                      <div className="text-lg font-bold text-amber-400 mt-0.5">
                        {data?.invoices?.filter((i) => i.status === 'pending').length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Properties Showcase */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-400" />
                    Your Portfolio Units
                  </h3>

                  {data?.customer?.linkedProperties && data.customer.linkedProperties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.customer.linkedProperties.map((prop: any) => (
                        <div
                          key={prop._id}
                          className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-blue-500/30 transition-all space-y-3"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {prop.status}
                            </span>
                            <span className="text-xs font-mono font-bold text-white">
                              {formatMoney(prop.price, prop.currency)}
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-white">{prop.title}</h4>
                          <p className="text-xs text-slate-400">{prop.location?.address || prop.location?.city}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-xs text-slate-400">
                      No units currently linked to your profile.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Tab 2: Deals & Milestones */}
            {activeTab === 'deals' && (
              <motion.div
                key="deals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-semibold text-white">Active Purchase Contracts</h3>

                {data?.deals && data.deals.length > 0 ? (
                  data.deals.map((deal: any) => (
                    <div
                      key={deal._id}
                      className="p-6 rounded-2xl bg-slate-900/50 border border-white/10 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                            Stage: {deal.stage?.replace('_', ' ')}
                          </span>
                          <h4 className="text-base font-bold text-white mt-1">{deal.title}</h4>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-xs text-slate-400">Agreed Value</div>
                          <div className="text-lg font-bold text-emerald-400">
                            {formatMoney(deal.dealValue, deal.currency)}
                          </div>
                        </div>
                      </div>

                      {/* Milestones for this deal */}
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <div className="text-xs font-semibold text-slate-300">Payment Schedule</div>
                        {deal.milestones?.map((m: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs font-mono"
                          >
                            <div>
                              <span className="text-slate-400 mr-2">#{idx + 1}</span>
                              <span className="text-white font-sans">{m.title}</span>
                              <span className="text-slate-500 ml-2">({m.percentage}%)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-emerald-400">{formatMoney(m.amount, deal.currency)}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  m.status === 'paid'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : m.status === 'invoiced'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {m.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-xs text-slate-400">
                    No active property purchase deals registered for this account.
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 3: Invoices */}
            {activeTab === 'invoices' && (
              <motion.div
                key="invoices"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-semibold text-white">Issued Billing Demands</h3>

                {data?.invoices && data.invoices.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-white/10">
                        <tr>
                          <th className="px-5 py-3">Invoice #</th>
                          <th className="px-5 py-3">Milestone</th>
                          <th className="px-5 py-3 text-right">Amount</th>
                          <th className="px-5 py-3 text-right">Remaining Balance</th>
                          <th className="px-5 py-3">Due Date</th>
                          <th className="px-5 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {data.invoices.map((inv: any) => (
                          <tr key={inv._id} className="hover:bg-white/[0.02]">
                            <td className="px-5 py-3.5 font-bold text-blue-400">{inv.invoiceNumber}</td>
                            <td className="px-5 py-3.5 font-sans text-white">{inv.milestoneTitle || 'Unit Payment'}</td>
                            <td className="px-5 py-3.5 text-right font-sans text-slate-300">
                              {formatMoney(inv.amount, inv.currency)}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-emerald-400">
                              {formatMoney(inv.balance, inv.currency)}
                            </td>
                            <td className="px-5 py-3.5 text-slate-400">
                              {new Date(inv.dueDate).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                                  inv.status === 'paid'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-xs text-slate-400">
                    No invoices available yet.
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 4: Payments */}
            {activeTab === 'payments' && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-semibold text-white">Payment Receipts &amp; Ledger</h3>

                {data?.payments && data.payments.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-white/10">
                        <tr>
                          <th className="px-5 py-3">Transaction Ref</th>
                          <th className="px-5 py-3">Invoice</th>
                          <th className="px-5 py-3">Method</th>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3 text-right">Amount Credited</th>
                          <th className="px-5 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {data.payments.map((p: any) => (
                          <tr key={p._id} className="hover:bg-white/[0.02]">
                            <td className="px-5 py-3.5 text-emerald-400 font-bold">{p.transactionReference}</td>
                            <td className="px-5 py-3.5 text-white">{p.invoiceId?.invoiceNumber || 'N/A'}</td>
                            <td className="px-5 py-3.5 font-sans capitalize text-slate-300">
                              {p.paymentMethod?.replace('_', ' ')}
                            </td>
                            <td className="px-5 py-3.5 text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</td>
                            <td className="px-5 py-3.5 text-right font-bold text-white text-sm">
                              {formatMoney(p.amount, p.currency)}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-emerald-500/20 text-emerald-300">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-xs text-slate-400">
                    No payment transactions recorded for this account.
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 5: Appointments */}
            {activeTab === 'appointments' && (
              <motion.div
                key="appointments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h3 className="text-sm font-semibold text-white">Scheduled Viewings &amp; Consultations</h3>

                {data?.appointments && data.appointments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.appointments.map((appt: any) => (
                      <div
                        key={appt._id}
                        className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {appt.status}
                          </span>
                          <span className="text-xs text-emerald-400 font-mono">
                            {new Date(appt.date).toLocaleDateString()} • {appt.timeSlot}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{appt.title}</h4>
                        {appt.propertyId && (
                          <p className="text-xs text-slate-400">{appt.propertyId.title}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 text-center text-xs text-slate-400">
                    No upcoming viewings scheduled.
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 6: Advisor Chat */}
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0f1420] border border-white/10 rounded-3xl h-[500px] flex flex-col overflow-hidden shadow-2xl"
              >
                <div className="p-4 bg-white/[0.03] border-b border-white/10 flex items-center space-x-3 text-xs">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
                    AD
                  </div>
                  <div>
                    <div className="font-bold text-white">Dedicated Client Director</div>
                    <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Direct Advisory Desk Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-3 text-xs">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3.5 rounded-2xl ${
                          msg.sender === 'client'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span className="text-[10px] opacity-60 mt-1 block text-right">{msg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-white/10 bg-black/20 flex items-center space-x-2">
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMsg()}
                    placeholder="Message your property advisor..."
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={handleSendMsg}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

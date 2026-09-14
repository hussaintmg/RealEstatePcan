'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Radio, Activity, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { IAuditEvent } from '@/lib/auditLogger';

export default function AuditFeedPage() {
  const [events, setEvents] = useState<IAuditEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/owner/audit-stream');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.addEventListener('history', (e: MessageEvent) => {
      try {
        const historyData = JSON.parse(e.data);
        setEvents(historyData);
      } catch {
        // parsing error
      }
    });

    eventSource.addEventListener('audit', (e: MessageEvent) => {
      try {
        const newEvent: IAuditEvent = JSON.parse(e.data);
        setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
      } catch {
        // parsing error
      }
    });

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {code} OK
        </span>
      );
    }
    if (code === 403) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {code} FORBIDDEN
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
        {code} ERROR
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return <span className="text-blue-400 font-mono font-bold">GET</span>;
      case 'POST':
        return <span className="text-emerald-400 font-mono font-bold">POST</span>;
      case 'PUT':
        return <span className="text-amber-400 font-mono font-bold">PUT</span>;
      case 'DELETE':
        return <span className="text-rose-400 font-mono font-bold">DELETE</span>;
      default:
        return <span className="text-slate-400 font-mono font-bold">{method}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Owner Real-Time Telemetry</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Live System &amp; API Security Audit Stream
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming real-time API invocations, response latencies, user scopes, and security events.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl shadow-sm">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-xs font-medium text-slate-300">
            {isConnected ? 'Stream Active & Connected' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2.5">
        {events.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white/[0.01] border border-white/5 rounded-2xl">
            Waiting for live telemetry signals... Trigger an API action to see events stream in real-time.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((ev) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -24, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                className="p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-16">{getMethodBadge(ev.method)}</div>
                  <code className="text-slate-200 font-mono text-[11px] bg-black/40 px-2 py-1 rounded border border-white/5">
                    {ev.path}
                  </code>
                  {getStatusBadge(ev.statusCode)}
                </div>

                <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
                  <div className="flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{ev.userEmail || 'Public Visitor'}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{ev.durationMs}ms</span>
                  </div>

                  <div className="text-slate-500 font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

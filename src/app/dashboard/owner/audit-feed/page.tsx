'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Clock,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  AlertTriangle,
  CheckCircle,
  FileCode,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { IAuditEvent } from '@/lib/auditLogger';

export default function AuditFeedPage() {
  const [activeTab, setActiveTab] = useState<'historical' | 'live'>('historical');

  // Query & Pagination State
  const [logs, setLogs] = useState<IAuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Live SSE Stream State
  const [liveEvents, setLiveEvents] = useState<IAuditEvent[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<IAuditEvent | null>(null);

  const fetchAuditLogs = async (pageNum = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', '15');
      if (search.trim()) params.set('search', search.trim());
      if (actionFilter) params.set('action', actionFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
  }, [search, actionFilter, statusFilter]);

  // SSE Live listener setup
  useEffect(() => {
    const eventSource = new EventSource('/api/owner/audit-stream');

    eventSource.onopen = () => {
      setIsLiveConnected(true);
    };

    eventSource.addEventListener('audit', (e: MessageEvent) => {
      try {
        const newEvent: IAuditEvent = JSON.parse(e.data);
        setLiveEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
      } catch {
        // ignore
      }
    });

    eventSource.onerror = () => {
      setIsLiveConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {status} OK
        </span>
      );
    }
    if (status === 403) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          403 FORBIDDEN
        </span>
      );
    }
    if (status === 401) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          401 UNAUTH
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        {status} ERROR
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return <span className="text-blue-400 font-mono text-xs font-bold">GET</span>;
      case 'POST':
        return <span className="text-emerald-400 font-mono text-xs font-bold">POST</span>;
      case 'PUT':
        return <span className="text-amber-400 font-mono text-xs font-bold">PUT</span>;
      case 'DELETE':
        return <span className="text-rose-400 font-mono text-xs font-bold">DELETE</span>;
      default:
        return <span className="text-slate-400 font-mono text-xs font-bold">{method}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-4">
      <PageHeader
        title="Security & Mutation Audit Logs"
        description="Tamper-evident logs of role modifications, feature flag toggles, capability scoping, and API invocations."
        icon={ShieldAlert}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Security Audit' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('historical')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'historical'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Database Archive ({total})
              </button>
              <button
                onClick={() => setActiveTab('live')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'live'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                Live Stream
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              icon={RotateCw}
              onClick={() => fetchAuditLogs(page)}
              loading={loading}
              title="Refresh"
            />
          </div>
        }
      />

      {activeTab === 'historical' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
            <div className="w-full sm:w-80">
              <SearchInput
                value={search}
                onValueChange={setSearch}
                placeholder="Search action, actor, or request ID..."
                size="md"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/40"
              >
                <option value="">All Actions</option>
                <option value="role.created">role.created</option>
                <option value="role.updated">role.updated</option>
                <option value="role.cloned">role.cloned</option>
                <option value="role.archived">role.archived</option>
                <option value="feature_flags.updated">feature_flags.updated</option>
                <option value="system_config.updated">system_config.updated</option>
                <option value="customer.updated">customer.updated</option>
                <option value="lead.updated">lead.updated</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/40"
              >
                <option value="">All Statuses</option>
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="401">401 Unauthorized</option>
                <option value="403">403 Forbidden</option>
                <option value="404">404 Not Found</option>
                <option value="500">500 Error</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-white/5">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Action &amp; Resource</th>
                    <th className="px-5 py-3.5">Actor</th>
                    <th className="px-5 py-3.5">Route / Method</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Diff</th>
                    <th className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500 font-mono">
                        Loading audit logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                        No audit events match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setSelectedEvent(log)}
                      >
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-white tracking-tight">{log.action}</div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {log.resourceType} {log.resourceId ? `#${log.resourceId.slice(-6)}` : ''}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-slate-200">{log.actorEmail || 'System'}</div>
                          <span className="inline-block px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider bg-slate-800 text-slate-400">
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px]">
                          <div className="flex items-center gap-2">
                            {getMethodBadge(log.method)}
                            <span className="text-slate-400">{log.route || log.path}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">{getStatusBadge(log.status)}</td>
                        <td className="px-5 py-3.5">
                          {log.changes?.before || log.changes?.after ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              Has Diff
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(log);
                            }}
                            className="text-xs"
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/5 bg-slate-950/40 text-xs text-slate-400">
              <div>
                Showing page <span className="font-semibold text-white">{page}</span> of{' '}
                <span className="font-semibold text-white">{totalPages}</span> ({total} records)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => fetchAuditLogs(page - 1)}
                  icon={ChevronLeft}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => fetchAuditLogs(page + 1)}
                  icon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live Telemetry Stream */
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  isLiveConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
                }`}
              />
              <div>
                <h3 className="text-sm font-bold text-white">Live EventSource Telemetry Socket</h3>
                <p className="text-xs text-slate-400">
                  Streaming incoming API actions, authorization events, and latency benchmarks.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {isLiveConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden divide-y divide-white/5">
            {liveEvents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-mono text-xs">
                Awaiting incoming events over live stream... Perform any dashboard action to inspect telemetry.
              </div>
            ) : (
              liveEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="p-4 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-xs text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        {getMethodBadge(evt.method)}
                        <span>{evt.action || evt.route || evt.path}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {evt.actorEmail || 'Anonymous'} ({evt.actorRole || 'staff'})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-slate-400">{evt.durationMs}ms</span>
                    {getStatusBadge(evt.status || evt.statusCode || 200)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Event Detail Modal with Change Diff Viewer */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Audit Event Inspection"
        description={`Correlation Request ID: ${selectedEvent?.requestId || 'N/A'}`}
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-6 text-xs text-slate-300">
            {/* Metadata Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Action</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedEvent.action}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Status Code</span>
                <div className="mt-1">{getStatusBadge(selectedEvent.status || selectedEvent.statusCode || 200)}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Latency</span>
                <p className="font-mono text-white text-sm mt-0.5">{selectedEvent.durationMs}ms</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Actor Email</span>
                <p className="font-semibold text-white mt-0.5 truncate">{selectedEvent.actorEmail || 'N/A'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Actor Role</span>
                <p className="font-semibold text-emerald-400 mt-0.5 uppercase">{selectedEvent.actorRole}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Resource</span>
                <p className="font-mono text-white mt-0.5 truncate">{selectedEvent.resourceType}</p>
              </div>
            </div>

            {/* Before / After Change Diff Viewer */}
            {(selectedEvent.changes?.before || selectedEvent.changes?.after) && (
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>Mutation State Diff (Secrets Redacted)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[11px] font-semibold text-rose-400 mb-1">State Before:</span>
                    <pre className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/20 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto custom-scrollbar">
                      {selectedEvent.changes?.before
                        ? JSON.stringify(selectedEvent.changes.before, null, 2)
                        : '(none / newly created)'}
                    </pre>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold text-emerald-400 mb-1">State After:</span>
                    <pre className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto custom-scrollbar">
                      {selectedEvent.changes?.after
                        ? JSON.stringify(selectedEvent.changes.after, null, 2)
                        : '(deleted)'}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Operational Metadata */}
            {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-white/10">
                <span className="text-[11px] font-semibold text-slate-400">Context Metadata:</span>
                <pre className="p-3 rounded-xl bg-slate-950/60 border border-white/5 font-mono text-[11px] text-slate-300">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 text-[10px] font-mono text-slate-500 flex justify-between">
              <span>Timestamp: {new Date(selectedEvent.timestamp).toISOString()}</span>
              <span>ID: {selectedEvent.id}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

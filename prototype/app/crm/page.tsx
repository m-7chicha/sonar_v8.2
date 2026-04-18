"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getCRMState, getCRMAlerts, getEnrichedClients,
  Client, Deal
} from '@/lib/mathEngine';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar
} from 'recharts';
import { Activity, AlertTriangle, ArrowUpRight, BarChart3, CheckCircle, CheckCircle2, ChevronRight, ClipboardCheck, Clock, FileText, Mail, MapPin, MessageCircle, Package, Phone, Shield, Star, Target, TrendingUp, User, Users, XCircle, Zap } from 'lucide-react';
import Link from 'next/link';

type ViewType = 'clients' | 'pipeline' | 'alerts' | 'dashboard';

const STAGE_ORDER = ['lead', 'contacted', 'negotiation', 'won', 'lost'] as const;

export default function CRM() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ViewType>('clients');
  const [crmData, setCrmData] = useState(() => getCRMState());
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'deals' | 'sav' | 'interactions'>('overview');

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
    // Refresh CRM data every 10s (tied to simulation cadence)
    const interval = setInterval(() => {
      setCrmData(getCRMState());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const { clients, alerts, pipeline, totalRevenue, activeClients, openTickets } = crmData;

  // Revenue monthly trend (simulated from deals)
  const allWonDeals = clients.flatMap(c => c.deals.filter(d => d.stage === 'won'));
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const label = new Date(Date.now() - (5 - i) * 30 * 86400000).toLocaleDateString('fr-FR', { month: 'short' });
    const revenue = allWonDeals
      .filter(d => d.closed_at && Math.abs(d.closed_at - (Date.now() - (5 - i) * 30 * 86400000)) < 35 * 86400000)
      .reduce((s, d) => s + d.amount, 0);
    return { label, revenue: revenue || Math.floor(Math.random() * 30000 + 20000) };
  });

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'VIP': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'Standard': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'At-Risk': return 'bg-rose-100 text-rose-700 border border-rose-200';
      default: return 'bg-slate-100 dark:bg-white/10 text-slate-400 border border-slate-200 dark:border-white/10';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Active' };
      case 'negotiation': return { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Negotiation' };
      case 'prospect': return { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', label: 'Prospect' };
      default: return { dot: 'bg-slate-400', text: 'text-slate-400', bg: 'bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white', label: 'Inactive' };
    }
  };

  const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'clients', label: 'Client Portfolio', icon: <Users size={14} /> },
    { id: 'pipeline', label: 'Sales Pipeline', icon: <Target size={14} /> },
    { id: 'alerts', label: `Smart Alerts ${alerts.length > 0 ? `(${alerts.length})` : ''}`, icon: <AlertTriangle size={14} /> },
    { id: 'dashboard', label: 'BI Dashboard', icon: <BarChart3 size={14} /> },
  ];

  const stageConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    lead:        { label: 'Lead',        color: 'text-slate-600 dark:text-white/70',   bg: 'bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white',    border: 'border-slate-200 dark:border-white/10' },
    contacted:   { label: 'Contacted',   color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200' },
    negotiation: { label: 'Negotiation', color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200' },
    won:         { label: 'Won',         color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
    lost:        { label: 'Lost',        color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-500/10',     border: 'border-rose-200 dark:border-rose-500/20' },
  };

  const interactionIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={12} />;
      case 'email': return <Mail size={12} />;
      case 'meeting': return <Users size={12} />;
      case 'whatsapp': return <MessageCircle size={12} />;
      default: return <MessageCircle size={12} />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-slate-900 dark:text-white dark:text-slate-100">

      {/* ─── Sidebar ─────────────────────────────────────────────── */}
      

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto flex flex-col">

        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white/90 dark:bg-[var(--glass-dark)] backdrop-blur-xl border-b border-slate-200 dark:border-white/10 dark:border-white/10 px-8 lg:px-12 py-5">
          <div className="flex items-end justify-between mb-6">
            <div>
              <nav className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase mb-3">
                <span className="text-blue-600">SONAR v8.2</span><span className="text-slate-300">/</span>
                <span className="text-slate-500 dark:text-slate-400">Context-Aware CRM</span>
              </nav>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Client Intelligence</h2>
            </div>
            <div className="flex items-center gap-4">
              {alerts.filter(a => a.type === 'critical').length > 0 && (
                <motion.div animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                  <AlertTriangle size={13} />
                  {alerts.filter(a => a.type === 'critical').length} Critical
                </motion.div>
              )}
              <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} className="text-amber-400" /> Auto-Scoring
              </div>
            </div>
          </div>

          {/* Top KPIs */}
          <div className="flex items-center gap-4">
            {[
              { label: 'Total Revenue', value: `€${totalRevenue.toLocaleString('fr-FR')}`, icon: <TrendingUp size={14} />, color: 'text-blue-600' },
              { label: 'Active Clients', value: activeClients, icon: <Users size={14} />, color: 'text-emerald-600' },
              { label: 'Open Pipeline', value: `€${clients.flatMap(c => c.deals.filter(d => !['won','lost'].includes(d.stage))).reduce((s,d) => s+d.amount, 0).toLocaleString('fr-FR')}`, icon: <Target size={14} />, color: 'text-amber-600' },
              { label: 'Open SAV Tickets', value: openTickets, icon: <Shield size={14} />, color: openTickets > 0 ? 'text-rose-600' : 'text-slate-600 dark:text-white/70' },
              { label: 'Conversion Rate', value: `${Math.round((allWonDeals.length / Math.max(1, pipeline.length)) * 100)}%`, icon: <ArrowUpRight size={14} />, color: 'text-blue-600' },
            ].map(kpi => (
              <div key={kpi.label} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-white/10 dark:border-white/10">
                <span className={kpi.color}>{kpi.icon}</span>
                <div>
                  <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                  <p className={`text-base font-black mono ${kpi.color}`}>{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 px-8 lg:px-12 py-8">

          {/* View Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 p-1.5 rounded-2xl w-fit mb-10">
            {views.map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  view === v.id ? 'bg-white dark:bg-white/[0.02] text-slate-900 dark:text-white shadow-md' : 'text-slate-400 hover:text-slate-700 dark:text-white/80'
                }`}>
                {v.icon}{v.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── CLIENT PORTFOLIO ─────────────────────────────────── */}
            {view === 'clients' && !selectedClient && (
              <motion.div key="clients" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {clients.sort((a, b) => (b.loyalty_score || 0) - (a.loyalty_score || 0)).map(client => {
                  const status = getStatusStyle(client.status);
                  const revenue = client.deals.filter(d => d.stage === 'won').reduce((s, d) => s + d.amount, 0);
                  const daysSince = Math.floor((Date.now() - client.last_interaction) / 86400000);

                  return (
                    <motion.div key={client.id} layout whileHover={{ y: -2 }}
                      onClick={() => setSelectedClient(client)}
                      className="glass-card p-6 cursor-pointer hover:shadow-lg transition-all border border-slate-200 dark:border-white/10 hover:border-blue-200 group">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shrink-0">
                            <span className="text-white font-black text-sm">{client.name.slice(0,2).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-black text-slate-900 dark:text-white">{client.name}</h3>
                              {client.category === 'VIP' && <Star size={12} className="text-amber-500 fill-amber-500" />}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{client.sector} · {client.city}, {client.country}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${getCategoryBadge(client.category)}`}>
                            {client.category}
                          </span>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${status.bg}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${status.text}`}>{status.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Loyalty Score Bar */}
                      <div className="mb-5">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Loyalty Score</span>
                          <span className="text-[10px] font-black mono text-slate-700 dark:text-white/80">{client.loyalty_score}/100</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${(client.loyalty_score || 0) >= 75 ? 'bg-amber-500' : (client.loyalty_score || 0) >= 45 ? 'bg-blue-500' : 'bg-rose-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${client.loyalty_score}%` }}
                            transition={{ duration: 1, delay: 0.1 }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Revenue</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white mono">€{(revenue/1000).toFixed(0)}k</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Orders</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white mono">{client.orders.length}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Next Order</p>
                          <p className={`text-sm font-black mono ${(client.order_probability || 0) > 0.6 ? 'text-emerald-600' : 'text-slate-700 dark:text-white/80'}`}>
                            {Math.round((client.order_probability || 0) * 100)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Last Contact</p>
                          <p className={`text-sm font-black mono ${daysSince > 21 ? 'text-rose-600' : 'text-slate-700 dark:text-white/80'}`}>{daysSince}d ago</p>
                        </div>
                      </div>

                      {client.tickets.some(t => t.status !== 'closed') && (
                        <div className="mt-4 flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl">
                          <AlertTriangle size={12} className="text-rose-500" />
                          <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest">
                            {client.tickets.filter(t => t.status !== 'closed').length} open ticket(s)
                          </span>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <span>Rep: {client.sales_rep}</span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── CLIENT 360° DETAIL VIEW ──────────────────────────── */}
            {view === 'clients' && selectedClient && (
              <motion.div key="client-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button onClick={() => setSelectedClient(null)}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors mb-8">
                  ← Back to Portfolio
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Profile Card */}
                  <div className="space-y-5">
                    <div className="glass-card p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
                          <span className="text-white font-black text-xl">{selectedClient.name.slice(0,2).toUpperCase()}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedClient.name}</h3>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{selectedClient.sector}</p>
                          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getCategoryBadge(selectedClient.category)}`}>
                            {selectedClient.category}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3 text-[11px]">
                        <div className="flex items-center gap-3 text-slate-600 dark:text-white/70">
                          <MapPin size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
                          <span>{selectedClient.city}, {selectedClient.country}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-white/70">
                          <Phone size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
                          <span className="mono">{selectedClient.phone_primary}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-white/70">
                          <Mail size={13} className="text-slate-500 dark:text-slate-400 shrink-0" />
                          <span>{selectedClient.email}</span>
                        </div>
                      </div>
                      <div className="mt-5 p-3 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white rounded-xl">
                        <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Commercial Conditions</p>
                        <p className="text-[11px] text-slate-600 dark:text-white/70 font-bold">{selectedClient.commercial_conditions}</p>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-[9px]">
                        <div>
                          <p className="font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">First Contact</p>
                          <p className="font-bold text-slate-700 dark:text-white/80">{new Date(selectedClient.first_contact).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                          <p className="font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Sales Rep</p>
                          <p className="font-bold text-slate-700 dark:text-white/80">{selectedClient.sales_rep}</p>
                        </div>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="glass-card p-6 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Intelligence Scores</h4>
                      {[
                        { label: 'Loyalty Score', value: selectedClient.loyalty_score || 0, max: 100, color: 'bg-amber-500' },
                        { label: 'Order Probability', value: (selectedClient.order_probability || 0) * 100, max: 100, color: 'bg-blue-500' },
                      ].map(s => (
                        <div key={s.label}>
                          <div className="flex justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</span>
                            <span className="text-[11px] font-black mono text-slate-700 dark:text-white/80">{s.value.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div className={`h-full rounded-full ${s.color}`}
                              animate={{ width: `${s.value}%` }} transition={{ duration: 1 }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-card p-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['Create Quote', 'Log Call', 'Send Email', 'New SAV Ticket'].map(action => (
                          <button key={action} className="px-3 py-2.5 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-white/70 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Detail Tabs */}
                  <div className="lg:col-span-2 space-y-5">
                    <div className="flex gap-1 bg-slate-100 dark:bg-white/10 p-1 rounded-xl w-fit">
                      {(['overview', 'deals', 'sav', 'interactions'] as const).map(t => (
                        <button key={t} onClick={() => setSelectedTab(t)}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedTab === t ? 'bg-white dark:bg-white/[0.02] shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-700 dark:text-white/80'}`}>
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Overview */}
                    {selectedTab === 'overview' && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { label: 'Total Revenue', value: `€${selectedClient.deals.filter(d=>d.stage==='won').reduce((s,d)=>s+d.amount,0).toLocaleString('fr-FR')}` },
                            { label: 'Total Orders', value: selectedClient.orders.length },
                            { label: 'Avg Basket', value: selectedClient.orders.length > 0 ? `€${Math.round(selectedClient.deals.filter(d=>d.stage==='won').reduce((s,d)=>s+d.amount,0) / Math.max(1, selectedClient.orders.length)).toLocaleString('fr-FR')}` : '—' },
                          ].map(m => (
                            <div key={m.label} className="glass-card p-5 text-center">
                              <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{m.label}</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white mono">{m.value}</p>
                            </div>
                          ))}
                        </div>
                        {selectedClient.orders.length > 0 && (
                          <div className="glass-card p-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5">Order History</h4>
                            <div className="space-y-3">
                              {selectedClient.orders.map(o => (
                                <div key={o.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white rounded-xl">
                                  <FileText size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-xs font-black text-slate-900 dark:text-white">{o.product}</p>
                                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                                  </div>
                                  <p className="text-sm font-black text-slate-900 dark:text-white mono">€{o.amount.toLocaleString('fr-FR')}</p>
                                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : o.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {o.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Deals */}
                    {selectedTab === 'deals' && (
                      <div className="glass-card p-6 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Deal History</h4>
                        {selectedClient.deals.map(deal => {
                          const sc = stageConfig[deal.stage];
                          return (
                            <div key={deal.id} className={`p-4 rounded-xl border ${sc.border} ${sc.bg}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className={`text-[9px] font-black uppercase tracking-widest ${sc.color}`}>{sc.label}</span>
                                  <p className="text-sm font-black text-slate-900 dark:text-white mt-1">€{deal.amount.toLocaleString('fr-FR')}</p>
                                </div>
                                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">{new Date(deal.created_at).toLocaleDateString('fr-FR')}</p>
                              </div>
                              {deal.stage !== 'won' && deal.stage !== 'lost' && (
                                <div className="mt-3">
                                  <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 mb-1.5">Pipeline Progress</div>
                                  <div className="flex gap-1">
                                    {STAGE_ORDER.slice(0, 3).map((s, i) => (
                                      <div key={s} className={`h-1 flex-1 rounded-full ${i <= STAGE_ORDER.indexOf(deal.stage as typeof STAGE_ORDER[number]) ? 'bg-amber-500' : 'bg-slate-200'}`} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* SAV */}
                    {selectedTab === 'sav' && (
                      <div className="glass-card p-6 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">After-Sales Tickets</h4>
                        {selectedClient.tickets.length === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                            <p className="text-sm font-black text-slate-500 dark:text-slate-400">No open SAV tickets</p>
                          </div>
                        ) : selectedClient.tickets.map(t => (
                          <div key={t.id} className={`p-4 rounded-xl border ${t.priority === 'critical' ? 'bg-rose-50 border-rose-200' : t.priority === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white border-slate-200 dark:border-white/10'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${t.priority === 'critical' ? 'bg-rose-100 text-rose-700' : t.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70'}`}>
                                {t.priority}
                              </span>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${t.status === 'open' ? 'text-rose-600' : 'text-blue-600'}`}>{t.status}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-white/80">{t.description}</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-2">Opened {new Date(t.opened_at).toLocaleDateString('fr-FR')}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interactions */}
                    {selectedTab === 'interactions' && (
                      <div className="glass-card p-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-5">Interaction Log</h4>
                        <div className="space-y-3 relative">
                          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100 dark:bg-white/10" />
                          {selectedClient.interactions.map(i => (
                            <div key={i.id} className="flex gap-4 relative">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 ${
                                i.type === 'call' ? 'bg-emerald-100 text-emerald-600' :
                                i.type === 'email' ? 'bg-blue-100 text-blue-600' :
                                i.type === 'meeting' ? 'bg-amber-100 text-amber-600' :
                                'bg-purple-100 text-purple-600'
                              }`}>
                                {interactionIcon(i.type)}
                              </div>
                              <div className="flex-1 pb-5">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{i.type}</span>
                                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">{new Date(i.created_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-white/80 font-bold">{i.notes}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PIPELINE KANBAN ──────────────────────────────────── */}
            {view === 'pipeline' && (
              <motion.div key="pipeline" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-5 gap-4 pb-4">
                {(['lead', 'contacted', 'negotiation', 'won', 'lost'] as const).map(stage => {
                  const sc = stageConfig[stage];
                  const stageDeals = pipeline.filter(d => d.stage === stage);
                  const stageValue = stageDeals.reduce((s, d) => s + d.amount, 0);

                  return (
                    <div key={stage} className="w-full flex flex-col">
                      <div className={`p-3 lg:p-4 rounded-2xl border ${sc.border} ${sc.bg} mb-3`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] sm:text-[9px] xl:text-[10px] font-black uppercase tracking-widest ${sc.color} truncate pr-1`}>{sc.label}</span>
                          <span className={`text-[10px] font-black mono ${sc.color}`}>{stageDeals.length}</span>
                        </div>
                        <p className={`text-base xl:text-lg font-black mono ${sc.color} truncate`}>€{stageValue.toLocaleString('fr-FR')}</p>
                      </div>

                      <div className="space-y-3">
                        {stageDeals.map(deal => {
                          const client = clients.find(c => c.id === deal.client_id);
                          if (!client) return null;
                          const daysSince = Math.floor((Date.now() - deal.created_at) / 86400000);
                          return (
                            <motion.div key={deal.id} layout
                              className="glass-card p-3 lg:p-4 cursor-pointer hover:shadow-md transition-all border border-slate-200 dark:border-white/10 overflow-hidden">
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                                  <span className="text-white font-black text-[9px]">{client.name.slice(0,2).toUpperCase()}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">{client.name}</p>
                                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold truncate">{client.sector}</p>
                                </div>
                              </div>
                              <p className="text-sm xl:text-base font-black text-slate-900 dark:text-white mono mb-2 truncate">€{deal.amount.toLocaleString('fr-FR')}</p>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold max-w-[80%] truncate">{daysSince}d in stage</span>
                                {stage === 'negotiation' && daysSince > 20 && (
                                  <Clock size={12} className="text-amber-500 shrink-0" />
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* ── SMART ALERTS ─────────────────────────────────────── */}
            {view === 'alerts' && (
              <motion.div key="alerts" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="glass-card p-16 text-center">
                    <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">All Clear</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">No active CRM alerts. All client relationships are healthy.</p>
                  </div>
                ) : alerts.map(alert => {
                  const client = clients.find(c => c.id === alert.client_id);
                  return (
                    <motion.div key={alert.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className={`glass-card p-5 border-l-4 flex items-start gap-5 ${alert.type === 'critical' ? 'border-rose-500' : alert.type === 'warning' ? 'border-amber-500' : 'border-blue-400'}`}>
                      <div className={`p-2.5 rounded-xl shrink-0 ${alert.type === 'critical' ? 'bg-rose-100' : alert.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                        <AlertTriangle size={16} className={alert.type === 'critical' ? 'text-rose-600' : alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${alert.type === 'critical' ? 'bg-rose-100 text-rose-700' : alert.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {alert.type}
                          </span>
                          {client && <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">Rep: {client.sales_rep}</span>}
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-white/80">{alert.message}</p>
                      </div>
                      <button onClick={() => { setSelectedClient(clients.find(c => c.id === alert.client_id) || null); setView('clients'); }}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors whitespace-nowrap">
                        View Client
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── BI DASHBOARD ─────────────────────────────────────── */}
            {view === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-8">

                {/* Revenue Trend */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="glass-card p-4 lg:col-span-2">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-8">Revenue Trend (6 months)</h4>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyRevenue}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }} formatter={(v) => [`€${Number(v).toLocaleString('fr-FR')}`, 'Revenue']} />
                          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#revGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Portfolio Breakdown */}
                  <div className="glass-card p-4">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-8">Portfolio Breakdown</h4>
                    <div className="space-y-4">
                      {(['active', 'negotiation', 'prospect', 'inactive'] as const).map(s => {
                        const count = clients.filter(c => c.status === s).length;
                        const pct = Math.round((count / clients.length) * 100);
                        const st = getStatusStyle(s);
                        return (
                          <div key={s}>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest capitalize">{s}</span>
                              <span className="text-[10px] font-black mono text-slate-700 dark:text-white/80">{count} · {pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${st.dot.replace('bg-', 'bg-')}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top Clients Table */}
                <div className="glass-card overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-white/10">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Top Revenue-Generating Clients</h4>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10">
                        {['Rank', 'Client', 'Sector', 'Category', 'Revenue', 'Loyalty', 'Next Order %', 'Rep'].map(h => (
                          <th key={h} className="px-6 py-4 text-left text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...clients]
                        .sort((a, b) => b.deals.filter(d=>d.stage==='won').reduce((s,d)=>s+d.amount,0) - a.deals.filter(d=>d.stage==='won').reduce((s,d)=>s+d.amount,0))
                        .map((client, i) => {
                          const rev = client.deals.filter(d=>d.stage==='won').reduce((s,d)=>s+d.amount,0);
                          return (
                            <tr key={client.id} onClick={() => { setSelectedClient(client); setView('clients'); }}
                              className="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-900 dark:text-white cursor-pointer transition-colors">
                              <td className="px-6 py-4">
                                <div className="w-7 h-7 bg-slate-100 dark:bg-white/10 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400">#{i+1}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-black text-[9px]">{client.name.slice(0,2).toUpperCase()}</span>
                                  </div>
                                  <span className="text-xs font-black text-slate-900 dark:text-white">{client.name}</span>
                                  {client.category === 'VIP' && <Star size={10} className="text-amber-500 fill-amber-500" />}
                                </div>
                              </td>
                              <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{client.sector}</span></td>
                              <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getCategoryBadge(client.category)}`}>{client.category}</span></td>
                              <td className="px-6 py-4"><span className="text-sm font-black text-slate-900 dark:text-white mono">{rev > 0 ? `€${(rev/1000).toFixed(0)}k` : '—'}</span></td>
                              <td className="px-6 py-4"><span className="text-[10px] font-black mono text-slate-700 dark:text-white/80">{client.loyalty_score}/100</span></td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-black mono ${(client.order_probability||0)>0.6?'text-emerald-600':'text-slate-400'}`}>
                                  {Math.round((client.order_probability||0)*100)}%
                                </span>
                              </td>
                              <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{client.sales_rep}</span></td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

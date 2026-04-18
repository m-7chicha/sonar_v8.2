"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeContext';
import {
  subscribeToUpdates,
  MachineState,
  getExecutivePulseMetrics,
  calculateAvailability,
  calculatePerformance,
  calculateQuality,
  calculateOEE,
  getQualityState,
  getDefectRate,
} from '@/lib/mathEngine';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { Activity, AlertOctagon, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, CheckCircle, CheckCircle2, ClipboardCheck, Clock, Cpu, Package, RefreshCw, Shield, Target, TrendingDown, TrendingUp, User, Users, XCircle, Zap } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG = {
  running:  { label: 'Running',  dot: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border-emerald-200',  bar: 'bg-emerald-500', glow: 'shadow-emerald-500/30' },
  stopped:  { label: 'Stopped',  dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200',            bar: 'bg-rose-500',    glow: 'shadow-rose-500/30'    },
  paused:   { label: 'Paused',   dot: 'bg-amber-500',   badge: 'bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-400 border-amber-200',          bar: 'bg-amber-500',   glow: 'shadow-amber-500/30'   },
};

const OEE_COLOR = (v: number) => v >= 85 ? '#10b981' : v >= 65 ? '#f59e0b' : '#ef4444';

export default function PerformanceEngine() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('MX01');
  const [machines, setMachines] = useState<MachineState[]>([]);
  const [qualityData, setQualityData] = useState(() => getQualityState());
  const [activeView, setActiveView] = useState<'drill' | 'fleet'>('drill');

  useEffect(() => {
    setMounted(true);
    const unsubscribe = subscribeToUpdates((newData) => {
      setMachines(newData.machines);
      setQualityData(getQualityState());
    });
    return () => unsubscribe();
  }, []);

  if (!mounted || machines.length === 0) return null;

  const currentMachine = machines.find(m => m.id === selectedMachineId) || machines[0];

  // Per-machine derived KPIs
  const getMachineStats = (m: MachineState) => {
    const avail    = calculateAvailability(m);
    const perf     = calculatePerformance(m);
    const qual     = calculateQuality(m);
    const oee      = calculateOEE(m);
    const defRate  = getDefectRate(m.id);
    const batches  = qualityData.batches.filter(b => b.machine_id === m.id);
    const passed   = batches.filter(b => b.status === 'passed').length;
    const failed   = batches.filter(b => b.status === 'failed').length;
    const inRework = batches.filter(b => b.status === 'rework').length;
    const defects  = batches.flatMap(b => b.defects);
    const openDef  = defects.filter(d => d.status !== 'closed').length;
    const yieldPct = qual * 100;
    const fillPct  = m.units_target > 0 ? Math.min(100, (m.units_produced / m.units_target) * 100) : 0;
    const hoursUp  = (Date.now() - m.started_at) / 3600000;
    const downtimeMs = m.downtime_start ? (Date.now() - m.downtime_start) : 0;
    const downtimeMin = downtimeMs / 60000;
    const revenueAtRisk = m.status === 'stopped' && m.downtime_start
      ? (downtimeMin / 60) * m.ideal_speed * m.unit_margin : 0;
    const throughputActual = hoursUp > 0 ? m.units_produced / hoursUp : 0;
    const efficiencyGap = m.ideal_speed - throughputActual;

    return {
      avail, perf, qual, oee, defRate, batches, passed, failed, inRework,
      defects, openDef, yieldPct, fillPct, hoursUp, downtimeMin, revenueAtRisk,
      throughputActual, efficiencyGap,
    };
  };

  const stats = getMachineStats(currentMachine);
  const oeeBreakdown = [
    { name: 'Availability', value: +(stats.avail * 100).toFixed(1), fill: '#3b82f6' },
    { name: 'Performance',  value: +(stats.perf  * 100).toFixed(1), fill: '#10b981' },
    { name: 'Quality',      value: +(stats.qual  * 100).toFixed(1), fill: '#f59e0b' },
  ];

  const defectBreakdown = (['welding_defect', 'pressure_failure', 'finishing_issue', 'dimensional_error', 'visual_check'] as const).map(type => ({
    type: type.replace('_', ' '),
    count: qualityData.batches.filter(b => b.machine_id === currentMachine.id).flatMap(b => b.defects).filter(d => d.defect_type === type).length,
  }));

  // Fleet summary helpers
  const fleetStats = machines.map(m => ({ m, s: getMachineStats(m) }));
  const globalOEE = fleetStats.reduce((acc, { s }) => acc + s.oee, 0) / machines.length;
  const totalRevenueAtRisk = fleetStats.reduce((acc, { s }) => acc + s.revenueAtRisk, 0);
  const totalOpenDefects   = fleetStats.reduce((acc, { s }) => acc + s.openDef, 0);
  const fleetAvgYield      = fleetStats.reduce((acc, { s }) => acc + s.yieldPct, 0) / machines.length;

  const statusConfig = STATUS_CONFIG[currentMachine.status];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-slate-900 dark:text-white dark:text-slate-100">
      {/* ── Sidebar ──────────────────────────────────────────────── */}
      

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-[var(--glass-dark)] backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-8 lg:px-12 py-5">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase mb-2">
                <span className="text-blue-600">SONAR v8.2</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 dark:text-slate-400">Performance Engine</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 dark:text-slate-400">{activeView === 'fleet' ? 'Fleet Overview' : `${selectedMachineId} Deep-Dive`}</span>
              </nav>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">OEE Intelligence</h2>
            </div>

            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-white/10 p-1 rounded-xl">
                <button
                  onClick={() => setActiveView('drill')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'drill' ? 'bg-white dark:bg-[var(--glass-dark)] text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >Machine Drill-down</button>
                <button
                  onClick={() => setActiveView('fleet')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'fleet' ? 'bg-white dark:bg-[var(--glass-dark)] text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >Fleet Overview</button>
              </div>

              {/* Machine picker (only in drill view) */}
              {activeView === 'drill' && (
                <div className="flex items-center gap-1 bg-white dark:bg-[var(--glass-dark)] p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                  {machines.map(m => {
                    const cfg = STATUS_CONFIG[m.status];
                    return (
                      <button key={m.id}
                        onClick={() => setSelectedMachineId(m.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMachineId === m.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-900 dark:text-white'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {m.id}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ═══════════════ MACHINE DRILL-DOWN VIEW ═══════════════ */}
          {activeView === 'drill' && (
            <motion.div
              key="drill"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="px-8 lg:px-12 py-8 space-y-8 max-w-[1600px]"
            >
              {/* ── Row 1: Machine Identity + Core KPIs ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
                {/* Machine identity card */}
                <div className="col-span-2 glass-card p-8 flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Production Node</p>
                      <h3 className="text-5xl font-black text-slate-900 dark:text-white mono tracking-tighter">{currentMachine.id}</h3>
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusConfig.badge} flex items-center gap-2`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${currentMachine.status === 'running' ? 'animate-pulse' : ''}`} />
                      {statusConfig.label}
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-700 dark:text-white/80">{currentMachine.product_name}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-[10px]">
                        <span className="font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Production Progress</span>
                        <span className="font-black text-slate-700 dark:text-white/80 mono">{currentMachine.units_produced} / {currentMachine.units_target} units</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${stats.fillPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          animate={{ width: `${Math.min(stats.fillPct, 100)}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* OEE Composite */}
                <div className="glass-card p-6 bg-slate-900 text-white border-none relative overflow-hidden flex flex-col justify-between">
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Composite OEE</p>
                    <h3 className="text-3xl font-black mono tracking-tighter" style={{ color: OEE_COLOR(stats.oee * 100) }}>
                      {(stats.oee * 100).toFixed(1)}%
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{stats.oee >= 0.85 ? '<CheckCircle size={14} /> World Class' : stats.oee >= 0.65 ? '↗ Acceptable' : '<AlertTriangle size={14} /> Below Target'}</p>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
                    <motion.div className="h-full rounded-full bg-blue-500" animate={{ width: `${stats.oee * 100}%` }} transition={{ duration: 1 }} />
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full" />
                </div>

                {/* Availability */}
                <div className="glass-card p-6 flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-400/10 rounded-xl border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"><Shield size={18} /></div>
                    <span className={`text-[10px] font-black mono px-2 py-1 rounded-lg ${stats.avail >= 0.9 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                      {(stats.avail * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Availability</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mono">{(stats.avail * 100).toFixed(1)}%</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                      {currentMachine.status === 'stopped' ? `▼ ${stats.downtimeMin.toFixed(0)}min down` : '● No downtime'}
                    </p>
                  </div>
                </div>

                {/* Performance */}
                <div className="glass-card p-6 flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-400/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"><Zap size={18} /></div>
                    <span className={`text-[10px] font-black mono px-2 py-1 rounded-lg ${stats.perf >= 0.85 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                      {(stats.perf * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Performance</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mono">{(stats.perf * 100).toFixed(1)}%</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">{stats.throughputActual.toFixed(0)} / {currentMachine.ideal_speed} u/hr</p>
                  </div>
                </div>

                {/* Quality */}
                <div className="glass-card p-6 flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-600"><ClipboardCheck size={18} /></div>
                    <span className={`text-[10px] font-black mono px-2 py-1 rounded-lg ${stats.qual >= 0.97 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                      {(stats.qual * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Quality Yield</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mono">{(stats.qual * 100).toFixed(1)}%</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">{currentMachine.defect_count} defects / {currentMachine.total_checks} checked</p>
                  </div>
                </div>
              </div>

              {/* ── Row 2: Charts ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* OEE Trend */}
                <div className="lg:col-span-2 glass-card p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Efficiency Dynamics (Shift)</h4>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">Live OEE over time — hover for details</p>
                    </div>
                    <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black border border-blue-100">
                      {(stats.oee * 100).toFixed(1)}% Now
                    </div>
                  </div>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentMachine.history}>
                        <defs>
                          <linearGradient id="gradOee" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'OEE']} />
                        <Area type="monotone" dataKey="oee" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#gradOee)" animationDuration={1500} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* OEE Breakdown Donut */}
                <div className="glass-card p-8 flex flex-col">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">OEE Breakdown</h4>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-6">A × P × Q decomposition</p>
                  <div className="flex-1 relative flex items-center justify-center">
                    <div className="w-48 h-48 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={oeeBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                            {oeeBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">OEE</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mono">{(stats.oee * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {oeeBreakdown.map(item => (
                      <div key={item.name} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                        <span className="text-[11px] font-black text-slate-600 dark:text-white/70 flex-1 uppercase tracking-tight">{item.name}</span>
                        <span className="text-[12px] font-black text-slate-900 dark:text-white mono">{item.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Row 3: Production Volume + Defect Analysis ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Yield Momentum */}
                <div className="glass-card p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Yield Momentum</h4>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">Units produced per hour block</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-white/10">
                      <Cpu size={12} className="text-slate-500 dark:text-slate-400" />
                      <span className="text-[10px] font-black text-slate-600 dark:text-white/70">{stats.throughputActual.toFixed(0)} u/hr avg</span>
                    </div>
                  </div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentMachine.history}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} />
                        <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} />
                        <Tooltip cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 700 }} formatter={(v: any) => [v, 'Units']} />
                        <Bar dataKey="units" radius={[6, 6, 0, 0]} animationDuration={1500}>
                          {currentMachine.history.map((_, i) => (
                            <Cell key={i} fill={i === currentMachine.history.length - 1 ? '#3b82f6' : theme === 'dark' ? '#475569' : '#0f172a'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Defect Breakdown */}
                <div className="glass-card p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Defect Pareto</h4>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">Failure modes on {currentMachine.id}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black ${stats.openDef > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                      {stats.openDef > 0 ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                      {stats.openDef > 0 ? `${stats.openDef} Open` : 'All Clear'}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {defectBreakdown.map(d => {
                      const maxCount = Math.max(...defectBreakdown.map(x => x.count), 1);
                      const pct = (d.count / maxCount) * 100;
                      const COLORS: Record<string, string> = { 'welding defect': '#ef4444', 'pressure failure': '#f97316', 'finishing issue': '#eab308', 'dimensional error': '#3b82f6', 'visual check': '#8b5cf6' };
                      return (
                        <div key={d.type}>
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest capitalize">{d.type}</span>
                            <span className="text-[10px] font-black text-slate-900 dark:text-white mono">{d.count}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: COLORS[d.type] || '#94a3b8' }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Row 4: Statistics Cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-slate-900 rounded-xl"><Target size={16} className="text-slate-900 dark:text-white" /></div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Batches Inspected</p>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mono">{stats.batches.length}</h3>
                  <div className="flex items-center gap-3 mt-3 text-[10px] font-black">
                    <span className="text-emerald-600"><CheckCircle size={14} /> {stats.passed} Pass</span>
                    <span className="text-rose-600"><XCircle size={14} /> {stats.failed} Fail</span>
                    <span className="text-amber-600"><RefreshCw size={14} /> {stats.inRework} Rework</span>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-rose-100 rounded-xl"><AlertOctagon size={16} className="text-rose-600" /></div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Defect Rate</p>
                  </div>
                  <h3 className={`text-2xl font-black mono ${stats.defRate > 0.08 ? 'text-rose-600' : stats.defRate > 0.04 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {(stats.defRate * 100).toFixed(2)}%
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-3">
                    {stats.defRate > 0.08 ? '<AlertTriangle size={14} /> Critical — action required' : stats.defRate > 0.04 ? '↗ Elevated — monitor' : '<CheckCircle size={14} /> Within target (<4%)'}
                  </p>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-50 rounded-xl"><Clock size={16} className="text-amber-600" /></div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Downtime</p>
                  </div>
                  <h3 className={`text-2xl font-black mono ${stats.downtimeMin > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {stats.downtimeMin > 0 ? `${stats.downtimeMin.toFixed(0)}m` : '0m'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-3">
                    {currentMachine.downtime_reason ? `Cause: ${currentMachine.downtime_reason.replace('_', ' ')}` : 'No active downtime event'}
                  </p>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-xl"><TrendingDown size={16} className="text-blue-600" /></div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Efficiency Gap</p>
                  </div>
                  <h3 className={`text-2xl font-black mono ${stats.efficiencyGap > 5 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                    {stats.efficiencyGap > 0 ? `-${stats.efficiencyGap.toFixed(0)}` : '0'} u/hr
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-3">vs. ideal {currentMachine.ideal_speed} u/hr target</p>
                </div>
              </div>

              {/* ── Row 5: Machine Alerts & Open Defects ── */}
              {(stats.openDef > 0 || currentMachine.status === 'stopped') && (
                <div className="glass-card p-8">
                  <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-6">Active Incidents — {currentMachine.id}</h4>
                  <div className="space-y-3">
                    {currentMachine.status === 'stopped' && (
                      <div className="flex items-start gap-4 p-5 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200">
                        <XCircle size={18} className="text-rose-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[13px] font-black text-rose-900 uppercase tracking-tight">Machine Stoppage Active</p>
                          <p className="text-[11px] font-bold text-rose-600 mt-1">Reason: {currentMachine.downtime_reason?.replace('_', ' ')} · Duration: {stats.downtimeMin.toFixed(0)} min · Est. Revenue at Risk: €{stats.revenueAtRisk.toFixed(0)}</p>
                        </div>
                      </div>
                    )}
                    {stats.defects.filter(d => d.status !== 'closed').map(def => (
                      <div key={def.id} className="flex items-start gap-4 p-5 bg-amber-50 dark:bg-amber-400/10 rounded-2xl border border-amber-200">
                        <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="text-[13px] font-black text-amber-900 uppercase tracking-tight">{def.defect_type.replace('_', ' ')}</p>
                            <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg">{def.id}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${def.status === 'open' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>{def.status}</span>
                          </div>
                          <p className="text-[11px] font-bold text-amber-700">{def.description}</p>
                          <p className="text-[10px] font-bold text-amber-500 mt-1">Batch: {def.batch_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════ FLEET OVERVIEW VIEW ═══════════════ */}
          {activeView === 'fleet' && (
            <motion.div
              key="fleet"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="px-8 lg:px-12 py-8 space-y-8 max-w-[1600px]"
            >
              {/* Fleet KPI Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { label: 'Global OEE',       value: `${(globalOEE * 100).toFixed(1)}%`,   sub: 'Fleet average',           color: OEE_COLOR(globalOEE * 100),   icon: <Activity size={18} />,    bg: 'bg-slate-900', iconBg: 'bg-blue-600' },
                  { label: 'Fleet Yield',       value: `${fleetAvgYield.toFixed(1)}%`,        sub: 'Avg quality rate',         color: '#10b981',                    icon: <CheckCircle2 size={18} />, bg: 'bg-white',     iconBg: 'bg-emerald-50 border border-emerald-100 text-emerald-600' },
                  { label: 'Revenue at Risk',   value: `€${totalRevenueAtRisk.toFixed(0)}`,  sub: 'From active downtime',     color: totalRevenueAtRisk > 0 ? '#ef4444' : '#10b981', icon: <TrendingDown size={18} />, bg: 'bg-white', iconBg: 'bg-rose-50 border border-rose-100 text-rose-600' },
                  { label: 'Open Defects',      value: `${totalOpenDefects}`,                sub: 'Across all nodes',         color: totalOpenDefects > 0 ? '#f59e0b' : '#10b981', icon: <AlertTriangle size={18} />, bg: 'bg-white', iconBg: 'bg-amber-50 border border-amber-100 text-amber-600' },
                ].map(k => (
                  <div key={k.label} className={`glass-card p-6 ${k.bg === 'bg-slate-900' ? 'bg-slate-900' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${k.iconBg} ${k.bg === 'bg-slate-900' ? 'bg-blue-600 text-white' : ''}`}>
                      {k.icon}
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${k.bg === 'bg-slate-900' ? 'text-slate-400' : 'text-slate-400'}`}>{k.label}</p>
                    <h3 className="text-2xl font-black mono tracking-tighter" style={{ color: k.bg === 'bg-slate-900' ? k.color : k.color }}>
                      {k.value}
                    </h3>
                    <p className={`text-[10px] font-bold mt-1 ${k.bg === 'bg-slate-900' ? 'text-slate-400' : 'text-slate-400'}`}>{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* All 4 Machine Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {machines.map(m => {
                  const s = getMachineStats(m);
                  const cfg = STATUS_CONFIG[m.status];
                  const oeePct = +(s.oee * 100).toFixed(1);
                  const machineDefects = qualityData.batches.filter(b => b.machine_id === m.id);

                  return (
                    <motion.div key={m.id}
                      layout
                      className="glass-card overflow-hidden"
                    >
                      {/* Card Header */}
                      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white mono text-sm">{m.id}</div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-base font-black text-slate-900 dark:text-white">{m.id} — {m.product_name}</h3>
                              <div className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase ${cfg.badge} flex items-center gap-1`}>
                                <div className={`w-1 h-1 rounded-full ${cfg.dot} ${m.status === 'running' ? 'animate-pulse' : ''}`} />
                                {cfg.label}
                              </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{m.units_produced} / {m.units_target} units · {m.ideal_speed} u/hr target</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedMachineId(m.id); setActiveView('drill'); }}
                          className="px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-900 hover:text-white text-slate-700 dark:text-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >Drill-down →</button>
                      </div>

                      {/* OEE Bar */}
                      <div className="px-6 py-4 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white border-b border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Composite OEE</span>
                          <span className="text-[13px] font-black mono" style={{ color: OEE_COLOR(oeePct) }}>{oeePct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: OEE_COLOR(oeePct) }}
                            animate={{ width: `${oeePct}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </div>

                      {/* KPI Grid */}
                      <div className="grid grid-cols-4 divide-x divide-slate-200">
                        {[
                          { label: 'Avail', value: `${(s.avail * 100).toFixed(0)}%`, sub: 'Availability', color: s.avail >= 0.9 ? 'text-emerald-600' : 'text-rose-600' },
                          { label: 'Perf',  value: `${(s.perf  * 100).toFixed(0)}%`, sub: 'Performance',  color: s.perf  >= 0.85 ? 'text-emerald-600' : 'text-amber-600' },
                          { label: 'Qual',  value: `${(s.qual  * 100).toFixed(0)}%`, sub: 'Quality Yield', color: s.qual  >= 0.97 ? 'text-emerald-600' : 'text-rose-600'  },
                          { label: 'Def',   value: `${(s.defRate * 100).toFixed(1)}%`, sub: 'Defect Rate', color: s.defRate < 0.04 ? 'text-emerald-600' : 'text-rose-600' },
                        ].map(kpi => (
                          <div key={kpi.label} className="p-5 text-center">
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{kpi.sub}</p>
                            <p className={`text-xl font-black mono ${kpi.color}`}>{kpi.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Production fill + Batch status */}
                      <div className="px-6 py-5 flex items-center gap-6 border-t border-slate-200">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] mb-1.5">
                            <span className="font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Production Target</span>
                            <span className="font-black text-slate-700 dark:text-white/80 mono">{s.fillPct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${s.fillPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                              animate={{ width: `${Math.min(s.fillPct, 100)}%` }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {machineDefects.length > 0 ? (
                            <>
                              <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1"><CheckCircle2 size={10} /> {s.passed}P</span>
                              <span className="text-[10px] font-black text-rose-600 flex items-center gap-1"><XCircle size={10} /> {s.failed}F</span>
                              <span className="text-[10px] font-black text-amber-600 flex items-center gap-1"><RefreshCw size={10} /> {s.inRework}R</span>
                            </>
                          ) : (
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">No batches yet</span>
                          )}
                          {s.openDef > 0 && (
                            <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[9px] font-black rounded-lg border border-rose-200 flex items-center gap-1">
                              <AlertTriangle size={9} /> {s.openDef} open
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mini OEE sparkline */}
                      <div className="px-6 pb-5">
                        <div className="h-[70px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={m.history}>
                              <defs>
                                <linearGradient id={`grad${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%"  stopColor={OEE_COLOR(oeePct)} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={OEE_COLOR(oeePct)} stopOpacity={0}   />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="oee" stroke={OEE_COLOR(oeePct)} strokeWidth={2} fillOpacity={1} fill={`url(#grad${m.id})`} animationDuration={1500} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => [`${Number(v).toFixed(1)}%`, 'OEE']} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Fleet Benchmarking Table */}
              <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Fleet Benchmarking Matrix</h4>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">Full comparative analysis of all production nodes</p>
                  </div>
                  <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black border border-blue-100">Live · 5s refresh</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white border-b border-slate-200">
                        {['Node', 'Product', 'Status', 'OEE', 'Availability', 'Performance', 'Quality', 'Defect Rate', 'Open Issues', 'Rev. at Risk', 'Alert'].map(h => (
                          <th key={h} className="px-5 py-4 text-left text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fleetStats.map(({ m, s }) => {
                        const cfg = STATUS_CONFIG[m.status];
                        const oeePct = (s.oee * 100);
                        const isWorst = fleetStats.every(fs => fs.s.oee >= s.oee);
                        return (
                          <tr key={m.id}
                            className="border-b border-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-900 dark:text-white transition-colors cursor-pointer"
                            onClick={() => { setSelectedMachineId(m.id); setActiveView('drill'); }}
                          >
                            <td className="px-5 py-4">
                              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center font-black text-white text-[10px] mono">{m.id}</div>
                            </td>
                            <td className="px-5 py-4">
                              <p className="text-[12px] font-black text-slate-900 dark:text-white">{m.product_name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{m.units_produced} / {m.units_target} u</p>
                            </td>
                            <td className="px-5 py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black ${cfg.badge}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${m.status === 'running' ? 'animate-pulse' : ''}`} />
                                {cfg.label}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-[14px] font-black mono" style={{ color: OEE_COLOR(oeePct) }}>{oeePct.toFixed(1)}%</span>
                            </td>
                            <td className="px-5 py-4"><span className="text-[12px] font-black mono text-slate-700 dark:text-white/80">{(s.avail * 100).toFixed(1)}%</span></td>
                            <td className="px-5 py-4"><span className="text-[12px] font-black mono text-slate-700 dark:text-white/80">{(s.perf * 100).toFixed(1)}%</span></td>
                            <td className="px-5 py-4"><span className="text-[12px] font-black mono text-slate-700 dark:text-white/80">{(s.qual * 100).toFixed(1)}%</span></td>
                            <td className="px-5 py-4">
                              <span className={`text-[12px] font-black mono ${s.defRate > 0.08 ? 'text-rose-600' : s.defRate > 0.04 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {(s.defRate * 100).toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {s.openDef > 0
                                ? <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-black rounded-lg border border-rose-200">{s.openDef} open</span>
                                : <span className="text-[10px] font-black text-emerald-600"><CheckCircle size={14} /> Clear</span>}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[12px] font-black mono ${s.revenueAtRisk > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {s.revenueAtRisk > 0 ? `€${s.revenueAtRisk.toFixed(0)}` : '—'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {m.status === 'stopped'
                                ? <AlertTriangle size={14} className="text-rose-500" />
                                : oeePct < 65
                                ? <AlertTriangle size={14} className="text-amber-500" />
                                : <CheckCircle2 size={14} className="text-emerald-500" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

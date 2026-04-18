"use client";

import React, { useState, useEffect } from 'react';
import { Activity, ActivityIcon, AlertTriangle, ArrowRight, CheckCircle, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Clock, FileCheck, Filter, Layers, MoreVertical, Package, Search, Settings, Shield, ShieldCheck, TrendingDown, TrendingUp, User, Users, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie,
  LineChart,
  Line,
  Legend
} from 'recharts';
import Link from 'next/link';
import { 
  getQualityState, 
  subscribeToUpdates, 
  submitChecklist, 
  resolveDefect,
  QualityBatch,
  CorrectiveAction,
  StepResult,
  checklistTemplates,
  MachineState 
} from '@/lib/mathEngine';

export default function QualityDashboard() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [qualityData, setQualityData] = useState<ReturnType<typeof getQualityState> | null>(null);
  const [activeTab, setActiveTab] = useState<'batches' | 'defects' | 'analytics'>('batches');
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState('MX01');
  const [checklistResults, setChecklistResults] = useState<StepResult[]>([]);
  const [unitsChecked, setUnitsChecked] = useState(10);
  const [operatorName, setOperatorName] = useState('OP-Karim');

  useEffect(() => {
    setMounted(true);
    setQualityData(getQualityState());
    
    const unsubscribe = subscribeToUpdates(() => {
      setQualityData(getQualityState());
    });
    return () => unsubscribe();
  }, []);

  const handleToggleStep = (stepId: string) => {
    setChecklistResults(prev => {
      const existing = prev.find(r => r.step_id === stepId);
      if (existing) {
        return prev.map(r => r.step_id === stepId ? { ...r, result: r.result === 'pass' ? 'fail' : 'pass' } : r);
      }
      return [...prev, { step_id: stepId, result: 'pass' }];
    });
  };

  const handleSetNotes = (stepId: string, notes: string) => {
    setChecklistResults(prev => prev.map(r => r.step_id === stepId ? { ...r, notes } : r));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const template = checklistTemplates.find(t => t.id === `CL-${selectedMachine}`);
    if (!template) return;

    // Ensure all steps have a result, default to pass if not touched
    const fullResults: StepResult[] = template.steps.map(step => {
      const existing = checklistResults.find(r => r.step_id === step.id);
      return existing || { step_id: step.id, result: 'pass' };
    });

    submitChecklist(
      selectedMachine,
      operatorName,
      `BATCH-${selectedMachine}-${Date.now().toString().slice(-4)}`,
      fullResults,
      unitsChecked
    );

    setShowChecklistModal(false);
    setChecklistResults([]);
    setUnitsChecked(10);
  };

  const defectTypeColors: Record<string, string> = {
    welding_defect: '#ef4444',
    pressure_failure: '#f97316',
    finishing_issue: '#eab308',
    dimensional_error: '#3b82f6',
    visual_check: '#8b5cf6'
  };

  if (!mounted || !qualityData) return null;

  return (
    <div className="flex flex-col h-full w-full font-sans text-slate-900 dark:text-white dark:text-slate-100">
      {/* Sidebar - Consistent with Stratum V1.0 UI */}
      

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Header */}
        <header className="h-24 bg-white/80 dark:bg-[var(--glass-dark)] backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-10 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 dark:bg-white/10 p-2.5 rounded-xl border border-slate-200 dark:border-white/10">
              <ClipboardCheck className="text-slate-900 dark:text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
                Quality Systems
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase not-italic tracking-normal">Live Feedback Loop</span>
              </h2>
              <div className="flex items-center gap-6 mt-1">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} className="text-slate-500 dark:text-slate-400" /> Current Ops: <span className="text-slate-900 dark:text-white">Shift A — QC Team Alpha</span>
                </p>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={12} className="text-emerald-500" /> Traceability: <span className="text-emerald-600">Full Audit Active</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowChecklistModal(true)}
              className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-slate-200 dark:shadow-none flex items-center gap-2 group border border-slate-700 hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileCheck size={16} className="group-hover:rotate-12 transition-transform" />
              New Inspection
            </button>
            <div className="w-px h-8 bg-slate-200 mx-2" />
            <div className="bg-slate-100 dark:bg-white/10/50 p-2 rounded-xl flex items-center gap-2">
              <Search className="text-slate-500 dark:text-slate-400" size={18} />
              <input type="text" placeholder="Search batch ID..." className="bg-transparent border-none focus:outline-none text-[12px] font-bold w-48 text-slate-600 dark:text-white/70 placeholder:text-slate-500 dark:text-slate-400" />
            </div>
          </div>
        </header>

        <div className="p-10 space-y-8">
          {/* KPI Dashboard - Using same design language as Pulse */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200 dark:shadow-none group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-400/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-slate-900 transition-all duration-300">
                  <CheckCircle2 size={24} />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-tighter">
                  <TrendingUp size={12} /> +1.2%
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Plant-wide Pass Rate</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{qualityData.passRate}%</h3>
              <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${qualityData.passRate}%` }}
                   className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />
              </div>
            </div>

            <div className="glass-card p-6 border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200 dark:shadow-none group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-red-50 dark:bg-red-400/10 rounded-xl border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 group-hover:bg-red-500/20 group-hover:text-slate-900 transition-all duration-300">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-400/10 text-red-700 dark:text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-tighter">
                  Critical Focus
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Total Defects Recorded</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{qualityData.totalDefects}</h3>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                <Clock size={12} /> Last 24 hours: <span className="text-red-600 font-black">+2 discovered</span>
              </p>
            </div>

            <div className="glass-card p-6 border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200 dark:shadow-none group hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-blue-600">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-400/10 rounded-xl border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 group-hover:text-white transition-all duration-300">
                  <Activity size={24} />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-tighter">
                  OEE Feedback
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Avg. Defect Rate</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{(qualityData.totalDefects / (qualityData.totalBatches * 50 || 1) * 100).toFixed(2)}%</h3>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5 uppercase">
                Target: <span className="text-slate-900 dark:text-white font-bold tracking-widest">&lt;2.00%</span>
              </p>
            </div>

            <div className="glass-card p-6 border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200 dark:shadow-none group hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-slate-900 dark:bg-white/[0.08] rounded-xl border border-slate-800 dark:border-white/10 text-white group-hover:bg-black transition-all duration-300 shadow-lg">
                  <Layers size={24} />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 dark:text-white/80 rounded-lg text-[10px] font-bold uppercase tracking-tighter">
                  Live History
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">Inspected Batches</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{qualityData.totalBatches}</h3>
              <div className="mt-4 flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800/80 border-2 border-white dark:border-white/5 flex items-center justify-center font-bold text-[8px] text-slate-500 dark:text-slate-400 shadow-sm uppercase tracking-tighter shadow-inner hover:z-10 transition-all cursor-pointer">QC{i}</div>
                ))}
                <div className="w-7 h-7 rounded-full glass-card border-2 border-white dark:border-[var(--glass-dark)] flex items-center justify-center font-bold text-[8px] text-slate-900 dark:text-white shadow-sm">+9</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
            {/* Left Column: List/Tabs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[var(--glass-dark)] rounded-2xl border border-slate-200 dark:border-white/10 w-fit shadow-md">
                <button 
                  onClick={() => setActiveTab('batches')}
                  className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'batches' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-900 dark:text-white'}`}
                >
                  Batch History
                </button>
                <button 
                  onClick={() => setActiveTab('defects')}
                  className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'defects' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-900 dark:text-white'}`}
                >
                  Action Items
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-900 dark:text-white'}`}
                >
                  Defect Analytics
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'batches' && (
                  <motion.div 
                    key="batches"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="glass-card overflow-hidden border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200 dark:shadow-none"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white/80 border-b border-slate-200">
                            <th className="p-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Batch ID & Timestamp</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Target Node</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Defects</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qualityData.batches.map((batch, idx) => (
                            <motion.tr 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              key={batch.id} 
                              className="border-b border-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-900 dark:text-white/80 transition-colors group cursor-pointer"
                            >
                              <td className="p-5">
                                <p className="font-extrabold text-[13px] text-slate-900 dark:text-white tracking-tight uppercase">{batch.id}</p>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter mt-0.5">{new Date(batch.created_at).toLocaleTimeString()} — {batch.operator_id}</p>
                              </td>
                              <td className="p-5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-700 dark:text-white/80 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">{batch.machine_id}</div>
                                  <span className="font-bold text-[12px] text-slate-700 dark:text-white/80 tracking-tight">{batch.product_name}</span>
                                </div>
                              </td>
                              <td className="p-5 text-center">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-[10px] shadow-sm ${batch.defect_count > 0 ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}>
                                  {batch.defect_count}
                                </span>
                              </td>
                              <td className="p-5">
                                <StatusBadge status={batch.status} />
                              </td>
                              <td className="p-5 text-right">
                                <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-slate-200 active:scale-90 shadow-sm">
                                  <ArrowRight size={16} />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'defects' && (
                  <motion.div 
                    key="defects"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {qualityData.allDefects.filter(d => d.status !== 'closed').length === 0 ? (
                      <div className="glass-card p-20 flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-emerald-50/20">
                        <div className="p-4 bg-emerald-100 rounded-full text-emerald-600 mb-4 shadow-inner">
                          <CheckCircle2 size={32} />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Zero Open Defect Items</h4>
                        <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide">All corrective actions have been closed successfully.</p>
                      </div>
                    ) : (
                      qualityData.allDefects.filter(d => d.status !== 'closed').map((defect, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={defect.id} 
                          className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between border-l-4 border-l-rose-500 shadow-lg shadow-slate-200 dark:shadow-none group hover:translate-x-1 transition-all duration-300 dark:bg-white/5"
                        >
                          <div className="flex gap-5">
                            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl h-fit border border-rose-200 shadow-sm group-hover:scale-110 transition-transform">
                              <AlertTriangle size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-tight text-base">Defect: {defect.defect_type.replace('_', ' ')}</h4>
                                <span className="text-[10px] font-black bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200">{defect.id}</span>
                              </div>
                              <p className="text-[13px] font-medium text-slate-600 dark:text-white/70 mt-1.5 leading-relaxed">{defect.description}</p>
                              <div className="flex items-center gap-4 mt-4">
                                  <span className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border border-slate-200 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white/80 px-2.5 py-1 rounded-lg">
                                    <Package size={12} /> <span className="text-slate-500 dark:text-slate-400">Batch:</span> <span className="text-slate-900 dark:text-white tracking-tight">{defect.batch_id}</span>
                                  </span>
                                  <span className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest border border-slate-200 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white/80 px-2.5 py-1 rounded-lg">
                                    <ActivityIcon size={12} /> <span className="text-slate-500 dark:text-slate-400">Node:</span> <span className="text-blue-600 font-black">{defect.machine_id}</span>
                                  </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 md:mt-0 flex flex-wrap items-center gap-3">
                            <button 
                              onClick={() => resolveDefect(defect.id, 'repair')}
                              className="px-5 py-2.5 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-black transition-all border border-slate-700 shadow-xl shadow-slate-200 dark:shadow-none hover:scale-105 active:scale-95"
                            >
                              Repair
                            </button>
                            <button 
                              onClick={() => resolveDefect(defect.id, 'rework')}
                              className="px-5 py-2.5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 hover:scale-105 active:scale-95"
                            >
                              Rework
                            </button>
                            <button 
                              onClick={() => resolveDefect(defect.id, 'rejection')}
                              className="px-5 py-2.5 bg-rose-600 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 hover:scale-105 active:scale-95"
                            >
                              Reject
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'analytics' && (
                  <motion.div 
                    key="analytics"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="glass-card p-8 border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200 dark:shadow-none dark:bg-white/5">
                      <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                        <TrendingDown size={14} className="text-rose-500" /> Defect Pareto Breakdown
                      </h4>
                      <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={qualityData.defectsByType} layout="vertical" margin={{ left: 40, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#334155' : '#F1F5F9'} />
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="type" 
                              type="category" 
                              axisLine={false} 
                              tickLine={false}
                              tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8', letterSpacing: '0.1em' }}
                              width={120}
                              tickFormatter={(val: string) => val.replace('_', ' ')}
                            />
                            <Tooltip 
                              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                              contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
                              labelStyle={{ color: '#94A3B8', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.1em' }}
                              itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 900 }}
                            />
                            <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={28}>
                              {qualityData.defectsByType.map((entry, index) => (
                                <Cell key={index} fill={defectTypeColors[entry.type]} shadow-lg />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="glass-card p-8 border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200 dark:shadow-none dark:bg-white/5">
                      <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                        <ActivityIcon size={14} className="text-emerald-500" /> Status Distribution
                      </h4>
                      <div className="h-[320px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Passed', value: qualityData.batches.filter(b => b.status === 'passed').length },
                                { name: 'Failed', value: qualityData.batches.filter(b => b.status === 'failed').length },
                                { name: 'In Rework', value: qualityData.batches.filter(b => b.status === 'rework').length },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={110}
                              paddingAngle={8}
                              dataKey="value"
                              stroke="none"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#f43f5e" />
                              <Cell fill="#3b82f6" />
                            </Pie>
                            <Tooltip 
                               contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '16px' }}
                               itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 900 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                           <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{qualityData.passRate}%</span>
                           <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1">Pass Yield</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column: Alerts & Feed */}
            <div className="space-y-8">
              <div className="glass-card p-8 border-slate-200 shadow-2xl shadow-slate-200 dark:shadow-none/50 bg-slate-900 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <ActivityIcon size={80} className="rotate-12" />
                </div>
                <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em] mb-8 relative z-10">OEE Quality Feedback Loop</h4>
                <div className="space-y-6 relative z-10">
                   <p className="text-[14px] font-bold text-slate-600 dark:text-white/70 leading-relaxed">
                     Checklist submissions directly modify the <span className="text-slate-900 dark:text-white font-black tracking-tight uppercase tracking-widest border-b-2 border-blue-500/50 pb-0.5">Quality-Indicator</span> of the global OEE formula.
                   </p>
                   <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 rounded-3xl flex items-center justify-between shadow-inner group-hover:bg-slate-100 dark:bg-white/10 transition-colors">
                      <div>
                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Global Quality Yield</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{(100 - (qualityData.totalDefects / (qualityData.totalBatches * 50 || 1) * 100)).toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="w-14 h-14 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-[spin_8s_linear_infinite] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <TrendingUp size={18} className="text-emerald-500 rotate-45" />
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex-1 h-px glass-card" />
                      <span className="text-[10px] font-black text-slate-600 dark:text-white/70 tracking-[0.3em] uppercase">Real-time Cascade</span>
                      <div className="flex-1 h-px glass-card" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      {['MX01', 'MX02', 'MX03', 'MX04'].map(m => (
                        <div key={m} className="p-4 bg-white/5 rounded-2xl border border-slate-200 hover:bg-white/10 transition-colors border-l-2 border-l-blue-500/50">
                          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-2 tracking-widest">{m}</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{((1 - (qualityData.batches.filter(b => b.machine_id === m).reduce((s, b) => s + b.defect_count, 0) / (qualityData.batches.filter(b => b.machine_id === m).reduce((s, b) => s + b.units_checked, 0) || 1))) * 100).toFixed(1)}%</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="glass-card p-8 border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200 dark:shadow-none h-fit dark:bg-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Active QC Intelligence</h4>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-lg shadow-rose-500/50"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse [animation-delay:200ms]"></div>
                  </div>
                </div>
                <div className="space-y-5">
                  {qualityData.totalDefects > 15 ? (
                    <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex gap-4 shadow-sm border-l-4 border-l-rose-500 group cursor-pointer hover:bg-rose-100 transition-colors">
                      <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="text-[13px] font-black text-rose-900 uppercase tracking-tight">Yield Drop Alert: MX03</p>
                        <p className="text-[11px] font-bold text-rose-600/80 mt-1.5 tracking-tight uppercase leading-relaxed font-black">Welding failure recurrence pattern detected in line G4.</p>
                      </div>
                    </div>
                  ) : null}
                  
                  {qualityData.allDefects.some(d => d.status === 'open' && d.corrective_action === 'pending') && (
                    <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4 shadow-sm border-l-4 border-l-amber-500 group cursor-pointer hover:bg-amber-100 transition-colors">
                      <Clock className="text-amber-600 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="text-[13px] font-black text-amber-900 uppercase tracking-tight">Disposition Required</p>
                        <p className="text-[11px] font-bold text-amber-600/80 mt-1.5 tracking-tight uppercase font-black">3 rejected units from BATCH-G82 awaiting final disposal.</p>
                      </div>
                    </div>
                  )}

                  <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-4 shadow-sm border-l-4 border-l-emerald-500 group cursor-pointer hover:bg-emerald-100 transition-colors">
                    <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-[13px] font-black text-emerald-900 uppercase tracking-tight">Conformance High</p>
                      <p className="text-[11px] font-bold text-emerald-600/80 mt-1.5 tracking-tight uppercase font-black">MX01 line operating at 99.8% geometric precision yield.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* New Review Modal */}
      <AnimatePresence>
        {showChecklistModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChecklistModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[var(--glass-dark)] rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh] border border-slate-200"
            >
              <div className="p-10 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white/80 border-b border-slate-200 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <ShieldCheck size={120} />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="bg-slate-900 p-4 rounded-[1.25rem] text-white shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                      <ClipboardCheck size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Digital Inspection</h3>
                      <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] mt-3 opacity-60">Authentication Layer Protocol v7.2-ALPHA</p>
                    </div>
                  </div>
                  <button onClick={() => setShowChecklistModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white p-2.5 rounded-2xl hover:bg-slate-200/50 transition-all active:scale-90 glass-card border border-slate-200">
                    <XCircle size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-2 gap-8 font-black uppercase tracking-tight">
                  <div className="space-y-3">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.2em] ml-1">Target Station</label>
                    <select 
                      value={selectedMachine}
                      onChange={(e) => {
                        setSelectedMachine(e.target.value);
                        setChecklistResults([]);
                      }}
                      className="w-full h-16 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white border-2 border-slate-200 rounded-2xl px-6 text-[15px] font-black focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:bg-white dark:hover:bg-white/10 shadow-inner"
                    >
                      <option value="MX01">MX01 — Primary Extruder</option>
                      <option value="MX02">MX02 — Thermal Processor</option>
                      <option value="MX03">MX03 — Cooling Module</option>
                      <option value="MX04">MX04 — Final Packing</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.2em] ml-1">Operator ID</label>
                    <input 
                      type="text" 
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full h-16 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white border-2 border-slate-200 rounded-2xl px-6 text-[15px] font-black focus:ring-8 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-inner"
                      placeholder="Auth token..."
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
                    <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] flex items-center gap-3">
                      <ShieldCheck size={16} /> Validation Points
                    </h4>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
                  </div>
                  
                  {checklistTemplates.find(t => t.id === `CL-${selectedMachine}`)?.steps.map((step, idx) => {
                    const result = checklistResults.find(r => r.step_id === step.id);
                    const isPass = result?.result === 'pass' || !result;
                    const isFail = result?.result === 'fail';

                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={step.id} 
                        className={`p-6 rounded-3xl border-2 transition-all group ${isFail ? 'bg-rose-50 border-rose-200 shadow-[0_10px_30px_rgba(244,63,94,0.15)] shadow-rose-100' : isPass && result ? 'bg-emerald-50 border-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.15)]' : 'bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white border-slate-200 hover:border-slate-200 hover:glass-card'}`}
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex gap-5">
                            <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm h-fit mt-1 shadow-2xl transition-all ${isFail ? 'bg-rose-600 text-slate-900 dark:text-white rotate-6' : isPass && result ? 'bg-emerald-600 text-white -rotate-6' : 'bg-slate-900 text-white'}`}>
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base leading-tight">{step.label}</p>
                              <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mt-2 max-w-[320px] leading-relaxed opacity-80 uppercase tracking-tight">{step.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 p-1.5 bg-slate-200/40 rounded-[1.25rem] shadow-inner shrink-0">
                            <button 
                              onClick={() => handleToggleStep(step.id)}
                              className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isPass && result ? 'bg-emerald-500 text-slate-900 dark:text-white shadow-xl rotate-0' : 'text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white'}`}
                            >
                              Pass
                            </button>
                            <button 
                              onClick={() => {
                                if (result?.result !== 'fail') handleToggleStep(step.id);
                              }}
                              className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isFail ? 'bg-rose-500 text-slate-900 dark:text-white shadow-xl' : 'text-slate-400 hover:text-rose-600 hover:bg-white'}`}
                            >
                              Fail
                            </button>
                          </div>
                        </div>
                        {isFail && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="mt-6 pt-6 border-t-2 border-rose-200/50"
                          >
                            <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest block mb-3">Root Cause & Evidence Notes</label>
                            <textarea 
                              placeholder="Describe structural or procedural anomaly..." 
                              className="w-full bg-white/60 border-2 border-rose-200 rounded-[1.25rem] p-5 text-[14px] font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-8 focus:ring-rose-500/5 focus:border-rose-400 h-28 placeholder:text-rose-300 transition-all resize-none"
                              onChange={(e) => handleSetNotes(step.id, e.target.value)}
                            />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <div className="p-10 bg-blue-900 text-slate-900 dark:text-white rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-blue-800 opacity-0 group-hover:opacity-100 transition-opacity translate-y-full hover:translate-y-0 duration-700 bg-[linear-gradient(to_right,#3b82f6_2px,transparent_1px),linear-gradient(to_bottom,#3b82f6_2px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                   <div className="relative z-10">
                     <p className="text-[11px] font-black text-blue-300 uppercase tracking-[0.4em] mb-3">Inspection Payload</p>
                     <p className="text-[14px] font-bold text-blue-100 leading-tight uppercase opacity-60">Total batch quantity for dynamic weighted feedback</p>
                   </div>
                   <div className="relative z-10 flex items-center gap-6">
                      <div className="relative">
                        <input 
                          type="number" 
                          value={unitsChecked}
                          onChange={(e) => setUnitsChecked(parseInt(e.target.value))}
                          className="w-32 h-20 bg-white/10 border-2 border-white/20 rounded-2xl text-[28px] font-black text-slate-900 dark:text-white text-center focus:ring-8 focus:ring-white/10 focus:border-white transition-all appearance-none shadow-inner outline-none"
                        />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[8px] font-black px-3 py-1 rounded-full border border-blue-400 shadow-xl border-2">QTY</div>
                      </div>
                      <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] rotate-90 origin-center translate-x-3">Batch Units</span>
                   </div>
                </div>
              </div>

              <div className="p-10 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white border-t-2 border-slate-200 backdrop-blur-md">
                <button 
                  onClick={handleSubmit}
                  className="w-full py-6 bg-slate-900 text-white font-black text-[16px] uppercase tracking-[0.4em] rounded-3xl hover:bg-black transition-all shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-none flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] border-t-4 border-slate-700"
                >
                  <FileCheck size={24} className="animate-pulse" />
                  Finalize Quality Release
                </button>
                <div className="flex items-center justify-center gap-3 mt-6">
                   <div className="h-px w-8 bg-slate-200" />
                   <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] inline-flex items-center gap-2">
                     <ShieldCheck size={10} className="text-emerald-500" /> Verified by Stratum Kernel Protocol {new Date().getFullYear()}
                   </p>
                   <div className="h-px w-8 bg-slate-200" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StatusBadge({ status }: { status: QualityBatch['status'] }) {
  const styles = {
    passed: 'bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 font-black shadow-[0_2px_10px_rgba(16,185,129,0.1)]',
    failed: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 font-black shadow-[0_2px_10px_rgba(244,63,94,0.1)]',
    rework: 'bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 font-black shadow-[0_2px_10px_rgba(37,99,235,0.1)]',
    open: 'bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 font-black shadow-[0_2px_10px_rgba(245,158,11,0.1)]',
  };

  return (
    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
      {status}
    </span>
  );
}

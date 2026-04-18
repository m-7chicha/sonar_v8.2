"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  subscribeToUpdates, 
  MachineState, 
  ExecutivePulseMetrics,
  getExecutivePulseMetrics,
  Alert
} from '@/lib/mathEngine';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity, BarChart3, ClipboardCheck, Info, LayoutDashboard, Package, Satellite, Shield, ShieldAlert, TrendingUp, User, Users, Zap } from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';

export default function ExecutivePulse() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const [data, setData] = useState<{ machines: MachineState[]; executivePulse: ExecutivePulseMetrics }>({
    machines: [],
    executivePulse: getExecutivePulseMetrics()
  });

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
    const unsubscribe = subscribeToUpdates((newData) => {
      setData(newData);
    });
    return () => unsubscribe();
  }, []);

  if (!mounted) return null;

  const { machines, executivePulse } = data;

  return (
    <div className="flex flex-1 w-full min-h-screen relative">
      {/* Precision Sidebar */}
      

      {/* Main Experience Area */}
      <main className="flex-1 w-full relative p-8">
        <header className="flex justify-between items-center mb-12">
          <nav className="flex items-center gap-4 text-[11px] font-black tracking-[0.2em] uppercase">
            <span className="text-blue-600 dark:text-blue-400">Strata-Matrix</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-500 dark:text-slate-400">Pulse Dashboard</span>
          </nav>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-full px-5 py-2.5 shadow-sm dark:shadow-none">
              <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 mono antialiased uppercase">Live-Tick: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center shadow-2xl shadow-slate-900/40 dark:shadow-white/20 transform -rotate-3 transition-transform hover:rotate-0 cursor-pointer">
              <span className="text-xl"><User size={20} className="text-white dark:text-slate-900" /></span>
            </div>
          </div>
        </header>

        <section className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-9 space-y-12">
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-8">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
                >
                  Pulse Monitor
                </motion.h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1 opacity-80">Operational telemetry overview for Floor-Alpha Deployment.</p>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-2.5 glass-card rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm">Export Data</button>
                <button className="px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black dark:hover:bg-blue-500 transition-all shadow-xl shadow-slate-900/20 dark:shadow-blue-600/20">System Report</button>
              </div>
            </div>

            {/* Metric Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="System OEE" value={`${executivePulse.globalOEE}%`} trend="+2.4" icon={<Shield className="w-5 h-5 text-emerald-400" />} />
              <MetricCard title="Node Status" value={executivePulse.runningMachines} trend="Active" icon={<Satellite className="w-5 h-5 text-blue-400" />} />
              <MetricCard title="Risk Vector" value={`$${executivePulse.revenueAtRisk.toLocaleString()}`} trend="-12.1" icon={<Zap className="w-5 h-5 text-rose-400" />} danger />
              <MetricCard title="Job Volume" value="1,240" trend="+84" icon={<Package className="w-5 h-5 text-indigo-400" />} />
            </div>

            
            <div className="glass-card p-8 relative overflow-hidden">
               <div className="flex justify-between items-center mb-8 relative z-10">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Efficiency Trend-Line</h3>
                 <div className="flex gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-300">
                   <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></span> Target (85%)</span>
                   <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Telemetry</span>
                 </div>
               </div>
               
               <div className="h-48 w-full mt-4 relative z-10" style={{ minHeight: 192 }}>
                 <ResponsiveContainer width="100%" height={192}>
                   <AreaChart data={[
                     { time: '08:00', target: 85, fill: 40 },
                     { time: '10:00', target: 85, fill: 65 },
                     { time: '12:00', target: 85, fill: 52 },
                     { time: '14:00', target: 85, fill: 78 },
                     { time: '16:00', target: 85, fill: 45 },
                     { time: '18:00', target: 85, fill: 89 },
                     { time: '20:00', target: 85, fill: 56 },
                     { time: 'NOW', target: 85, fill: executivePulse.globalOEE }
                   ]}>
                     <defs>
                       <linearGradient id="colorFill" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1}/>
                         <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1E293B' : '#E2E8F0'} />
                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }} domain={[0, 100]} />
                     <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : 'none', background: theme === 'dark' ? 'rgba(15,23,42,0.9)' : '#fff', backdropFilter: 'blur(12px)', color: theme === 'dark' ? '#F8FAFC' : '#0F172A', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }} 
                       formatter={(v) => [`${v}%`, 'Efficiency']} 
                     />
                     <Area type="monotone" dataKey="target" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="4 4" fill="url(#colorTarget)" />
                     <Area type="monotone" dataKey="fill" stroke="#3B82F6" strokeWidth={3} fill="url(#colorFill)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Matrix Table */}
            <div className="glass-card p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
                <h3 className="text-lg font-black tracking-tight uppercase dark:text-white">Node Integrity Matrix</h3>
                <div className="flex gap-3">
                   <input type="text" placeholder="QUERY NODE..." className="bg-slate-50 dark:bg-slate-900/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-blue-600/20 w-40" />
                   <button className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500">Filters</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-900/50 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Protocol-ID</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Session status</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Efficiency Vector</th>
                      <th className="px-6 py-4 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Yield Momentum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                     <AnimatePresence mode="popLayout">
                      {machines.map((node) => (
                        <motion.tr 
                          key={node.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-colors"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-white text-[10px] mono transform group-hover:rotate-6 transition-transform border border-transparent dark:border-slate-700">{node.id}</div>
                              <div>
                                 <p className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">{node.product_name}</p>
                                 <p className="text-[8px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mono">Node-{node.id.toLowerCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                             <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                               node.status === 'running' ? 'bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' : 
                               node.status === 'paused' ? 'bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                             }`}>
                               <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                               {node.status}
                             </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                             <span className="text-lg font-black text-slate-900 dark:text-white mono">{(Math.random() * 20 + 70).toFixed(1)}%</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="space-y-2">
                               <div className="flex justify-between text-[9px] font-black mono text-slate-500 uppercase tracking-wide">
                                 <span>{Math.floor(node.units_produced)}/{node.units_target}</span>
                                 <span className={node.progress_status === 'ahead' ? 'text-emerald-600' : 'text-rose-600'}>
                                   {node.progress_delta! > 0 ? '+' : ''}{node.progress_delta} units
                                 </span>
                               </div>
                               <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                 <motion.div 
                                  className={`h-full ${node.progress_status === 'ahead' ? 'bg-blue-600' : 'bg-rose-500'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (node.units_produced / node.units_target) * 100)}%` }}
                                 ></motion.div>
                               </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                     </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Alert Feed */}
          <div className="col-span-12 lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Incident Feed</h3>
              <div className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-black animate-pulse">LIVE</div>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {executivePulse.alerts.length === 0 ? (
                  <div className="p-8 text-center glass-card opacity-50">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No active alerts</p>
                  </div>
                ) : (
                  executivePulse.alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="glass-card bg-slate-900 dark:bg-white/5 border border-transparent dark:border-white/10 p-6 text-white relative overflow-hidden group">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-3 relative z-10 dark:text-white">AI Predictor</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider relative z-10 mb-6">System expects material shortage on Node-02 in <span className="text-amber-500">42 mins</span>.</p>
              <button className="w-full py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-xl text-[10px] uppercase tracking-widest relative z-10 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Adjust Logistics</button>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full group-hover:bg-blue-500/20/30 transition-all"></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const isCritical = alert.type === 'critical';
  const Icon = isCritical ? ShieldAlert : Activity;
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-sm dark:shadow-xl border border-slate-200/50 dark:border-slate-800/50 border-l-4 flex gap-4 ${
        isCritical ? 'border-l-rose-500' : 'border-l-amber-500'
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
      }`}>
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className={`text-[8px] font-black uppercase tracking-widest ${
            isCritical ? 'text-rose-400' : 'text-amber-400'
          }`}>{alert.type}</span>
          <span className="text-[8px] font-black text-slate-500 mono">{new Date(alert.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight">{alert.message}</p>
      </div>
    </motion.div>
  );
}


function MetricCard({ title, value, trend, icon, danger = false }: any) {
  const isPositive = trend.startsWith('+') || trend === 'Active';
  
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card p-6 flex flex-col justify-between group transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner transform group-hover:-rotate-6 transition-transform bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">{icon}</div>
        <div className={`px-2 py-1 rounded-full text-[9px] font-black mono flex items-center gap-1 border ${
          isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          {isPositive ? '▲' : '▼'} {trend}
        </div>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mono antialiased truncate">{value}</p>
      </div>
    </motion.div>
  );
}

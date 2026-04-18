"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  ReactFlow, Background, Controls, Node, Edge,
  Handle, Position, ConnectionLineType, BaseEdge,
  getBezierPath, EdgeProps, BackgroundVariant, Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  subscribeToUpdates, MachineState, getExecutivePulseMetrics,
  calculateOEE, calculateAvailability, calculatePerformance, calculateQuality
} from '@/lib/mathEngine';
import { Activity, AlertTriangle, BarChart3, Box, CheckCircle, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Cpu, Database, Flame, Gauge, HardDrive, Info, Layers, MapPin, Package, PauseCircle, Radio, Server, Settings, Shield, Thermometer, TrendingUp, User, Users, Wind, Wrench, X, Zap } from 'lucide-react';
import Link from 'next/link';

// ─── FACTORY SECTION TREE ──────────────────────────────────────────────────

interface FactorySection {
  id: string;
  label: string;
  zone: string;
  color: string;
  machines: SectionMachine[];
}

interface SectionMachine {
  id: string;
  label: string;
  type: 'extruder' | 'thermal' | 'cooling' | 'packing' | 'conveyor' | 'press' | 'welding' | 'cnc';
  machineStateId?: string; // links to live mathEngine data
  status: 'running' | 'stopped' | 'paused' | 'maintenance' | 'idle';
  temp?: number;
  load?: number;
  rpm?: number;
  pressure?: number;
}

const FACTORY_SECTIONS: FactorySection[] = [
  {
    id: 'ZONE-A',
    label: 'Production Zone A',
    zone: 'Primary Fabrication',
    color: '#3b82f6',
    machines: [
      { id: 'MX01', label: 'Primary Extruder', type: 'extruder', machineStateId: 'MX01', status: 'running', temp: 198, load: 87, rpm: 1240 },
      { id: 'MX01-B', label: 'Feed Hopper',     type: 'conveyor', status: 'running', load: 72, rpm: 320 },
      { id: 'MX01-C', label: 'Die Head Press',  type: 'press',    status: 'paused',  temp: 185, pressure: 42 },
    ]
  },
  {
    id: 'ZONE-B',
    label: 'Thermal Processing',
    zone: 'Heat Treatment',
    color: '#f59e0b',
    machines: [
      { id: 'MX02',   label: 'Thermal Processor', type: 'thermal',   machineStateId: 'MX02', status: 'stopped', temp: 350, pressure: 0 },
      { id: 'MX02-B', label: 'Heat Exchanger',    type: 'thermal',   status: 'running',      temp: 280, pressure: 18 },
      { id: 'MX02-C', label: 'Tempering Unit',    type: 'thermal',   status: 'running',      temp: 160, load: 61 },
      { id: 'MX02-D', label: 'Quench Tank',       type: 'cooling',   status: 'idle',         temp: 28 },
    ]
  },
  {
    id: 'ZONE-C',
    label: 'Cooling & Finishing',
    zone: 'Surface Treatment',
    color: '#10b981',
    machines: [
      { id: 'MX03',   label: 'Cooling Module',    type: 'cooling',  machineStateId: 'MX03', status: 'running', temp: 12, load: 95, rpm: 2800 },
      { id: 'MX03-B', label: 'CNC Router',        type: 'cnc',      status: 'running',       load: 78, rpm: 4500 },
      { id: 'MX03-C', label: 'Surface Finisher',  type: 'press',    status: 'running',       load: 55, rpm: 680 },
      { id: 'MX03-D', label: 'Deburring Unit',    type: 'cnc',      status: 'maintenance' },
      { id: 'MX03-E', label: 'Inspection Station',type: 'conveyor', status: 'running', load: 40 },
    ]
  },
  {
    id: 'ZONE-D',
    label: 'Final Packing',
    zone: 'Logistics & Dispatch',
    color: '#8b5cf6',
    machines: [
      { id: 'MX04',   label: 'Auto Packing Line', type: 'packing',  machineStateId: 'MX04', status: 'running', load: 88, rpm: 560 },
      { id: 'MX04-B', label: 'Labelling Robot',   type: 'conveyor', status: 'running',       load: 92 },
      { id: 'MX04-C', label: 'Shrink Wrapper',    type: 'packing',  status: 'running',       temp: 72, load: 74 },
      { id: 'MX04-D', label: 'Palletiser',        type: 'packing',  status: 'paused',        load: 0 },
    ]
  },
  {
    id: 'ZONE-E',
    label: 'Utilities & Infrastructure',
    zone: 'Support Systems',
    color: '#64748b',
    machines: [
      { id: 'UTIL-01', label: 'Compressed Air Unit', type: 'cooling',  status: 'running',   pressure: 8 },
      { id: 'UTIL-02', label: 'Hydraulic Station',   type: 'press',    status: 'running',   pressure: 200, temp: 48 },
      { id: 'UTIL-03', label: 'Welding Bay A',       type: 'welding',  status: 'stopped' },
      { id: 'UTIL-04', label: 'Welding Bay B',       type: 'welding',  status: 'running',   load: 65 },
    ]
  },
];

const STATUS_CFG = {
  running:     { dot: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200', ring: 'border-emerald-400',  label: 'Running',     glow: '#10b981' },
  stopped:     { dot: 'bg-rose-500',    badge: 'text-rose-700 bg-rose-50 border-rose-200',          ring: 'border-rose-400',     label: 'Stopped',    glow: '#ef4444' },
  paused:      { dot: 'bg-amber-500',   badge: 'text-amber-700 bg-amber-50 border-amber-200',        ring: 'border-amber-400',    label: 'Paused',     glow: '#f59e0b' },
  maintenance: { dot: 'bg-blue-400',   badge: 'text-blue-700 bg-blue-50 border-blue-200',           ring: 'border-blue-400',    label: 'Maintenance', glow: '#3b82f6' },
  idle:        { dot: 'bg-slate-400',   badge: 'text-slate-600 dark:text-white/70 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white border-slate-200 dark:border-white/10',        ring: 'border-slate-300',   label: 'Idle',       glow: '#94a3b8' },
};

const MACHINE_ICONS: Record<string, React.ReactNode> = {
  extruder:  <Cpu size={16} />,
  thermal:   <Flame size={16} />,
  cooling:   <Wind size={16} />,
  packing:   <Box size={16} />,
  conveyor:  <Radio size={16} />,
  press:     <Gauge size={16} />,
  welding:   <Zap size={16} />,
  cnc:       <Settings size={16} />,
};

// ─── REACT FLOW CUSTOM NODES ────────────────────────────────────────────────

const LiveMachineNode = ({ data }: { data: { machine: SectionMachine; liveState?: MachineState } }) => {
  const { machine, liveState } = data;
  const cfg = STATUS_CFG[machine.status];
  const oee = liveState ? (calculateOEE(liveState) * 100).toFixed(1) : null;
  const fillPct = liveState ? Math.min(100, (liveState.units_produced / liveState.units_target) * 100) : 0;

  return (
    <div className={`rounded-2xl border-2 shadow-xl bg-white dark:bg-[var(--glass-dark)] transition-all duration-500 w-[230px] ${cfg.ring}`}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-slate-300 !border-2 !border-white" />
      <div className={`px-4 py-3 border-b rounded-t-2xl flex items-center justify-between`}
           style={{ borderBottomColor: `${cfg.glow}22`, background: `${cfg.glow}0a` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-900 dark:text-white"
               style={{ backgroundColor: cfg.glow }}>
            {MACHINE_ICONS[machine.type]}
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-500 dark:text-white/60 uppercase tracking-widest leading-none mb-0.5">{machine.id}</p>
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{machine.label}</h3>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${cfg.dot} ${machine.status === 'running' ? 'animate-pulse' : ''}`} />
      </div>

      <div className="p-3 space-y-2.5">
        {oee && (
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-500 dark:text-white/60 uppercase tracking-widest">OEE</span>
            <span className="text-base font-black text-slate-900 dark:text-white mono">{oee}%</span>
          </div>
        )}
        {liveState && (
          <>
            <div className="flex justify-between text-[9px] mb-1">
              <span className="font-black text-slate-500 dark:text-white/60 uppercase tracking-widest">Output</span>
              <span className="font-black text-slate-700 dark:text-white/80 mono">{liveState.units_produced}/{liveState.units_target}</span>
            </div>
            <div className="w-full h-1 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${fillPct}%`, backgroundColor: cfg.glow }} />
            </div>
          </>
        )}
        {machine.temp && <div className="flex justify-between text-[9px]"><span className="font-black text-slate-500 dark:text-white/60 uppercase tracking-widest flex items-center gap-1"><Thermometer size={9} />Temp</span><span className="font-black text-slate-700 dark:text-white/80 mono">{machine.temp}°C</span></div>}
        {machine.load && <div className="flex justify-between text-[9px]"><span className="font-black text-slate-500 dark:text-white/60 uppercase tracking-widest flex items-center gap-1"><Gauge size={9} />Load</span><span className="font-black text-slate-700 dark:text-white/80 mono">{machine.load}%</span></div>}
        {machine.rpm && <div className="flex justify-between text-[9px]"><span className="font-black text-slate-500 dark:text-white/60 uppercase tracking-widest flex items-center gap-1"><Radio size={9} />RPM</span><span className="font-black text-slate-700 dark:text-white/80 mono">{machine.rpm.toLocaleString()}</span></div>}
        {machine.pressure && <div className="flex justify-between text-[9px]"><span className="font-black text-slate-500 dark:text-white/60 uppercase tracking-widest flex items-center gap-1"><Gauge size={9} />Press.</span><span className="font-black text-slate-700 dark:text-white/80 mono">{machine.pressure} bar</span></div>}
        {machine.status === 'stopped' && (
          <div className="flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-100 rounded-lg mt-1">
            <AlertTriangle size={11} className="text-rose-600 shrink-0" />
            <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest">Critical Stoppage</span>
          </div>
        )}
        {machine.status === 'maintenance' && (
          <div className="flex items-center gap-1.5 p-2 bg-blue-50 border border-blue-100 rounded-lg mt-1">
            <Wrench size={11} className="text-blue-600 shrink-0" />
            <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Under Maintenance</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-slate-300 !border-2 !border-white" />
    </div>
  );
};

const SectionGroupNode = ({ data }: { data: { section: FactorySection } }) => {
  const { section } = data;
  return (
    <div className="rounded-3xl border-2 border-dashed px-6 py-4 min-w-[320px]"
         style={{ borderColor: `${section.color}60`, background: `${section.color}06` }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: section.color }} />
        <h3 className="text-[11px] font-black text-slate-700 dark:text-white/80 uppercase tracking-widest">{section.label}</h3>
      </div>
      <p className="text-[9px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-widest pl-6">{section.zone}</p>
    </div>
  );
};

const nodeTypes = { machine: LiveMachineNode, section: SectionGroupNode };

function AnimatedEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd }: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 3, stroke: '#cbd5e1', strokeDasharray: '8 5' }} />
      <circle r="4" fill="#3b82f6" opacity="0.8">
        <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
}

const edgeTypes = { animated: AnimatedEdge };

// ─── FLOOR PLAN COMPONENT ───────────────────────────────────────────────────

const FloorPlanView = ({ machines }: { machines: MachineState[] }) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  // Pan & Zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setTransform(t => {
        let newScale = t.scale * (e.deltaY > 0 ? 0.9 : 1.1);
        newScale = Math.max(0.2, Math.min(newScale, 4));
        return { ...t, scale: newScale };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target instanceof Element && e.target.closest('.interactive-zone')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    if (e.currentTarget instanceof Element) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setTransform(t => ({ ...t, x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }));
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (e.currentTarget instanceof Element) e.currentTarget.releasePointerCapture(e.pointerId);
  };


  const zones = [
    { id: 'A', label: 'Zone A — Primary Fab', x: 40,  y: 40,  w: 280, h: 200, color: '#3b82f6', machines: ['MX01', 'MX01-B', 'MX01-C'] },
    { id: 'B', label: 'Zone B — Thermal',     x: 360, y: 40,  w: 320, h: 200, color: '#f59e0b', machines: ['MX02', 'MX02-B', 'MX02-C', 'MX02-D'] },
    { id: 'C', label: 'Zone C — Cooling',     x: 40,  y: 290, w: 320, h: 200, color: '#10b981', machines: ['MX03', 'MX03-B', 'MX03-C', 'MX03-D', 'MX03-E'] },
    { id: 'D', label: 'Zone D — Packing',     x: 400, y: 290, w: 280, h: 200, color: '#8b5cf6', machines: ['MX04', 'MX04-B', 'MX04-C', 'MX04-D'] },
    { id: 'E', label: 'Utilities',            x: 720, y: 40,  w: 200, h: 450, color: '#64748b', machines: ['UTIL-01', 'UTIL-02', 'UTIL-03', 'UTIL-04'] },
  ];

  const MACHINE_DOTS = [
    { id: 'MX01',    zoneId: 'A', x: 90,  y: 120, liveId: 'MX01' },
    { id: 'MX01-B',  zoneId: 'A', x: 160, y: 100, liveId: null   },
    { id: 'MX01-C',  zoneId: 'A', x: 230, y: 140, liveId: null, status: 'paused' },
    { id: 'MX02',    zoneId: 'B', x: 420, y: 120, liveId: 'MX02' },
    { id: 'MX02-B',  zoneId: 'B', x: 510, y: 100, liveId: null   },
    { id: 'MX02-C',  zoneId: 'B', x: 580, y: 130, liveId: null   },
    { id: 'MX02-D',  zoneId: 'B', x: 620, y: 195, liveId: null, status: 'idle' },
    { id: 'MX03',    zoneId: 'C', x: 80,  y: 380, liveId: 'MX03' },
    { id: 'MX03-B',  zoneId: 'C', x: 160, y: 355, liveId: null   },
    { id: 'MX03-C',  zoneId: 'C', x: 230, y: 380, liveId: null   },
    { id: 'MX03-D',  zoneId: 'C', x: 180, y: 440, liveId: null, status: 'maintenance' },
    { id: 'MX03-E',  zoneId: 'C', x: 290, y: 430, liveId: null   },
    { id: 'MX04',    zoneId: 'D', x: 460, y: 380, liveId: 'MX04' },
    { id: 'MX04-B',  zoneId: 'D', x: 520, y: 355, liveId: null   },
    { id: 'MX04-C',  zoneId: 'D', x: 570, y: 400, liveId: null   },
    { id: 'MX04-D',  zoneId: 'D', x: 610, y: 440, liveId: null, status: 'paused' },
    { id: 'UTIL-01', zoneId: 'E', x: 790, y: 100, liveId: null   },
    { id: 'UTIL-02', zoneId: 'E', x: 790, y: 200, liveId: null   },
    { id: 'UTIL-03', zoneId: 'E', x: 790, y: 320, liveId: null, status: 'stopped' },
    { id: 'UTIL-04', zoneId: 'E', x: 790, y: 420, liveId: null   },
  ];

  const getStatus = (dot: typeof MACHINE_DOTS[0]) => {
    if (dot.liveId) {
      const m = machines.find(m => m.id === dot.liveId);
      return m?.status || 'idle';
    }
    return (dot as any).status || 'running';
  };

  const STATUS_DOT_COLOR: Record<string, string> = {
    running: '#10b981', stopped: '#ef4444', paused: '#f59e0b', maintenance: '#3b82f6', idle: '#94a3b8'
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-white/10">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Factory Floor Plan</h3>
          <p className="text-[11px] font-bold text-slate-500 dark:text-white/60 mt-0.5">Workshop Alpha — Ground Floor — 955 m²</p>
        </div>
        <div className="flex items-center gap-6 text-[10px] font-black">
          {Object.entries({ running: 'Operational', stopped: 'Critical', paused: 'Warning', maintenance: 'Maintenance', idle: 'Idle' }).map(([s, l]) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_DOT_COLOR[s] }} />
              <span className="text-slate-500 dark:text-white/60 uppercase tracking-widest">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white"
           ref={containerRef}
           onPointerDown={handlePointerDown}
           onPointerMove={handlePointerMove}
           onPointerUp={handlePointerUp}
           onPointerCancel={handlePointerUp}
      >
        <div style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: 'center center', width: '100%', height: '100%', transition: isDragging ? 'none' : 'transform 0.1s ease-out', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 960 530" className="w-full h-full drop-shadow-sm select-none" style={{ minWidth: 960, minHeight: 530 }}>
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="960" height="530" fill="#f8fafc" rx="12" />
          <rect width="960" height="530" fill="url(#grid)" rx="12" />

          {/* Flow pipes between zones */}
          <line x1="320" y1="140" x2="360" y2="140" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 4" />
          <line x1="360" y1="390" x2="400" y2="390" stroke="#cbd5e1" strokeWidth="4" strokeDasharray="8 4" />
          <line x1="200" y1="240" x2="200" y2="290" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="6 4" />
          <line x1="520" y1="240" x2="520" y2="290" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="6 4" />
          <line x1="720" y1="140" x2="720" y2="140" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="6 4" />

          {/* Zone rectangles */}
          {zones.map(zone => (
            <g key={zone.id} className="interactive-zone" onClick={() => setSelectedZone(selectedZone === zone.id ? null : zone.id)} style={{ cursor: 'pointer' }}>
              <rect
                x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                rx="14" ry="14"
                fill={selectedZone === zone.id ? `${zone.color}18` : `${zone.color}0a`}
                stroke={zone.color}
                strokeWidth={selectedZone === zone.id ? 2.5 : 1.5}
                strokeDasharray={selectedZone === zone.id ? '0' : '6 3'}
              />
              <text x={zone.x + 16} y={zone.y + 26} fontSize="10" fontWeight="900" fill={zone.color} fontFamily="monospace" letterSpacing="1.5">{zone.label}</text>
            </g>
          ))}

          {/* Walkways */}
          <rect x="330" y="40" width="22" height="450" fill="white" opacity="0.6" />
          <rect x="40" y="258" width="880" height="24" fill="white" opacity="0.6" />

          {/* Machine dots */}
          {MACHINE_DOTS.map(dot => {
            const status = getStatus(dot);
            const color = STATUS_DOT_COLOR[status];
            const isLive = !!dot.liveId;
            return (
              <g key={dot.id}>
                {isLive && (
                  <circle cx={dot.x} cy={dot.y} r="14" fill={color} opacity="0.15">
                    <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={dot.x} cy={dot.y} r={isLive ? 10 : 7} fill={color} filter={isLive ? 'url(#glow)' : ''} />
                <circle cx={dot.x} cy={dot.y} r={isLive ? 5 : 3.5} fill="white" />
                <text x={dot.x + 14} y={dot.y + 4} fontSize="8" fontWeight="800" fill="#475569" fontFamily="monospace">{dot.id}</text>
              </g>
            );
          })}

          {/* Compass */}
          <g transform="translate(910, 490)">
            <circle cx="0" cy="0" r="18" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
            <text x="0" y="-6" textAnchor="middle" fontSize="9" fontWeight="900" fill="#3b82f6">N</text>
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#3b82f6" strokeWidth="1.5" />
          </g>

          {/* Scale bar */}
          <g transform="translate(40, 510)">
            <line x1="0" y1="0" x2="80" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="80" y1="-4" x2="80" y2="4" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="40" y="-7" textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8">10 m</text>
          </g>
        </svg>
        </div>

        {/* Zone detail pop-up */}
        {selectedZone && (() => {
          const zone = zones.find(z => z.id === selectedZone)!;
          const section = FACTORY_SECTIONS.find(s => s.id === `ZONE-${selectedZone}`)!;
          const liveMachines = section?.machines.map(sm => machines.find(m => m.id === sm.machineStateId)).filter(Boolean) as MachineState[];
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-8 left-8 right-8 z-50 glass-card p-6 border-l-4 shadow-2xl cursor-default" style={{ borderLeftColor: zone.color }} onPointerDown={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{zone.label}</h4>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-white/60 mt-0.5">{zone.machines.length} machines in this zone</p>
                </div>
                <button onClick={() => setSelectedZone(null)} className="p-2 hover:bg-slate-100 dark:bg-white/10 rounded-lg transition-colors"><X size={16} className="text-slate-500 dark:text-white/60" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {section?.machines.map(sm => {
                  const live = machines.find(m => m.id === sm.machineStateId);
                  const cfg = STATUS_CFG[sm.status];
                  return (
                    <div key={sm.id} className={`p-4 rounded-xl border ${cfg.badge}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{sm.id}</span>
                      </div>
                      <p className="text-[11px] font-black text-slate-900 dark:text-white">{sm.label}</p>
                      {live && <p className="text-[10px] font-bold text-slate-500 dark:text-white/60 mt-1">OEE: {(calculateOEE(live) * 100).toFixed(1)}%</p>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}
      </div>
    </div>
  );
};

// ─── ASSETS REGISTRY VIEW ──────────────────────────────────────────────────

const AssetsView = ({ machines }: { machines: MachineState[] }) => {
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped' | 'paused' | 'maintenance' | 'idle'>('all');
  const [selectedAsset, setSelectedAsset] = useState<SectionMachine | null>(null);

  const allMachines = FACTORY_SECTIONS.flatMap(s => s.machines.map(m => ({ ...m, zone: s.label, zoneColor: s.color })));
  const filtered = filter === 'all' ? allMachines : allMachines.filter(m => m.status === filter);

  const counts = {
    running: allMachines.filter(m => m.status === 'running').length,
    stopped: allMachines.filter(m => m.status === 'stopped').length,
    paused: allMachines.filter(m => m.status === 'paused').length,
    maintenance: allMachines.filter(m => m.status === 'maintenance').length,
    idle: allMachines.filter(m => m.status === 'idle').length,
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-8 py-5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Asset Registry</h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-white/60 mt-0.5">{allMachines.length} registered assets across {FACTORY_SECTIONS.length} production zones</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 size={12} /> {counts.running} Operational
            </div>
            <div className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black border border-rose-200 flex items-center gap-2">
              <AlertTriangle size={12} /> {counts.stopped} Critical
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black border border-blue-200 flex items-center gap-2">
              <Wrench size={12} /> {counts.maintenance} Maintenance
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {(['all', 'running', 'stopped', 'paused', 'maintenance', 'idle'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400 hover:bg-slate-200'}`}
            >
              {f === 'all' ? `All (${allMachines.length})` : `${f} (${counts[f as keyof typeof counts]})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Asset Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-[var(--glass-dark)] z-10">
              <tr className="bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10">
                {['Asset ID', 'Name', 'Type', 'Zone', 'Status', 'Temperature', 'Load', 'RPM', 'Pressure', 'Live OEE', 'Details'].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-[9px] font-black text-slate-500 dark:text-white/60 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m: SectionMachine & { zone: string; zoneColor: string }) => {
                const cfg = STATUS_CFG[m.status];
                const live = machines.find(lm => lm.id === m.machineStateId);
                const oee = live ? (calculateOEE(live) * 100).toFixed(1) : null;
                const isSelected = selectedAsset?.id === m.id;
                return (
                  <tr key={m.id}
                    onClick={() => setSelectedAsset(isSelected ? null : m)}
                    className={`border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-100' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-900 dark:text-white text-[10px] font-black"
                             style={{ backgroundColor: m.zoneColor }}>
                          {MACHINE_ICONS[m.type]}
                        </div>
                        <span className="text-[11px] font-black text-slate-900 dark:text-white mono">{m.id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className="text-[12px] font-black text-slate-700 dark:text-white/80">{m.label}</span></td>
                    <td className="px-5 py-4"><span className="text-[10px] font-black text-slate-500 dark:text-white/60 uppercase tracking-wider">{m.type}</span></td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-white/70 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.zoneColor }} />
                        {m.zone.split('—')[0].trim()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black ${cfg.badge}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${m.status === 'running' ? 'animate-pulse' : ''}`} />
                        {cfg.label}
                      </div>
                    </td>
                    <td className="px-5 py-4"><span className="text-[11px] font-black mono text-slate-600 dark:text-white/70">{m.temp ? `${m.temp}°C` : '—'}</span></td>
                    <td className="px-5 py-4"><span className="text-[11px] font-black mono text-slate-600 dark:text-white/70">{m.load ? `${m.load}%` : '—'}</span></td>
                    <td className="px-5 py-4"><span className="text-[11px] font-black mono text-slate-600 dark:text-white/70">{m.rpm ? m.rpm.toLocaleString() : '—'}</span></td>
                    <td className="px-5 py-4"><span className="text-[11px] font-black mono text-slate-600 dark:text-white/70">{m.pressure ? `${m.pressure} bar` : '—'}</span></td>
                    <td className="px-5 py-4">
                      {oee
                        ? <span className="text-[13px] font-black mono" style={{ color: parseFloat(oee) >= 85 ? '#10b981' : parseFloat(oee) >= 65 ? '#f59e0b' : '#ef4444' }}>{oee}%</span>
                        : <span className="text-[10px] font-bold text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <button className="p-2 hover:bg-slate-100 dark:bg-white/10 rounded-lg transition-colors">
                        <Info size={14} className="text-slate-500 dark:text-white/60" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Asset Detail Panel */}
        <AnimatePresence>
          {selectedAsset && (() => {
            const live = machines.find(m => m.id === selectedAsset.machineStateId);
            const cfg = STATUS_CFG[selectedAsset.status];
            return (
              <motion.div
                initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
                className="w-80 bg-white dark:bg-[var(--glass-dark)] border-l border-slate-200 dark:border-white/10 overflow-y-auto shrink-0"
              >
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`px-2 py-0.5 rounded-lg border text-[9px] font-black ${cfg.badge}`}>{cfg.label}</div>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">{selectedAsset.id}</h4>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-white/60">{selectedAsset.label}</p>
                  </div>
                  <button onClick={() => setSelectedAsset(null)} className="p-2 hover:bg-slate-100 dark:bg-white/10 rounded-lg transition-colors mt-1">
                    <X size={16} className="text-slate-500 dark:text-white/60" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Technical specs */}
                  <div>
                    <h5 className="text-[9px] font-black text-slate-500 dark:text-white/60 uppercase tracking-[0.2em] mb-3">Technical Specs</h5>
                    <div className="space-y-2">
                      {[
                        { l: 'Asset Type',    v: selectedAsset.type.toUpperCase() },
                        { l: 'Temperature',   v: selectedAsset.temp  ? `${selectedAsset.temp}°C` : 'N/A' },
                        { l: 'Load',          v: selectedAsset.load  ? `${selectedAsset.load}%` : 'N/A' },
                        { l: 'Rotation Speed',v: selectedAsset.rpm   ? `${selectedAsset.rpm.toLocaleString()} RPM` : 'N/A' },
                        { l: 'Pressure',      v: selectedAsset.pressure ? `${selectedAsset.pressure} bar` : 'N/A' },
                      ].map(row => (
                        <div key={row.l} className="flex justify-between py-2 border-b border-slate-200 dark:border-white/10">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-white/60">{row.l}</span>
                          <span className="text-[11px] font-black text-slate-900 dark:text-white mono">{row.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live OEE if linked */}
                  {live && (
                    <div>
                      <h5 className="text-[9px] font-black text-slate-500 dark:text-white/60 uppercase tracking-[0.2em] mb-3">Live Performance</h5>
                      <div className="space-y-3">
                        {[
                          { l: 'OEE',          v: `${(calculateOEE(live) * 100).toFixed(1)}%`,          color: '#3b82f6' },
                          { l: 'Availability', v: `${(calculateAvailability(live) * 100).toFixed(1)}%`,  color: '#10b981' },
                          { l: 'Performance',  v: `${(calculatePerformance(live) * 100).toFixed(1)}%`,  color: '#f59e0b' },
                          { l: 'Quality',      v: `${(calculateQuality(live) * 100).toFixed(1)}%`,      color: '#8b5cf6' },
                        ].map(kpi => (
                          <div key={kpi.l}>
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-white/60">{kpi.l}</span>
                              <span className="text-[11px] font-black mono" style={{ color: kpi.color }}>{kpi.v}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: kpi.v, backgroundColor: kpi.color }} />
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-bold text-slate-500 dark:text-white/60">Output Progress</span>
                            <span className="font-black text-slate-700 dark:text-white/80 mono">{live.units_produced} / {live.units_target} units</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status events */}
                  <div>
                    <h5 className="text-[9px] font-black text-slate-500 dark:text-white/60 uppercase tracking-[0.2em] mb-3">Status History</h5>
                    <div className="space-y-2">
                      {selectedAsset.status === 'stopped' && (
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                          <p className="text-[10px] font-black text-rose-800"><AlertTriangle size={14} /> Critical stoppage</p>
                          <p className="text-[9px] font-bold text-rose-600 mt-1">Immediate intervention required</p>
                        </div>
                      )}
                      {selectedAsset.status === 'maintenance' && (
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-[10px] font-black text-blue-800"><Wrench size={14} /> Scheduled maintenance</p>
                          <p className="text-[9px] font-bold text-blue-600 mt-1">Expected back online: 2h</p>
                        </div>
                      )}
                      {selectedAsset.status === 'paused' && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                          <p className="text-[10px] font-black text-amber-800">⏸ Machine paused</p>
                          <p className="text-[9px] font-bold text-amber-600 mt-1">Awaiting operator resume</p>
                        </div>
                      )}
                      {selectedAsset.status === 'running' && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-800">✓ All systems nominal</p>
                          <p className="text-[9px] font-bold text-emerald-600 mt-1">Operating within parameters</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

type ViewMode = 'mapping' | 'floorplan' | 'assets';

export default function DigitalTwin() {
  const [mounted, setMounted] = useState(false);
  const [machines, setMachines] = useState<MachineState[]>([]);
  const [metrics, setMetrics] = useState<ReturnType<typeof getExecutivePulseMetrics> | null>(null);
  const [view, setView] = useState<ViewMode>('mapping');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['ZONE-A', 'ZONE-B', 'ZONE-C', 'ZONE-D']));

  // ReactFlow nodes & edges
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = subscribeToUpdates((data) => {
      setMachines(data.machines);
      setMetrics(data.executivePulse);

      // Build nodes from factory sections
      const builtNodes: Node[] = [];
      let yOffset = 60;

      FACTORY_SECTIONS.forEach((section, sIdx) => {
        const xBase = sIdx % 2 === 0 ? 60 : 800;
        const groupY = yOffset;

        // Section group background node
        builtNodes.push({
          id: `group-${section.id}`,
          type: 'section',
          position: { x: xBase - 30, y: groupY - 10 },
          data: { section } as any,
          draggable: false,
          selectable: false,
          zIndex: -1,
        });

        // Machine nodes in this section
        section.machines.forEach((sm, mIdx) => {
          const live = data.machines.find(m => m.id === sm.machineStateId);
          builtNodes.push({
            id: sm.id,
            type: 'machine',
            position: { x: xBase + (mIdx % 2) * 270, y: groupY + 50 + Math.floor(mIdx / 2) * 230 },
            data: { machine: sm, liveState: live } as any,
          });
        });

        yOffset += 50 + Math.ceil(section.machines.length / 2) * 230 + 60;
      });

      // Build edges: connect machines sequentially within sections, then across zones
      const builtEdges: Edge[] = [];
      FACTORY_SECTIONS.forEach(section => {
        for (let i = 0; i < section.machines.length - 1; i++) {
          builtEdges.push({
            id: `e-${section.machines[i].id}-${section.machines[i + 1].id}`,
            source: section.machines[i].id,
            target: section.machines[i + 1].id,
            type: 'animated',
          });
        }
      });
      // Cross-zone main flow
      builtEdges.push({ id: 'flow-A-B', source: 'MX01', target: 'MX02', type: 'animated' });
      builtEdges.push({ id: 'flow-B-C', source: 'MX02', target: 'MX03', type: 'animated' });
      builtEdges.push({ id: 'flow-C-D', source: 'MX03', target: 'MX04', type: 'animated' });

      setNodes(builtNodes);
      setEdges(builtEdges);
    });
    return () => unsubscribe();
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!mounted) return null;

  const runningCount = machines.filter(m => m.status === 'running').length;
  const stoppedCount = machines.filter(m => m.status === 'stopped').length;
  const globalOEE = metrics?.globalOEE || 0;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-slate-900 dark:text-white dark:text-slate-100">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 relative flex flex-col overflow-hidden">

        {/* Header bar */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-5 bg-white/70 dark:bg-[var(--glass-dark)] backdrop-blur-xl border-b border-slate-200 dark:border-white/10/50 dark:border-white/10">
          <div>
            <nav className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase mb-1.5">
              <span className="text-blue-600">Workshop-Alpha</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 dark:text-white/60">Live Spatial Twin</span>
            </nav>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {view === 'mapping' ? 'Digital Mapping' : view === 'floorplan' ? 'Floor Plan' : 'Asset Registry'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white dark:bg-[var(--glass-dark)] border border-slate-200 dark:border-white/10 p-1 rounded-xl shadow-sm">
              {([
                { id: 'mapping',   label: 'Digital Mapping', icon: <Layers size={13} /> },
                { id: 'floorplan', label: 'Floor Plan',      icon: <MapPin size={13} /> },
                { id: 'assets',    label: 'Assets',          icon: <Server size={13} /> },
              ] as { id: ViewMode; label: string; icon: React.ReactNode }[]).map(v => (
                <button key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === v.id ? 'bg-slate-900 dark:bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {v.icon}{v.label}
                </button>
              ))}
            </div>
            <div className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Simulation
            </div>
          </div>
        </div>

        {/* View Content */}
        <div className="flex-1 pt-[82px] flex flex-col min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ═══ DIGITAL MAPPING (ReactFlow) ═══ */}
            {view === 'mapping' && (
              <motion.div key="mapping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  connectionLineType={ConnectionLineType.Bezier}
                  minZoom={0.2}
                  maxZoom={1.5}
                >
                  <Background variant={BackgroundVariant.Dots} color="#cbd5e1" gap={24} size={1.5} />
                  <Controls className="!bg-white dark:bg-[var(--glass-dark)] !border-slate-200 dark:border-white/10 !shadow-xl !rounded-xl overflow-hidden" />
                  <Panel position="bottom-left">
                    <div className="bg-white/90 dark:bg-[var(--glass-dark)] backdrop-blur-sm px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl flex items-center gap-8">
                      {Object.entries({ running: 'Operational', stopped: 'Critical', paused: 'Warning', maintenance: 'Maintenance', idle: 'Idle' }).map(([s, l]) => (
                        <div key={s} className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CFG[s as keyof typeof STATUS_CFG].dot}`} />
                          <span className="text-[9px] font-black text-slate-600 dark:text-white/70 uppercase tracking-widest">{l}</span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </ReactFlow>
              </motion.div>
            )}

            {/* ═══ FLOOR PLAN ═══ */}
            {view === 'floorplan' && (
              <motion.div key="floorplan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full h-full bg-white dark:bg-[var(--glass-dark)] overflow-auto">
                <FloorPlanView machines={machines} />
              </motion.div>
            )}

            {/* ═══ ASSETS REGISTRY ═══ */}
            {view === 'assets' && (
              <motion.div key="assets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full h-full bg-white dark:bg-[var(--glass-dark)] overflow-hidden flex flex-col">
                <AssetsView machines={machines} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  subscribeToUpdates,
  getInventoryState,
  getLowStockItems,
  getStockHealthScore,
  getForecastQty,
  addStockReceipt,
  InventoryItem,
  PurchaseOrderSuggestion,
  IncomingDelivery
} from '@/lib/mathEngine';
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Boxes, CheckCircle, CheckCircle2, ClipboardCheck, Clock, Filter, Package, RefreshCw, ShoppingCart, TrendingUp, Truck, User, Users, Zap } from 'lucide-react';
import Link from 'next/link';

type TabType = 'stock' | 'deliveries' | 'orders' | 'forecast';

export default function SmartLedger() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [inventory, setInventory] = useState<ReturnType<typeof getInventoryState>>(getInventoryState());
  const [stockHealth, setStockHealth] = useState(getStockHealthScore());
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>(getLowStockItems());
  const [receiptModal, setReceiptModal] = useState<{ open: boolean; item: InventoryItem | null }>({ open: false, item: null });
  const [receiptQty, setReceiptQty] = useState('');
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
    const unsubscribe = subscribeToUpdates(() => {
      setInventory(getInventoryState());
      setStockHealth(getStockHealthScore());
      setLowStockItems(getLowStockItems());
      setTicker(t => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const handleReceipt = useCallback(() => {
    if (!receiptModal.item || !receiptQty) return;
    addStockReceipt(receiptModal.item.id, parseFloat(receiptQty), 'Manual Receipt');
    setInventory(getInventoryState());
    setLowStockItems(getLowStockItems());
    setReceiptModal({ open: false, item: null });
    setReceiptQty('');
  }, [receiptModal.item, receiptQty]);

  if (!mounted) return null;

  const { items, purchaseOrders, deliveries } = inventory;

  const totalInventoryValue = items.reduce((sum, item) => sum + item.qty_current * item.unit_cost, 0);
  const criticalItems = items.filter(i => i.qty_current < i.qty_min * 0.5);

  const getStatusColor = (item: InventoryItem) => {
    const ratio = item.qty_current / item.qty_min;
    if (ratio < 0.5) return { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500', label: 'Critical', badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300' };
    if (ratio < 1) return { bg: 'bg-amber-50 dark:bg-amber-400/10', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500', label: 'Low Stock', badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' };
    return { bg: 'bg-emerald-50 dark:bg-emerald-400/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', label: 'Healthy', badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' };
  };

  const getDeliveryStatus = (d: IncomingDelivery) => {
    switch (d.status) {
      case 'delayed': return { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/20', dot: 'bg-rose-500', label: 'Delayed' };
      case 'on_the_way': return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/20', dot: 'bg-blue-500', label: 'On the Way' };
      case 'scheduled': return { color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-white/10', dot: 'bg-slate-400', label: 'Scheduled' };
      case 'delivered': return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20', dot: 'bg-emerald-500', label: 'Delivered' };
    }
  };

  const sortedDeliveries = [...deliveries].sort((a, b) => {
    if (a.status === 'delayed' && b.status !== 'delayed') return -1;
    if (b.status === 'delayed' && a.status !== 'delayed') return 1;
    return a.expected_date - b.expected_date;
  });

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'stock', label: 'Live Stock', icon: <Boxes size={14} />, count: items.length },
    { id: 'deliveries', label: 'Deliveries', icon: <Truck size={14} />, count: deliveries.filter(d => d.status === 'delayed').length },
    { id: 'orders', label: 'Purchase Orders', icon: <ShoppingCart size={14} />, count: purchaseOrders.filter(p => p.status === 'pending').length },
    { id: 'forecast', label: 'Demand Forecast', icon: <BarChart3 size={14} /> },
  ];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-slate-900 dark:text-white dark:text-slate-100">

      {/* ─── Sidebar ─────────────────────────────────────────────── */}
      

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-[var(--glass-dark)] backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-8 lg:px-12 py-6">
          <div className="flex items-end justify-between">
            <div>
              <nav className="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase mb-3">
                <span className="text-blue-600">SONAR v8.2</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 dark:text-slate-400">Smart Ledger</span>
              </nav>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Inventory & WMS</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} className="text-amber-400" />
                Auto-Depleting
              </div>
              <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 mono">
                ≈ {totalInventoryValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} stock value
              </div>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="flex items-center gap-6 mt-6">
            {[
              { label: 'Total SKUs', value: items.length, icon: <Boxes size={14} />, color: 'text-slate-900 dark:text-white' },
              { label: 'Low Stock', value: lowStockItems.length, icon: <AlertTriangle size={14} />, color: lowStockItems.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400' },
              { label: 'POs Pending', value: purchaseOrders.filter(p => p.status === 'pending').length, icon: <ShoppingCart size={14} />, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Delayed Deliveries', value: deliveries.filter(d => d.status === 'delayed').length, icon: <Clock size={14} />, color: 'text-rose-600 dark:text-rose-400' },
            ].map(kpi => (
              <div key={kpi.label} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-white/10">
                <span className={kpi.color}>{kpi.icon}</span>
                <div>
                  <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                  <p className={`text-lg font-black mono ${kpi.color}`}>{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 lg:px-12 py-8">

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 p-1.5 rounded-2xl w-fit mb-10">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id ? 'bg-white dark:bg-[var(--glass-dark)] text-slate-900 dark:text-white shadow-md' : 'text-slate-400 hover:text-slate-700 dark:text-white/80'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black ${
                    activeTab === tab.id ? 'bg-rose-500 text-slate-900 dark:text-white' : 'bg-slate-400 text-slate-900 dark:text-white'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── LIVE STOCK TAB ─────────────────────────────── */}
            {activeTab === 'stock' && (
              <motion.div
                key="stock"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {items.map(item => {
                  const status = getStatusColor(item);
                  const fillPct = Math.min(100, (item.qty_current / (item.qty_min * 3)) * 100);
                  const daysLeft = item.avg_daily_consumption > 0
                    ? (item.qty_current / item.avg_daily_consumption).toFixed(1)
                    : '∞';

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      className={`glass-card p-6 border ${status.border} relative overflow-hidden`}
                    >
                      {/* Live depletion pulse for running machines */}
                      <div className="absolute right-0 top-0 bottom-0 w-1">
                        <motion.div
                          className={status.bar}
                          style={{ height: `${fillPct}%`, position: 'absolute', bottom: 0, width: '100%' }}
                          animate={{ height: `${fillPct}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>

                      <div className="flex items-start justify-between gap-6">
                        {/* Left: identity */}
                        <div className="flex items-start gap-5 flex-1">
                          <div className={`p-3.5 rounded-2xl ${status.bg} border ${status.border} shrink-0`}>
                            <Package size={22} className={status.text} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 mono uppercase tracking-widest">{item.ref}</p>
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${status.badge}`}>
                                {status.label}
                              </span>
                            </div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">{item.name}</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                              Zone {item.zone} · {item.shelf} · {item.location}
                            </p>
                          </div>
                        </div>

                        {/* Center: qty */}
                        <div className="text-center">
                          <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                          <p className={`text-2xl font-black mono ${status.text}`}>{item.qty_current.toFixed(0)}</p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">/ {item.qty_min} min</p>
                        </div>

                        {/* Right: stats */}
                        <div className="grid grid-cols-3 gap-4 text-right">
                          <div>
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Unit Cost</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white mono">€{item.unit_cost}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Days Left</p>
                            <p className={`text-sm font-black mono ${Number(daysLeft) < 3 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{daysLeft}d</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Linked</p>
                            <p className="text-sm font-black text-blue-600 mono">{item.linked_machine_id}</p>
                          </div>
                        </div>

                        {/* Action */}
                        <button
                          onClick={() => setReceiptModal({ open: true, item })}
                          className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors whitespace-nowrap flex items-center gap-2 shrink-0"
                        >
                          <RefreshCw size={12} />
                          Receive Stock
                        </button>
                      </div>

                      {/* Stock bar */}
                      <div className="mt-5">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Stock Level</span>
                          <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 mono">{fillPct.toFixed(0)}% of capacity</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={status.bar}
                            animate={{ width: `${fillPct}%` }}
                            transition={{ duration: 0.8 }}
                            style={{ height: '100%', borderRadius: 999 }}
                          />
                        </div>
                        {/* Minimum marker */}
                        <div className="relative h-0">
                          <div
                            className="absolute h-3 w-0.5 bg-rose-400 -top-2"
                            style={{ left: `${(item.qty_min / (item.qty_min * 3)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* ── DELIVERIES TAB ─────────────────────────────── */}
            {activeTab === 'deliveries' && (
              <motion.div
                key="deliveries"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="glass-card overflow-hidden">
                  <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Upcoming Deliveries</h3>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sorted by urgency</p>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        {['Order Ref', 'Product / Batch', 'Qty', 'Expected Date', 'Manager', 'Status'].map(h => (
                          <th key={h} className="px-6 py-4 text-left text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDeliveries.map(del => {
                        const s = getDeliveryStatus(del);
                        const isOverdue = del.expected_date < Date.now() && del.status !== 'delivered';
                        return (
                          <motion.tr
                            key={del.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`border-b border-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-900 dark:text-white transition-colors ${isOverdue ? 'bg-rose-50/50 dark:bg-rose-900/20' : ''}`}
                          >
                            <td className="px-6 py-5">
                              <p className="text-[11px] font-black text-slate-900 dark:text-white mono">{del.order_ref}</p>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-xs font-bold text-slate-700 dark:text-white/80">{del.product}</p>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{del.client}</p>
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-sm font-black text-slate-900 dark:text-white mono">{del.qty.toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-5">
                              <p className={`text-[11px] font-black mono ${isOverdue ? 'text-rose-600' : 'text-slate-700 dark:text-white/80'}`}>
                                {new Date(del.expected_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                              </p>
                              {isOverdue && <p className="text-[9px] text-rose-500 font-black uppercase tracking-wider mt-0.5">OVERDUE</p>}
                            </td>
                            <td className="px-6 py-5">
                              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{del.logistics_manager}</p>
                            </td>
                            <td className="px-6 py-5">
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${s.bg}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${s.dot} ${del.status === 'on_the_way' ? 'animate-pulse' : ''}`} />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${s.color}`}>{s.label}</span>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ── PURCHASE ORDERS TAB ───────────────────────── */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {purchaseOrders.length === 0 ? (
                  <div className="glass-card p-16 text-center">
                    <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">All Stock Levels Nominal</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">No automated purchase orders generated yet. Ledger is monitoring continuously.</p>
                  </div>
                ) : (
                  purchaseOrders.map(po => (
                    <motion.div
                      key={po.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card p-6 border-l-4 border-amber-400"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                            <ShoppingCart size={20} className="text-amber-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 mono uppercase tracking-widest">{po.item_ref}</p>
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                po.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                po.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>{po.status}</span>
                            </div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">{po.item_name}</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                              Auto-generated · {new Date(po.created_at).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Suggested Qty</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mono">{po.suggested_qty.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Est. Cost</p>
                            <p className="text-2xl font-black text-blue-600 mono">€{po.estimated_cost.toLocaleString('fr-FR')}</p>
                          </div>
                          <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">
                            Approve
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* ── DEMAND FORECAST TAB ───────────────────────── */}
            {activeTab === 'forecast' && (
              <motion.div
                key="forecast"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {items.map(item => {
                    const forecast30 = getForecastQty(item, 30);
                    const forecast90 = getForecastQty(item, 90);
                    const daysUntilEmpty = item.avg_daily_consumption > 0 ? item.qty_current / item.avg_daily_consumption : 999;
                    const isUrgent = daysUntilEmpty < item.lead_time_days;
                    const status = getStatusColor(item);

                    return (
                      <div key={item.id} className="glass-card p-8">
                        <div className="flex items-start justify-between mb-8">
                          <div>
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 mono uppercase tracking-widest mb-1">{item.ref}</p>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">{item.name}</h3>
                          </div>
                          {isUrgent && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 rounded-xl">
                              <AlertTriangle size={12} className="text-rose-600" />
                              <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest">Order Now</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                          <div className="p-4 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white rounded-2xl">
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Daily Avg</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white mono">{item.avg_daily_consumption}</p>
                            <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold">units / day</p>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">30d Forecast</p>
                            <p className="text-xl font-black text-blue-700 mono">{forecast30.toLocaleString()}</p>
                            <p className="text-[8px] text-blue-400 font-bold">units needed</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white rounded-2xl">
                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">90d Forecast</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white mono">{forecast90.toLocaleString()}</p>
                            <p className="text-[8px] text-slate-500 dark:text-slate-400 font-bold">units needed</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Days Until Empty</span>
                            <span className={`text-[11px] font-black mono ${daysUntilEmpty < item.lead_time_days ? 'text-rose-600' : 'text-slate-700 dark:text-white/80'}`}>
                              {daysUntilEmpty.toFixed(1)} days
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Supplier Lead Time</span>
                            <span className="text-[11px] font-black mono text-slate-700 dark:text-white/80">{item.lead_time_days} days</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Safety Buffer</span>
                            <span className="text-[11px] font-black mono text-slate-700 dark:text-white/80">
                              {(item.avg_daily_consumption * item.lead_time_days).toLocaleString()} units
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">30d Est. Cost</span>
                            <span className="text-[11px] font-black mono text-blue-600">
                              €{(forecast30 * item.unit_cost).toLocaleString('fr-FR', { minimumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Purchase History Summary */}
                <div className="glass-card p-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-8">Purchase History — Top Spend</h3>
                  <div className="space-y-5">
                    {[...items]
                      .sort((a, b) => (getForecastQty(b, 30) * b.unit_cost) - (getForecastQty(a, 30) * a.unit_cost))
                      .map((item, i) => {
                        const monthlySpend = getForecastQty(item, 30) * item.unit_cost;
                        const maxSpend = getForecastQty(items[0], 30) * items[0].unit_cost;
                        return (
                          <div key={item.id} className="flex items-center gap-6">
                            <div className="w-7 h-7 bg-slate-100 dark:bg-white/10 rounded-lg flex items-center justify-center text-[11px] font-black text-slate-500 dark:text-slate-400">#{i+1}</div>
                            <div className="flex-1">
                              <div className="flex justify-between mb-2">
                                <span className="text-xs font-black text-slate-900 dark:text-white">{item.name}</span>
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 mono">
                                  €{monthlySpend.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} / 30d
                                  {i === 0 && <span className="ml-2 text-rose-500">▲ Highest</span>}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${(monthlySpend / (maxSpend || 1)) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ─── Receive Stock Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {receiptModal.open && receiptModal.item && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={(e) => e.target === e.currentTarget && setReceiptModal({ open: false, item: null })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[var(--glass-dark)] rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <Truck size={22} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Receive Stock</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{receiptModal.item.name}</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Current Qty</span>
                  <span className="text-[11px] font-black text-slate-700 dark:text-white/80 mono">{receiptModal.item.qty_current.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Minimum</span>
                  <span className="text-[11px] font-black text-slate-700 dark:text-white/80 mono">{receiptModal.item.qty_min}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Unit Cost</span>
                  <span className="text-[11px] font-black text-slate-700 dark:text-white/80 mono">€{receiptModal.item.unit_cost}</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Quantity Received</label>
                <input
                  type="number"
                  value={receiptQty}
                  onChange={e => setReceiptQty(e.target.value)}
                  placeholder="0"
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.02] text-slate-900 dark:text-white border border-slate-200 rounded-xl text-2xl font-black text-slate-900 dark:text-white mono focus:outline-none focus:border-blue-400 focus:bg-white dark:bg-[var(--glass-dark)] transition-colors"
                  autoFocus
                />
                {receiptQty && (
                  <p className="text-[10px] text-emerald-600 font-black mt-2 mono">
                    → New total: {(receiptModal.item.qty_current + parseFloat(receiptQty || '0')).toFixed(0)} units
                    · Est. value: €{((receiptModal.item.qty_current + parseFloat(receiptQty || '0')) * receiptModal.item.unit_cost).toFixed(0)}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setReceiptModal({ open: false, item: null })}
                  className="flex-1 px-5 py-3 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReceipt}
                  disabled={!receiptQty || parseFloat(receiptQty) <= 0}
                  className="flex-1 px-5 py-3 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm Receipt
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

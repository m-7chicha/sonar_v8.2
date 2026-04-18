"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Activity, 
  Target, 
  ClipboardCheck, 
  Layers, 
  Users, 
  MapPin,
  Settings,
  Menu,
  Sun,
  Moon
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';

const NAV_ITEMS = [
  { href: '/executive-pulse', icon: LayoutDashboard, label: 'Executive Pulse' },
  { href: '/digital-twin', icon: MapPin, label: 'Digital Twin' },
  { href: '/performance', icon: Activity, label: 'Performance' },
  { href: '/quality', icon: ClipboardCheck, label: 'Quality Control' },
  { href: '/smart-ledger', icon: Layers, label: 'Smart Ledger' },
  { href: '/crm', icon: Users, label: 'CRM & Supply' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={`glass-sidebar h-full overflow-y-auto flex flex-col justify-between p-6 transition-all duration-300 relative z-50 ${collapsed ? 'w-24 mt-0 items-center' : 'w-64'}`}>
      <div>
        {/* Logo Section */}
        <div className="flex items-center gap-4 mb-10 pl-2">
          <img src="/sonar-logo.png" alt="SONAR Logo" className="w-11 h-11 object-contain shrink-0 drop-shadow-md dark:brightness-110" />
          {!collapsed && (
            <div>
              <h1 className="text-[19px] font-black text-slate-900 dark:text-white tracking-tight leading-none">SONAR v8.2</h1>
              <p className="text-[9px] text-blue-700 dark:text-blue-400 font-extrabold uppercase tracking-widest leading-relaxed mt-1">Industrial OS</p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2 relative" onMouseLeave={() => {}}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-300 font-bold text-[13px] w-full group ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-white/90 dark:bg-[#1E293B]/80 backdrop-blur-sm rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30
                    }}
                  />
                )}
                
                {/* Background hover for inactive */}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-white/5 rounded-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300" />
                )}

                <span className="relative flex items-center gap-3 z-10 w-full transition-transform duration-300 group-hover:translate-x-1">
                  <Icon size={20} className={isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"} strokeWidth={isActive ? 2.5 : 1.5} />
                  {!collapsed && <span className={isActive ? "text-slate-900 dark:text-white font-black" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"}>{item.label}</span>}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4">
        {/* Controls Section */}
        <div className="flex flex-col gap-2">
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-[13px] text-slate-500 dark:text-slate-400 w-full border border-slate-200/50 dark:border-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 active:scale-95"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={20} strokeWidth={1.5} /> : <Sun size={20} strokeWidth={1.5} />}
            {!collapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          {/* Minimize Button */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-[13px] text-slate-500 dark:text-slate-400 w-full border border-slate-200/50 dark:border-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 active:scale-95"
          >
            <Menu size={20} strokeWidth={1.5} />
            {!collapsed && <span>Minimize</span>}
          </button>
        </div>
        
        {!collapsed && (
          <div className="bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 dark:bg-blue-500 rounded-t-xl group-hover:h-full transition-all duration-500 opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 relative z-10 transition-colors group-hover:text-blue-900 dark:group-hover:text-white">v1.0-alpha</p>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 relative z-10 transition-colors group-hover:text-blue-950 dark:group-hover:text-white pb-3">Node Connected</p>
          </div>
        )}
      </div>
    </aside>
  );
}

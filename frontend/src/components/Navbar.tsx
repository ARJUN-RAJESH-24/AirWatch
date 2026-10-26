import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Wind, Activity, MapPin, BarChart3, Scale, History, BookOpen, Server, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { DataStatus } from '../types';

export const Navbar: React.FC = () => {
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    api.getDataStatus()
      .then(res => {
        setDataStatus(res);
        setOnline(true);
      })
      .catch(() => {
        setOnline(false);
      });
  }, []);

  const navItems = [
    { to: '/', label: 'Overview', icon: Activity },
    { to: '/explorer', label: 'Explorer', icon: MapPin },
    { to: '/comparison', label: 'Comparison', icon: BarChart3 },
    { to: '/standards', label: 'Standards (NAAQS)', icon: Scale },
    { to: '/historical', label: 'Historical', icon: History },
    { to: '/sources', label: 'Sources & Methods', icon: BookOpen },
    { to: '/ingestion', label: 'Ingestion Health', icon: Server },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Wind className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">AirWatch</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">
                  India CAAQMS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Environmental Analytics Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* System Telemetry Status Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200">
              {online ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-slate-700">CPCB Data Active</span>
                  {dataStatus && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      ({dataStatus.total_stations} stns)
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-slate-600">Connecting Backend</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

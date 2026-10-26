import React from 'react';
import { ShieldCheck, Database, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-500">
          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <Database className="h-4 w-4 text-sky-600" />
              <span>Official Indian Environmental Data</span>
            </div>
            <p className="leading-relaxed">
              AirWatch ingests genuine environmental observations from the Central Pollution Control Board (CPCB),
              Open Government Data (OGD) Platform India (<a href="https://data.gov.in" target="_blank" rel="noreferrer" className="underline hover:text-sky-600">data.gov.in</a>),
              and the Kerala State Pollution Control Board (KSPCB).
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Academic & Scientific Integrity</span>
            </div>
            <p className="leading-relaxed">
              Strictly non-AI, non-synthetic. All metrics, time series aggregations, and exceedance percentages are
              deterministically computed from stored official records with full provenance metadata.
            </p>
          </div>

          <div>
            <div className="font-semibold text-slate-800 text-sm mb-2">
              Authoritative Reference Standards
            </div>
            <p className="leading-relaxed mb-2">
              Evaluated against National Ambient Air Quality Standards (NAAQS) 2009 under Gazette of India Notification No. B-29016/20/90/PCI-L.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>CPCB CAAQMS v1.0</span>
              <span>•</span>
              <a href="https://airquality.cpcb.gov.in/AQI_India/" target="_blank" rel="noreferrer" className="flex items-center gap-0.5 hover:text-sky-600">
                <span>CPCB Portal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© 2026 AirWatch Platform. Distributed under Government Open Data License - India (GODL-India).</p>
          <p className="mt-2 sm:mt-0">Built with Rust, Axum, PostgreSQL, React, and TypeScript.</p>
        </div>
      </div>
    </footer>
  );
};

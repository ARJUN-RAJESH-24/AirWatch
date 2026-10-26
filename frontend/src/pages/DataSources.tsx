import React from 'react';
import { ExternalLink, Database, ShieldCheck, CheckCircle2, FileCode2 } from 'lucide-react';

export const DataSources: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            Data Provenance & Methodology
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">Official Documentation & Audit Trail</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Data Sources, Standards & Engineering Methodology
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          AirWatch is committed to open scientific reproducibility and verifiable data provenance.
          This document records every official data provider, ingestion pipeline rule, deduplication strategy,
          and regulatory standard employed by the platform.
        </p>
      </div>

      {/* Authoritative Data Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPCB */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="h-10 w-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Central Pollution Control Board (CPCB)</h3>
            <p className="text-xs text-slate-500">Ministry of Environment, Forest and Climate Change, Govt of India</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Statutory organization responsible for operating the National Air Quality Monitoring Programme (NAMP)
            and the Continuous Ambient Air Quality Monitoring System (CAAQMS) across all states and Union Territories.
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Portal: airquality.cpcb.gov.in</span>
            <a
              href="https://airquality.cpcb.gov.in/AQI_India/"
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-0.5"
            >
              <span>Portal</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* OGD Platform India */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <FileCode2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Open Government Data (OGD) Platform India</h3>
            <p className="text-xs text-slate-500">National Informatics Centre (NIC) / data.gov.in</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            National public data portal hosting official datasets published under the National Data Sharing and Accessibility Policy (NDSAP).
            Real-Time Air Quality Index catalogue UUID: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69</code>.
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">License: GODL-India</span>
            <a
              href="https://data.gov.in/catalog/real-time-air-quality-index"
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-0.5"
            >
              <span>data.gov.in</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Kerala State PCB */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Kerala State Pollution Control Board (KSPCB)</h3>
            <p className="text-xs text-slate-500">Department of Environment, Government of Kerala</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Maintains continuous automated stations and manual monitoring stations in major Kerala municipal corporations:
            Thiruvananthapuram, Ernakulam, Kochi, Kozhikode, Kollam, Kannur, and Eloor industrial zone.
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Portal: kspcb.kerala.gov.in</span>
            <a
              href="https://kspcb.kerala.gov.in"
              target="_blank"
              rel="noreferrer"
              className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-0.5"
            >
              <span>kspcb</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Engineering Methodology & Data Quality Rules */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Data Engineering & Ingestion Pipeline Rules</h2>
          <p className="text-xs text-slate-500 mt-0.5">Strict adherence to data integrity safeguards and deterministic storage</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>1. Cryptographic Record Fingerprinting</span>
            </div>
            <p className="leading-relaxed">
              Every imported observation generates a deterministic SHA-256 fingerprint from the tuple:
              <code className="block bg-white p-2 rounded border border-slate-200 font-mono text-[11px] my-1 text-slate-800">
                SHA256(StationCode + ':' + Pollutant + ':' + ObservationDate)
              </code>
              This guarantees mathematical idempotency. Re-running the ingestion pipeline on previously imported records
              safely updates fields if corrections occurred in government publications, without duplicate record creation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>2. Strict Missing Data Treatment (No Zero Imputation)</span>
            </div>
            <p className="leading-relaxed">
              When an official sensor is offline, under calibration, or failing telemetry, the resulting cell in the government report is empty.
              AirWatch strictly stores this as SQL <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">NULL</code>.
              Missing records are <strong>never</strong> replaced with 0.0, as zero would falsely represent pristine, unpolluted air.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>3. Physical Unit Preservation</span>
            </div>
            <p className="leading-relaxed">
              Measurements preserve their authoritative physical dimensions:
              Particulate matter (PM2.5, PM10), Nitrogen Dioxide (NO2), Sulfur Dioxide (SO2), Ozone (O3), and Ammonia (NH3) are in <strong className="text-slate-800">µg/m³</strong>.
              Carbon Monoxide (CO) is measured in <strong className="text-slate-800">mg/m³</strong>.
              Incompatible units are never blended during time-series aggregation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>4. Quality Status Flagging</span>
            </div>
            <p className="leading-relaxed">
              Observations undergo automated schema validation. Observations with physically plausible positive values are marked <span className="font-semibold text-emerald-700">VALID</span>.
              Readings with negative values (caused by sensor baseline drift or calibration cycles in raw telemetry) are preserved but flagged as <span className="font-semibold text-amber-700">SUSPECT</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Raw Assets Cryptographic Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1">Raw Assets Cryptographic Verification</h3>
        <p className="text-xs text-slate-500 mb-4">Cryptographic checksums of source datasets downloaded and cached in raw storage</p>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Asset Name</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Format</th>
                <th className="py-2.5 px-3">SHA-256 Content Checksum</th>
                <th className="py-2.5 px-3">Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">cpcb_stations.csv</td>
                <td className="py-2.5 px-3">14.4 KB</td>
                <td className="py-2.5 px-3 font-sans text-xs">text/csv</td>
                <td className="py-2.5 px-3 text-slate-500">ce2b7081c3e3c89145613eb724d7d2149ef79c6e16f36bb8a835747a673ed410</td>
                <td className="py-2.5 px-3 font-sans font-bold text-emerald-600">PASSED</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">cpcb_station_day.csv</td>
                <td className="py-2.5 px-3">8.63 MB</td>
                <td className="py-2.5 px-3 font-sans text-xs">text/csv</td>
                <td className="py-2.5 px-3 text-slate-500">f07787eb4c36c53b07763f591ee29fa01fbaa4d18df1a470447d04def79677b9</td>
                <td className="py-2.5 px-3 font-sans font-bold text-emerald-600">PASSED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

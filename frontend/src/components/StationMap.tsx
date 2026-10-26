import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Station } from '../types';
import { AqiBadge } from './AqiBadge';
import { MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StationMapProps {
  stations: Station[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onStationSelect?: (station: Station) => void;
}

// Function to create custom color-coded Leaflet DivIcon
const createCustomMarker = (aqi: number | null | undefined, isKerala: boolean) => {
  let color = '#0284c7'; // default sky
  if (aqi !== null && aqi !== undefined) {
    if (aqi <= 50) color = '#10B981'; // Good (Emerald)
    else if (aqi <= 100) color = '#84CC16'; // Satisfactory (Lime)
    else if (aqi <= 200) color = '#EAB308'; // Moderate (Yellow)
    else if (aqi <= 300) color = '#F97316'; // Poor (Orange)
    else if (aqi <= 400) color = '#EF4444'; // Very Poor (Red)
    else color = '#7F1D1D'; // Severe (Maroon)
  } else if (isKerala) {
    color = '#0284c7';
  } else {
    color = '#94a3b8';
  }

  const borderClass = isKerala ? 'border-2 border-white ring-2 ring-sky-500' : 'border-2 border-white';

  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;" class="${borderClass}">
        <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  center = [10.8505, 76.2711], // Kerala center default
  zoom = 7,
  height = '480px',
  onStationSelect,
}) => {
  // Filter stations that have valid coordinates
  const validStations = stations.filter(
    (s) => s.latitude !== null && s.longitude !== null && !isNaN(Number(s.latitude)) && !isNaN(Number(s.longitude))
  );

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden shadow-sm border border-slate-200 relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validStations.map((station) => {
          const isKerala = station.state.toLowerCase() === 'kerala';
          const icon = createCustomMarker(station.latest_aqi, isKerala);

          return (
            <Marker
              key={station.id}
              position={[Number(station.latitude), Number(station.longitude)]}
              icon={icon}
              eventHandlers={{
                click: () => onStationSelect && onStationSelect(station),
              }}
            >
              <Popup className="station-popup">
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                    <MapPin className="h-3 w-3 text-sky-600" />
                    <span>{station.city}, {station.state}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-tight mb-2">
                    {station.name}
                  </h4>

                  <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded border border-slate-100 mb-2">
                    <span className="text-xs text-slate-600">Reported AQI:</span>
                    <AqiBadge value={station.latest_aqi} category={station.latest_aqi_category} size="sm" />
                  </div>

                  {station.latest_observation_date && (
                    <div className="text-[11px] text-slate-500 mb-2">
                      Last observation: <span className="font-mono font-medium">{station.latest_observation_date.slice(0, 10)}</span>
                    </div>
                  )}

                  <Link
                    to={`/explorer?station=${station.station_code}`}
                    className="inline-flex items-center justify-center gap-1 w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded transition-colors"
                  >
                    <span>Analyze in Explorer</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200 text-xs">
        <div className="font-bold text-slate-800 mb-1.5">CPCB AQI Scale</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Good (0-50)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-500"></span>
            <span>Satisfactory (51-100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Moderate (101-200)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>Poor (201-300)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Very Poor (301-400)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-950"></span>
            <span>Severe (401-500)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

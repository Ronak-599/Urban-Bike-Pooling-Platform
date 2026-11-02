import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SearchRideMatch } from '../types/index.js';
import {
  X,
  Star,
  Users,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
} from 'lucide-react';

interface BlaBlaCarMapViewProps {
  rides: SearchRideMatch[];
  selectedRideId: string | null;
  onSelectRide: (rideId: string) => void;
  onClose: () => void;
  pickupAddress: string;
  dropoffAddress: string;
  departureDate: string;
  onViewRide: (rideId: string) => void;
}

export const BlaBlaCarMapView: React.FC<BlaBlaCarMapViewProps> = ({
  rides,
  selectedRideId,
  onSelectRide,
  onClose,
  pickupAddress,
  dropoffAddress,
  departureDate,
  onViewRide,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeRideId, setActiveRideId] = useState<string | null>(
    selectedRideId || (rides.length > 0 ? rides[0].rideId : null)
  );

  const activeRide = rides.find((r) => r.rideId === activeRideId) || rides[0];

  const getShortLocation = (address: string) => {
    if (!address) return 'City center';
    const parts = address.split(',').map((s) => s.trim());
    return parts[0] || address;
  };

  // Format date label
  const getDateLabel = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    if (departureDate === todayStr) return 'Today';
    if (departureDate === tomorrowStr) return 'Tomorrow';
    try {
      const d = new Date(departureDate);
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return departureDate || 'Tomorrow';
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([19.9975, 73.7898], 12);

      // OpenStreetMap Tiles (Clean CartoDB Positron / OSM style)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers, Polylines and Bounds when rides or activeRideId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (rides.length === 0) return;

    const bounds = L.latLngBounds([]);

    rides.forEach((ride) => {
      const isSelected = ride.rideId === activeRideId;
      const originLat = ride.originLat || 19.9989;
      const originLng = ride.originLng || 73.7633;
      const destLat = ride.destinationLat || 19.9582;
      const destLng = ride.destinationLng || 73.8449;

      bounds.extend([originLat, originLng]);
      bounds.extend([destLat, destLng]);

      // Draw polyline connecting pickup to dropoff
      const polyline = L.polyline(
        [
          [originLat, originLng],
          [destLat, destLng],
        ],
        {
          color: isSelected ? '#0084f9' : '#94a3b8',
          weight: isSelected ? 5 : 3,
          opacity: isSelected ? 0.95 : 0.6,
          dashArray: isSelected ? undefined : '5, 5',
        }
      );
      polyline.addTo(layerGroup);

      // Origin Marker Pin (Dark slate pin)
      const originIcon = L.divIcon({
        className: 'custom-origin-pin',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: #0f172a;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const originMarker = L.marker([originLat, originLng], { icon: originIcon }).addTo(layerGroup);
      originMarker.on('click', () => {
        setActiveRideId(ride.rideId);
        onSelectRide(ride.rideId);
      });

      // Destination Marker (Price badge matching BlaBlaCar screenshot)
      const priceText = `₹${(ride.pricing?.totalFare || 45).toFixed(0)}`;
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div style="
            background: ${isSelected ? '#0f172a' : '#ffffff'};
            color: ${isSelected ? '#ffffff' : '#0f172a'};
            font-weight: 800;
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 9999px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
            border: 2px solid ${isSelected ? '#0084f9' : '#e2e8f0'};
            white-space: nowrap;
            cursor: pointer;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s ease;
          ">
            <span>${priceText}</span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(layerGroup);
      destMarker.on('click', () => {
        setActiveRideId(ride.rideId);
        onSelectRide(ride.rideId);
      });
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14 });
    }
  }, [rides, activeRideId]);

  return (
    <div className="fixed inset-0 top-16 z-40 bg-[#f4f5f7] dark:bg-slate-950 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-200">
      {/* Left Sidebar: Rides List (matching BlaBlaCar screenshot) */}
      <div className="w-full md:w-[420px] lg:w-[460px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 shadow-lg z-20">
        {/* Top Header of left list: Close X and Title */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close map view"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
              {getDateLabel()} · {rides.length} rides
            </span>
          </div>
        </div>

        {/* Scrollable rides list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y-0">
          {rides.map((ride) => {
            const isSelected = ride.rideId === activeRideId;
            const depDate = new Date(ride.scheduledDeparture);
            const depH = String(depDate.getHours()).padStart(2, '0');
            const depM = String(depDate.getMinutes()).padStart(2, '0');
            const depTime = `${depH}:${depM}`;

            const durationSec = ride.detourMinutes ? ride.detourMinutes * 60 + 2400 : 2400;
            const arrDate = new Date(depDate.getTime() + durationSec * 1000);
            const arrH = String(arrDate.getHours()).padStart(2, '0');
            const arrM = String(arrDate.getMinutes()).padStart(2, '0');
            const arrTime = `${arrH}:${arrM}`;

            const originShort = getShortLocation(ride.originAddress);
            const destShort = getShortLocation(ride.destinationAddress);
            const priceFormatted = `₹${(ride.pricing?.totalFare || 45).toFixed(2)}`;

            return (
              <div
                key={ride.rideId}
                onClick={() => {
                  setActiveRideId(ride.rideId);
                  onSelectRide(ride.rideId);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'border-2 border-[#0084f9] shadow-md bg-white dark:bg-slate-850 ring-1 ring-[#0084f9]/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-sm'
                }`}
              >
                {/* Time & Price Row */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                      <span>{depTime}</span>
                      <span className="text-slate-400 font-normal">→</span>
                      <span>{arrTime}</span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-400 font-semibold truncate max-w-[240px]">
                      {originShort} → {destShort}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-slate-950 dark:text-emerald-400">{priceFormatted}</span>
                  </div>
                </div>

                {/* Driver Row */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs overflow-hidden">
                      {ride.rider?.avatarUrl ? (
                        <img src={ride.rider.avatarUrl} alt={ride.rider.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{ride.rider?.fullName?.slice(0, 2).toUpperCase() || 'DR'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">{ride.rider?.fullName}</span>
                      <span className="flex items-center text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                        <Star className="w-3 h-3 fill-slate-900 dark:fill-white text-slate-900 dark:text-white mr-0.5 inline" />
                        {Number(ride.rider?.ratingAvg || 5).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewRide(ride.rideId);
                    }}
                    className="text-xs font-bold text-[#0084f9] hover:underline"
                  >
                    Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Map View Area (matching BlaBlaCar screenshot) */}
      <div className="flex-1 relative h-full w-full bg-slate-100 dark:bg-slate-900">
        {/* Top overlay bar on map: Route information */}
        <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex items-center justify-between">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-md text-xs font-bold text-slate-800 dark:text-slate-200 pointer-events-auto flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate max-w-xs sm:max-w-md">
              {pickupAddress || 'Origin'} → {dropoffAddress || 'Destination'}
            </span>
          </div>

          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-md text-xs font-semibold text-slate-600 dark:text-slate-300 pointer-events-auto hidden sm:block">
            Showing {rides.length} of {rides.length} available rides
          </div>
        </div>

        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Interactive Floating Ride Card on Map (Matching BlaBlaCar Screenshot Popup!) */}
        {activeRide && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-20 w-[92%] sm:w-[320px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xl p-4 space-y-3.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Header: Origin -> Destination */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                  {getShortLocation(activeRide.originAddress)} → {getShortLocation(activeRide.destinationAddress)}
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{getDateLabel()}</div>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-slate-950 dark:text-emerald-400">
                  ₹{(activeRide.pricing?.totalFare || 45).toFixed(0)}
                </span>
              </div>
            </div>

            {/* Primary Action: View ride button matching screenshot */}
            <button
              type="button"
              onClick={() => onViewRide(activeRide.rideId)}
              className="w-full py-2.5 rounded-full bg-[#0084f9] hover:bg-[#0073d9] text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all active:scale-[0.98]"
            >
              View ride
            </button>

            {/* Secondary Action: View arrival point */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  const map = mapInstanceRef.current;
                  if (map && activeRide.destinationLat && activeRide.destinationLng) {
                    map.setView([activeRide.destinationLat, activeRide.destinationLng], 15);
                  }
                }}
                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0084f9] transition-colors"
              >
                View arrival point
              </button>
            </div>

            {/* Driver Profile Row at bottom of popup */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs overflow-hidden">
                {activeRide.rider?.avatarUrl ? (
                  <img src={activeRide.rider.avatarUrl} alt={activeRide.rider.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{activeRide.rider?.fullName?.slice(0, 2).toUpperCase() || 'DR'}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white">{activeRide.rider?.fullName}</span>
                <span className="flex items-center text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                  <Star className="w-3 h-3 fill-slate-900 dark:fill-white text-slate-900 dark:text-white mr-0.5 inline" />
                  {Number(activeRide.rider?.ratingAvg || 5).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

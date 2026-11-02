import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { LocationAutocomplete } from '../components/ui/LocationAutocomplete.js';
import { formatCurrency } from '../lib/utils.js';
import {
  Bike,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Heart,
  Fuel,
  Info,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';

export const OfferRide: React.FC = () => {
  const navigate = useNavigate();
  const { user, fetchProfile } = useAuthStore();

  const getLocalDatetimeString = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2); // Default to 2 hours from now
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    vehicleId: '',
    originAddress: '',
    originLat: 0,
    originLng: 0,
    destinationAddress: '',
    destinationLat: 0,
    destinationLng: 0,
    routePolyline: 'encoded_sample_polyline_blr_corridor_123',
    scheduledDeparture: getLocalDatetimeString(),
    bufferMinutes: 10,
    helmetProvided: true,
    isWomenOnly: false,
    perKmCostShare: 4.5,
    estimatedDistanceMeters: 16500,
    estimatedDurationSeconds: 2400,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const vehicles = user?.riderProfile?.vehicles || [];

  useEffect(() => {
    if (vehicles.length > 0 && !formData.vehicleId) {
      setFormData((prev) => ({ ...prev, vehicleId: vehicles[0].id }));
    }
  }, [vehicles]);

  const estimatedDistanceKm = formData.estimatedDistanceMeters / 1000;
  const estimatedFuelRecovery = Math.round(estimatedDistanceKm * formData.perKmCostShare);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.vehicleId) {
      setError('Please select or register a verified vehicle first.');
      setLoading(false);
      return;
    }

    if (!formData.originAddress.trim() || !formData.destinationAddress.trim()) {
      setError('Please enter both pickup origin and destination addresses.');
      setLoading(false);
      return;
    }

    // Ensure future departure
    const departureTime = new Date(formData.scheduledDeparture).getTime();
    if (isNaN(departureTime) || departureTime < Date.now() - 5 * 60 * 1000) {
      setError('Please select a departure date and time in the future.');
      setLoading(false);
      return;
    }

    try {
      await api.offerRide({
        ...formData,
        originLat: formData.originLat || 19.9989,
        originLng: formData.originLng || 73.7633,
        destinationLat: formData.destinationLat || 19.9582,
        destinationLng: formData.destinationLng || 73.8449,
        scheduledDeparture: new Date(formData.scheduledDeparture).toISOString(),
        perKmCostShare: Number(formData.perKmCostShare),
      });
      navigate('/trips?tab=rider&published=true');
    } catch (err: any) {
      setError(err.message || 'Failed to publish ride offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Publish Your Daily <span className="text-emerald-400">Pillion Ride</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Share your empty pillion seat, offset monthly fuel costs, and travel legally under cost-sharing rules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-slate-800 relative z-20 overflow-visible">
            <CardHeader>
              <CardTitle>Trip Route & Schedule</CardTitle>
              <CardDescription>Enter your standard commute coordinates</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-3.5 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Vehicle Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Selected Motorcycle / Scooter
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      + Add New Vehicle
                    </button>
                  </div>
                  {vehicles.length > 0 ? (
                    <select
                      className="flex h-11 w-full rounded-xl glass-input px-3.5 text-sm text-slate-100 focus:outline-none"
                      value={formData.vehicleId}
                      onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                      required
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id} className="bg-slate-900">
                          {v.make} {v.model} ({v.color}) — {v.licensePlate}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                      <span>No vehicle registered yet. Please add your bike details first.</span>
                      <Button variant="secondary" size="sm" onClick={() => navigate('/profile')}>
                        Register Bike
                      </Button>
                    </div>
                  )}
                </div>

                {/* Origin */}
                <div className="relative">
                  <LocationAutocomplete
                    label="Origin (Home / Starting Node)"
                    placeholder="Enter starting street, hub or city"
                    value={formData.originAddress}
                    icon={<MapPin className="w-4 h-4 text-emerald-400" />}
                    variant="blablacar"
                    inputClassName="bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl px-3.5 h-11"
                    onChange={(address, lat, lng) => {
                      setFormData((prev) => ({
                        ...prev,
                        originAddress: address,
                        ...(lat !== undefined ? { originLat: lat } : {}),
                        ...(lng !== undefined ? { originLng: lng } : {}),
                      }));
                    }}
                    required
                  />
                </div>

                {/* Destination */}
                <div className="relative">
                  <LocationAutocomplete
                    label="Destination (Office / Tech Park)"
                    placeholder="Enter destination tech park, area or station"
                    value={formData.destinationAddress}
                    icon={<MapPin className="w-4 h-4 text-rose-400" />}
                    variant="blablacar"
                    inputClassName="bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl px-3.5 h-11"
                    onChange={(address, lat, lng) => {
                      setFormData((prev) => ({
                        ...prev,
                        destinationAddress: address,
                        ...(lat !== undefined ? { destinationLat: lat } : {}),
                        ...(lng !== undefined ? { destinationLng: lng } : {}),
                      }));
                    }}
                    required
                  />
                </div>

                {/* Departure Time & Buffer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Departure Date & Time"
                    type="datetime-local"
                    value={formData.scheduledDeparture}
                    onChange={(e) => setFormData({ ...formData, scheduledDeparture: e.target.value })}
                    icon={<Calendar className="w-4 h-4" />}
                    required
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Departure Time Buffer
                    </label>
                    <select
                      className="flex h-11 w-full rounded-xl glass-input px-3.5 text-sm text-slate-100 focus:outline-none"
                      value={formData.bufferMinutes}
                      onChange={(e) => setFormData({ ...formData, bufferMinutes: parseInt(e.target.value) })}
                    >
                      <option value={5} className="bg-slate-900">&plusmn; 5 minutes</option>
                      <option value={10} className="bg-slate-900">&plusmn; 10 minutes (Recommended)</option>
                      <option value={15} className="bg-slate-900">&plusmn; 15 minutes</option>
                    </select>
                  </div>
                </div>

                {/* Cost Share Slider */}
                <div className="space-y-2 p-4 rounded-xl glass-panel border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Fuel className="w-4 h-4 text-emerald-400" />
                      <span>Shared Fuel Contribution</span>
                    </label>
                    <span className="font-bold text-sm text-emerald-400">
                      ₹{formData.perKmCostShare} / km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="6.0"
                    step="0.5"
                    value={formData.perKmCostShare}
                    onChange={(e) => setFormData({ ...formData, perKmCostShare: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Min (₹3.0/km)</span>
                    <span>Statutory Cap (₹6.0/km)</span>
                  </div>
                </div>

                {/* Toggles: Helmet & ShePool */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl glass-card cursor-pointer border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.helmetProvided}
                      onChange={(e) => setFormData({ ...formData, helmetProvided: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-white">I will provide a clean, ISI-certified pillion helmet</div>
                      <div className="text-slate-400">Required by traffic regulation unless passenger brings their own</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl glass-card cursor-pointer border border-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.isWomenOnly}
                      onChange={(e) => setFormData({ ...formData, isWomenOnly: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-pink-400 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        <span>ShePool Mode (Female co-commuter only)</span>
                      </div>
                      <div className="text-slate-400">Only verified female commuters can view and request this ride</div>
                    </div>
                  </label>
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
                  <span>Publish Ride Offer</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Cost Recovery Summary Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-panel border-emerald-500/20 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Trip Cost Share Preview
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Estimated Distance</span>
                <span className="font-semibold text-white">{estimatedDistanceKm.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Per-Km Share Rate</span>
                <span className="font-semibold text-white">₹{formData.perKmCostShare}</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm">
                <span className="font-bold text-white">Fuel Cost Recovered</span>
                <span className="text-xl font-extrabold text-emerald-400">
                  {formatCurrency(estimatedFuelRecovery)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>Statutory 2 Trips / Day Rule</span>
              </div>
              <p>
                To comply with non-commercial carpooling laws, bike owners are limited to 2 completed pooled rides per day. All payouts cover direct fuel and wear costs.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

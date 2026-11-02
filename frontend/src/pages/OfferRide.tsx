import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Button } from '../components/ui/button.js';
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
  IndianRupee,
  Sparkles,
} from 'lucide-react';

const PRESET_COSTS = [40, 50, 75, 100, 120, 150];

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

  const [tripCost, setTripCost] = useState<number | string>(75);

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

  // Recalculate road distance if both coordinates are present
  const updateDistanceIfPossible = (
    origLat: number,
    origLng: number,
    destLat: number,
    destLng: number
  ) => {
    if (origLat && origLng && destLat && destLng) {
      const R = 6371; // km
      const dLat = ((destLat - origLat) * Math.PI) / 180;
      const dLon = ((destLng - origLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((origLat * Math.PI) / 180) *
          Math.cos((destLat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const approxKm = Math.max(2, Math.round(R * c * 1.3)); // 1.3 route factor
      const meters = approxKm * 1000;
      const seconds = Math.round((approxKm / 35) * 3600); // ~35 km/h avg speed
      setFormData((prev) => ({
        ...prev,
        estimatedDistanceMeters: meters,
        estimatedDurationSeconds: seconds,
      }));
    }
  };

  const estimatedDistanceKm = Math.max(1, formData.estimatedDistanceMeters / 1000);
  const numericTripCost = Number(tripCost) || 0;
  const effectivePerKmRate = (numericTripCost / estimatedDistanceKm).toFixed(2);

  const handleTripCostChange = (val: number | string) => {
    setTripCost(val);
    const num = Number(val) || 0;
    const perKm = Math.max(0.1, parseFloat((num / estimatedDistanceKm).toFixed(2)));
    setFormData((prev) => ({ ...prev, perKmCostShare: perKm }));
  };

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

    if (numericTripCost <= 0) {
      setError('Please enter a valid trip cost greater than ₹0.');
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

    const calculatedPerKm = Math.max(
      0.1,
      parseFloat((numericTripCost / estimatedDistanceKm).toFixed(2))
    );

    try {
      await api.offerRide({
        ...formData,
        originLat: formData.originLat || 19.9989,
        originLng: formData.originLng || 73.7633,
        destinationLat: formData.destinationLat || 19.9582,
        destinationLng: formData.destinationLng || 73.8449,
        scheduledDeparture: new Date(formData.scheduledDeparture).toISOString(),
        perKmCostShare: calculatedPerKm,
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
          Publish Your Daily <span className="text-emerald-500 dark:text-emerald-400">Pillion Ride</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 transition-colors">
          Share your empty pillion seat, set your trip cost, and travel legally under cost-sharing rules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 relative z-20 overflow-visible transition-colors">
            <CardHeader>
              <CardTitle>Trip Route & Schedule</CardTitle>
              <CardDescription>Enter your standard commute coordinates and set your trip price</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="p-3.5 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Vehicle Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Selected Motorcycle / Scooter
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold transition-colors"
                    >
                      + Add New Vehicle
                    </button>
                  </div>
                  {vehicles.length > 0 ? (
                    <select
                      className="flex h-11 w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                      value={formData.vehicleId}
                      onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                      required
                    >
                      {vehicles.map((v) => (
                        <option
                          key={v.id}
                          value={v.id}
                          className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100"
                        >
                          {v.make} {v.model} ({v.color}) — {v.licensePlate}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
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
                    icon={<MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
                    variant="dark"
                    inputClassName="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-3.5 h-11 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    onChange={(address, lat, lng) => {
                      const newOrigLat = lat !== undefined ? lat : formData.originLat;
                      const newOrigLng = lng !== undefined ? lng : formData.originLng;
                      setFormData((prev) => ({
                        ...prev,
                        originAddress: address,
                        originLat: newOrigLat,
                        originLng: newOrigLng,
                      }));
                      updateDistanceIfPossible(
                        newOrigLat,
                        newOrigLng,
                        formData.destinationLat,
                        formData.destinationLng
                      );
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
                    icon={<MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400" />}
                    variant="dark"
                    inputClassName="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl px-3.5 h-11 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    onChange={(address, lat, lng) => {
                      const newDestLat = lat !== undefined ? lat : formData.destinationLat;
                      const newDestLng = lng !== undefined ? lng : formData.destinationLng;
                      setFormData((prev) => ({
                        ...prev,
                        destinationAddress: address,
                        destinationLat: newDestLat,
                        destinationLng: newDestLng,
                      }));
                      updateDistanceIfPossible(
                        formData.originLat,
                        formData.originLng,
                        newDestLat,
                        newDestLng
                      );
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
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Departure Time Buffer
                    </label>
                    <select
                      className="flex h-11 w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
                      value={formData.bufferMinutes}
                      onChange={(e) => setFormData({ ...formData, bufferMinutes: parseInt(e.target.value) })}
                    >
                      <option value={5} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">&plusmn; 5 minutes</option>
                      <option value={10} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">&plusmn; 10 minutes (Recommended)</option>
                      <option value={15} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">&plusmn; 15 minutes</option>
                    </select>
                  </div>
                </div>

                {/* Direct Trip Cost Option (Replaced Slider) */}
                <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <IndianRupee className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        <span>Trip Cost for Passenger</span>
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Direct price per passenger seat for this entire commute route
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold self-start sm:self-auto">
                      <Sparkles className="w-3 h-3" />
                      <span>~₹{effectivePerKmRate}/km</span>
                    </div>
                  </div>

                  {/* Direct Cost Input */}
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-xl font-bold text-slate-400 dark:text-slate-500 pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="10"
                      max="5000"
                      step="5"
                      value={tripCost}
                      onChange={(e) => handleTripCostChange(e.target.value)}
                      placeholder="e.g. 75"
                      className="w-full h-13 pl-9 pr-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xl font-black placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
                      required
                    />
                    <span className="absolute right-4 text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                      Total Fare
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Quick Preset Values:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {PRESET_COSTS.map((amount) => {
                        const isSelected = numericTripCost === amount;
                        return (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => handleTripCostChange(amount)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30 scale-105'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                            }`}
                          >
                            ₹{amount}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Toggles: Helmet & ShePool */}
                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.helmetProvided}
                      onChange={(e) => setFormData({ ...formData, helmetProvided: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        I will provide a clean, ISI-certified pillion helmet
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Required by traffic regulation unless passenger brings their own
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isWomenOnly}
                      onChange={(e) => setFormData({ ...formData, isWomenOnly: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        <span>ShePool Mode (Female co-commuter only)</span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        Only verified female commuters can view and request this ride
                      </div>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Trip Cost Preview
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Distance</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {estimatedDistanceKm.toFixed(1)} km
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Effective Rate</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ₹{effectivePerKmRate} / km
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900 dark:text-white">Direct Trip Cost</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(numericTripCost)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 transition-colors">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Statutory 2 Trips / Day Rule</span>
              </div>
              <p className="leading-relaxed">
                To comply with non-commercial carpooling laws, bike owners are limited to 2 completed pooled rides per day. All payouts cover direct fuel and wear costs.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

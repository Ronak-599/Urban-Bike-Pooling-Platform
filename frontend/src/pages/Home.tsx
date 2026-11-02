import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent } from '../components/ui/card.js';
import { Badge } from '../components/ui/badge.js';
import { LocationAutocomplete } from '../components/ui/LocationAutocomplete.js';
import { formatCurrency, formatDate } from '../lib/utils.js';
import {
  Bike,
  Search,
  MapPin,
  Calendar,
  Shield,
  Heart,
  TrendingUp,
  Fuel,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useState({
    pickupAddress: '',
    pickupLat: undefined as number | undefined,
    dropoffAddress: '',
    dropoffLat: undefined as number | undefined,
    pickupLng: undefined as number | undefined,
    dropoffLng: undefined as number | undefined,
    departureDate: new Date().toISOString().slice(0, 10),
    passengers: 1,
    womenOnly: false,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch real-time available rides for live showcase
  const { data: upcomingRides, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['upcomingRides'],
    queryFn: () => api.getUpcomingRides(6),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchParams.pickupAddress.trim()) params.set('pickupAddress', searchParams.pickupAddress.trim());
    if (searchParams.dropoffAddress.trim()) params.set('dropoffAddress', searchParams.dropoffAddress.trim());
    if (searchParams.pickupLat !== undefined) params.set('pickupLat', searchParams.pickupLat.toString());
    if (searchParams.pickupLng !== undefined) params.set('pickupLng', searchParams.pickupLng.toString());
    if (searchParams.dropoffLat !== undefined) params.set('dropoffLat', searchParams.dropoffLat.toString());
    if (searchParams.dropoffLng !== undefined) params.set('dropoffLng', searchParams.dropoffLng.toString());
    if (searchParams.departureDate) params.set('departureDate', searchParams.departureDate);
    if (searchParams.womenOnly) params.set('womenOnly', 'true');

    navigate(`/search?${params.toString()}`);
  };

  const getDepartureLabel = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    if (searchParams.departureDate === todayStr) return 'Today';
    if (searchParams.departureDate === tomorrowStr) return 'Tomorrow';
    try {
      const d = new Date(searchParams.departureDate);
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return searchParams.departureDate;
    }
  };

  return (
    <div className="space-y-20 pb-16 transition-colors duration-200">
      {/* Hero Section with Search Widget */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge variant="secondary" className="px-3 py-1 text-xs sm:text-sm font-semibold gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Intra-City Bike Pooling</span>
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] transition-colors">
            Turn Empty Pillion Seats into <span className="text-emerald-500 dark:text-emerald-400">Shared Journeys</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed transition-colors">
            Your pick of rides at low prices. Commute together, offset fuel expenses, and bypass traffic on two wheels.
          </p>
        </div>

        {/* BlaBlaCar-Style Unified Search Bar */}
        <div className="mt-10 max-w-5xl mx-auto relative z-40">
          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-full shadow-2xl shadow-slate-900/10 dark:shadow-black/50 border-2 border-slate-200 dark:border-slate-700/80 p-2 md:p-1.5 transition-all hover:border-[#0084f9]">
            <form
              onSubmit={handleSearch}
              className="flex flex-col md:flex-row items-stretch md:items-center divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700/80"
            >
              {/* Segment 1: From */}
              <div className="flex-1 px-4 py-2.5 md:py-2 relative hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-t-xl md:rounded-l-full md:rounded-tr-none transition-colors">
                <LocationAutocomplete
                  label="From"
                  placeholder="City or place"
                  value={searchParams.pickupAddress}
                  icon={<MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  variant="blablacar"
                  onChange={(address, lat, lng) => {
                    setSearchParams((prev) => ({
                      ...prev,
                      pickupAddress: address,
                      pickupLat: lat,
                      pickupLng: lng,
                    }));
                  }}
                />
              </div>

              {/* Segment 2: To */}
              <div className="flex-1 px-4 py-2.5 md:py-2 relative hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                <LocationAutocomplete
                  label="To"
                  placeholder="City or place"
                  value={searchParams.dropoffAddress}
                  icon={<MapPin className="w-4 h-4 text-rose-500" />}
                  variant="blablacar"
                  onChange={(address, lat, lng) => {
                    setSearchParams((prev) => ({
                      ...prev,
                      dropoffAddress: address,
                      dropoffLat: lat,
                      dropoffLng: lng,
                    }));
                  }}
                />
              </div>

              {/* Segment 3: Departure */}
              <div className="px-4 py-2.5 md:py-2 relative hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors min-w-[140px]">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 select-none">
                  Departure
                </label>
                <div
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center justify-between gap-2 text-slate-900 dark:text-white font-bold text-sm sm:text-base h-10 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0084f9]" />
                    <span>{getDepartureLabel()}</span>
                  </div>
                </div>

                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <div className="absolute top-[calc(100%+8px)] left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 w-72 space-y-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Select Departure Date
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchParams((p) => ({ ...p, departureDate: new Date().toISOString().slice(0, 10) }));
                          setShowDatePicker(false);
                        }}
                        className={`p-2.5 text-xs font-bold rounded-xl border transition-colors ${
                          searchParams.departureDate === new Date().toISOString().slice(0, 10)
                            ? 'bg-[#0084f9] text-white border-[#0084f9]'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setSearchParams((p) => ({ ...p, departureDate: tomorrow.toISOString().slice(0, 10) }));
                          setShowDatePicker(false);
                        }}
                        className={`p-2.5 text-xs font-bold rounded-xl border transition-colors ${
                          searchParams.departureDate !== new Date().toISOString().slice(0, 10)
                            ? 'bg-[#0084f9] text-white border-[#0084f9]'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                        }`}
                      >
                        Tomorrow
                      </button>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Pick a specific date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={searchParams.departureDate}
                        onChange={(e) => {
                          setSearchParams((p) => ({ ...p, departureDate: e.target.value }));
                          setShowDatePicker(false);
                        }}
                        className="w-full text-xs font-medium p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0084f9]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Segment 4: Passengers */}
              <div className="px-4 py-2.5 md:py-2 relative hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors min-w-[130px]">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 select-none">
                  Passengers
                </label>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm sm:text-base h-10 select-none">
                  <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>1 passenger</span>
                </div>
              </div>

              {/* Segment 5: BlaBlaCar Style Search Button */}
              <div className="p-1 md:pl-2 flex-shrink-0">
                <button
                  type="submit"
                  className="w-full md:w-auto h-12 md:h-14 px-8 md:px-10 rounded-xl md:rounded-full bg-[#0084f9] hover:bg-[#0073d9] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/45 transition-all active:scale-[0.98]"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sub options matching BlaBlaCar checkbox style */}
          <div className="mt-3 flex items-center justify-between px-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={searchParams.womenOnly}
                onChange={(e) => setSearchParams({ ...searchParams, womenOnly: e.target.checked })}
                className="w-4 h-4 rounded text-pink-500 focus:ring-pink-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
              <span className="flex items-center gap-1 font-semibold text-pink-600 dark:text-pink-400">
                <Heart className="w-3.5 h-3.5 fill-pink-500/20" />
                <span>ShePool (Verified female rider & passenger only)</span>
              </span>
            </label>

            <button
              type="button"
              onClick={() => navigate('/offer')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>Have an empty pillion seat? Offer a ride</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Live Available Rides Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live Active Rides</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 transition-colors">
              Available Bike Pools Right Now
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 transition-colors">
              Verified commuters traveling today. Click any ride to view details and book.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/search')}
            className="self-start sm:self-auto"
          >
            <span>Browse All Rides</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>

        {loadingUpcoming ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : upcomingRides && upcomingRides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingRides.map((ride: any) => (
              <Card
                key={ride.rideId}
                onClick={() => navigate(`/ride/${ride.rideId}`)}
                className="hover:border-emerald-500/40 transition-all duration-200 group cursor-pointer hover:shadow-xl hover:shadow-emerald-950/10 dark:hover:shadow-emerald-950/20"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Departure Time & Price */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatDate(ride.scheduledDeparture)}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Fuel Share</div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(ride.pricing?.totalFare || 45)}
                      </div>
                    </div>
                  </div>

                  {/* Route points with visual route line */}
                  <div className="space-y-3 relative pl-6 text-xs">
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-300 dark:bg-slate-700 border-dashed" />
                    
                    <div className="relative">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-4 ring-emerald-500/20" />
                      <div className="font-semibold text-slate-900 dark:text-white truncate">{ride.originAddress}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Curbside Pickup Spot</div>
                    </div>

                    <div className="relative pt-2">
                      <div className="absolute -left-6 top-3 w-2.5 h-2.5 rounded-full bg-rose-500 dark:bg-rose-400 ring-4 ring-rose-500/20" />
                      <div className="font-semibold text-slate-900 dark:text-white truncate">{ride.destinationAddress}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Dropoff Station</div>
                    </div>
                  </div>

                  {/* Rider info & vehicle */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                        {ride.rider?.fullName?.slice(0, 2).toUpperCase() || 'RD'}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                          <span>{ride.rider?.fullName}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="text-amber-500 dark:text-amber-400 font-semibold">★ {Number(ride.rider?.ratingAvg || 5).toFixed(1)}</span>
                          <span>•</span>
                          <span>{ride.vehicle?.make} {ride.vehicle?.model}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ride.helmetProvided && (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-400 border-emerald-500/30 px-1.5 py-0.5">
                          Helmet
                        </Badge>
                      )}
                      <Button variant="primary" size="sm" className="group-hover:translate-x-0.5 transition-transform">
                        <span>Book</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center space-y-3 border-dashed border-slate-300 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No rides offered yet for today. Be the first to share your route!
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/offer')}>
              Offer a Pillion Ride
            </Button>
          </Card>
        )}
      </section>

      {/* Real-time Stats Counter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">125,000+</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Shared Km Pooled</div>
          </Card>
          <Card className="p-5 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">65%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average Commute Savings</div>
          </Card>
          <Card className="p-5 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">18.4 Tons</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">CO2 Emissions Saved</div>
          </Card>
          <Card className="p-5 text-center space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-yellow-400">★ 4.92</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mutual Commuter Rating</div>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <Badge variant="outline">Simple & Seamless</Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white transition-colors">How TwoShare Works</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto transition-colors">
            Whether you ride your bike or need an affordable lift, getting started takes less than 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
              01
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Publish or Search Route</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Bike owners publish their commute route once. Passengers search intersecting corridors or browse active rides.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
              02
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instant OTP Pickup & Helmet Check</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Meet at convenient curbside nodes. Verify your 4-digit PIN, put on the provided helmet, and hit the road.
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
              03
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Auto Fuel Split & Escrow Release</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Payments are held securely in escrow and automatically transferred to the rider upon safe drop-off.
            </p>
          </Card>
        </div>
      </section>

      {/* Safety Matrix Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl glass-panel border-emerald-500/30 p-8 sm:p-12 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <Badge variant="secondary" className="gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Compromise Safety</span>
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight transition-colors">
                Designed From The Ground Up For Two-Wheeler Safety
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                Riding a motorcycle in the city requires specialized safety protocols. TwoShare enforces mandatory government ID verification, dual helmet policies, and real-time route deviation guards.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Mandatory Govt Driving License & Vehicle RC Validation</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>"ShePool" verified mode for women riders and passengers</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Masked Telephony: Real phone numbers are never disclosed</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Included complimentary ₹2,00,000 personal accident insurance per trip</span>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <Button variant="primary" onClick={() => navigate('/offer')}>
                  <span>Become a Verified Host</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-sm rounded-2xl glass-card p-6 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Live Safe Corridor</span>
                  </div>
                  <Badge variant="success">Active Protection</Badge>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Planned Detour Tolerance</span>
                    <span className="font-semibold text-slate-900 dark:text-white">&le; 600 meters</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Helmet Selfie Audit</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Verified at Pickup</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Emergency SOS Bridge</span>
                    <span className="font-semibold text-slate-900 dark:text-white">24/7 Monitoring Desk</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

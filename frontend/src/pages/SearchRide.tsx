import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { SearchRideMatch } from '../types/index.js';
import { LocationAutocomplete } from '../components/ui/LocationAutocomplete.js';
import { BlaBlaCarMapView } from '../components/BlaBlaCarMapView.js';
import {
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  Heart,
  Calendar,
  Users,
  ArrowLeftRight,
  Zap,
  Star,
  Bell,
  X,
  Map,
  Filter,
  Check,
  SlidersHorizontal,
} from 'lucide-react';

export const SearchRide: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search parameters without hardcoded pre-filled values
  const [pickupAddress, setPickupAddress] = useState(searchParams.get('pickupAddress') || '');
  const [dropoffAddress, setDropoffAddress] = useState(searchParams.get('dropoffAddress') || '');
  const [pickupLat, setPickupLat] = useState<number | undefined>(
    searchParams.get('pickupLat') ? parseFloat(searchParams.get('pickupLat')!) : undefined
  );
  const [pickupLng, setPickupLng] = useState<number | undefined>(
    searchParams.get('pickupLng') ? parseFloat(searchParams.get('pickupLng')!) : undefined
  );
  const [dropoffLat, setDropoffLat] = useState<number | undefined>(
    searchParams.get('dropoffLat') ? parseFloat(searchParams.get('dropoffLat')!) : undefined
  );
  const [dropoffLng, setDropoffLng] = useState<number | undefined>(
    searchParams.get('dropoffLng') ? parseFloat(searchParams.get('dropoffLng')!) : undefined
  );
  const [departureDate, setDepartureDate] = useState(
    searchParams.get('departureDate') || new Date().toISOString().slice(0, 10)
  );
  const [passengers, setPassengers] = useState(1);
  const [womenOnly, setWomenOnly] = useState(searchParams.get('womenOnly') === 'true');
  const [helmetOnly, setHelmetOnly] = useState(false);
  const [instantOnly, setInstantOnly] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');
  const [sortBy, setSortBy] = useState<'match' | 'departure' | 'price'>('match');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassengersPicker, setShowPassengersPicker] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [alertCreated, setAlertCreated] = useState(false);

  // Sync when searchParams change in URL
  useEffect(() => {
    if (searchParams.has('pickupAddress')) setPickupAddress(searchParams.get('pickupAddress') || '');
    if (searchParams.has('dropoffAddress')) setDropoffAddress(searchParams.get('dropoffAddress') || '');
    if (searchParams.has('departureDate')) setDepartureDate(searchParams.get('departureDate') || '');
    if (searchParams.has('womenOnly')) setWomenOnly(searchParams.get('womenOnly') === 'true');
  }, [searchParams]);

  // Query rides with dynamic filters
  const { data: rides, isLoading, refetch } = useQuery<SearchRideMatch[]>({
    queryKey: ['searchRides', pickupAddress, dropoffAddress, pickupLat, pickupLng, dropoffLat, dropoffLng, departureDate, womenOnly],
    queryFn: () =>
      api.searchRides({
        originAddress: pickupAddress.trim() || undefined,
        destinationAddress: dropoffAddress.trim() || undefined,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        departureDate: departureDate || undefined,
        womenOnly: womenOnly ? 'true' : 'false',
        maxWalkDistanceMeters: 5000,
      }),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (pickupAddress.trim()) newParams.set('pickupAddress', pickupAddress.trim());
    if (dropoffAddress.trim()) newParams.set('dropoffAddress', dropoffAddress.trim());
    if (pickupLat !== undefined) newParams.set('pickupLat', pickupLat.toString());
    if (pickupLng !== undefined) newParams.set('pickupLng', pickupLng.toString());
    if (dropoffLat !== undefined) newParams.set('dropoffLat', dropoffLat.toString());
    if (dropoffLng !== undefined) newParams.set('dropoffLng', dropoffLng.toString());
    if (departureDate) newParams.set('departureDate', departureDate);
    if (womenOnly) newParams.set('womenOnly', 'true');

    setSearchParams(newParams);
    refetch();
  };

  // Swap From and To
  const handleSwapLocations = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const tempAddr = pickupAddress;
    const tempLat = pickupLat;
    const tempLng = pickupLng;

    setPickupAddress(dropoffAddress);
    setPickupLat(dropoffLat);
    setPickupLng(dropoffLng);

    setDropoffAddress(tempAddr);
    setDropoffLat(tempLat);
    setDropoffLng(tempLng);
  };

  // Format departure label (Today, Tomorrow, or formatted date)
  const getDepartureLabel = () => {
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
      return departureDate || 'Today';
    }
  };

  // Filter & Sort rides
  const filteredRides = (rides || [])
    .filter((r) => {
      if (helmetOnly && !r.helmetProvided) return false;
      if (timeFilter !== 'all') {
        const depH = new Date(r.scheduledDeparture).getHours();
        if (timeFilter === 'morning' && (depH < 6 || depH >= 12)) return false;
        if (timeFilter === 'afternoon' && (depH < 12 || depH >= 18)) return false;
        if (timeFilter === 'evening' && depH < 18) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'departure') {
        return new Date(a.scheduledDeparture).getTime() - new Date(b.scheduledDeparture).getTime();
      }
      if (sortBy === 'price') {
        return (a.pricing?.totalFare || 0) - (b.pricing?.totalFare || 0);
      }
      return b.matchScore - a.matchScore;
    });

  // Short city or street label extractor
  const getShortLocation = (address: string) => {
    if (!address) return 'City center';
    const parts = address.split(',').map((s) => s.trim());
    return parts[0] || address;
  };

  // Header route title
  const routeHeading = () => {
    const fromLabel = pickupAddress ? getShortLocation(pickupAddress) : 'Nashik';
    const toLabel = dropoffAddress ? getShortLocation(dropoffAddress) : 'Anywhere';
    return `${fromLabel} → ${toLabel}`;
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-slate-900 pb-20">
      {/* Top Search Bar Header (Matching BlaBlaCar India screenshot) */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="bg-white rounded-2xl md:rounded-full border border-slate-300 shadow-sm hover:border-[#0084f9] transition-all p-1.5">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col md:flex-row items-stretch md:items-center divide-y md:divide-y-0 md:divide-x divide-slate-200"
            >
              {/* Segment 1: From */}
              <div className="flex-1 px-4 py-2 relative rounded-t-xl md:rounded-l-full md:rounded-tr-none hover:bg-slate-50/70 transition-colors">
                <LocationAutocomplete
                  label="From"
                  placeholder="City or place"
                  value={pickupAddress}
                  icon={<MapPin className="w-4 h-4 text-emerald-600" />}
                  variant="blablacar"
                  onChange={(address, lat, lng) => {
                    setPickupAddress(address);
                    setPickupLat(lat);
                    setPickupLng(lng);
                  }}
                />
              </div>

              {/* Swap Button (<->) */}
              <div className="hidden md:flex items-center justify-center px-2">
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  title="Swap locations"
                  className="p-2 rounded-full text-slate-400 hover:text-[#0084f9] hover:bg-blue-50 transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              {/* Segment 2: To */}
              <div className="flex-1 px-4 py-2 relative hover:bg-slate-50/70 transition-colors">
                <LocationAutocomplete
                  label="To"
                  placeholder="City or place"
                  value={dropoffAddress}
                  icon={<MapPin className="w-4 h-4 text-rose-500" />}
                  variant="blablacar"
                  onChange={(address, lat, lng) => {
                    setDropoffAddress(address);
                    setDropoffLat(lat);
                    setDropoffLng(lng);
                  }}
                />
              </div>

              {/* Segment 3: Departure */}
              <div className="px-4 py-2 relative hover:bg-slate-50/70 transition-colors min-w-[130px]">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 select-none">
                  Departure
                </label>
                <div
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base h-10 cursor-pointer select-none"
                >
                  <Calendar className="w-4 h-4 text-[#0084f9]" />
                  <span>{getDepartureLabel()}</span>
                </div>

                {showDatePicker && (
                  <div className="absolute top-[calc(100%+8px)] left-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-72 space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Departure Date
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDepartureDate(new Date().toISOString().slice(0, 10));
                          setShowDatePicker(false);
                        }}
                        className={`p-2.5 text-xs font-bold rounded-xl border transition-colors ${
                          departureDate === new Date().toISOString().slice(0, 10)
                            ? 'bg-[#0084f9] text-white border-[#0084f9]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setDepartureDate(tomorrow.toISOString().slice(0, 10));
                          setShowDatePicker(false);
                        }}
                        className={`p-2.5 text-xs font-bold rounded-xl border transition-colors ${
                          departureDate !== new Date().toISOString().slice(0, 10)
                            ? 'bg-[#0084f9] text-white border-[#0084f9]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Tomorrow
                      </button>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={departureDate}
                        onChange={(e) => {
                          setDepartureDate(e.target.value);
                          setShowDatePicker(false);
                        }}
                        className="w-full text-xs font-medium p-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Segment 4: Return */}
              <div className="px-4 py-2 relative hover:bg-slate-50/70 transition-colors hidden lg:block min-w-[100px]">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 select-none">
                  Return
                </label>
                <div className="text-slate-400 font-semibold text-sm sm:text-base h-10 flex items-center select-none">
                  <span>Date</span>
                </div>
              </div>

              {/* Segment 5: Passengers */}
              <div className="px-4 py-2 relative hover:bg-slate-50/70 transition-colors min-w-[130px]">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5 select-none">
                  Passengers
                </label>
                <div
                  onClick={() => setShowPassengersPicker(!showPassengersPicker)}
                  className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base h-10 cursor-pointer select-none"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>{passengers} passenger</span>
                </div>

                {showPassengersPicker && (
                  <div className="absolute top-[calc(100%+8px)] right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 w-52 space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Seat Count
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => { setPassengers(1); setShowPassengersPicker(false); }}
                        className={`flex-1 p-2 text-xs font-bold rounded-xl border ${passengers === 1 ? 'bg-[#0084f9] text-white border-[#0084f9]' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                      >
                        1 Seat
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPassengers(2); setShowPassengersPicker(false); }}
                        className={`flex-1 p-2 text-xs font-bold rounded-xl border ${passengers === 2 ? 'bg-[#0084f9] text-white border-[#0084f9]' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                      >
                        2 Seats
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Segment 6: Blue BlaBlaCar Search Button */}
              <div className="p-1 md:pl-2 flex-shrink-0">
                <button
                  type="submit"
                  className="w-full md:w-auto h-12 md:h-13 px-8 md:px-10 rounded-xl md:rounded-full bg-[#0084f9] hover:bg-[#0073d9] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Area (Two Columns Layout matching BlaBlaCar screenshot) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Stylized Map Card & Filters */}
          <div className="lg:col-span-4 space-y-6">
            {/* Map Preview Thumbnail matching screenshot */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-blue-50/50 aspect-[16/10] flex items-center justify-center group">
              {/* SVG Map Background Artwork */}
              <svg
                className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
                viewBox="0 0 400 250"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M-20 80 Q100 120 220 70 T420 110" stroke="#93c5fd" strokeWidth="24" fill="none" strokeLinecap="round" />
                <path d="M60 -20 Q120 140 180 260" stroke="#bfdbfe" strokeWidth="16" fill="none" />
                <path d="M-10 180 L420 40" stroke="#ffffff" strokeWidth="8" strokeDasharray="6 4" />
                <path d="M120 -10 L280 270" stroke="#ffffff" strokeWidth="6" />
                <path d="M-20 40 L410 220" stroke="#e2e8f0" strokeWidth="5" />
                <circle cx="110" cy="110" r="8" fill="#10b981" />
                <circle cx="270" cy="80" r="8" fill="#ef4444" />
                <path d="M110 110 Q190 90 270 80" stroke="#0084f9" strokeWidth="4" strokeDasharray="5 3" />
              </svg>

              {/* Floating Centered "Show on map" Button */}
              <button
                type="button"
                onClick={() => {
                  if (filteredRides.length > 0) {
                    setSelectedRideId(filteredRides[0].rideId);
                  }
                  setShowMapModal(true);
                }}
                className="relative z-10 px-5 py-2.5 rounded-full bg-[#0084f9] hover:bg-[#0073d9] text-white font-bold text-sm shadow-md shadow-blue-500/30 flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
              >
                <MapPin className="w-4 h-4 fill-white" />
                <span>Show on map</span>
              </button>
            </div>

            {/* Filters Sidebar matching screenshot */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                  <span>Trip Filters</span>
                </span>
                {(womenOnly || helmetOnly || timeFilter !== 'all' || sortBy !== 'match') && (
                  <button
                    type="button"
                    onClick={() => {
                      setWomenOnly(false);
                      setHelmetOnly(false);
                      setTimeFilter('all');
                      setSortBy('match');
                    }}
                    className="text-xs text-[#0084f9] hover:underline font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Sort By
                </span>
                <div className="space-y-1 text-xs font-medium text-slate-700">
                  <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                    <span>Best Corridor Match</span>
                    <input
                      type="radio"
                      name="sort"
                      checked={sortBy === 'match'}
                      onChange={() => setSortBy('match')}
                      className="accent-[#0084f9]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                    <span>Earliest Departure</span>
                    <input
                      type="radio"
                      name="sort"
                      checked={sortBy === 'departure'}
                      onChange={() => setSortBy('departure')}
                      className="accent-[#0084f9]"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                    <span>Lowest Price</span>
                    <input
                      type="radio"
                      name="sort"
                      checked={sortBy === 'price'}
                      onChange={() => setSortBy('price')}
                      className="accent-[#0084f9]"
                    />
                  </label>
                </div>
              </div>

              {/* Departure Time of Day */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Departure Time
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setTimeFilter(timeFilter === 'morning' ? 'all' : 'morning')}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      timeFilter === 'morning'
                        ? 'bg-blue-50 border-[#0084f9] text-[#0084f9]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>Morning</div>
                    <div className="text-[10px] text-slate-400 font-normal">06:00 - 12:00</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeFilter(timeFilter === 'afternoon' ? 'all' : 'afternoon')}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      timeFilter === 'afternoon'
                        ? 'bg-blue-50 border-[#0084f9] text-[#0084f9]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>Afternoon</div>
                    <div className="text-[10px] text-slate-400 font-normal">12:00 - 18:00</div>
                  </button>
                </div>
              </div>

              {/* Safety & Preferences */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Preferences
                </span>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={womenOnly}
                      onChange={(e) => setWomenOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 accent-pink-600 border-slate-300"
                    />
                    <div className="flex items-center gap-1 font-semibold text-pink-600">
                      <Heart className="w-3.5 h-3.5 fill-pink-600/20" />
                      <span>ShePool (Female only)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={helmetOnly}
                      onChange={(e) => setHelmetOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 border-slate-300"
                    />
                    <span className="font-semibold text-slate-700">Helmet Provided by Host</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Rides List matching BlaBlaCar Screenshot */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header Line: "<Date>  <Origin> → <Destination>" and "<N> rides available" */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <span className="font-extrabold text-slate-900">{getDepartureLabel()}</span>
                <span className="font-semibold text-slate-600 truncate">{routeHeading()}</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-500 whitespace-nowrap">
                {filteredRides.length} {filteredRides.length === 1 ? 'ride' : 'rides'} available
              </div>
            </div>

            {/* List of Ride Cards */}
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0084f9] rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-500">Loading available rides...</p>
              </div>
            ) : filteredRides.length > 0 ? (
              <div className="space-y-3.5">
                {filteredRides.map((ride) => {
                  const depDate = new Date(ride.scheduledDeparture);
                  const depH = String(depDate.getHours()).padStart(2, '0');
                  const depM = String(depDate.getMinutes()).padStart(2, '0');
                  const depTime = `${depH}:${depM}`;

                  // Compute realistic duration & arrival time
                  const durationSec = ride.detourMinutes ? ride.detourMinutes * 60 + 2400 : 2400;
                  const arrDate = new Date(depDate.getTime() + durationSec * 1000);
                  const arrH = String(arrDate.getHours()).padStart(2, '0');
                  const arrM = String(arrDate.getMinutes()).padStart(2, '0');
                  const arrTime = `${arrH}:${arrM}`;

                  const durHours = Math.floor(durationSec / 3600);
                  const durMins = Math.floor((durationSec % 3600) / 60);
                  const durationLabel = durHours > 0 ? `${durHours}h${durMins > 0 ? durMins : ''}` : `${durMins}m`;

                  const originShort = getShortLocation(ride.originAddress);
                  const destShort = getShortLocation(ride.destinationAddress);
                  const priceFormatted = `₹${(ride.pricing?.totalFare || 45).toFixed(2)}`;

                  return (
                    <div
                      key={ride.rideId}
                      onClick={() =>
                        navigate(
                          `/ride/${ride.rideId}?pickupAddress=${encodeURIComponent(
                            pickupAddress || ride.originAddress
                          )}&dropoffAddress=${encodeURIComponent(
                            dropoffAddress || ride.destinationAddress
                          )}`
                        )
                      }
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5 sm:p-6 cursor-pointer space-y-4 group"
                    >
                      {/* Top Row: Journey Times, Route Line & Large Bold Price */}
                      <div className="flex items-start justify-between gap-4">
                        {/* Timeline Graphic */}
                        <div className="space-y-1 min-w-0 flex-1 max-w-lg">
                          <div className="flex items-center gap-3">
                            {/* Departure Time */}
                            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight shrink-0">
                              {depTime}
                            </span>

                            {/* Horizontal Route Line with Duration Pill */}
                            <div className="flex items-center flex-1 max-w-[200px] sm:max-w-[240px] px-1">
                              <span className="w-2 h-2 rounded-full border-2 border-slate-900 bg-white shrink-0" />
                              <div className="h-[2px] bg-slate-900 flex-1 relative flex items-center justify-center">
                                <span className="absolute text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200/80 -top-2.5 select-none shadow-2xs">
                                  {durationLabel}
                                </span>
                              </div>
                              <span className="w-2 h-2 rounded-full border-2 border-slate-900 bg-white shrink-0" />
                            </div>

                            {/* Arrival Time */}
                            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight shrink-0">
                              {arrTime}
                            </span>
                          </div>

                          {/* Origin and Destination Place Names */}
                          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700 pt-0.5">
                            <span className="truncate max-w-[45%] text-left">{originShort}</span>
                            <span className="truncate max-w-[45%] text-right">{destShort}</span>
                          </div>
                        </div>

                        {/* Price (Right aligned matching screenshot) */}
                        <div className="text-right shrink-0">
                          <span className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                            {priceFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Vehicle Icon, Driver Avatar, Name, Rating & Badges */}
                      <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-3">
                          {/* Bike / Vehicle Icon */}
                          <div className="p-1 text-slate-500">
                            <svg className="w-5 h-5 fill-slate-700" viewBox="0 0 24 24">
                              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.6-1.7-1.5-1.9L18 10.5V7c0-.6-.4-1-1-1H7c-.6 0-1 .4-1 1v3.5L3.5 11.1C2.6 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2c0 1.7 1.3 3 3 3s3-1.3 3-3h6c0 1.7 1.3 3 3 3s3-1.3 3-3zm-11 2c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm8-11h2v3h-2V8zm-6 0h4v3h-4V8zm-2 0h-2v3h2V8zm-2 10c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
                            </svg>
                          </div>

                          {/* Driver Avatar with Blue Verified Checkmark */}
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs overflow-hidden">
                              {ride.rider?.avatarUrl ? (
                                <img src={ride.rider.avatarUrl} alt={ride.rider.fullName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{ride.rider?.fullName?.slice(0, 2).toUpperCase() || 'DR'}</span>
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#0084f9] rounded-full flex items-center justify-center text-[8px] text-white font-bold border border-white">
                              ✓
                            </div>
                          </div>

                          {/* Driver Name & Star Rating */}
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{ride.rider?.fullName}</span>
                            <span className="flex items-center gap-0.5 text-slate-600 font-semibold">
                              <Star className="w-3.5 h-3.5 fill-slate-900 text-slate-900 inline" />
                              <span>{Number(ride.rider?.ratingAvg || 5).toFixed(0)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Feature Badges matching BlaBlaCar Screenshot */}
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <Zap className="w-3.5 h-3.5 text-slate-400" />
                            <span>Instant Booking</span>
                          </span>

                          {ride.helmetProvided && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Helmet Provided
                            </span>
                          )}

                          {ride.isWomenOnly && (
                            <span className="text-[11px] font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200">
                              ShePool
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* "Create a ride alert" Pill Button at Bottom (Matching Screenshot) */}
                <div className="pt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAlertCreated(true)}
                    className="px-6 py-2.5 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-[#0084f9] font-bold text-xs sm:text-sm shadow-2xs flex items-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Bell className="w-4 h-4 text-[#0084f9]" />
                    <span>{alertCreated ? 'Ride Alert Created!' : 'Create a ride alert'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">No rides available on this route</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No bike riders have published a route along this corridor for the selected date yet.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPickupAddress('');
                      setDropoffAddress('');
                      setPickupLat(undefined);
                      setPickupLng(undefined);
                      setDropoffLat(undefined);
                      setDropoffLng(undefined);
                      setDepartureDate('');
                      setSearchParams(new URLSearchParams());
                      refetch();
                    }}
                    className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Clear Filters & See All Rides
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/offer')}
                    className="px-5 py-2.5 rounded-full bg-[#0084f9] text-white font-bold text-xs hover:bg-[#0073d9]"
                  >
                    Publish Your Ride Instead
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive BlaBlaCar Split-Screen Map View (matching screenshot) */}
      {showMapModal && (
        <BlaBlaCarMapView
          rides={filteredRides}
          selectedRideId={selectedRideId}
          onSelectRide={(id) => setSelectedRideId(id)}
          onClose={() => setShowMapModal(false)}
          pickupAddress={pickupAddress}
          dropoffAddress={dropoffAddress}
          departureDate={departureDate}
          onViewRide={(rideId) =>
            navigate(
              `/ride/${rideId}?pickupAddress=${encodeURIComponent(
                pickupAddress
              )}&dropoffAddress=${encodeURIComponent(dropoffAddress)}`
            )
          }
        />
      )}
    </div>
  );
};

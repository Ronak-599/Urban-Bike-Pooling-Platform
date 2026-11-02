import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { Ride } from '../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Badge } from '../components/ui/badge.js';
import { formatCurrency, formatDate } from '../lib/utils.js';
import {
  Bike,
  ShieldCheck,
  MapPin,
  Clock,
  Heart,
  User,
  Shield,
  ArrowRight,
} from 'lucide-react';

export const RideDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const [pickupAddress, setPickupAddress] = useState(
    searchParams.get('pickupAddress') || ''
  );
  const [dropoffAddress, setDropoffAddress] = useState(
    searchParams.get('dropoffAddress') || ''
  );
  const [pickupLat, setPickupLat] = useState<number>(19.9989);
  const [pickupLng, setPickupLng] = useState<number>(73.7633);
  const [dropoffLat, setDropoffLat] = useState<number>(19.9582);
  const [dropoffLng, setDropoffLng] = useState<number>(73.8449);

  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: ride, isLoading } = useQuery<Ride>({
    queryKey: ['ride', id],
    queryFn: () => api.getRideById(id!),
    enabled: !!id,
  });

  React.useEffect(() => {
    if (ride) {
      if (!pickupAddress) setPickupAddress(ride.originAddress);
      if (!dropoffAddress) setDropoffAddress(ride.destinationAddress);
      setPickupLat(ride.originLat);
      setPickupLng(ride.originLng);
      setDropoffLat(ride.destinationLat);
      setDropoffLng(ride.destinationLng);
    }
  }, [ride]);

  const handleBook = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setRequesting(true);
    setError(null);

    try {
      const booking = await api.createBooking({
        rideId: id!,
        pickupLat,
        pickupLng,
        pickupAddress: pickupAddress || ride?.originAddress,
        dropoffLat,
        dropoffLng,
        dropoffAddress: dropoffAddress || ride?.destinationAddress,
      });
      navigate(`/booking/${booking.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to book ride');
    } finally {
      setRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Ride Offer Not Found</h2>
        <Button variant="secondary" onClick={() => navigate('/search')}>
          Back to Search
        </Button>
      </div>
    );
  }

  const rider = ride.riderProfile?.user;
  const vehicle = ride.vehicle;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <Badge variant="secondary" className="mb-2">Ride Offer Details</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Intra-City Pillion Commute
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Rider Profile Card */}
          <Card className="p-6 border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
                  {rider?.fullName.slice(0, 2).toUpperCase() || 'RD'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{rider?.fullName}</h2>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="text-amber-400 font-semibold">★ {Number(rider?.ratingAvg || 5).toFixed(1)}</span>
                    <span>•</span>
                    <span>{ride.riderProfile?.totalTripsCompleted || 0} completed pooled trips</span>
                  </div>
                </div>
              </div>

              {ride.isWomenOnly && (
                <Badge variant="success" className="gap-1 text-pink-400 border-pink-500/30 bg-pink-500/10">
                  <Heart className="w-3.5 h-3.5" />
                  <span>ShePool Only</span>
                </Badge>
              )}
            </div>
          </Card>

          {/* Vehicle & Safety Equipment */}
          <Card className="p-6 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Vehicle & Safety Gear
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl glass-panel space-y-1">
                <span className="text-slate-500">Vehicle</span>
                <div className="font-bold text-white text-sm">
                  {vehicle?.make} {vehicle?.model}
                </div>
                <div className="text-emerald-400 font-mono text-[11px]">{vehicle?.licensePlate}</div>
              </div>

              <div className="p-3.5 rounded-xl glass-panel space-y-1">
                <span className="text-slate-500">Pillion Helmet</span>
                <div className="font-bold text-emerald-400 text-sm">
                  {ride.helmetProvided ? 'Provided by Host' : 'Bring Your Own'}
                </div>
                <div className="text-slate-400 text-[11px]">ISI / DOT Standard</div>
              </div>

              <div className="p-3.5 rounded-xl glass-panel space-y-1">
                <span className="text-slate-500">Verification</span>
                <div className="font-bold text-white text-sm flex items-center gap-1">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Verified DL & RC</span>
                </div>
                <div className="text-slate-400 text-[11px]">Govt Database Checked</div>
              </div>
            </div>
          </Card>

          {/* Route Itinerary */}
          <Card className="p-6 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Corridor Trajectory
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-xs sm:text-sm">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Rider Origin</span>
                  <span className="font-medium text-white">{ride.originAddress}</span>
                </div>
              </div>

              <div className="border-l-2 border-dashed border-slate-700 ml-2.5 h-6" />

              <div className="flex items-start gap-3 text-xs sm:text-sm">
                <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Rider Destination</span>
                  <span className="font-medium text-white">{ride.destinationAddress}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Booking Action Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-panel border-emerald-500/30 p-6 space-y-5">
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Shared Fuel Contribution
              </div>
              <div className="text-3xl font-black text-emerald-400">
                ₹{Math.round(((ride.estimatedDistanceMeters || 12000) / 1000) * Number(ride.perKmCostShare)) + 5 + 2}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Includes fuel share + ₹5 platform fee + ₹2 insurance
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Input
                label="Your Pickup Node"
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                icon={<MapPin className="w-4 h-4 text-emerald-400" />}
                required
              />

              <Input
                label="Your Dropoff Node"
                type="text"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                icon={<MapPin className="w-4 h-4 text-rose-400" />}
                required
              />
            </div>

            {user?.id === ride.riderProfile?.user?.id ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 text-center">
                  You published this ride offer. Passengers will request seats from their account.
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/trips?tab=rider')}
                >
                  <span>Manage in My Trips</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={requesting}
                onClick={handleBook}
              >
                <span>Send Booking Request</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            <div className="text-[11px] text-slate-400 leading-relaxed text-center">
              Request is sent to host for confirmation. Seat is reserved and pickup PIN unlocks once the host approves.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

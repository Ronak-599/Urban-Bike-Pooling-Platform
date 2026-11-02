import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Booking } from '../types/index.js';
import { useSocket } from '../hooks/useSocket.js';
import { Card, CardContent } from '../components/ui/card.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { formatCurrency, formatDate } from '../lib/utils.js';
import {
  Bike,
  ShieldAlert,
  KeyRound,
  CreditCard,
  Phone,
  CheckCircle2,
  Navigation,
  Clock,
  XCircle,
  Lock,
  ArrowRight,
  AlertTriangle,
  UserCheck,
  Ban,
} from 'lucide-react';

export const BookingConfirmation: React.FC = () => {
  const { id: bookingId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: booking, isLoading, refetch } = useQuery<Booking>({
    queryKey: ['booking', bookingId],
    queryFn: () => api.getBookingById(bookingId!),
    enabled: !!bookingId,
    refetchInterval: 3000, // Poll status every 3 seconds for instant real-time sync
  });

  const { isConnected, riderLocation, triggerSos } = useSocket(bookingId);

  const handlePayNow = async () => {
    setPaying(true);
    setError(null);
    try {
      const order = await api.createPaymentOrder(bookingId!);

      // In sandbox/demo, auto-verify signature or mock Razorpay modal
      await api.verifyPayment({
        bookingId: bookingId!,
        razorpayOrderId: order.orderId,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpaySignature: 'valid_mock_signature',
      });

      refetch();
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed');
    } finally {
      setPaying(false);
    }
  };

  const handleCancelBooking = async () => {
    const isPending = booking?.status === 'REQUESTED';
    const confirmMsg = isPending
      ? 'Are you sure you want to cancel this booking request?'
      : 'Are you sure you want to cancel this confirmed booking?';

    if (!confirm(confirmMsg)) return;
    setCancelling(true);
    try {
      await api.cancelBooking(bookingId!, 'Cancelled by passenger');
      refetch();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleTriggerEmergencySos = () => {
    if (confirm('EMERGENCY: Do you want to trigger SOS alert to police and emergency contacts?')) {
      triggerSos({ lat: booking?.pickupLat || 19.9989, lng: booking?.pickupLng || 73.7633 });
      alert('SOS Alert has been dispatched with your live coordinates.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Booking Not Found</h2>
        <Button variant="secondary" onClick={() => navigate('/search')}>
          Search Rides
        </Button>
      </div>
    );
  }

  const rider = booking.ride?.riderProfile?.user;
  const vehicle = booking.ride?.vehicle;
  const isPending = booking.status === 'REQUESTED';
  const isConfirmed = booking.status === 'CONFIRMED' || booking.status === 'ARRIVED';
  const isStarted = booking.status === 'STARTED';
  const isCompleted = booking.status === 'COMPLETED';
  const isRejected = booking.status === 'REJECTED';
  const isCancelled = booking.status === 'CANCELLED';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner with Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Booking #{booking.id.slice(0, 8)}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isPending ? 'Booking Request Submitted' : 'Ride Booking & Confirmation'}
          </h1>
        </div>

        <Badge
          variant={
            isCompleted
              ? 'success'
              : isStarted
              ? 'warning'
              : isConfirmed
              ? 'secondary'
              : isPending
              ? 'warning'
              : 'default'
          }
          className={`text-sm px-3 py-1 uppercase tracking-wider ${
            isPending
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : isConfirmed
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : isRejected || isCancelled
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : ''
          }`}
        >
          {isPending
            ? 'AWAITING HOST CONFIRMATION'
            : isConfirmed
            ? 'CONFIRMED & BOOKED'
            : isRejected
            ? 'DECLINED BY HOST'
            : booking.status}
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
          {error}
        </div>
      )}

      {/* 1. STATE: PENDING HOST APPROVAL */}
      {isPending && (
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-amber-300">
                    Waiting for Host Confirmation
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Pending Owner Review
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your seat request has been delivered to <strong>{rider?.fullName || 'the host rider'}</strong>. 
                  Your seat is reserved as soon as the host accepts. Your pickup verification PIN will unlock instantly upon approval.
                </p>
              </div>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-500/20 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>1. Request Sent</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-300 font-bold animate-pulse">
                <Clock className="w-4 h-4 shrink-0" />
                <span>2. Host Approving...</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Lock className="w-4 h-4 shrink-0" />
                <span>3. PIN & Curbside</span>
              </div>
            </div>
          </div>

          {/* Locked OTP Card */}
          <Card className="glass-panel border-slate-800 p-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-bold tracking-wider text-slate-400">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Pickup Verification PIN (Locked)</span>
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black text-slate-600 tracking-widest py-1">
              ••••
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your 4-digit pickup verification PIN will be revealed here automatically as soon as {rider?.fullName || 'the host'} accepts your booking.
            </p>
          </Card>
        </div>
      )}

      {/* 2. STATE: CONFIRMED & BOOKED */}
      {isConfirmed && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-emerald-300">
                  {booking.status === 'ARRIVED' ? 'Host Has Arrived at Curbside!' : 'Ride Confirmed by Host! 🎉'}
                </h2>
                <p className="text-xs text-slate-300">
                  {booking.status === 'ARRIVED'
                    ? 'Meet the rider at your pickup location and share your 4-digit PIN.'
                    : 'Your seat has been reserved. Meet the host at your pickup spot at departure time.'}
                </p>
              </div>
            </div>
            <Badge variant="success" className="text-xs font-bold shrink-0">
              SEAT RESERVED
            </Badge>
          </div>

          {/* Unlocked 4-Digit Pickup OTP Card */}
          <Card className="glass-panel border-emerald-500/40 p-6 text-center space-y-2 shadow-glow">
            <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-bold tracking-wider text-slate-400">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Pickup Verification PIN</span>
            </div>
            <div className="text-4xl sm:text-5xl font-mono font-black text-emerald-400 tracking-widest py-1">
              {booking.pickupOtp}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Share this 4-digit code in person with {rider?.fullName || 'the rider'} when boarding at your curbside pickup spot.
            </p>
          </Card>
        </div>
      )}

      {/* 3. STATE: DECLINED BY HOST */}
      {isRejected && (
        <div className="p-6 rounded-2xl bg-rose-500/15 border border-rose-500/30 space-y-3 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Booking Request Declined</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            The host was unable to accept this booking request for their schedule. No funds have been charged to your account.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={() => navigate('/search')}>
              Find Another Ride
            </Button>
          </div>
        </div>
      )}

      {/* 4. STATE: CANCELLED */}
      {isCancelled && (
        <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
            <Ban className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ride Cancelled</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {booking.cancellationReason || 'This booking or ride offer was cancelled.'}
          </p>
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/search')}>
              Explore Live Corridor Rides
            </Button>
          </div>
        </div>
      )}

      {/* Live Rider Approach & Telemetry */}
      {['CONFIRMED', 'ARRIVED', 'STARTED'].includes(booking.status) && (
        <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Live GPS Telemetry ({isConnected ? 'Connected' : 'Syncing'})
              </span>
            </div>
            {riderLocation && (
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                Speed: {riderLocation.speedKmh.toFixed(1)} km/h
              </span>
            )}
          </div>
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>
                {booking.status === 'ARRIVED'
                  ? 'Host has arrived at your curbside pickup spot'
                  : 'Host is en-route to curbside pickup spot'}
              </span>
            </div>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {booking.status === 'ARRIVED' ? 'Arrived Now' : 'ETA ~3 mins'}
            </span>
          </div>
        </Card>
      )}

      {/* Trip & Vehicle Details */}
      <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Trip & Host Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Rider Name</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{rider?.fullName}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-amber-500 font-semibold">★ {Number(rider?.ratingAvg || 5).toFixed(1)}</span>
              {isConfirmed && rider?.phoneNumber && (
                <a
                  href={`tel:${rider.phoneNumber}`}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium flex items-center gap-1 ml-2"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Rider</span>
                </a>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-500 block">Motorcycle / License Plate</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{vehicle?.make} {vehicle?.model}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">{vehicle?.licensePlate}</span>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Pickup Spot</span>
            <span className="text-slate-900 dark:text-white font-medium text-right">{booking.pickupAddress}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Destination</span>
            <span className="text-slate-900 dark:text-white font-medium text-right">{booking.dropoffAddress}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Scheduled Time</span>
            <span className="text-slate-900 dark:text-white font-medium">{formatDate(booking.ride?.scheduledDeparture)}</span>
          </div>
        </div>
      </Card>

      {/* Payment & Escrow Card */}
      {!isRejected && !isCancelled && (
        <Card className="p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block">
                Total Shared Cost
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {formatCurrency(booking.totalFare)}
              </span>
            </div>

            <div>
              {booking.payment?.status === 'CAPTURED' ? (
                <Badge variant="success" className="gap-1 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Held in Escrow</span>
                </Badge>
              ) : booking.payment?.status === 'TRANSFERRED' ? (
                <Badge variant="success" className="gap-1 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Trip Paid & Completed</span>
                </Badge>
              ) : isPending ? (
                <Badge variant="secondary" className="text-xs">
                  Charges Authorize After Confirmation
                </Badge>
              ) : (
                <Button variant="primary" size="sm" onClick={handlePayNow} isLoading={paying}>
                  <CreditCard className="w-4 h-4" />
                  <span>Authorize Escrow Pay</span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Bottom Safety & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {['CONFIRMED', 'ARRIVED', 'STARTED'].includes(booking.status) && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleTriggerEmergencySos}
            className="w-full sm:w-auto"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency SOS Dispatch</span>
          </Button>
        )}

        {['REQUESTED', 'CONFIRMED'].includes(booking.status) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelBooking}
            isLoading={cancelling}
            className="w-full sm:w-auto text-rose-400 hover:text-rose-300"
          >
            <XCircle className="w-4 h-4" />
            <span>{isPending ? 'Cancel Booking Request' : 'Cancel Ride'}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

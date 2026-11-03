import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Booking, Ride } from '../types/index.js';
import { TripChat } from '../components/TripChat.js';
import { Card, CardContent } from '../components/ui/card.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { formatCurrency, formatDate } from '../lib/utils.js';
import {
  Bike,
  User,
  Clock,
  MapPin,
  Check,
  X,
  Play,
  CheckCheck,
  Star,
  KeyRound,
  ArrowRight,
  Sparkles,
  Phone,
  Ban,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Copy,
  Lock,
} from 'lucide-react';

export const MyTrips: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'rider' ? 'RIDER' : 'PASSENGER';
  const [activeTab, setActiveTab] = useState<'PASSENGER' | 'RIDER'>(initialTab);
  const isNewlyPublished = searchParams.get('published') === 'true';
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Fetch Passenger Bookings
  const {
    data: bookings,
    isLoading: loadingBookings,
    refetch: refetchBookings,
  } = useQuery<Booking[]>({
    queryKey: ['myBookings'],
    queryFn: () => api.getMyBookings(),
  });

  // Fetch Rider Offers
  const {
    data: myRides,
    isLoading: loadingRides,
    refetch: refetchRides,
  } = useQuery<Ride[]>({
    queryKey: ['myRides'],
    queryFn: () => api.getMyRides(),
  });

  // Host Action: Cancel published ride offer
  const handleCancelRide = async (rideId: string) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this ride offer? All pending or confirmed passenger requests for this ride will be cancelled.'
    );
    if (!confirmCancel) return;

    setActionLoading((prev) => ({ ...prev, [`ride-${rideId}`]: true }));
    try {
      await api.cancelRide(rideId);
      await refetchRides();
      alert('Ride offer cancelled successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel ride offer');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`ride-${rideId}`]: false }));
    }
  };

  // Host Action: Respond to booking (Accept/Reject)
  const handleRespond = async (bookingId: string, action: 'ACCEPT' | 'REJECT') => {
    setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
    try {
      await api.respondBooking(bookingId, action);
      await refetchRides();
    } catch (err: any) {
      alert(err.message || 'Failed to respond to booking');
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  // Host Action: Mark Arrived
  const handleMarkArrived = async (bookingId: string) => {
    setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
    try {
      await api.markArrived(bookingId);
      await refetchRides();
    } catch (err: any) {
      alert(err.message || 'Failed to mark arrival');
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  // Host Action: Verify Passenger OTP & Start
  const handleVerifyOtp = async (bookingId: string) => {
    const otp = otpInputs[bookingId];
    if (!otp || otp.length !== 4) {
      alert('Please enter a 4-digit numeric OTP provided by the passenger');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
    try {
      await api.verifyOtpAndStart(bookingId, otp);
      await refetchRides();
    } catch (err: any) {
      alert(err.message || 'Invalid OTP');
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  // Host Action: Complete Ride
  const handleCompleteRide = async (bookingId: string) => {
    setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
    try {
      await api.completeRide(bookingId);
      await refetchRides();
    } catch (err: any) {
      alert(err.message || 'Failed to complete ride');
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          My Commute Trips
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Manage your booked pillion rides and published host schedules
        </p>
      </div>

      {isNewlyPublished && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-300">Ride Offer Published Successfully!</div>
              <div className="text-xs text-slate-300">Your ride is stored and live. You will receive booking requests when commuters book your ride.</div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/search')}
            className="shrink-0"
          >
            <span>View in Search</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('PASSENGER')}
          className={`pb-3 text-sm font-bold transition-colors relative ${
            activeTab === 'PASSENGER' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>As Passenger ({bookings?.length || 0})</span>
          {activeTab === 'PASSENGER' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('RIDER')}
          className={`pb-3 text-sm font-bold transition-colors relative ${
            activeTab === 'RIDER' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>As Host Rider ({myRides?.length || 0})</span>
          {activeTab === 'RIDER' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Passenger Bookings View */}
      {activeTab === 'PASSENGER' && (
        <div className="space-y-4">
          {loadingBookings ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : bookings && bookings.length > 0 ? (
            bookings.map((booking) => (
              <Card key={booking.id} className="p-5 border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          booking.status === 'COMPLETED'
                            ? 'success'
                            : booking.status === 'STARTED'
                            ? 'warning'
                            : booking.status === 'CONFIRMED'
                            ? 'secondary'
                            : booking.status === 'REQUESTED'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {booking.status === 'REQUESTED'
                          ? 'Awaiting Host Approval'
                          : booking.status === 'CONFIRMED'
                          ? 'Confirmed & Booked'
                          : booking.status === 'REJECTED'
                          ? 'Declined by Host'
                          : booking.status}
                      </Badge>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatDate(booking.ride?.scheduledDeparture || booking.requestedAt)}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Host: {booking.ride?.riderProfile?.user?.fullName || 'Verified Rider'}
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{booking.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">{booking.dropoffAddress}</span>
                      </div>
                    </div>

                    {/* Revealed Host Phone Number upon confirmation */}
                    {['CONFIRMED', 'ARRIVED', 'STARTED'].includes(booking.status) && booking.ride?.riderProfile?.user?.phoneNumber && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Host Phone:</span>
                        <a
                          href={`tel:${booking.ride.riderProfile.user.phoneNumber}`}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{booking.ride.riderProfile.user.phoneNumber}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(booking.ride!.riderProfile!.user!.phoneNumber!);
                            setCopiedPhoneId(booking.id);
                            setTimeout(() => setCopiedPhoneId(null), 2000);
                          }}
                          className="text-slate-400 hover:text-slate-200 transition-colors"
                          title="Copy Phone Number"
                        >
                          {copiedPhoneId === booking.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {booking.status === 'REQUESTED' && (
                      <div className="space-y-1">
                        <p className="text-[11px] text-amber-400/90 font-medium">
                          Request sent to host. Pillion seat and pickup PIN unlock once host accepts.
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-amber-500 dark:text-amber-400 font-medium">
                          <Lock className="w-3 h-3 shrink-0" />
                          <span>Host phone number and chat unlock upon acceptance</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Share</div>
                      <div className="text-lg font-black text-emerald-400">
                        {formatCurrency(booking.totalFare)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {['CONFIRMED', 'ARRIVED', 'STARTED', 'COMPLETED'].includes(booking.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveChatBookingId(activeChatBookingId === booking.id ? null : booking.id)}
                          className={`gap-1.5 text-xs ${activeChatBookingId === booking.id ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : ''}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{activeChatBookingId === booking.id ? 'Close Chat' : 'Chat'}</span>
                        </Button>
                      )}

                      <Button
                        variant={booking.status === 'CONFIRMED' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => navigate(`/booking/${booking.id}`)}
                      >
                        <span>
                          {booking.status === 'REQUESTED'
                            ? 'View Status'
                            : booking.status === 'CONFIRMED'
                            ? 'View Trip & PIN'
                            : 'View Details'}
                        </span>
                      </Button>

                      {booking.status === 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/reviews?bookingId=${booking.id}`)}
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          <span>Review</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Socket.IO Chat for Passenger */}
                {activeChatBookingId === booking.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <TripChat
                      bookingId={booking.id}
                      bookingStatus={booking.status}
                      otherUser={{
                        id: booking.ride?.riderProfile?.user?.id,
                        fullName: booking.ride?.riderProfile?.user?.fullName,
                        phoneNumber: booking.ride?.riderProfile?.user?.phoneNumber,
                        avatarUrl: booking.ride?.riderProfile?.user?.avatarUrl,
                        roleLabel: 'Host Rider',
                      }}
                      onClose={() => setActiveChatBookingId(null)}
                    />
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center space-y-3">
              <p className="text-xs text-slate-400">You have no booked trips as a passenger yet.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/search')}>
                Find a Ride
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Host Rider View */}
      {activeTab === 'RIDER' && (
        <div className="space-y-6">
          {loadingRides ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : myRides && myRides.length > 0 ? (
            myRides.map((ride) => (
              <Card key={ride.id} className="p-6 border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-xs text-slate-400">
                      Departure: {formatDate(ride.scheduledDeparture)}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {ride.originAddress} &rarr; {ride.destinationAddress}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        ride.status === 'SCHEDULED'
                          ? 'secondary'
                          : ride.status === 'CANCELLED'
                          ? 'default'
                          : 'default'
                      }
                      className={
                        ride.status === 'CANCELLED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : ''
                      }
                    >
                      {ride.status}
                    </Badge>

                    {ride.status === 'SCHEDULED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={actionLoading[`ride-${ride.id}`]}
                        onClick={() => handleCancelRide(ride.id)}
                        className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 h-7 px-2.5"
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" />
                        <span>Cancel Ride Offer</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Passenger Bookings on this ride */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Passenger Bookings ({ride.bookings?.length || 0})
                    </h4>
                    {ride.availableSeats > 0 && ride.status === 'SCHEDULED' && (
                      <span className="text-xs text-emerald-400 font-semibold">
                        {ride.availableSeats} seat available
                      </span>
                    )}
                  </div>

                  {ride.bookings && ride.bookings.length > 0 ? (
                    ride.bookings.map((b) => {
                      // 1. REQUESTED State: Host needs to accept or decline
                      if (b.status === 'REQUESTED') {
                        return (
                          <div
                            key={b.id}
                            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                                  Incoming Booking Request · Awaiting Your Confirmation
                                </span>
                              </div>
                              <Badge variant="warning" className="text-xs">REQUESTED</Badge>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
                                  {b.passenger?.fullName?.slice(0, 2).toUpperCase() || 'PA'}
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>{b.passenger?.fullName || 'Passenger'}</span>
                                    <span className="text-xs font-semibold text-amber-400">
                                      ★ {Number(b.passenger?.ratingAvg || 5.0).toFixed(1)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    Requested on {formatDate(b.requestedAt)}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-amber-500/90 font-medium mt-0.5">
                                    <Lock className="w-3 h-3" />
                                    <span>Passenger phone & chat unlock once you accept</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs text-slate-400">Fuel Contribution</div>
                                <div className="text-base font-black text-emerald-400">
                                  {formatCurrency(b.fareFuelShare)}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Requested Pickup:</span>
                                  <span className="text-slate-200 font-medium">{b.pickupAddress}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Requested Dropoff:</span>
                                  <span className="text-slate-200 font-medium">{b.dropoffAddress}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                isLoading={actionLoading[b.id]}
                                onClick={() => handleRespond(b.id, 'REJECT')}
                                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                <span>Decline</span>
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                isLoading={actionLoading[b.id]}
                                onClick={() => handleRespond(b.id, 'ACCEPT')}
                                className="text-xs bg-emerald-600 hover:bg-emerald-500"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                <span>Accept & Confirm Booking</span>
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      // 2. CONFIRMED State: Seat is booked, passenger phone/details revealed
                      if (b.status === 'CONFIRMED' || b.status === 'ARRIVED') {
                        return (
                          <div
                            key={b.id}
                            className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                                  {b.status === 'ARRIVED' ? 'Arrived at Curbside Pickup' : 'Confirmed Passenger · Seat Reserved'}
                                </span>
                              </div>
                              <Badge variant="success" className="text-xs">{b.status}</Badge>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                                  {b.passenger?.fullName?.slice(0, 2).toUpperCase() || 'PA'}
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>{b.passenger?.fullName || 'Passenger'}</span>
                                    <span className="text-xs font-semibold text-amber-400">
                                      ★ {Number(b.passenger?.ratingAvg || 5.0).toFixed(1)}
                                    </span>
                                  </div>
                                  {b.passenger?.phoneNumber ? (
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <a
                                        href={`tel:${b.passenger.phoneNumber}`}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 font-mono font-bold flex items-center gap-1"
                                      >
                                        <Phone className="w-3 h-3" />
                                        <span>{b.passenger.phoneNumber}</span>
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(b.passenger!.phoneNumber!);
                                          setCopiedPhoneId(b.id);
                                          setTimeout(() => setCopiedPhoneId(null), 2000);
                                        }}
                                        className="text-slate-400 hover:text-slate-200 transition-colors"
                                        title="Copy Phone Number"
                                      >
                                        {copiedPhoneId === b.id ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">Contact verified</span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs text-slate-400">Fuel Contribution</div>
                                <div className="text-base font-black text-emerald-400">
                                  {formatCurrency(b.fareFuelShare)}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Curbside Pickup:</span>
                                  <span className="text-slate-200 font-medium">{b.pickupAddress}</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-slate-400 block text-[11px]">Destination Dropoff:</span>
                                  <span className="text-slate-200 font-medium">{b.dropoffAddress}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                              <div className="flex items-center gap-2">
                                {b.status === 'CONFIRMED' && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    isLoading={actionLoading[b.id]}
                                    onClick={() => handleMarkArrived(b.id)}
                                  >
                                    <span>Mark Arrived at Pickup</span>
                                  </Button>
                                )}

                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setActiveChatBookingId(activeChatBookingId === b.id ? null : b.id)}
                                  className={`gap-2 text-xs font-bold ${
                                    activeChatBookingId === b.id
                                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  }`}
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>{activeChatBookingId === b.id ? 'Hide Chat' : 'Chat with Passenger'}</span>
                                </Button>
                              </div>

                              <div className="flex items-center gap-2 ml-auto">
                                <span className="text-[11px] text-slate-400">Enter Passenger PIN:</span>
                                <input
                                  type="text"
                                  maxLength={4}
                                  placeholder="4-digit OTP"
                                  value={otpInputs[b.id] || ''}
                                  onChange={(e) =>
                                    setOtpInputs({ ...otpInputs, [b.id]: e.target.value })
                                  }
                                  className="w-24 h-8 text-center rounded-lg glass-input text-xs font-mono font-bold text-emerald-400 focus:outline-none placeholder:text-slate-500"
                                />
                                <Button
                                  variant="primary"
                                  size="sm"
                                  isLoading={actionLoading[b.id]}
                                  onClick={() => handleVerifyOtp(b.id)}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  <span>Start Ride</span>
                                </Button>
                              </div>
                            </div>

                            {/* Inline Socket.IO Chat for Rider */}
                            {activeChatBookingId === b.id && (
                              <div className="mt-3 pt-3 border-t border-slate-800">
                                <TripChat
                                  bookingId={b.id}
                                  bookingStatus={b.status}
                                  otherUser={{
                                    id: b.passenger?.id,
                                    fullName: b.passenger?.fullName,
                                    phoneNumber: b.passenger?.phoneNumber,
                                    avatarUrl: b.passenger?.avatarUrl,
                                    roleLabel: 'Passenger',
                                  }}
                                  onClose={() => setActiveChatBookingId(null)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      }

                      // 3. STARTED State: In progress
                      if (b.status === 'STARTED') {
                        return (
                          <div
                            key={b.id}
                            className="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border-2 border-emerald-500/40 space-y-3.5 shadow-md"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                                    Ride In-Progress with {b.passenger?.fullName || 'Passenger'}
                                  </span>
                                  <Badge variant="warning">STARTED</Badge>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  Dropping off at: <span className="font-medium text-slate-700 dark:text-slate-200">{b.dropoffAddress}</span>
                                </div>
                                {b.passenger?.phoneNumber ? (
                                  <div className="flex items-center gap-2 pt-0.5">
                                    <span className="text-xs text-slate-400">Passenger Phone:</span>
                                    <a
                                      href={`tel:${b.passenger.phoneNumber}`}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-mono font-bold text-xs hover:bg-emerald-500/25 transition-colors border border-emerald-500/30"
                                    >
                                      <Phone className="w-3 h-3" />
                                      <span>{b.passenger.phoneNumber}</span>
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">Verified Contact</span>
                                )}
                                <div className="text-xs font-bold text-emerald-400">
                                  Payout upon dropoff: {formatCurrency(b.fareFuelShare)}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setActiveChatBookingId(activeChatBookingId === b.id ? null : b.id)}
                                  className={`gap-2 text-xs font-bold ${
                                    activeChatBookingId === b.id
                                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow'
                                  }`}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{activeChatBookingId === b.id ? 'Hide Chat' : 'Chat with Passenger'}</span>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/booking/${b.id}`)}
                                  className="text-xs gap-1"
                                >
                                  <span>Full View</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Button>

                                <Button
                                  variant="secondary"
                                  size="sm"
                                  isLoading={actionLoading[b.id]}
                                  onClick={() => handleCompleteRide(b.id)}
                                  className="text-xs font-bold"
                                >
                                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                                  <span>Complete Ride</span>
                                </Button>
                              </div>
                            </div>

                            {/* Inline Socket.IO Chat for Ongoing Ride */}
                            {activeChatBookingId === b.id && (
                              <div className="mt-3 pt-3 border-t border-slate-800">
                                <TripChat
                                  bookingId={b.id}
                                  bookingStatus={b.status}
                                  otherUser={{
                                    id: b.passenger?.id,
                                    fullName: b.passenger?.fullName,
                                    phoneNumber: b.passenger?.phoneNumber,
                                    avatarUrl: b.passenger?.avatarUrl,
                                    roleLabel: 'Passenger',
                                  }}
                                  onClose={() => setActiveChatBookingId(null)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      }

                      // 4. Other states (COMPLETED, REJECTED, CANCELLED)
                      return (
                        <div
                          key={b.id}
                          className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-80"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {b.passenger?.fullName || 'Passenger'}
                              </span>
                              <Badge
                                variant={
                                  b.status === 'COMPLETED'
                                    ? 'success'
                                    : 'default'
                                }
                                className={
                                  b.status === 'REJECTED' || b.status === 'CANCELLED'
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/20'
                                    : ''
                                }
                              >
                                {b.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-400">
                              {b.pickupAddress} &rarr; {b.dropoffAddress}
                            </div>
                            <div className="text-xs font-bold text-emerald-400">
                              Fuel Share: {formatCurrency(b.fareFuelShare)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900/50 text-center text-xs text-slate-500">
                      No passengers have requested this ride yet. It is live in corridor search.
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center space-y-3">
              <p className="text-xs text-slate-400">You have no published ride offers.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/offer')}>
                Publish Ride Offer
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

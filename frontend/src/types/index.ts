export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
  avatarUrl?: string;
  bio?: string;
  role: 'COMMUTER' | 'RIDER' | 'ADMIN' | 'SUPPORT_AGENT';
  kycStatus: 'UNVERIFIED' | 'SUBMITTED' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  ratingAvg: number | string;
  ratingCount: number;
  isActive: boolean;
  emergencyContacts?: EmergencyContact[];
  riderProfile?: RiderProfile;
}

export interface RiderProfile {
  id: string;
  userId: string;
  drivingLicenseNo: string;
  licenseExpiryDate: string;
  licenseDocFrontUrl: string;
  verificationStatus: string;
  totalTripsOffered: number;
  totalTripsCompleted: number;
  safetyRatingAvg: number | string;
  isEligibleForPooling: boolean;
  vehicles?: Vehicle[];
}

export interface Vehicle {
  id: string;
  riderProfileId: string;
  licensePlate: string;
  make: string;
  model: string;
  engineCc: number;
  color: string;
  rcNumber: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface EmergencyContact {
  id: string;
  contactName: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
}

export interface Ride {
  id: string;
  riderProfileId: string;
  vehicleId: string;
  originLat: number;
  originLng: number;
  originAddress: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  routePolyline: string;
  scheduledDeparture: string;
  bufferMinutes: number;
  availableSeats: number;
  helmetProvided: boolean;
  isWomenOnly: boolean;
  perKmCostShare: number | string;
  estimatedDistanceMeters: number;
  estimatedDurationSeconds: number;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  vehicle?: Vehicle;
  riderProfile?: RiderProfile & {
    user: {
      id: string;
      fullName: string;
      phoneNumber?: string;
      ratingAvg: number;
      ratingCount: number;
      avatarUrl?: string;
    };
  };
  bookings?: Booking[];
}

export interface SearchRideMatch {
  rideId: string;
  rider: {
    id: string;
    fullName: string;
    gender: string;
    ratingAvg: number;
    ratingCount: number;
    avatarUrl?: string;
  };
  vehicle: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  originAddress: string;
  destinationAddress: string;
  scheduledDeparture: string;
  helmetProvided: boolean;
  isWomenOnly: boolean;
  pickupWalkDistanceMeters: number;
  dropoffWalkDistanceMeters: number;
  detourMinutes: number;
  pricing: {
    distanceKm: number;
    fareFuelShare: number;
    platformFee: number;
    insuranceFee: number;
    totalFare: number;
  };
  matchScore: number;
  isOwnRide?: boolean;
  availableSeats?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  pickupOtp: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'ARRIVED' | 'STARTED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  fareFuelShare: number | string;
  platformFee: number | string;
  insuranceFee: number | string;
  totalFare: number | string;
  requestedAt: string;
  confirmedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  ride: Ride;
  passenger?: User;
  payment?: Payment;
}

export interface Payment {
  id: string;
  bookingId: string;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  totalAmount: number | string;
  platformCut: number | string;
  riderPayout: number | string;
  insurancePremium: number | string;
  status: 'INITIATED' | 'AUTHORIZED' | 'CAPTURED' | 'TRANSFERRED' | 'REFUNDED' | 'FAILED';
  capturedAt?: string;
  transferredAt?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  safetyTags: string[];
  comment?: string;
  createdAt: string;
  reviewer?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  channel: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
}

import { prisma } from '../../config/prisma.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../errors/app.error.js';
import { calculateDistanceMeters, distanceToSegmentMeters, calculateProjectionT, calculateDirectionAlignment, calculateStatutoryCostShare, } from '../../utils/spatial.util.js';
export class RidesService {
    async createRide(userId, input) {
        const riderProfile = await prisma.riderProfile.findUnique({
            where: { userId },
            include: { vehicles: true },
        });
        if (!riderProfile || !riderProfile.isEligibleForPooling) {
            throw new ForbiddenError('You must have a verified Rider Profile to offer rides');
        }
        const vehicle = riderProfile.vehicles.find((v) => v.id === input.vehicleId && v.isActive);
        if (!vehicle) {
            throw new BadRequestError('Invalid or inactive vehicle selected');
        }
        // Daily Frequency Limit Check: Max 2 pooled trips per day (Statutory Non-Commercial requirement)
        const departureDate = new Date(input.scheduledDeparture);
        const startOfDay = new Date(departureDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(departureDate);
        endOfDay.setHours(23, 59, 59, 999);
        const ridesOnSameDay = await prisma.ride.count({
            where: {
                riderProfileId: riderProfile.id,
                scheduledDeparture: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: { in: ['SCHEDULED', 'ACTIVE', 'COMPLETED'] },
            },
        });
        if (ridesOnSameDay >= 2) {
            throw new BadRequestError('Non-commercial pooling limit reached: Maximum 2 ride offers permitted per calendar day.');
        }
        return prisma.ride.create({
            data: {
                riderProfileId: riderProfile.id,
                vehicleId: input.vehicleId,
                originLat: input.originLat,
                originLng: input.originLng,
                originAddress: input.originAddress,
                destinationLat: input.destinationLat,
                destinationLng: input.destinationLng,
                destinationAddress: input.destinationAddress,
                routePolyline: input.routePolyline,
                scheduledDeparture: new Date(input.scheduledDeparture),
                bufferMinutes: input.bufferMinutes,
                availableSeats: 1,
                helmetProvided: input.helmetProvided,
                isWomenOnly: input.isWomenOnly,
                perKmCostShare: input.perKmCostShare,
                estimatedDistanceMeters: input.estimatedDistanceMeters,
                estimatedDurationSeconds: input.estimatedDurationSeconds,
                recurringCron: input.recurringCron,
                status: 'SCHEDULED',
            },
            include: {
                vehicle: true,
            },
        });
    }
    async searchRides(input, requestingUserId) {
        const isWomenOnlyFilter = input.womenOnly === 'true';
        // Date filtering logic
        let dateFilter = {
            gte: new Date(Date.now() - 4 * 3600 * 1000), // Active rides from today onwards
        };
        const targetDateStr = input.departureDate || input.departureTime;
        if (targetDateStr) {
            const parsedDate = new Date(targetDateStr);
            if (!isNaN(parsedDate.getTime())) {
                const startOfDay = new Date(parsedDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(parsedDate);
                endOfDay.setHours(23, 59, 59, 999);
                dateFilter = {
                    gte: startOfDay,
                    lte: endOfDay,
                };
            }
        }
        // Query candidate scheduled rides
        const candidateRides = await prisma.ride.findMany({
            where: {
                status: 'SCHEDULED',
                availableSeats: { gt: 0 },
                scheduledDeparture: dateFilter,
                ...(isWomenOnlyFilter ? { isWomenOnly: true } : {}),
            },
            include: {
                riderProfile: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                gender: true,
                                ratingAvg: true,
                                ratingCount: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                vehicle: {
                    select: {
                        make: true,
                        model: true,
                        color: true,
                        licensePlate: true,
                    },
                },
            },
            orderBy: {
                scheduledDeparture: 'asc',
            },
        });
        const hasCoords = typeof input.pickupLat === 'number' &&
            typeof input.pickupLng === 'number' &&
            typeof input.dropoffLat === 'number' &&
            typeof input.dropoffLng === 'number';
        /**
         * Extract meaningful locality tokens, filtering out administrative, city, and generic road stop words.
         */
        function extractLocalityTokens(text) {
            if (!text)
                return [];
            const stopWords = new Set([
                'nashik', 'pune', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'india', 'maharashtra',
                'road', 'rd', 'street', 'st', 'circle', 'chowk', 'corner', 'nagar', 'colony', 'lane', 'gali',
                'near', 'opp', 'opposite', 'behind', 'beside', 'next', 'front', 'area', 'zone', 'sector', 'phase',
                'station', 'railway', 'bus', 'stand', 'stop', 'depot', 'terminal', 'airport',
                'city', 'state', 'district', 'taluka', 'highway', 'bypass', 'expressway'
            ]);
            const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
            const tokens = clean.split(/\s+/).filter((w) => w.length >= 3 && !stopWords.has(w));
            return tokens;
        }
        /**
         * Checks whether targetAddress matches query based on key locality names or composite phrases.
         */
        function checkTextLocalityMatch(query, targetAddress) {
            if (!query)
                return true;
            const qLower = query.toLowerCase().trim();
            const tLower = targetAddress.toLowerCase().trim();
            // Direct substring
            if (tLower.includes(qLower) || qLower.includes(tLower))
                return true;
            // Check known multi-word locality phrases
            const keyPhrases = [
                'nashik road',
                'college road',
                'gangapur road',
                'indira nagar',
                'old cbs',
                'new cbs',
                'mumbai naka',
                'dwarka circle',
                'panchavati',
                'cidco',
                'city centre mall',
                'city center mall',
                'untwadi',
                'sambhaji chowk',
            ];
            for (const phrase of keyPhrases) {
                if (qLower.includes(phrase) && tLower.includes(phrase))
                    return true;
            }
            const qTokens = extractLocalityTokens(qLower);
            const tTokens = extractLocalityTokens(tLower);
            if (qTokens.length === 0) {
                // If only generic words (e.g., city name "Nashik"), check word match
                const words = qLower.split(/[\s,]+/).filter((w) => w.length > 2);
                return words.some((w) => tLower.includes(w));
            }
            // Must match at least one specific locality keyword
            return qTokens.some((qt) => tLower.includes(qt) || tTokens.some((tt) => tt.includes(qt) || qt.includes(tt)));
        }
        const originQuery = (input.originAddress || '').trim().toLowerCase();
        const destQuery = (input.destinationAddress || '').trim().toLowerCase();
        const hasOriginInput = Boolean(originQuery ||
            (typeof input.pickupLat === 'number' && typeof input.pickupLng === 'number'));
        const hasDestInput = Boolean(destQuery ||
            (typeof input.dropoffLat === 'number' && typeof input.dropoffLng === 'number'));
        const isBrowseAll = !hasOriginInput && !hasDestInput;
        const matchedRides = [];
        for (const ride of candidateRides) {
            const originCoord = { lat: ride.originLat, lng: ride.originLng };
            const destCoord = { lat: ride.destinationLat, lng: ride.destinationLng };
            const hasCoords = typeof input.pickupLat === 'number' &&
                typeof input.pickupLng === 'number' &&
                typeof input.dropoffLat === 'number' &&
                typeof input.dropoffLng === 'number';
            let isOriginMatch = true;
            let isDestMatch = true;
            let pickupWalkDistance = 0;
            let dropoffWalkDistance = 0;
            let detourMinutes = 0;
            let matchScore = 90;
            const totalDistanceMeters = ride.estimatedDistanceMeters || 15000;
            let pricingDistanceMeters = totalDistanceMeters;
            // 1. ORIGIN MATCHING
            if (hasOriginInput) {
                let spatialOriginOk = false;
                if (typeof input.pickupLat === 'number' && typeof input.pickupLng === 'number') {
                    const pPickup = { lat: input.pickupLat, lng: input.pickupLng };
                    pickupWalkDistance = calculateDistanceMeters(pPickup, originCoord);
                    const distToRoute = distanceToSegmentMeters(pPickup, originCoord, destCoord);
                    const tPickup = calculateProjectionT(pPickup, originCoord, destCoord);
                    // Within 2.0 km of ride start, or within 1.5 km of corridor trajectory
                    spatialOriginOk =
                        pickupWalkDistance <= 2000 ||
                            (distToRoute <= 1500 && tPickup >= -0.05 && tPickup <= 0.85);
                }
                const textOriginOk = !originQuery || checkTextLocalityMatch(originQuery, ride.originAddress);
                if (typeof input.pickupLat === 'number' && typeof input.pickupLng === 'number') {
                    isOriginMatch = spatialOriginOk && textOriginOk;
                }
                else {
                    isOriginMatch = textOriginOk;
                }
            }
            // 2. DESTINATION & INTERMEDIATE CORRIDOR MATCHING
            // If user wants A -> C, ride to D is accepted IF AND ONLY IF D is at C or D is on the way between A and C
            if (hasDestInput) {
                let spatialDestOk = false;
                let isIntermediateStop = false;
                if (typeof input.dropoffLat === 'number' && typeof input.dropoffLng === 'number') {
                    const pDropoff = { lat: input.dropoffLat, lng: input.dropoffLng };
                    dropoffWalkDistance = calculateDistanceMeters(pDropoff, destCoord);
                    // A. Full destination match: Ride destination D is at or near passenger destination C
                    const fullDestMatch = dropoffWalkDistance <= 2000;
                    // B. Intermediate stop: Ride destination D lies strictly on the way from A to C
                    if (typeof input.pickupLat === 'number' && typeof input.pickupLng === 'number') {
                        const pPickup = { lat: input.pickupLat, lng: input.pickupLng };
                        const distDestToPassengerCorridor = distanceToSegmentMeters(destCoord, pPickup, pDropoff);
                        const tRideDest = calculateProjectionT(destCoord, pPickup, pDropoff);
                        // D is on the way between A and C:
                        // 1. D is within 1200m of the direct path A -> C
                        // 2. Projection scalar t is between 0.15 and 1.0 (strictly between A and C, not past C!)
                        if (distDestToPassengerCorridor <= 1200 && tRideDest >= 0.15 && tRideDest <= 1.0) {
                            isIntermediateStop = true;
                        }
                    }
                    spatialDestOk = fullDestMatch || isIntermediateStop;
                }
                const textDestOk = !destQuery || checkTextLocalityMatch(destQuery, ride.destinationAddress);
                if (typeof input.dropoffLat === 'number' && typeof input.dropoffLng === 'number') {
                    // If coords are provided:
                    // Either D is confirmed to be on the way between A and C,
                    // OR it is a destination match where spatial AND text are consistent
                    isDestMatch = isIntermediateStop || (spatialDestOk && textDestOk);
                }
                else {
                    isDestMatch = textDestOk;
                }
            }
            // 3. DIRECTION CHECK
            if (hasCoords) {
                const pPickup = { lat: input.pickupLat, lng: input.pickupLng };
                const pDropoff = { lat: input.dropoffLat, lng: input.dropoffLng };
                const alignment = calculateDirectionAlignment(originCoord, destCoord, pPickup, pDropoff);
                if (alignment <= 0) {
                    isDestMatch = false;
                }
                pricingDistanceMeters = calculateDistanceMeters(pPickup, pDropoff);
                const directMeters = calculateDistanceMeters(originCoord, destCoord);
                const detourMeters = Math.max(0, pickupWalkDistance + pricingDistanceMeters + dropoffWalkDistance - directMeters);
                detourMinutes = Math.round((detourMeters / 1000 / 30) * 60);
                const spatialPenalty = (detourMinutes * 3) + (pickupWalkDistance / 200) + (dropoffWalkDistance / 200);
                matchScore = Math.max(10, Math.min(100, Math.round(100 - spatialPenalty)));
            }
            // 4. ELIGIBILITY DETERMINATION
            const isEligible = isBrowseAll
                ? true
                : hasOriginInput && hasDestInput
                    ? isOriginMatch && isDestMatch
                    : hasOriginInput
                        ? isOriginMatch
                        : isDestMatch;
            if (!isEligible) {
                continue;
            }
            const fareDetails = calculateStatutoryCostShare(pricingDistanceMeters, Number(ride.perKmCostShare));
            matchedRides.push({
                rideId: ride.id,
                rider: ride.riderProfile.user,
                vehicle: ride.vehicle,
                originAddress: ride.originAddress,
                destinationAddress: ride.destinationAddress,
                originLat: ride.originLat,
                originLng: ride.originLng,
                destinationLat: ride.destinationLat,
                destinationLng: ride.destinationLng,
                scheduledDeparture: ride.scheduledDeparture,
                helmetProvided: ride.helmetProvided,
                isWomenOnly: ride.isWomenOnly,
                availableSeats: ride.availableSeats,
                perKmCostShare: Number(ride.perKmCostShare),
                pickupWalkDistanceMeters: Math.round(pickupWalkDistance),
                dropoffWalkDistanceMeters: Math.round(dropoffWalkDistance),
                detourMinutes,
                pricing: fareDetails,
                matchScore: Math.round(matchScore),
                isOwnRide: requestingUserId ? ride.riderProfile.user.id === requestingUserId : false,
            });
        }
        return matchedRides.sort((a, b) => b.matchScore - a.matchScore || new Date(a.scheduledDeparture).getTime() - new Date(b.scheduledDeparture).getTime());
    }
    async getUpcomingRides(limit = 10) {
        const candidateRides = await prisma.ride.findMany({
            where: {
                status: 'SCHEDULED',
                availableSeats: { gt: 0 },
                scheduledDeparture: {
                    gte: new Date(Date.now() - 4 * 3600 * 1000),
                },
            },
            include: {
                riderProfile: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                gender: true,
                                ratingAvg: true,
                                ratingCount: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                vehicle: {
                    select: {
                        make: true,
                        model: true,
                        color: true,
                        licensePlate: true,
                    },
                },
            },
            orderBy: { scheduledDeparture: 'asc' },
            take: limit,
        });
        return candidateRides.map((ride) => {
            const fare = calculateStatutoryCostShare(ride.estimatedDistanceMeters || 15000, Number(ride.perKmCostShare));
            return {
                rideId: ride.id,
                rider: ride.riderProfile.user,
                vehicle: ride.vehicle,
                originAddress: ride.originAddress,
                destinationAddress: ride.destinationAddress,
                originLat: ride.originLat,
                originLng: ride.originLng,
                destinationLat: ride.destinationLat,
                destinationLng: ride.destinationLng,
                scheduledDeparture: ride.scheduledDeparture,
                helmetProvided: ride.helmetProvided,
                isWomenOnly: ride.isWomenOnly,
                availableSeats: ride.availableSeats,
                pricing: fare,
                matchScore: 95,
            };
        });
    }
    async getMyRides(userId) {
        const riderProfile = await prisma.riderProfile.findUnique({
            where: { userId },
        });
        if (!riderProfile) {
            return [];
        }
        const rides = await prisma.ride.findMany({
            where: { riderProfileId: riderProfile.id },
            include: {
                vehicle: true,
                bookings: {
                    include: {
                        passenger: {
                            select: {
                                id: true,
                                fullName: true,
                                phoneNumber: true,
                                ratingAvg: true,
                                avatarUrl: true,
                                gender: true,
                            },
                        },
                    },
                },
            },
            orderBy: { scheduledDeparture: 'desc' },
        });

        // Passenger phone number is revealed ONLY once host accepts & confirms booking
        return rides.map((ride) => {
            if (ride.bookings) {
                ride.bookings = ride.bookings.map((b) => {
                    const isConfirmed = ['CONFIRMED', 'ARRIVED', 'STARTED', 'COMPLETED'].includes(b.status);
                    if (!isConfirmed && b.passenger) {
                        b.passenger.phoneNumber = null;
                    }
                    return b;
                });
            }
            return ride;
        });
    }
    async getRideById(rideId) {
        const ride = await prisma.ride.findUnique({
            where: { id: rideId },
            include: {
                riderProfile: {
                    include: {
                        user: {
                            select: { id: true, fullName: true, ratingAvg: true, ratingCount: true, avatarUrl: true },
                        },
                    },
                },
                vehicle: true,
                bookings: true,
            },
        });
        if (!ride) {
            throw new NotFoundError('Ride offer not found');
        }
        return ride;
    }
    async cancelRide(userId, rideId) {
        const ride = await prisma.ride.findUnique({
            where: { id: rideId },
            include: { riderProfile: true, bookings: true },
        });
        if (!ride) {
            throw new NotFoundError('Ride not found');
        }
        if (ride.riderProfile.userId !== userId) {
            throw new ForbiddenError('Not authorized to cancel this ride');
        }
        return prisma.$transaction(async (tx) => {
            // Cancel ride
            const cancelledRide = await tx.ride.update({
                where: { id: rideId },
                data: { status: 'CANCELLED', availableSeats: 0 },
            });
            // Cancel associated bookings
            await tx.booking.updateMany({
                where: { rideId, status: { in: ['REQUESTED', 'CONFIRMED'] } },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancelledById: userId,
                    cancellationReason: 'Rider cancelled the ride offer',
                },
            });
            // Send notifications to affected passengers
            const affectedBookings = ride.bookings.filter((b) => ['REQUESTED', 'CONFIRMED'].includes(b.status));
            for (const b of affectedBookings) {
                await tx.notification.create({
                    data: {
                        userId: b.passengerId,
                        title: 'Ride Cancelled by Host',
                        body: `Your ride offer from ${ride.originAddress.slice(0, 30)}... was cancelled by the host.`,
                        notificationType: 'GENERAL',
                        channel: 'IN_APP',
                        metadata: { rideId, bookingId: b.id },
                    },
                }).catch((err) => console.error('Failed to create cancellation notification:', err));
            }
            return cancelledRide;
        });
    }
}

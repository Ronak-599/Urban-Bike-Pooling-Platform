import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
async function runTest() {
    console.log('🚀 Starting in-memory MongoDB Replica Set (simulating MongoDB Atlas)...');
    const replSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const uri = replSet.getUri('twoshare_test_db');
    console.log('✅ MongoDB Replica Set active at:', uri);
    process.env.DATABASE_URL = uri;
    console.log('📦 Running prisma db push to push schema to MongoDB...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: uri },
        stdio: 'inherit',
    });
    const prisma = new PrismaClient({
        datasources: { db: { url: uri } },
    });
    try {
        await prisma.$connect();
        console.log('✅ Connected to MongoDB via Prisma Client.');
        // 1. Create Rider User
        console.log('👤 1. Creating Host Rider User...');
        const hostUser = await prisma.user.create({
            data: {
                phoneNumber: '+919876543210',
                fullName: 'Aarav Sharma',
                gender: 'MALE',
                email: 'aarav@example.com',
                role: 'RIDER',
                kycStatus: 'VERIFIED',
                isPhoneVerified: true,
            },
        });
        console.log('   Host User Created:', hostUser.id, hostUser.fullName);
        // 2. Create Rider Profile
        console.log('🪪 2. Creating Rider Profile...');
        const riderProfile = await prisma.riderProfile.create({
            data: {
                userId: hostUser.id,
                drivingLicenseNo: 'DL-0420110012345',
                licenseExpiryDate: new Date('2030-01-01'),
                licenseDocFrontUrl: 'https://docs.example.com/dl-front.jpg',
                verificationStatus: 'VERIFIED',
                isEligibleForPooling: true,
            },
        });
        console.log('   Rider Profile Created:', riderProfile.id);
        // 3. Create Vehicle
        console.log('🏍️ 3. Registering Two-Wheeler Vehicle...');
        const vehicle = await prisma.vehicle.create({
            data: {
                riderProfileId: riderProfile.id,
                licensePlate: 'KA01AB1234',
                make: 'Royal Enfield',
                model: 'Hunter 350',
                engineCc: 350,
                color: 'Dapper Ash',
                rcNumber: 'RC-KA01-2023-0099',
                rcDocumentUrl: 'https://docs.example.com/rc.jpg',
                insurancePolicyNo: 'POL-992384',
                insuranceExpiryDate: new Date('2028-12-31'),
                insuranceDocUrl: 'https://docs.example.com/ins.jpg',
                isVerified: true,
            },
        });
        console.log('   Vehicle Created:', vehicle.id, vehicle.make, vehicle.model);
        // 4. Create Host Wallet
        console.log('💳 4. Creating Rider Wallet...');
        const hostWallet = await prisma.wallet.create({
            data: {
                userId: hostUser.id,
                currency: 'INR',
                currentBalance: 0.0,
                lockedEscrowBalance: 0.0,
            },
        });
        console.log('   Wallet Created:', hostWallet.id);
        // 5. Create Ride Offer
        console.log('🗺️ 5. Publishing Ride Offer...');
        const departureTime = new Date(Date.now() + 3600000); // 1 hour from now
        const ride = await prisma.ride.create({
            data: {
                riderProfileId: riderProfile.id,
                vehicleId: vehicle.id,
                originLat: 12.9716,
                originLng: 77.5946,
                originAddress: 'MG Road Metro, Bengaluru',
                destinationLat: 12.9279,
                destinationLng: 77.6271,
                destinationAddress: 'Koramangala 5th Block, Bengaluru',
                routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
                scheduledDeparture: departureTime,
                availableSeats: 1,
                helmetProvided: true,
                perKmCostShare: 4.5,
                estimatedDistanceMeters: 7500,
                estimatedDurationSeconds: 1500,
                status: 'SCHEDULED',
            },
        });
        console.log('   Ride Offer Published:', ride.id, 'Fare per km:', ride.perKmCostShare);
        // 6. Create Passenger User
        console.log('👥 6. Creating Passenger User...');
        const passenger = await prisma.user.create({
            data: {
                phoneNumber: '+919123456789',
                fullName: 'Priya Patel',
                gender: 'FEMALE',
                email: 'priya@example.com',
                role: 'COMMUTER',
                kycStatus: 'VERIFIED',
            },
        });
        console.log('   Passenger Created:', passenger.id, passenger.fullName);
        // 7. Create Booking
        console.log('🎫 7. Creating Passenger Booking Request...');
        const booking = await prisma.booking.create({
            data: {
                rideId: ride.id,
                passengerId: passenger.id,
                pickupLat: 12.9700,
                pickupLng: 77.5950,
                pickupAddress: 'Brigade Road Junction',
                dropoffLat: 12.9300,
                dropoffLng: 77.6250,
                dropoffAddress: 'Sony World Signal, Koramangala',
                pickupOtp: '4821',
                fareFuelShare: 33.75,
                platformFee: 4.05,
                insuranceFee: 2.0,
                totalFare: 39.80,
                status: 'REQUESTED',
            },
        });
        console.log('   Booking Created:', booking.id, 'OTP:', booking.pickupOtp, 'Total fare:', booking.totalFare);
        // 8. Test Multi-Document ACID Transaction (Simulating Confirmation & Seat Reservation)
        console.log('🔒 8. Executing Multi-Document Transaction on MongoDB (Accept Booking & Reserve Seat)...');
        const result = await prisma.$transaction(async (tx) => {
            const updatedBooking = await tx.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'CONFIRMED',
                    confirmedAt: new Date(),
                },
            });
            await tx.ride.update({
                where: { id: ride.id },
                data: { availableSeats: 0 },
            });
            await tx.notification.create({
                data: {
                    userId: passenger.id,
                    title: 'Ride Confirmed!',
                    body: 'Aarav has accepted your pooling request.',
                    notificationType: 'RIDE_CONFIRMED',
                },
            });
            return updatedBooking;
        });
        console.log('   Transaction completed successfully. Booking status:', result.status);
        // 9. Verify Seat Decrement
        const updatedRide = await prisma.ride.findUnique({ where: { id: ride.id } });
        console.log('   Updated Ride Available Seats:', updatedRide?.availableSeats);
        if (updatedRide?.availableSeats !== 0) {
            throw new Error('Seats were not updated properly in transaction!');
        }
        // 10. Complete Ride & Post Review with Rating Recalculation Transaction
        console.log('⭐ 9. Completing Ride and Submitting Review...');
        await prisma.$transaction(async (tx) => {
            await tx.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });
            await tx.review.create({
                data: {
                    bookingId: booking.id,
                    reviewerId: passenger.id,
                    revieweeId: hostUser.id,
                    rating: 5,
                    safetyTags: ['Helmet Provided', 'Smooth Driving', 'Punctual'],
                    comment: 'Great ride! Very safe and reached on time.',
                },
            });
            const aggregate = await tx.review.aggregate({
                where: { revieweeId: hostUser.id },
                _avg: { rating: true },
                _count: { rating: true },
            });
            await tx.user.update({
                where: { id: hostUser.id },
                data: {
                    ratingAvg: aggregate._avg.rating || 5.0,
                    ratingCount: aggregate._count.rating || 1,
                },
            });
        });
        const reviewedUser = await prisma.user.findUnique({ where: { id: hostUser.id } });
        console.log('   Host User Rating After Review:', reviewedUser?.ratingAvg, 'Reviews count:', reviewedUser?.ratingCount);
        console.log('\n🎉 ALL MONGODB ATLAS / REPLICA SET TESTS PASSED SUCCESSFULLY! 🎉\n');
    }
    finally {
        await prisma.$disconnect();
        await replSet.stop();
        console.log('🛑 In-memory replica set stopped.');
    }
}
runTest().catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
});

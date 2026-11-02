export const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'TwoShare API - Urban Bike Pooling Platform',
        version: '1.0.0',
        description: 'Production-ready RESTful API for intra-city peer-to-peer bike pooling with real-time tracking, corridor matching, and Razorpay split settlements.',
        contact: {
            name: 'TwoShare Engineering Team',
            email: 'engineering@twoshare.io',
        },
    },
    servers: [
        {
            url: 'http://localhost:4000/api/v1',
            description: 'Local Development Server',
        },
        {
            url: 'https://api.twoshare.io/api/v1',
            description: 'Production Cloud Cluster',
        },
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            ApiResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { type: 'object' },
                },
            },
            RegisterDto: {
                type: 'object',
                required: ['phoneNumber', 'fullName', 'password', 'gender'],
                properties: {
                    phoneNumber: { type: 'string', example: '+919876543210' },
                    fullName: { type: 'string', example: 'Vikram Sharma' },
                    email: { type: 'string', example: 'vikram@example.com' },
                    password: { type: 'string', example: 'SecureP@ss123' },
                    gender: { type: 'string', enum: ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'] },
                    role: { type: 'string', enum: ['COMMUTER', 'RIDER'], default: 'COMMUTER' },
                },
            },
            LoginDto: {
                type: 'object',
                required: ['phoneNumber', 'password'],
                properties: {
                    phoneNumber: { type: 'string', example: '+919876543210' },
                    password: { type: 'string', example: 'SecureP@ss123' },
                },
            },
            CreateRideDto: {
                type: 'object',
                required: [
                    'vehicleId',
                    'originLat',
                    'originLng',
                    'originAddress',
                    'destinationLat',
                    'destinationLng',
                    'destinationAddress',
                    'routePolyline',
                    'scheduledDeparture',
                    'perKmCostShare',
                    'estimatedDistanceMeters',
                    'estimatedDurationSeconds',
                ],
                properties: {
                    vehicleId: { type: 'string', format: 'uuid' },
                    originLat: { type: 'number', example: 12.9716 },
                    originLng: { type: 'number', example: 77.5946 },
                    originAddress: { type: 'string', example: 'MG Road Metro Station' },
                    destinationLat: { type: 'number', example: 12.9279 },
                    destinationLng: { type: 'number', example: 77.6271 },
                    destinationAddress: { type: 'string', example: 'Koramangala 5th Block' },
                    routePolyline: { type: 'string', example: 'a~l~FjkzsU_@e@...' },
                    scheduledDeparture: { type: 'string', format: 'date-time' },
                    bufferMinutes: { type: 'integer', default: 10 },
                    helmetProvided: { type: 'boolean', default: true },
                    isWomenOnly: { type: 'boolean', default: false },
                    perKmCostShare: { type: 'number', example: 4.5 },
                    estimatedDistanceMeters: { type: 'integer', example: 8400 },
                    estimatedDurationSeconds: { type: 'integer', example: 1500 },
                },
            },
            CreateBookingDto: {
                type: 'object',
                required: ['rideId', 'pickupLat', 'pickupLng', 'pickupAddress', 'dropoffLat', 'dropoffLng', 'dropoffAddress'],
                properties: {
                    rideId: { type: 'string', format: 'uuid' },
                    pickupLat: { type: 'number', example: 12.965 },
                    pickupLng: { type: 'number', example: 77.6 },
                    pickupAddress: { type: 'string', example: 'Richmond Circle Bus Shelter' },
                    dropoffLat: { type: 'number', example: 12.93 },
                    dropoffLng: { type: 'number', example: 77.625 },
                    dropoffAddress: { type: 'string', example: 'Sony World Signal' },
                },
            },
        },
    },
    paths: {
        '/auth/register': {
            post: {
                tags: ['Authentication'],
                summary: 'Register new user account',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterDto' } } },
                },
                responses: { 201: { description: 'User registered successfully' } },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Authentication'],
                summary: 'Login with phone number & password',
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginDto' } } },
                },
                responses: { 200: { description: 'Authenticated successfully' } },
            },
        },
        '/users/profile': {
            get: {
                tags: ['User Management'],
                summary: 'Get current user profile and linked details',
                security: [{ BearerAuth: [] }],
                responses: { 200: { description: 'User profile returned' } },
            },
        },
        '/rides/offer': {
            post: {
                tags: ['Ride Management'],
                summary: 'Publish new ride offer (Rider only)',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRideDto' } } },
                },
                responses: { 201: { description: 'Ride offer created' } },
            },
        },
        '/rides/search': {
            get: {
                tags: ['Ride Management'],
                summary: 'Search corridor ride matches with walking threshold & detour scoring',
                parameters: [
                    { name: 'pickupLat', in: 'query', required: true, schema: { type: 'number' } },
                    { name: 'pickupLng', in: 'query', required: true, schema: { type: 'number' } },
                    { name: 'dropoffLat', in: 'query', required: true, schema: { type: 'number' } },
                    { name: 'dropoffLng', in: 'query', required: true, schema: { type: 'number' } },
                    { name: 'womenOnly', in: 'query', required: false, schema: { type: 'boolean' } },
                ],
                responses: { 200: { description: 'List of matching rides' } },
            },
        },
        '/bookings': {
            post: {
                tags: ['Booking Management'],
                summary: 'Request a booking on a ride offer',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBookingDto' } } },
                },
                responses: { 201: { description: 'Booking requested' } },
            },
        },
        '/bookings/{id}/verify-otp': {
            post: {
                tags: ['Booking Management'],
                summary: 'Verify 4-digit pickup OTP and start ride (Rider only)',
                security: [{ BearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', properties: { otp: { type: 'string' } } } } },
                },
                responses: { 200: { description: 'Ride verified and started' } },
            },
        },
        '/payments/orders': {
            post: {
                tags: ['Payment Management'],
                summary: 'Create Razorpay order for booking payment',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: { 'application/json': { schema: { type: 'object', properties: { bookingId: { type: 'string' } } } } },
                },
                responses: { 201: { description: 'Razorpay order created' } },
            },
        },
        '/reviews': {
            post: {
                tags: ['Reviews'],
                summary: 'Submit mutual post-ride rating & safety tags',
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    bookingId: { type: 'string' },
                                    rating: { type: 'integer', minimum: 1, maximum: 5 },
                                    safetyTags: { type: 'array', items: { type: 'string' } },
                                    comment: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: { 201: { description: 'Review submitted' } },
            },
        },
        '/notifications': {
            get: {
                tags: ['Notifications'],
                summary: 'Get user in-app notifications',
                security: [{ BearerAuth: [] }],
                responses: { 200: { description: 'List of notifications' } },
            },
        },
    },
};

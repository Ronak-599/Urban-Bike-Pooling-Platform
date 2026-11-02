# TwoShare - Urban Bike Pooling Backend API

Production-ready pure Node.js backend for an intra-city peer-to-peer bike pooling platform.

## Tech Stack
* **Runtime:** Node.js (v20+ / v24+) with native ES Modules
* **Framework:** Express.js 4.x
* **ORM & Database:** Prisma ORM 5.x + MongoDB Atlas
* **Real-Time Gateway:** Socket.IO 4.x
* **Authentication:** JWT (Access & Refresh Tokens) + bcryptjs
* **Payments:** Razorpay Orders, Route Escrow & Webhook validation
* **Validation:** Zod 3.x
* **API Documentation:** OpenAPI 3.0 via Swagger UI

---

## Directory Layout

```
backend/
├── prisma/
│   └── schema.prisma              # Database schema (11 models, enums, relations)
├── src/
│   ├── config/
│   │   ├── env.js                 # Validated environment configuration
│   │   ├── prisma.js              # Singleton PrismaClient
│   │   ├── razorpay.js            # Razorpay client instance
│   │   └── swagger.js             # OpenAPI 3.0 documentation spec
│   ├── errors/
│   │   └── app.error.js           # Standardized AppError hierarchy
│   ├── middlewares/
│   │   ├── auth.middleware.js     # JWT auth guard, role checks, rider verification
│   │   ├── error.middleware.js    # Global centralized error handler
│   │   └── validate.middleware.js # Zod request validation middleware
│   ├── modules/
│   │   ├── auth/                  # Register, Login, Refresh Token, Logout
│   │   ├── users/                 # Profile, KYC, Vehicles, Emergency Contacts, Wallet
│   │   ├── rides/                 # Publishing, Corridor Proximity Search, Limits
│   │   ├── bookings/              # State Machine (Request -> Confirm -> Arrived -> Start -> Complete)
│   │   ├── payments/              # Razorpay Order creation, HMAC verification, Escrow
│   │   ├── reviews/               # 1-5 Star Ratings, Safety Tags, Sync average
│   │   └── notifications/         # In-App & Push Notification Inbox
│   ├── sockets/
│   │   └── tracking.socket.js     # Real-Time GPS Telemetry, Room Partitioning, SOS
│   ├── utils/
│   │   ├── response.util.js       # Uniform API Response envelope
│   │   ├── spatial.util.js        # Haversine distance, Detour math, Statutory cost share
│   │   └── token.util.js          # JWT sign & verify
│   ├── app.js                     # Express application configuration
│   └── server.js                  # Server initialization (HTTP + Socket.IO)
├── .env.example
├── package.json
└── server.js                      # Root entrypoint
```

---

## Getting Started

### 1. Prerequisites
* Node.js v20.x or higher
* MongoDB Atlas Cluster (or local MongoDB replica set 6.0+)

### 2. Environment Setup
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` in `.env` points to your MongoDB Atlas cluster:
```env
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster-url>/twoshare_db?retryWrites=true&w=majority&appName=TwoShare"
```

### 3. Generate Prisma Client & Push Schema
```bash
npm run prisma:generate

# Sync schema and create indexes in your MongoDB Atlas cluster:
npm run prisma:push
```

### 4. Run Server in Development Mode
```bash
# Uses Node.js native live-reload watcher
npm run dev
```
Or start directly with `node`:
```bash
node server.js
```
Server starts at `http://localhost:4000`.  
Explore interactive API docs at: **`http://localhost:4000/api/docs`**

### 5. Production Start
```bash
npm start
```

---

## API Endpoints Reference

### 1. Authentication (`/api/v1/auth`)
* `POST /register`: Create commuter/rider account
* `POST /login`: Authenticate with phone & password
* `POST /refresh-token`: Issue new access token using refresh cookie
* `POST /logout`: Clear session cookies

### 2. User Management (`/api/v1/users`)
* `GET /profile`: Fetch authenticated user profile with wallet balance & vehicles
* `PATCH /profile`: Update name, bio, avatar
* `POST /rider-profile`: Register or update driving license credentials
* `POST /vehicles`: Register two-wheeler (license plate, engine CC, RC doc)
* `GET /emergency-contacts`: List distress contacts
* `POST /emergency-contacts`: Add new emergency contact
* `GET /wallet`: Fetch commuter wallet balance and transactions ledger

### 3. Ride Management (`/api/v1/rides`)
* `GET /search`: Search corridor matches with walking distance threshold & detour ranking
* `POST /offer`: Publish a new ride offer along a route (enforces statutory max 2 rides/day)
* `GET /my-offers`: List offers published by logged-in rider
* `GET /:id`: Fetch ride offer details
* `PUT /:id/cancel`: Cancel published ride offer

### 4. Booking Management (`/api/v1/bookings`)
* `POST /`: Request a seat on a ride offer (generates 4-digit numeric pickup OTP)
* `GET /my-bookings`: Fetch passenger ride bookings
* `GET /:id`: Fetch booking details
* `POST /:id/respond`: Host rider accepts (`ACCEPT`) or declines (`REJECT`)
* `POST /:id/arrived`: Rider marks arrival at pickup node
* `POST /:id/verify-otp`: Rider enters passenger's 4-digit OTP to start trip
* `POST /:id/complete`: Complete trip and trigger automatic escrow payout
* `POST /:id/cancel`: Cancel booking and restore seat availability

### 5. Payments (`/api/v1/payments`)
* `POST /orders`: Generate Razorpay Order for fuel share + platform fee
* `POST /verify`: Verify Razorpay signature (`HMAC-SHA256`) and place funds in escrow
* `GET /receipt/:bookingId`: Fetch detailed payment breakdown and receipt

### 6. Reviews (`/api/v1/reviews`)
* `POST /`: Submit mutual post-ride rating (1-5 stars) and safety tags
* `GET /user/:userId`: Fetch public reviews and ratings for a user

### 7. Notifications (`/api/v1/notifications`)
* `GET /`: Retrieve user notifications (supports `?unread=true`)
* `PATCH /read-all`: Mark all notifications as read
* `PATCH /:id/read`: Mark single notification as read

---

## Real-Time Tracking (Socket.IO Events)

* **Connection URL:** `ws://localhost:4000/socket.io/?token=<JWT_TOKEN>`
* **Room Management:**
  * `JOIN_TRIP_ROOM` $\to$ `{ bookingId: "uuid" }`
  * `LEAVE_TRIP_ROOM` $\to$ `{ bookingId: "uuid" }`
* **Telemetry Streaming:**
  * Client emits: `TELEMETRY_PING` $\to$ `{ bookingId, lat, lng, speedKmh, bearing, accuracy }`
  * Server broadcasts to room: `RIDER_LOCATION_UPDATE` $\to$ `{ bookingId, location: { lat, lng }, speedKmh, bearing, eta }`

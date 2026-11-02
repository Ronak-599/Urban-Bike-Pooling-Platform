# Urban-Bike-Pooling (TwoShare)

A modern full-stack web application that allows users to share bike rides in urban areas, aiming to reduce traffic congestion, carbon emissions, and fuel costs.

---

## 🛠️ Tech Stack

- **Backend:** Node.js (v20+ / v24+), Express.js, Prisma ORM
- **Database:** MongoDB Atlas (NoSQL cloud replica set with native multi-document ACID transactions)
- **Real-Time:** Socket.IO (live GPS tracking, room broadcasting, SOS)
- **Frontend:** React 18, Vite, Tailwind CSS, Leaflet Maps, React Query, Zustand
- **Payments:** Razorpay Escrow Integration

---

## 🚀 Quick Start Guide

### 1. Configure MongoDB Atlas

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a database user with read/write privileges.
3. Under **Network Access**, add your current IP address (or `0.0.0.0/0` for development).
4. Click **Connect** → **Drivers** (Node.js) and copy your connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster-url>/twoshare_db?retryWrites=true&w=majority&appName=TwoShare
   ```

### 2. Backend Setup

```bash
cd backend

# Configure environment
cp .env.example .env
# Edit .env and paste your MongoDB Atlas connection string into DATABASE_URL

# Generate Prisma Client & Push Schema to MongoDB Atlas
npm run prisma:generate
npm run prisma:push

# Verify MongoDB Atlas compatibility with the built-in test suite:
npm run test:mongo

# Start backend dev server
npm run dev
```

- **API Server:** `http://localhost:4000`
- **Interactive Swagger Docs:** `http://localhost:4000/api/docs`
- **WebSocket Gateway:** `ws://localhost:4000/socket.io`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies and start Vite dev server
npm install
npm run dev
```

- **Web App:** `http://localhost:5173`

---

## 🗄️ Database Collections (MongoDB Atlas)

When running `npm run prisma:push`, Prisma synchronizes the following MongoDB collections and unique indexes:

| Collection | Description | Unique Indexes / Keys |
| :--- | :--- | :--- |
| `users` | Profiles, roles, rating averages | `phone_number`, `email` |
| `rider_profiles` | Driving license & KYC verification status | `user_id`, `driving_license_no` |
| `vehicles` | Two-wheeler registration, RC & insurance details | `license_plate`, `rc_number` |
| `emergency_contacts` | SOS / emergency notification contacts | `user_id` |
| `wallets` | Passenger & rider balances and escrow holdings | `user_id` |
| `wallet_transactions` | Ledger for top-ups, fares, payouts, refunds | `wallet_id` |
| `rides` | Published ride offers, route polylines, seats | `rider_profile_id`, `vehicle_id` |
| `bookings` | Seat reservations, pickup OTPs, journey state | `ride_id`, `passenger_id` |
| `payments` | Razorpay order IDs, signatures, payment status | `booking_id`, `gateway_order_id` |
| `reviews` | 1-5 star ratings, safety tags, user feedback | `(booking_id, reviewer_id)` |
| `notifications` | In-app notification inbox & push alerts | `user_id` |
"# Urban-Bike-Pooling-Platform" 

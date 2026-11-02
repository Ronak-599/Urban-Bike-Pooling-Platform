# TwoShare - Modern Urban Bike Pooling Web Frontend

Production-ready, highly aesthetic web client for intra-city peer-to-peer bike pooling.

## Tech Stack
* **Framework:** React 18 + Vite 5 + TypeScript
* **Styling & Design System:** Tailwind CSS v3 + Custom Glassmorphic Dark UI + Lucide React Icons
* **UI Components:** Shadcn-inspired accessible components (`Button`, `Card`, `Input`, `Badge`)
* **State Management:** Zustand (`useAuthStore`)
* **Server State & Caching:** TanStack React Query v5
* **Routing:** React Router v6 with Protected Route Guards
* **Real-Time Client:** Socket.IO Client for Live Telemetry & SOS Broadcasts

---

## 11 Production Pages Built

| Page # | Route | Purpose | Key Features & Modules |
| :--- | :--- | :--- | :--- |
| **1** | `/login` | Commuter & Rider Sign In | E.164 phone verification, password auth, instant demo pre-fill buttons |
| **2** | `/signup` | Account Registration | Gender selector (ShePool), Role (Commuter vs Host), auto-creates wallet |
| **3** | `/` (Home) | Landing & Corridor Search | Interactive pickup/dropoff finder, live impact counter, safety matrix showcase |
| **4** | `/search` | Corridor Spatial Search | Detour minutes, walk distances, match scores, ShePool filter, pricing |
| **5** | `/offer` | Offer Pillion Seat (Host) | Vehicle selection, departure buffer, statutory ₹3-₹6/km cost share slider |
| **6** | `/ride/:id` | Ride Offer Details | Verified DL badge, helmet declaration, route itinerary, instant booking trigger |
| **7** | `/booking/:id` | Booking & Live Escrow | **Prominent 4-digit pickup OTP**, live approach telemetry, Razorpay escrow, SOS |
| **8** | `/trips` | My Commute Trips | Dual Tabs (Passenger vs Host), Host OTP validation, start & complete actions |
| **9** | `/wallet` | Commute Wallet & Ledger | Available balance, escrow hold, instant recharge, transaction ledger, monthly pass |
| **10` | `/profile` | Profile & Verification | Verified KYC badge, Add Motorcycle modal (RC/Plate), Emergency Contacts |
| **11` | `/reviews` | Ratings & Community Trust| 5-star interactive rating, safety tags (*Safe Speed*, *Clean Helmet*), public feed |

---

## Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Starts Vite dev server at: `http://localhost:5173`

### 3. Build for Production
```bash
npm run build
npm run preview
```
Outputs optimized production bundle to `frontend/dist/`.

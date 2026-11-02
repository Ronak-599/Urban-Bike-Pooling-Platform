import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore.js';

// Global Layout Components
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';

// 11 Pages
import { Home } from './pages/Home.js';
import { Login } from './pages/Login.js';
import { Signup } from './pages/Signup.js';
import { SearchRide } from './pages/SearchRide.js';
import { OfferRide } from './pages/OfferRide.js';
import { RideDetails } from './pages/RideDetails.js';
import { BookingConfirmation } from './pages/BookingConfirmation.js';
import { MyTrips } from './pages/MyTrips.js';
import { Profile } from './pages/Profile.js';
import { Reviews } from './pages/Reviews.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-brand-500 selection:text-black">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/search" element={<SearchRide />} />
              <Route path="/ride/:id" element={<RideDetails />} />

              {/* Protected Pages */}
              <Route
                path="/offer"
                element={
                  <ProtectedRoute>
                    <OfferRide />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:id"
                element={
                  <ProtectedRoute>
                    <BookingConfirmation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trips"
                element={
                  <ProtectedRoute>
                    <MyTrips />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reviews"
                element={
                  <ProtectedRoute>
                    <Reviews />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;

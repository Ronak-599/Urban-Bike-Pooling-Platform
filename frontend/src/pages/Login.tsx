import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Button } from '../components/ui/button.js';
import { Phone, Lock, Bike, Sparkles, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);

  const [phoneNumber, setPhoneNumber] = useState('+919876543210');
  const [password, setPassword] = useState('Password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ phoneNumber, password });
      login(res.accessToken, res.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (phone: string, pass: string) => {
    setPhoneNumber(phone);
    setPassword(pass);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-md space-y-6">
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 items-center justify-center shadow-glow mb-2">
            <Bike className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back to Two<span className="text-emerald-500 dark:text-emerald-400">Share</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sign in to share or book your daily intra-city bike ride
          </p>
        </div>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your verified mobile phone number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Mobile Phone Number"
                type="tel"
                placeholder="+919876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                icon={<Phone className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />

              <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={loading}>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            {/* Quick Demo Pre-fills */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Instant Demo Fill
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoFill('+919876543210', 'Password123')}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 text-left transition-colors"
                >
                  <div className="font-semibold">Commuter</div>
                  <div className="text-[10px] text-slate-500 truncate">+919876543210</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('+919123456780', 'Password123')}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 text-left transition-colors"
                >
                  <div className="font-semibold">Rider (Host)</div>
                  <div className="text-[10px] text-slate-500 truncate">+919123456780</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/signup" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold underline underline-offset-4">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
};

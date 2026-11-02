import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { Button } from '../components/ui/button.js';
import { Phone, Lock, User, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [formData, setFormData] = useState({
    phoneNumber: '+91',
    fullName: '',
    email: '',
    password: '',
    gender: 'PREFER_NOT_TO_SAY',
    role: 'COMMUTER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.register({
        ...formData,
        email: formData.email ? formData.email : undefined,
      });
      login(res.accessToken, res.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create your Two<span className="text-emerald-400">Share</span> Account
          </h1>
          <p className="text-sm text-slate-400">
            Join thousands of daily commuters sharing rides and cutting commute expenses
          </p>
        </div>

        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Enter your details to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="e.g. Rohan Sen"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                icon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Mobile Phone Number (E.164)"
                type="tel"
                placeholder="+919876543210"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                icon={<Phone className="w-4 h-4" />}
                required
              />

              <Input
                label="Corporate or Personal Email (Optional)"
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                icon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                icon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Gender (For ShePool)
                  </label>
                  <select
                    className="flex h-11 w-full rounded-xl glass-input px-3.5 text-sm text-slate-100 focus:outline-none"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  >
                    <option value="PREFER_NOT_TO_SAY" className="bg-slate-900">Prefer not to say</option>
                    <option value="FEMALE" className="bg-slate-900">Female (Eligible for ShePool)</option>
                    <option value="MALE" className="bg-slate-900">Male</option>
                    <option value="NON_BINARY" className="bg-slate-900">Non-Binary</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Primary Goal
                  </label>
                  <select
                    className="flex h-11 w-full rounded-xl glass-input px-3.5 text-sm text-slate-100 focus:outline-none"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="COMMUTER" className="bg-slate-900">Passenger (Find Rides)</option>
                    <option value="RIDER" className="bg-slate-900">Bike Owner (Offer Pillion)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Your profile and contact numbers are protected with masked telephony. You agree to TwoShare's non-commercial statutory cost-sharing code.
                </span>
              </div>

              <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={loading}>
                <span>Create Verified Account</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

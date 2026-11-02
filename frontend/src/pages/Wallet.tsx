import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { formatCurrency, formatDate } from '../lib/utils.js';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  CreditCard,
  PlusCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const Wallet: React.FC = () => {
  const [topupAmount, setTopupAmount] = useState('250');
  const [loading, setLoading] = useState(false);

  const { data: wallet, isLoading, refetch } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.getWallet(),
  });

  const handleTopup = async () => {
    setLoading(true);
    try {
      // Mock top-up credit in sandbox
      alert(`Successfully topped up ${formatCurrency(topupAmount)} to your Commute Wallet!`);
      refetch();
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const transactions = wallet?.transactions || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Commute Wallet & Balance
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage your fuel share credits, escrow settlements, and commute passes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Balance Cards */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="glass-panel border-emerald-500/30 p-6 space-y-2 shadow-glow">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Available Balance</span>
                <WalletIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-white">
                {formatCurrency(wallet?.currentBalance || 0)}
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Instant UPI cashout ready</span>
              </div>
            </Card>

            <Card className="p-6 border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Escrow Locked</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-300">
                {formatCurrency(wallet?.lockedEscrowBalance || 0)}
              </div>
              <p className="text-[11px] text-slate-500">
                Reserved for ongoing in-transit rides
              </p>
            </Card>
          </div>

          {/* Quick Top-Up */}
          <Card className="p-6 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Quick Wallet Recharge
            </h3>

            <div className="grid grid-cols-4 gap-2">
              {['100', '250', '500', '1000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(amt)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    topupAmount === amt
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'glass-card border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <Button variant="primary" size="md" className="w-full" isLoading={loading} onClick={handleTopup}>
              <PlusCircle className="w-4 h-4" />
              <span>Recharge {formatCurrency(topupAmount)} via UPI</span>
            </Button>
          </Card>

          {/* Ledger Transactions */}
          <Card className="p-6 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Recent Transactions
            </h3>

            {transactions.length > 0 ? (
              <div className="divide-y divide-slate-800">
                {transactions.map((txn: any) => (
                  <div key={txn.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          txn.type.includes('PAYOUT') || txn.type.includes('TOPUP')
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {txn.type.includes('PAYOUT') || txn.type.includes('TOPUP') ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white">{txn.description}</div>
                        <div className="text-slate-500 text-[10px]">{formatDate(txn.createdAt)}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-bold text-sm ${
                          Number(txn.amount) > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {Number(txn.amount) > 0 ? `+₹${txn.amount}` : `₹${txn.amount}`}
                      </div>
                      <div className="text-[10px] text-slate-500">Bal: ₹{txn.balanceAfter}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                No wallet transactions recorded yet.
              </div>
            )}
          </Card>
        </div>

        {/* Commute Pass Subscription Banner */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-panel border-emerald-500/30 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">TwoShare Commute Pass</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Save 100% on platform convenience fees across all daily intra-city rides.
            </p>

            <div className="p-4 rounded-xl glass-card space-y-2 border border-slate-800">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">Monthly Pass</span>
                <span className="text-xl font-extrabold text-white">₹199<span className="text-xs text-slate-400 font-normal">/mo</span></span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1.5 pt-1">
                <li>• ₹0 platform convenience fees</li>
                <li>• Priority peak corridor matching</li>
                <li>• Free instant ride cancellations</li>
              </ul>
            </div>

            <Button variant="secondary" size="md" className="w-full">
              Activate Commute Pass
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

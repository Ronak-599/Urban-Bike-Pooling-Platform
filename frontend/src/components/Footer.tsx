import React from 'react';
import { Bike, Shield, Heart, MapPin, Fuel } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/90 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-950/60 mt-20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-sm">
                <Bike className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                Two<span className="text-emerald-500 dark:text-emerald-400">Share</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              India's first legal non-commercial urban bike pooling platform. Connecting daily commuters with empty pillion seats to reduce traffic, cut emissions, and share fuel expenses.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li><Link to="/search" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Find a Commute Ride</Link></li>
              <li><Link to="/offer" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Publish Your Daily Route</Link></li>
              <li><Link to="/trips" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Live Ride Tracking</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Trust & Safety</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> 100% Verified Govt DL & RC</li>
              <li className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" /> "ShePool" Female-Only Mode</li>
              <li className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Statutory Cost-Recovery Model</li>
              <li className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> 24/7 Live Corridor Geofencing</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">Legal & Statutory</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              TwoShare operates strictly under the Motor Vehicles Act non-commercial cost-sharing guidelines. Riders are capped at 2 pooled trips per day. Fares reflect actual shared fuel expenses without commercial markup.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 TwoShare Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Safety Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

'use client';

import { TrendingUp, TrendingDown, DollarSign, Users, Building, Coins } from 'lucide-react';

const secondaryStats = [
  { label: 'Total assets', value: '1,247', change: '+12%', trend: 'up', icon: Building, color: 'cyan' },
  { label: 'Active investors', value: '3,892', change: '+23%', trend: 'up', icon: Users, color: 'amber' },
  { label: 'Tokens issued', value: '45.6M', change: '-2%', trend: 'down', icon: Coins, color: 'orange' },
];

const colorClasses = {
  cyan: 'bg-cyan-500/10 text-cyan-300 ring-1 ring-inset ring-cyan-500/20',
  amber: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20',
  orange: 'bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-500/20',
};

export function StatsCards() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="assetflow-muted text-sm">Total value locked</p>
            <p className="font-display mt-2 text-4xl font-bold text-white md:text-5xl">$2.4B</p>
            <span className="mt-3 inline-flex items-center text-sm font-medium text-emerald-400">
              <TrendingUp className="mr-1 h-4 w-4" /> +8% this quarter
            </span>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {secondaryStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <span className={`flex items-center text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stat.trend === 'up' ? <TrendingUp className="mr-0.5 h-3 w-3" /> : <TrendingDown className="mr-0.5 h-3 w-3" />}
                {stat.change}
              </span>
            </div>
            <p className="font-display mt-3 text-xl font-bold text-white">{stat.value}</p>
            <p className="assetflow-muted text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

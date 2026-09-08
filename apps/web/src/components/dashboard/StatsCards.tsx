'use client';

import { TrendingUp, TrendingDown, DollarSign, Users, Building, Coins } from 'lucide-react';

const secondaryStats = [
  { label: 'Total assets', value: '1,247', change: '+12%', trend: 'up', icon: Building },
  { label: 'Active investors', value: '3,892', change: '+23%', trend: 'up', icon: Users },
  { label: 'Tokens issued', value: '45.6M', change: '-2%', trend: 'down', icon: Coins },
];

export function StatsCards() {
  return (
    <section aria-label="Portfolio summary" className="space-y-3">
      <div className="assetflow-card relative overflow-hidden rounded-2xl p-5 md:p-6">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-cyan-400/[.06] to-transparent" />
        <div className="relative flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <p className="assetflow-muted text-xs font-semibold uppercase tracking-[.16em]">Total value locked</p>
              <span className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">LIVE</span>
            </div>
            <p className="font-display mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">$2.4B</p>
            <p className="mt-2 flex items-center text-sm font-medium text-emerald-300"><TrendingUp className="mr-1.5 h-4 w-4" /> +8.0% <span className="ml-1 text-slate-500">this quarter</span></p>
          </div>
          <div className="hidden h-14 w-14 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[.07] text-cyan-200 sm:grid"><DollarSign className="h-6 w-6" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {secondaryStats.map((stat) => (
          <div key={stat.label} className="assetflow-card rounded-2xl p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/[.16]">
            <div className="flex items-start justify-between gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-300"><stat.icon className="h-4 w-4" /></div>
              <span className={`flex items-center text-xs font-semibold ${stat.trend === 'up' ? 'text-emerald-300' : 'text-rose-300'}`}>
                {stat.trend === 'up' ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}{stat.change}
              </span>
            </div>
            <p className="font-display mt-4 text-2xl font-semibold tracking-tight text-white">{stat.value}</p>
            <p className="assetflow-muted mt-0.5 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

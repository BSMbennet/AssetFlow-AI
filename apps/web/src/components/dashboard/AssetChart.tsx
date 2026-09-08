'use client';

import { useState } from 'react';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Jan', value: 100 }, { date: 'Feb', value: 120 }, { date: 'Mar', value: 115 },
  { date: 'Apr', value: 140 }, { date: 'May', value: 135 }, { date: 'Jun', value: 160 },
  { date: 'Jul', value: 155 }, { date: 'Aug', value: 180 }, { date: 'Sep', value: 175 },
  { date: 'Oct', value: 200 }, { date: 'Nov', value: 220 }, { date: 'Dec', value: 250 },
];

const timeRanges = ['1D', '1W', '1M', '3M', '1Y', 'All'];

export function AssetChart() {
  const [selectedRange, setSelectedRange] = useState('1Y');

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">Portfolio value</h3>
          <p className="assetflow-muted text-sm">Total across all private-credit assets</p>
        </div>
        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button key={range} onClick={() => setSelectedRange(range)} className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${selectedRange === range ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-500 hover:bg-white/[.05] hover:text-white'}`}>
              {range}
            </button>
          ))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.28} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.06} vertical={false} />
            <XAxis dataKey="date" stroke="#5b6373" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#5b6373" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(10, 13, 19, 0.95)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', color: '#f5f7fb' }} formatter={(value: number) => [`$${value}`, 'Portfolio value']} />
            <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

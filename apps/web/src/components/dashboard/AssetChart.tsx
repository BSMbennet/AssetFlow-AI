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
    <div className="assetflow-card rounded-2xl p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /><h3 className="font-display text-lg font-semibold text-white">Portfolio value</h3></div>
          <p className="assetflow-muted mt-1 text-sm">Total across all private-credit assets</p>
        </div>
        <div className="flex w-fit rounded-xl border border-white/10 bg-black/10 p-1">
          {timeRanges.map((range) => (
            <button key={range} onClick={() => setSelectedRange(range)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${selectedRange === range ? 'bg-white/[.09] text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}>{range}</button>
          ))}
        </div>
      </div>
      <div className="h-72 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#67e8f9" stopOpacity={0.2} /><stop offset="95%" stopColor="#67e8f9" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="2 5" stroke="#ffffff" opacity={0.05} vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={8} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} width={42} />
            <Tooltip cursor={{ stroke: 'rgba(255,255,255,.12)' }} contentStyle={{ backgroundColor: 'rgba(10, 13, 19, 0.96)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '12px', color: '#f5f7fb', boxShadow: '0 18px 50px rgba(0,0,0,.35)' }} formatter={(value: number) => [`$${value}`, 'Portfolio value']} />
            <Area type="monotone" dataKey="value" stroke="#67e8f9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

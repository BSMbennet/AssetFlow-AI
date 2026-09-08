'use client';

import { Clock, ArrowUpRight, CheckCircle, AlertCircle } from 'lucide-react';

const activities = [
  { type: 'Asset Tokenized', description: 'Office Tower LA · 10,000 tokens issued', time: '5 minutes ago', status: 'completed', amount: '$25M' },
  { type: 'Trade Executed', description: 'Solar Farm TX · 2,500 tokens traded', time: '18 minutes ago', status: 'completed', amount: '$1.2M' },
  { type: 'Compliance Check', description: 'KYC verified for 3 new investors', time: '1 hour ago', status: 'pending', amount: '' },
  { type: 'Dividend Paid', description: 'Data Center NY · Distribution processed', time: '3 hours ago', status: 'completed', amount: '$125K' },
  { type: 'Risk Alert', description: 'Suspicious activity detected on monitored wallet', time: '5 hours ago', status: 'alert', amount: '' },
];

const statusIcons = { completed: CheckCircle, pending: Clock, alert: AlertCircle };
const statusColors = {
  completed: 'text-emerald-300 bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20',
  pending: 'text-amber-300 bg-amber-500/10 ring-1 ring-inset ring-amber-500/20',
  alert: 'text-rose-300 bg-rose-500/10 ring-1 ring-inset ring-rose-500/20',
};

export function ActivityFeed() {
  return (
    <div className="assetflow-card overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-white/[.06] px-5 py-4 md:px-6">
        <div><h3 className="font-display text-lg font-semibold text-white">Recent activity</h3><p className="assetflow-muted mt-1 text-xs">Latest portfolio and workflow events</p></div>
        <button className="rounded-lg px-2 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-300/[.06] hover:text-cyan-200">View all</button>
      </div>
      <div className="divide-y divide-white/[.05]">
        {activities.map((activity, index) => {
          const Icon = statusIcons[activity.status as keyof typeof statusIcons];
          return (
            <div key={index} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[.025] md:px-6">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${statusColors[activity.status as keyof typeof statusColors]}`}><Icon className="h-4 w-4" /></div>
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="text-sm font-semibold text-slate-100">{activity.type}</p><span className="hidden text-[10px] uppercase tracking-wider text-slate-600 sm:inline">Workflow event</span></div><p className="truncate text-sm text-slate-500">{activity.description}</p><p className="assetflow-muted mt-1 flex items-center text-[11px]"><Clock className="mr-1 h-3 w-3" />{activity.time}</p></div>
              </div>
              {activity.amount && <div className="flex shrink-0 items-center text-emerald-300"><span className="text-sm font-semibold tabular-nums">{activity.amount}</span><ArrowUpRight className="ml-1 h-3.5 w-3.5" /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

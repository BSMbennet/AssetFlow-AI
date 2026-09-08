'use client';

import { Clock, ArrowUpRight, CheckCircle, AlertCircle } from 'lucide-react';

const activities = [
  { type: 'Asset Tokenized', description: 'Office Tower LA - 10,000 tokens issued', time: '5 minutes ago', status: 'completed', amount: '$25M' },
  { type: 'Trade Executed', description: 'Solar Farm TX - 2,500 tokens traded', time: '18 minutes ago', status: 'completed', amount: '$1.2M' },
  { type: 'Compliance Check', description: 'KYC verified for 3 new investors', time: '1 hour ago', status: 'pending', amount: '' },
  { type: 'Dividend Paid', description: 'Data Center NY - Distribution processed', time: '3 hours ago', status: 'completed', amount: '$125K' },
  { type: 'Risk Alert', description: 'Suspicious activity detected on wallet 0x1234...', time: '5 hours ago', status: 'alert', amount: '' },
];

const statusIcons = { completed: CheckCircle, pending: Clock, alert: AlertCircle };
const statusColors = {
  completed: 'text-emerald-300 bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20',
  pending: 'text-amber-300 bg-amber-500/10 ring-1 ring-inset ring-amber-500/20',
  alert: 'text-rose-300 bg-rose-500/10 ring-1 ring-inset ring-rose-500/20',
};

export function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.025]">
      <div className="flex items-center justify-between border-b border-white/[.06] p-6">
        <div><h3 className="font-display text-lg font-semibold text-white">Recent Activity</h3><p className="assetflow-muted mt-1 text-sm">Latest portfolio and workflow events</p></div>
        <button className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">View all</button>
      </div>
      <div className="divide-y divide-white/[.06]">
        {activities.map((activity, index) => {
          const Icon = statusIcons[activity.status as keyof typeof statusIcons];
          return (
            <div key={index} className="flex items-center justify-between gap-4 p-4 transition hover:bg-white/[.025] sm:p-5">
              <div className="flex min-w-0 items-start gap-4">
                <div className={`shrink-0 rounded-xl p-2.5 ${statusColors[activity.status as keyof typeof statusColors]}`}><Icon className="h-4 w-4" /></div>
                <div className="min-w-0"><p className="font-medium text-white">{activity.type}</p><p className="truncate text-sm text-slate-500">{activity.description}</p><p className="assetflow-muted mt-1 flex items-center text-xs"><Clock className="mr-1 h-3 w-3" />{activity.time}</p></div>
              </div>
              {activity.amount && <div className="flex shrink-0 items-center text-emerald-400"><span className="text-sm font-medium">{activity.amount}</span><ArrowUpRight className="ml-1 h-4 w-4" /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

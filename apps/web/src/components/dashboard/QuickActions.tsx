'use client';

import { Plus, FileText, Users, Shield, BarChart3, RefreshCw } from 'lucide-react';

const actions = [
  { icon: Plus, label: 'New Asset', color: 'cyan' },
  { icon: FileText, label: 'Upload Document', color: 'emerald' },
  { icon: Users, label: 'Add Investor', color: 'amber' },
  { icon: Shield, label: 'Run Compliance', color: 'orange' },
  { icon: BarChart3, label: 'Generate Report', color: 'rose' },
  { icon: RefreshCw, label: 'Sync Blockchain', color: 'sky' },
];

const colorClasses = {
  cyan: 'bg-cyan-500/10 text-cyan-300 ring-1 ring-inset ring-cyan-500/20 hover:bg-cyan-500/15',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20 hover:bg-emerald-500/15',
  amber: 'bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20 hover:bg-amber-500/15',
  orange: 'bg-orange-500/10 text-orange-300 ring-1 ring-inset ring-orange-500/20 hover:bg-orange-500/15',
  rose: 'bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/20 hover:bg-rose-500/15',
  sky: 'bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-500/20 hover:bg-sky-500/15',
};

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
      <h3 className="font-display text-lg font-semibold text-white">Quick Actions</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button key={index} className={`flex flex-col items-center justify-center rounded-xl p-4 transition ${colorClasses[action.color as keyof typeof colorClasses]}`}>
            <action.icon className="mb-2 h-6 w-6" />
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

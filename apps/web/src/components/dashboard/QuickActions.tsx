'use client';

import { Plus, FileText, Users, Shield, BarChart3, RefreshCw } from 'lucide-react';

const actions = [
  { icon: Plus, label: 'New Asset' },
  { icon: FileText, label: 'Upload Document' },
  { icon: Users, label: 'Add Investor' },
  { icon: Shield, label: 'Run Compliance' },
  { icon: BarChart3, label: 'Generate Report' },
  { icon: RefreshCw, label: 'Sync Blockchain' },
];

export function QuickActions() {
  return (
    <div className="assetflow-card rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-semibold text-white">Quick actions</h3><p className="assetflow-muted mt-1 text-xs">Common portfolio workflows</p></div><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">6 actions</span></div>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {actions.map((action, index) => (
          <button key={index} className="group flex min-h-[92px] flex-col items-start justify-between rounded-xl border border-white/[.07] bg-white/[.025] p-3.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[.05] focus:outline-none focus:ring-2 focus:ring-cyan-300/20">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[.04] text-slate-300 transition group-hover:text-cyan-200"><action.icon className="h-4 w-4" /></span>
            <span className="text-xs font-medium leading-4 text-slate-300 group-hover:text-white">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

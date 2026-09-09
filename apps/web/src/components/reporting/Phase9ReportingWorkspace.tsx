'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileText, RefreshCw, WalletCards, ArrowUpRight, CircleDollarSign, CalendarDays } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssets } from '@/components/dashboard/AssetData';

type Action = { id: string; asset_id: string; action_type: string; amount: number | string; currency: string; record_date: string; payment_date: string; status: string };
type Position = { id: string; asset_id: string; investor_id: string; units: number | string };
type Metric = [string, string, string, LucideIcon];

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function Phase9ReportingWorkspace() {
  const { assets, loading: assetsLoading } = useAssets();
  const [actions, setActions] = useState<Action[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function load() {
    setLoading(true); setError(null);
    const [actionResult, positionResult] = await Promise.all([
      supabase.from('corporate_actions').select('id,asset_id,action_type,amount,currency,record_date,payment_date,status').order('payment_date', { ascending: false }).limit(250),
      supabase.from('servicing_positions').select('id,asset_id,investor_id,units').limit(500),
    ]);
    if (actionResult.error || positionResult.error) setError(actionResult.error?.message || positionResult.error?.message || 'Could not load reporting data');
    else { setActions((actionResult.data || []) as Action[]); setPositions((positionResult.data || []) as Position[]); setLastRefresh(new Date()); }
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const assetMap = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);
  const totalValue = assets.reduce((sum, asset) => sum + Number(asset.current_value || 0), 0);
  const scheduledCash = actions.filter((a) => ['SCHEDULED', 'READY', 'PROCESSING'].includes(a.status)).reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const completedCash = actions.filter((a) => a.status === 'COMPLETED').reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const reportRows = assets.map((asset) => ({ asset: asset.name, type: asset.asset_type, jurisdiction: asset.jurisdiction, value: Number(asset.current_value || 0), risk: asset.risk_score ?? '—', compliance: asset.compliance_score ?? '—', status: asset.status }));
  const metrics: Metric[] = [
    ['Portfolio value', money(totalValue), 'Live asset records', WalletCards],
    ['Scheduled cash', money(scheduledCash), 'Upcoming servicing', CalendarDays],
    ['Completed cash', money(completedCash), 'Serviced actions', CircleDollarSign],
    ['Investor positions', String(positions.length), 'Servicing positions', BarChart3],
  ];

  function downloadReport() {
    const rows = [['Asset', 'Type', 'Jurisdiction', 'Current Value', 'Risk Score', 'Compliance Score', 'Status'], ...reportRows.map((row) => [row.asset, row.type, row.jurisdiction, row.value, row.risk, row.compliance, row.status])];
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `assetflow-portfolio-report-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1540px] space-y-5 p-4 md:space-y-6 md:p-8">
      <section className="assetflow-command rounded-3xl p-5 md:p-7">
        <div className="assetflow-command-grid pointer-events-none" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><div className="mb-4 flex flex-wrap items-center gap-2"><span className="assetflow-eyebrow"><FileText className="h-3.5 w-3.5" /> Phase 9 · Investor Reporting</span><span className="assetflow-status">Institutional reporting layer</span></div><h1 className="font-display max-w-4xl text-3xl font-semibold tracking-[-.04em] text-white md:text-5xl">A clear statement of every asset, position and cash flow.</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">Turn live portfolio, servicing and corporate-action records into an audit-friendly reporting surface for investment teams and their investors.</p></div>
          <div className="flex gap-2"><button onClick={() => void load()} className="assetflow-secondary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button><button onClick={downloadReport} className="assetflow-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"><Download className="h-4 w-4" /> Export CSV</button></div>
        </div>
        {lastRefresh && <p className="relative z-10 mt-5 font-mono text-[10px] uppercase tracking-[.14em] text-slate-600">Last refresh {lastRefresh.toLocaleTimeString()}</p>}
      </section>

      {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[.05] p-4 text-sm text-rose-200">Reporting data could not be loaded: {error}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([label, value, detail, Icon]) => <div key={label} className="assetflow-kpi"><div className="flex items-center justify-between"><p>{label}</p><Icon className="h-4 w-4 text-cyan-300/70" /></div><strong>{value}</strong><span>{detail}</span></div>)}</div>

      <section className="assetflow-panel overflow-hidden rounded-3xl"><div className="flex items-center justify-between border-b border-white/[.06] px-5 py-4 md:px-6"><div><p className="assetflow-eyebrow">Portfolio statement</p><h2 className="mt-1 text-lg font-semibold text-white">Asset-level reporting</h2></div><ArrowUpRight className="h-4 w-4 text-cyan-300" /></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-white/[.05] text-[10px] uppercase tracking-[.14em] text-slate-600"><th className="px-5 py-3">Asset</th><th>Type</th><th>Value</th><th>Risk</th><th>Compliance</th><th>Status</th></tr></thead><tbody>{reportRows.map((row) => <tr key={row.asset} className="border-b border-white/[.04] text-slate-300 last:border-0"><td className="px-5 py-4 font-medium text-white">{row.asset}</td><td className="text-slate-500">{row.type}</td><td className="font-mono">{money(row.value)}</td><td className="font-mono">{row.risk}</td><td className="font-mono">{row.compliance}</td><td><span className="rounded-full border border-cyan-400/15 bg-cyan-400/[.05] px-2 py-1 text-[10px] uppercase tracking-wider text-cyan-200">{row.status || 'ACTIVE'}</span></td></tr>)}{!reportRows.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-600">{assetsLoading ? 'Loading portfolio…' : 'No assets available for reporting.'}</td></tr>}</tbody></table></div></section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><section className="assetflow-panel rounded-3xl p-5 md:p-6"><div className="mb-5"><p className="assetflow-eyebrow">Cash-flow ledger</p><h2 className="mt-1 text-lg font-semibold text-white">Recent servicing events</h2></div><div className="space-y-2">{actions.slice(0, 8).map((action) => <div key={action.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/[.05] bg-white/[.02] px-4 py-3"><div className="min-w-0"><p className="truncate text-sm text-slate-200">{assetMap.get(action.asset_id)?.name || 'Asset'}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-600">{action.action_type} · {action.payment_date}</p></div><div className="text-right"><p className="font-mono text-sm text-slate-200">{money(Number(action.amount || 0))}</p><p className="text-[10px] uppercase tracking-wider text-cyan-300/70">{action.status}</p></div></div>)}{!actions.length && <p className="py-8 text-center text-sm text-slate-600">No corporate actions recorded yet.</p>}</div></section><section className="assetflow-panel rounded-3xl p-5 md:p-6"><p className="assetflow-eyebrow">Statement controls</p><h2 className="mt-1 text-lg font-semibold text-white">Reporting ready</h2><div className="mt-5 space-y-3 text-sm text-slate-400"><div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">Live portfolio values</div><div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">Risk + compliance snapshot</div><div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">Servicing cash-flow history</div><div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3">CSV export for institutional workflows</div></div></section></div>
    </div>
  );
}

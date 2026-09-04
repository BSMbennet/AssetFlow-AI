'use client';

import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BellRing, CircleCheck, Gauge, RefreshCw, ShieldAlert, TrendingUp } from 'lucide-react';
import { useAssets } from '@/components/dashboard/AssetData';

function scoreTone(score: number | null) {
  if (score == null) return 'text-white/45 bg-white/[0.04] border-white/10';
  if (score >= 75) return 'text-emerald-300 bg-emerald-400/[0.07] border-emerald-400/15';
  if (score >= 50) return 'text-amber-300 bg-amber-400/[0.07] border-amber-400/15';
  return 'text-rose-300 bg-rose-400/[0.07] border-rose-400/15';
}

export function PortfolioMonitoringWorkspace() {
  const { assets, loading, error, refresh } = useAssets();
  const [lastScan, setLastScan] = useState(new Date());

  const metrics = useMemo(() => {
    const totalValue = assets.reduce((sum, asset) => sum + Number(asset.current_value || 0), 0);
    const riskScores = assets.map(a => a.risk_score).filter((v): v is number => v != null);
    const complianceScores = assets.map(a => a.compliance_score).filter((v): v is number => v != null);
    const avgRisk = riskScores.length ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length : null;
    const avgCompliance = complianceScores.length ? complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length : null;
    const watchlist = assets.filter(a => (a.risk_score != null && a.risk_score < 50) || (a.compliance_score != null && a.compliance_score < 70));
    return { totalValue, avgRisk, avgCompliance, watchlist };
  }, [assets]);

  async function runScan() {
    await refresh();
    setLastScan(new Date());
  }

  return (
    <div className="min-h-full bg-[#05070b] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[12%] top-0 h-96 w-96 rounded-full bg-cyan-400/[0.055] blur-3xl" />
        <div className="absolute right-[8%] top-[28%] h-96 w-96 rounded-full bg-violet-500/[0.045] blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-[1500px] space-y-6 px-4 py-6 md:px-8 md:py-10">
        <header className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-cyan-400/[0.035] p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <Activity className="h-3.5 w-3.5" /> Phase 4 · Portfolio Monitoring
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] md:text-5xl">See portfolio risk before it becomes a problem.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 md:text-base">Continuous portfolio oversight across asset value, risk and compliance signals, with a clear watchlist for human attention.</p>
            </div>
            <button onClick={runScan} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.12] disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Run portfolio scan
            </button>
          </div>
          <p className="mt-5 text-[11px] uppercase tracking-[0.16em] text-white/25">Last scan {lastScan.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Monitoring layer connected to live asset records</p>
        </header>

        {error && <div className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.06] p-4 text-sm text-rose-200">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Portfolio value', metrics.totalValue ? `$${metrics.totalValue.toLocaleString()}` : '—', 'Current asset values', TrendingUp],
            ['Assets monitored', String(assets.length), 'Live portfolio coverage', Gauge],
            ['Risk baseline', metrics.avgRisk != null ? `${metrics.avgRisk.toFixed(0)}/100` : 'Pending', 'Higher is stronger', ShieldAlert],
            ['Compliance health', metrics.avgCompliance != null ? `${metrics.avgCompliance.toFixed(0)}%` : 'Pending', 'Control coverage', CircleCheck],
          ].map(([label, value, detail, Icon]) => {
            const I = Icon as typeof Gauge;
            return <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><I className="h-4 w-4 text-cyan-300" /><p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-white/35">{detail}</p></div>;
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">Asset signal matrix</p><h2 className="mt-1 text-lg font-semibold">Portfolio health</h2></div><Activity className="h-5 w-5 text-cyan-300" /></div>
            {assets.length === 0 && !loading ? <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-white/35">Create an asset to start portfolio monitoring.</div> : <div className="space-y-2">{assets.map(asset => { const risk = asset.risk_score; const compliance = asset.compliance_score; const watch = (risk != null && risk < 50) || (compliance != null && compliance < 70); return <div key={asset.id} className="grid gap-3 rounded-xl border border-white/[0.07] bg-black/15 p-4 md:grid-cols-[1.5fr_.6fr_.6fr_auto] md:items-center"><div className="min-w-0"><p className="truncate text-sm font-medium">{asset.name}</p><p className="mt-1 text-[11px] text-white/30">{asset.asset_type} · {asset.jurisdiction || 'Jurisdiction pending'}</p></div><span className={`rounded-full border px-2.5 py-1 text-center text-xs ${scoreTone(risk)}`}>Risk {risk ?? '—'}</span><span className={`rounded-full border px-2.5 py-1 text-center text-xs ${scoreTone(compliance)}`}>Comp. {compliance ?? '—'}</span><span className={`inline-flex items-center gap-1 text-xs ${watch ? 'text-amber-300' : 'text-emerald-300'}`}>{watch ? <AlertTriangle className="h-3.5 w-3.5" /> : <CircleCheck className="h-3.5 w-3.5" />}{watch ? 'Watch' : 'Healthy'}</span></div>; })}</div>}
          </div>

          <aside className="rounded-2xl border border-white/10 bg-gradient-to-b from-amber-400/[0.06] to-white/[0.02] p-5 md:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/60">Attention queue</p><h2 className="mt-1 text-lg font-semibold">Watchlist</h2></div><BellRing className="h-5 w-5 text-amber-300" /></div>
            <div className="mt-5 rounded-2xl border border-amber-300/10 bg-black/20 p-4"><p className="text-3xl font-semibold">{metrics.watchlist.length}</p><p className="mt-1 text-xs text-white/35">assets requiring review</p></div>
            <div className="mt-4 space-y-2">{metrics.watchlist.slice(0, 5).map(asset => <div key={asset.id} className="flex items-center justify-between rounded-xl border border-white/[0.07] p-3"><div className="min-w-0"><p className="truncate text-sm">{asset.name}</p><p className="text-[11px] text-white/30">Review signal detected</p></div><ArrowDownRight className="h-4 w-4 shrink-0 text-amber-300" /></div>)}{metrics.watchlist.length === 0 && <div className="flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-3 text-xs text-emerald-200"><CircleCheck className="h-4 w-4" /> No current watchlist items.</div>}</div>
          </aside>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">Monitoring operating model</p><h2 className="mt-1 text-lg font-semibold">Signal → review → action</h2></div><span className="rounded-full border border-cyan-300/10 bg-cyan-300/[0.05] px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-cyan-200">Phase 4 foundation</span></div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">{[['01','Detect','Surface deteriorating risk, compliance or portfolio signals.'],['02','Prioritise','Route exceptions into a focused human attention queue.'],['03','Act','Connect review decisions back to the asset record and audit trail.']].map(([n,t,d]) => <div key={n} className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><span className="text-[10px] font-semibold tracking-[0.18em] text-cyan-300/70">{n}</span><h3 className="mt-3 text-sm font-semibold">{t}</h3><p className="mt-2 text-xs leading-5 text-white/35">{d}</p></div>)}</div>
        </section>
      </div>
    </div>
  );
}

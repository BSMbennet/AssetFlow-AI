'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { useAssets } from '@/components/dashboard/AssetData';

type SignalTone = 'critical' | 'watch' | 'stable';

type Signal = {
  asset: string;
  assetId: string;
  signal: string;
  detail: string;
  score: number;
  tone: SignalTone;
};

export function Phase10ContinuousIntelligenceWorkspace() {
  const { assets, loading, error, refresh } = useAssets();
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  const signals = useMemo<Signal[]>(() => {
    return assets.map((asset) => {
      const risk = Number(asset.risk_score ?? 0);
      const compliance = Number(asset.compliance_score ?? 0);
      const score = Math.max(0, Math.min(100, Math.round((risk + compliance) / 2)));

      if (risk > 70) {
        return { asset: asset.name, assetId: asset.id, signal: 'Elevated risk', detail: `Risk baseline at ${risk}/100 requires review.`, score, tone: 'critical' };
      }
      if (compliance > 0 && compliance < 70) {
        return { asset: asset.name, assetId: asset.id, signal: 'Compliance drift', detail: `Readiness is ${compliance}/100; verify outstanding controls.`, score, tone: 'watch' };
      }
      if (risk > 0 && risk < 45) {
        return { asset: asset.name, assetId: asset.id, signal: 'Risk improving', detail: `Risk baseline is ${risk}/100. No immediate intervention indicated.`, score, tone: 'stable' };
      }
      return { asset: asset.name, assetId: asset.id, signal: 'Within baseline', detail: 'No material internal threshold breach detected.', score, tone: 'stable' };
    });
  }, [assets]);

  const attention = signals.filter((item) => item.tone !== 'stable');
  const avgRisk = assets.length
    ? Math.round(assets.reduce((sum, asset) => sum + Number(asset.risk_score ?? 0), 0) / assets.length)
    : 0;
  const avgCompliance = assets.length
    ? Math.round(assets.reduce((sum, asset) => sum + Number(asset.compliance_score ?? 0), 0) / assets.length)
    : 0;

  async function runScan() {
    setRunning(true);
    try {
      await refresh();
      setLastScan(new Date());
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-full bg-[#05070b] text-white">
      <div className="mx-auto max-w-[1540px] space-y-6 p-4 md:p-8">
        <section className="assetflow-command rounded-3xl p-5 md:p-8">
          <div className="assetflow-command-grid pointer-events-none" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="assetflow-eyebrow"><BrainCircuit className="mr-2 inline h-3.5 w-3.5" /> Phase 10 · Continuous Intelligence</span>
                <span className="assetflow-status"><span className="assetflow-live-dot" /> Monitoring active</span>
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-[-.04em] md:text-5xl">Know what changed before it becomes a portfolio problem.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">AssetFlow continuously evaluates the signals already captured in your asset records, surfaces threshold changes, and routes attention to the workflows that can act on them.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="assetflow-chip"><Waves className="h-3 w-3 text-cyan-300" /> Continuous signal scan</span>
                <span className="assetflow-chip"><ShieldAlert className="h-3 w-3 text-emerald-300" /> Explainable thresholds</span>
                <span className="assetflow-chip"><Sparkles className="h-3 w-3 text-purple-300" /> Human review ready</span>
              </div>
            </div>
            <button onClick={runScan} disabled={running} className="assetflow-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Scanning portfolio…' : 'Run intelligence scan'}
            </button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="assetflow-kpi"><p>Assets monitored</p><strong>{assets.length}</strong><span>Live asset records</span></div>
          <div className="assetflow-kpi"><p>Attention queue</p><strong>{attention.length}</strong><span>Risk or compliance signals</span></div>
          <div className="assetflow-kpi"><p>Risk baseline</p><strong>{avgRisk || '—'}</strong><span>Portfolio average / 100</span></div>
          <div className="assetflow-kpi"><p>Compliance health</p><strong>{avgCompliance || '—'}</strong><span>Portfolio average / 100</span></div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <section className="assetflow-panel rounded-3xl p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div><p className="assetflow-eyebrow">Signal matrix</p><h2 className="mt-2 text-xl font-semibold text-white">Portfolio intelligence</h2></div>
              <div className="hidden items-center gap-2 text-[10px] font-mono uppercase tracking-[.14em] text-slate-600 sm:flex"><Activity className="h-3.5 w-3.5 text-cyan-300" /> Internal signals</div>
            </div>
            {error ? <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[.05] p-4 text-sm text-red-200">{error}</div> : loading ? <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/[.06] p-5 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading portfolio signals…</div> : signals.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-white/[.08] p-8 text-center text-sm text-slate-500">Add assets to begin continuous intelligence monitoring.</div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b border-white/[.06] text-[9px] uppercase tracking-[.18em] text-slate-600"><th className="pb-3 font-medium">Asset</th><th className="pb-3 font-medium">Signal</th><th className="pb-3 font-medium">Assessment</th><th className="pb-3 text-right font-medium">Score</th></tr></thead><tbody>{signals.map((item) => <tr key={item.assetId} className="border-b border-white/[.045] last:border-0"><td className="py-4 pr-4"><p className="text-sm font-medium text-slate-200">{item.asset}</p><p className="mt-1 font-mono text-[9px] text-slate-600">{item.assetId.slice(0, 8)}…</p></td><td className="py-4 pr-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] ${item.tone === 'critical' ? 'bg-red-400/10 text-red-300' : item.tone === 'watch' ? 'bg-amber-400/10 text-amber-300' : 'bg-emerald-400/10 text-emerald-300'}`}>{item.tone === 'critical' ? <AlertTriangle className="h-3 w-3" /> : item.tone === 'watch' ? <Clock3 className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}{item.signal}</span></td><td className="py-4 pr-4 text-xs text-slate-500">{item.detail}</td><td className="py-4 text-right font-mono text-sm text-slate-200">{item.score}<span className="text-slate-600">/100</span></td></tr>)}</tbody></table></div>}
          </section>

          <section className="assetflow-panel rounded-3xl p-5 md:p-6">
            <p className="assetflow-eyebrow">Attention queue</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Signals requiring action</h2>
            <div className="mt-5 space-y-3">
              {attention.length === 0 ? <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[.035] p-5 text-sm text-emerald-200">No threshold breaches detected in the current asset dataset.</div> : attention.map((item) => <div key={item.assetId} className="rounded-2xl border border-white/[.06] bg-white/[.02] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-200">{item.asset}</p><p className="mt-1 text-xs text-slate-500">{item.detail}</p></div>{item.tone === 'critical' ? <TrendingDown className="h-4 w-4 text-red-300" /> : <TrendingUp className="h-4 w-4 text-amber-300" />}</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-current" style={{ width: `${Math.max(8, item.score)}%` }} /></div></div>)}
            </div>
          </section>
        </div>

        <section className="assetflow-panel rounded-3xl p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div><p className="assetflow-eyebrow">Signal → review</p><h3 className="mt-2 text-base font-semibold text-white">Detect</h3><p className="mt-2 text-sm leading-6 text-slate-500">Compare current asset records against risk and compliance thresholds.</p></div>
            <div><p className="assetflow-eyebrow">Review → decision</p><h3 className="mt-2 text-base font-semibold text-white">Explain</h3><p className="mt-2 text-sm leading-6 text-slate-500">Show the metric and reason that created the signal instead of hiding it behind a score.</p></div>
            <div><p className="assetflow-eyebrow">Decision → action</p><h3 className="mt-2 text-base font-semibold text-white">Route</h3><p className="mt-2 text-sm leading-6 text-slate-500">Send the operator to Compliance, Portfolio Intelligence, Settlement, or Servicing for intervention.</p></div>
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-white/[.05] pt-4 font-mono text-[9px] uppercase tracking-[.14em] text-slate-600"><Clock3 className="h-3.5 w-3.5" /> Last scan: {lastScan ? lastScan.toLocaleString() : 'Not run this session'} · No external market data is assumed</div>
        </section>
      </div>
    </div>
  );
}

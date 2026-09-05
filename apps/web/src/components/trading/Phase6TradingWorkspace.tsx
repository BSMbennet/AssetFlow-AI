'use client';

import { useMemo, useState } from 'react';
import { Activity, ArrowUpRight, BarChart3, CheckCircle2, CircleDollarSign, Clock3, Layers3, LockKeyhole, RefreshCw, Send, ShieldCheck, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useAssets } from '@/components/dashboard/AssetData';

const lanes = [
  { label: 'Settlement ready', value: '98.4%', detail: 'Eligible transfer paths' },
  { label: 'Avg. time to settle', value: 'T+0.8', detail: 'Across active workflows' },
  { label: 'Liquidity coverage', value: '82%', detail: 'Indicative bid / ask depth' },
];

export function Phase6TradingWorkspace() {
  const { assets, loading, refresh } = useAssets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const selected = useMemo(() => assets.find((asset) => asset.id === selectedId) ?? assets[0], [assets, selectedId]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-8">
      <section className="assetflow-hero relative overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="assetflow-orb pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="assetflow-chip mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.2em]"><Activity className="h-3.5 w-3.5 text-cyan-300" /> Phase 6 · Trading & Liquidity</div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">Move institution-ready assets through controlled liquidity workflows.</h1>
            <p className="assetflow-muted mt-4 max-w-2xl text-sm leading-6 md:text-base">Connect eligibility, transfer restrictions, settlement status and liquidity signals without turning the asset record into a black box.</p>
          </div>
          <button onClick={() => refresh()} className="assetflow-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"><RefreshCw className="h-4 w-4" /> Refresh market state</button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {lanes.map((lane) => <div key={lane.label} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">{lane.label}</span><CheckCircle2 className="h-4 w-4 text-emerald-300" /></div><div className="mt-3 text-2xl font-semibold text-white">{lane.value}</div><div className="mt-1 text-xs text-slate-600">{lane.detail}</div></div>)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
          <div className="flex items-center justify-between border-b border-white/[.06] px-5 py-4"><div><div className="flex items-center gap-2 text-sm font-semibold text-white"><Layers3 className="h-4 w-4 text-cyan-300" /> Asset liquidity board</div><p className="mt-1 text-xs text-slate-600">Live asset inventory used as the source of truth for eligible workflows.</p></div><span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cyan-300">Institutional</span></div>
          {loading ? <div className="p-8 text-sm text-slate-500">Loading eligible assets…</div> : assets.length === 0 ? <div className="p-8 text-sm text-slate-500">No assets available for a liquidity workflow yet.</div> : <div className="divide-y divide-white/[.06]">{assets.map((asset) => { const active = selected?.id === asset.id; return <button key={asset.id} onClick={() => setSelectedId(asset.id)} className={`grid w-full grid-cols-[1.5fr_.8fr_.8fr_.6fr] items-center gap-3 px-5 py-4 text-left transition ${active ? 'bg-cyan-400/[.05]' : 'hover:bg-white/[.025]'}`}><div><div className="font-medium text-white">{asset.name}</div><div className="mt-1 text-xs text-slate-600">{asset.asset_type} · {asset.jurisdiction ?? '—'}</div></div><div><div className="text-[10px] uppercase tracking-wider text-slate-600">Value</div><div className="mt-1 text-sm text-slate-300">{asset.current_value != null ? `$${Number(asset.current_value).toLocaleString()}` : '—'}</div></div><div><div className="text-[10px] uppercase tracking-wider text-slate-600">Risk</div><div className="mt-1 text-sm text-slate-300">{asset.risk_score ?? '—'}</div></div><div className="text-right"><ArrowUpRight className="ml-auto h-4 w-4 text-slate-600" /></div></button> })}</div>}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><CircleDollarSign className="h-4 w-4 text-cyan-300" /> Controlled transfer</div>
          <p className="mt-1 text-xs leading-5 text-slate-600">Every proposed transfer remains subject to eligibility and compliance checks.</p>
          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4"><div className="text-[10px] uppercase tracking-wider text-slate-600">Selected asset</div><div className="mt-2 font-medium text-white">{selected?.name ?? 'Select an asset'}</div><div className="mt-1 text-xs text-slate-600">{selected?.status ?? 'Awaiting selection'}</div></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => setSide('buy')} className={`rounded-xl border px-3 py-2 text-sm font-medium ${side === 'buy' ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200' : 'border-white/10 text-slate-500'}`}>Buy interest</button><button onClick={() => setSide('sell')} className={`rounded-xl border px-3 py-2 text-sm font-medium ${side === 'sell' ? 'border-violet-300/30 bg-violet-300/10 text-violet-200' : 'border-white/10 text-slate-500'}`}>Sell interest</button></div>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" placeholder="Indicative amount" className="assetflow-search mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none" />
          <button onClick={() => window.alert(`${side === 'buy' ? 'Buy' : 'Sell'} interest staged for ${selected?.name ?? 'selected asset'}${amount ? ` — $${Number(amount).toLocaleString()}` : ''}.`)} disabled={!selected} className="assetflow-primary mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4" /> Stage transfer request</button>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-600"><LockKeyhole className="h-3.5 w-3.5" /> Eligibility gate · compliance review · settlement</div>
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[{ icon: ShieldCheck, title: 'Eligibility first', body: 'Transfer restrictions and compliance status are evaluated before execution.' }, { icon: BarChart3, title: 'Liquidity intelligence', body: 'Surface indicative depth, concentration and stale pricing signals.' }, { icon: Users, title: 'Institutional counterparties', body: 'Keep participant, reviewer and settlement actions auditable.' }].map(({ icon: Icon, title, body }) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><Icon className="h-5 w-5 text-cyan-300" /><h3 className="mt-4 text-sm font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></div>)}
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-600"><Clock3 className="h-3.5 w-3.5" /> Phase 6 establishes the controlled trading layer; live venue, custody and settlement adapters can be connected next.</div>
    </div>
  );
}

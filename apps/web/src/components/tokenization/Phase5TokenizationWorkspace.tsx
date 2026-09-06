'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Coins, Clock3, FileCheck2, LockKeyhole, Network, RefreshCw, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAssets } from '@/components/dashboard/AssetData';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type Stage = { label: string; detail: string; icon: LucideIcon };
type Request = { id: string; asset_id: string; status: string; token_symbol: string; total_supply: number; token_price: number; network: string; created_at: string };

const stages: Stage[] = [
  { label: 'Eligibility', detail: 'Risk, compliance and human approval', icon: ShieldCheck },
  { label: 'Structure', detail: 'Token economics and issuance rules', icon: Coins },
  { label: 'Legal package', detail: 'Offering and ownership records', icon: FileCheck2 },
  { label: 'Network', detail: 'Rail and custody configuration', icon: Network },
  { label: 'Issuance', detail: 'Controlled mint and distribution', icon: WalletCards },
];

export function Phase5TokenizationWorkspace() {
  const { assets, loading, refresh } = useAssets();
  const [selectedId, setSelectedId] = useState('');
  const [tokenCount, setTokenCount] = useState('1000000');
  const [symbol, setSymbol] = useState('AF-PRV');
  const [network, setNetwork] = useState('Polygon');
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);

  const selected = useMemo(() => assets.find((asset) => asset.id === selectedId) ?? assets[0], [assets, selectedId]);
  const value = Number(selected?.current_value ?? 0);
  const tokens = Math.max(1, Number(tokenCount) || 1);
  const tokenPrice = value > 0 ? value / tokens : 0;
  const riskReady = selected?.risk_score != null && selected.risk_score >= 50;
  const complianceReady = selected?.compliance_score != null && selected.compliance_score >= 70;
  const eligible = Boolean(selected && riskReady && complianceReady);

  async function loadRequests() {
    const { data, error } = await supabase.from('tokenization_requests').select('id,asset_id,status,token_symbol,total_supply,token_price,network,created_at').order('created_at', { ascending: false }).limit(8);
    if (!error) setRequests((data ?? []) as Request[]);
  }

  useEffect(() => { void loadRequests(); }, []);

  async function createRequest() {
    if (!selected) return toast.error('Select an asset first');
    if (!eligible) return toast.error('Asset must clear risk and compliance gates before issuance');
    if (!symbol.trim()) return toast.error('Token symbol is required');
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sign in to prepare an issuance request');
      const { data: profile, error: profileError } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (profileError || !profile?.organization_id) throw new Error('Your workspace organization could not be resolved');
      const { data: request, error } = await supabase.from('tokenization_requests').insert({
        asset_id: selected.id, organization_id: profile.organization_id, requested_by: user.id, status: 'ready_for_review',
        token_symbol: symbol.trim(), total_supply: tokens, token_price: tokenPrice, network,
        asset_value: value, risk_score: selected.risk_score, compliance_score: selected.compliance_score,
        metadata: { workflow: 'phase_5', custody: 'pending', legal_package: 'pending' },
      }).select('id,asset_id,status,token_symbol,total_supply,token_price,network,created_at').single();
      if (error) throw error;
      await supabase.from('audit_events').insert({ asset_id: selected.id, actor_id: user.id, event_type: 'tokenization_request_created', metadata: { tokenization_request_id: request.id, token_symbol: symbol.trim(), network, total_supply: tokens } });
      setRequests((current) => [request as Request, ...current].slice(0, 8));
      toast.success(`${symbol} issuance request saved for review`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create issuance request');
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-8">
      <section className="assetflow-hero relative overflow-hidden rounded-3xl p-6 md:p-8"><div className="assetflow-orb pointer-events-none" /><div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><div className="assetflow-chip mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"><Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Phase 5 · Tokenization</div><h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Turn approved assets into controlled digital issuance.</h2><p className="assetflow-muted mt-4 max-w-2xl text-sm leading-6 md:text-base">Create a persistent issuance request, retain the approval context and keep final minting behind legal, custody and investor controls.</p></div><button onClick={() => { void refresh(); void loadRequests(); }} className="assetflow-chip inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/[.08]"><RefreshCw className="h-4 w-4" /> Refresh issuance state</button></div></section>

      <section className="grid gap-3 md:grid-cols-5">{stages.map((stage, index) => { const Icon = stage.icon; const complete = index === 0 ? eligible : false; return <div key={stage.label} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center justify-between"><Icon className="h-4 w-4 text-cyan-300" />{complete ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Circle className="h-4 w-4 text-slate-700" />}</div><p className="mt-4 text-sm font-semibold text-white">{stage.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{stage.detail}</p></div>; })}</section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[.025] p-5 md:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-slate-600">Asset selection</p><h3 className="mt-1 text-xl font-semibold text-white">Issuance candidate</h3></div><select value={selected?.id ?? ''} onChange={(e) => setSelectedId(e.target.value)} className="assetflow-search rounded-xl px-3 py-2 text-sm outline-none">{loading ? <option>Loading assets…</option> : assets.length === 0 ? <option value="">No assets available</option> : assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></div>{selected ? <div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-slate-500">Asset value</p><p className="mt-2 text-2xl font-semibold text-white">${value.toLocaleString()}</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-slate-500">Indicative token price</p><p className="mt-2 text-2xl font-semibold text-white">${tokenPrice.toFixed(4)}</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-slate-500">Risk gate</p><p className={`mt-2 text-sm font-semibold ${riskReady ? 'text-emerald-300' : 'text-amber-300'}`}>{riskReady ? 'Passed' : 'Review required'}</p></div><div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs text-slate-500">Compliance gate</p><p className={`mt-2 text-sm font-semibold ${complianceReady ? 'text-emerald-300' : 'text-amber-300'}`}>{complianceReady ? 'Passed' : 'Review required'}</p></div></div> : <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500">Create an asset and complete its risk/compliance review before tokenization.</div>}</section>

        <section className="rounded-3xl border border-white/10 bg-white/[.025] p-5 md:p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Coins className="h-5 w-5" /></div><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-slate-600">Token structure</p><h3 className="text-xl font-semibold text-white">Define issuance terms</h3></div></div><div className="mt-6 space-y-3"><label className="block text-xs text-slate-500">Token symbol<input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase().slice(0, 12))} className="assetflow-search mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none" /></label><label className="block text-xs text-slate-500">Total supply<input value={tokenCount} onChange={(e) => setTokenCount(e.target.value.replace(/[^0-9]/g, ''))} className="assetflow-search mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none" /></label><label className="block text-xs text-slate-500">Settlement network<select value={network} onChange={(e) => setNetwork(e.target.value)} className="assetflow-search mt-1 w-full rounded-xl px-3 py-2.5 text-sm outline-none"><option>Polygon</option><option>Ethereum</option><option>Other / later adapter</option></select></label></div><div className="mt-5 rounded-2xl border border-cyan-400/10 bg-cyan-400/[.04] p-4"><div className="flex items-center gap-2 text-xs font-medium text-cyan-200"><LockKeyhole className="h-4 w-4" /> Controlled issuance</div><p className="mt-2 text-xs leading-5 text-slate-500">The request is persisted before any future minting adapter. Legal, custody and investor permissions remain explicit approval gates.</p></div><button disabled={!eligible || busy} onClick={createRequest} className="assetflow-primary mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40">{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}{busy ? 'Saving request…' : 'Create issuance request'}</button></section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/[.025] p-5 md:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-slate-600">Issuance queue</p><h3 className="mt-1 text-xl font-semibold text-white">Recent tokenization requests</h3></div><Clock3 className="h-5 w-5 text-slate-600" /></div>{requests.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No issuance requests yet.</div> : <div className="mt-5 space-y-2">{requests.map((request) => { const asset = assets.find((item) => item.id === request.asset_id); return <div key={request.id} className="flex flex-col gap-3 rounded-2xl border border-white/[.07] bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold text-white">{request.token_symbol}</p><span className="rounded-full border border-amber-400/15 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">{request.status.replaceAll('_', ' ')}</span></div><p className="mt-1 text-xs text-slate-500">{asset?.name ?? 'Asset'} · {request.network} · {Number(request.total_supply).toLocaleString()} tokens</p></div><p className="text-xs text-slate-600">{new Date(request.created_at).toLocaleString()}</p></div>; })}</div>}</section>

      <section className="grid gap-4 md:grid-cols-3">{[['Eligibility-first issuance','Risk and compliance gates sit before token creation.'],['Rail-agnostic settlement','Network selection is an adapter, not the core product.'],['Audit-ready controls','The request and audit event are persisted before any future minting adapter.']].map(([title, detail]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-sm font-semibold text-white">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p></div>)}</section>
    </div>
  );
}

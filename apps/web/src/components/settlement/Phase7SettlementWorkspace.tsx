'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Landmark, LockKeyhole, RefreshCw, Send, ShieldCheck, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAssets } from '@/components/dashboard/AssetData';

type Settlement = {
  id: string;
  asset_id: string;
  direction: 'BUY' | 'SELL';
  amount: number;
  currency: string;
  settlement_network: string;
  counterparty: string | null;
  status: string;
  settlement_date: string | null;
  reference: string | null;
  created_at: string;
};

const statusOrder = ['PENDING_REVIEW', 'ELIGIBILITY_CHECK', 'READY', 'IN_SETTLEMENT', 'SETTLED'];

const statusLabel: Record<string, string> = {
  PENDING_REVIEW: 'Pending review',
  ELIGIBILITY_CHECK: 'Eligibility check',
  READY: 'Ready to settle',
  IN_SETTLEMENT: 'In settlement',
  SETTLED: 'Settled',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

export function Phase7SettlementWorkspace() {
  const { assets, loading: assetsLoading, refresh: refreshAssets } = useAssets();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assetId, setAssetId] = useState('');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('Bank rail');
  const [counterparty, setCounterparty] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const selected = useMemo(() => settlements.find((item) => item.id === selectedId) ?? settlements[0], [settlements, selectedId]);

  async function loadSettlements() {
    setLoading(true);
    const { data, error } = await supabase.from('settlement_instructions').select('*').order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setSettlements((data ?? []) as Settlement[]);
    setLoading(false);
  }

  useEffect(() => { void loadSettlements(); }, []);

  async function createSettlement() {
    if (!assetId) return toast.error('Select an asset');
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return toast.error('Enter a valid settlement amount');
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Your session has expired. Sign in again.');
      const { data: profile, error: profileError } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (profileError || !profile?.organization_id) throw new Error('Your workspace organization could not be resolved');
      const { data, error } = await supabase.from('settlement_instructions').insert({ organization_id: profile.organization_id, asset_id: assetId, created_by: user.id, direction, amount: numericAmount, currency: 'USD', settlement_network: network, counterparty: counterparty.trim() || null, status: 'PENDING_REVIEW' }).select('*').single();
      if (error) throw error;
      await supabase.from('settlement_events').insert({ settlement_id: data.id, organization_id: profile.organization_id, actor_id: user.id, to_status: 'PENDING_REVIEW', message: 'Settlement instruction created' });
      setAmount(''); setCounterparty('');
      await loadSettlements();
      setSelectedId(data.id);
      toast.success('Settlement instruction staged');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create settlement instruction');
    } finally { setCreating(false); }
  }

  async function advance(id: string, nextStatus: string) {
    const current = settlements.find((item) => item.id === id);
    if (!current) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error('Your session has expired');
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
    if (!profile?.organization_id) return toast.error('Workspace organization could not be resolved');
    const { error } = await supabase.from('settlement_instructions').update({ status: nextStatus, settlement_date: nextStatus === 'SETTLED' ? new Date().toISOString().slice(0, 10) : current.settlement_date }).eq('id', id);
    if (error) return toast.error(error.message);
    await supabase.from('settlement_events').insert({ settlement_id: id, organization_id: profile.organization_id, actor_id: user.id, from_status: current.status, to_status: nextStatus, message: `Status advanced to ${statusLabel[nextStatus]}` });
    await loadSettlements();
    toast.success(`Settlement moved to ${statusLabel[nextStatus]}`);
  }

  async function cancel(id: string) {
    const current = settlements.find((item) => item.id === id);
    if (!current || ['SETTLED', 'CANCELLED'].includes(current.status)) return;
    const { error } = await supabase.from('settlement_instructions').update({ status: 'CANCELLED' }).eq('id', id);
    if (error) return toast.error(error.message);
    await loadSettlements();
    toast.success('Settlement cancelled');
  }

  const currentIndex = selected ? statusOrder.indexOf(selected.status) : -1;
  const nextStatus = currentIndex >= 0 && currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;
  const summaryCards: Array<[string, number, LucideIcon]> = [
    ['Pending review', settlements.filter((s) => s.status === 'PENDING_REVIEW').length, Clock3],
    ['Ready', settlements.filter((s) => s.status === 'READY').length, ShieldCheck],
    ['In settlement', settlements.filter((s) => s.status === 'IN_SETTLEMENT').length, Send],
    ['Settled', settlements.filter((s) => s.status === 'SETTLED').length, CheckCircle2],
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-8">
      <section className="assetflow-hero relative overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="assetflow-orb pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="assetflow-chip mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.2em]"><Landmark className="h-3.5 w-3.5 text-cyan-300" /> Phase 7 · Settlement Operations</div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">Turn approved liquidity into controlled settlement instructions.</h1>
            <p className="assetflow-muted mt-4 max-w-2xl text-sm leading-6 md:text-base">Stage, review and advance asset transfers through an auditable lifecycle. AssetFlow records the operational state without pretending a bank, custodian or blockchain rail has executed funds movement.</p>
          </div>
          <button onClick={() => { void loadSettlements(); void refreshAssets(); }} className="assetflow-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"><RefreshCw className="h-4 w-4" /> Refresh settlement state</button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map(([label, value, Icon]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><Icon className="h-4 w-4 text-cyan-300" /></div><div className="mt-3 text-2xl font-semibold text-white">{value}</div><div className="mt-1 text-xs text-slate-600">Live workspace instructions</div></div>)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
          <div className="flex items-center justify-between border-b border-white/[.06] px-5 py-4"><div><div className="flex items-center gap-2 text-sm font-semibold text-white"><ArrowRight className="h-4 w-4 text-cyan-300" /> Settlement queue</div><p className="mt-1 text-xs text-slate-600">Every instruction is scoped to the signed-in organization.</p></div><span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cyan-300">Auditable</span></div>
          {loading ? <div className="p-8 text-sm text-slate-500">Loading settlement instructions…</div> : settlements.length === 0 ? <div className="p-8 text-sm text-slate-500">No settlement instructions yet. Stage the first one on the right.</div> : <div className="divide-y divide-white/[.06]">{settlements.map((item) => { const asset = assets.find((a) => a.id === item.asset_id); const active = item.id === selected?.id; return <button key={item.id} onClick={() => setSelectedId(item.id)} className={`grid w-full grid-cols-[1.4fr_.55fr_.8fr_1fr] items-center gap-3 px-5 py-4 text-left transition ${active ? 'bg-cyan-400/[.05]' : 'hover:bg-white/[.025]'}`}><div><div className="font-medium text-white">{asset?.name ?? 'Asset'}</div><div className="mt-1 text-xs text-slate-600">{item.direction} · {item.counterparty ?? 'Counterparty not assigned'}</div></div><div className="text-sm text-slate-300">${Number(item.amount).toLocaleString()}</div><div><div className="text-[10px] uppercase tracking-wider text-slate-600">Rail</div><div className="mt-1 text-xs text-slate-400">{item.settlement_network}</div></div><div className="text-right"><span className="rounded-full border border-white/10 bg-white/[.03] px-2.5 py-1 text-[10px] font-medium text-slate-300">{statusLabel[item.status] ?? item.status}</span></div></button>; })}</div>}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><Send className="h-4 w-4 text-cyan-300" /> Stage settlement</div>
          <p className="mt-1 text-xs leading-5 text-slate-600">Create an instruction only. Execution remains with the connected settlement rail.</p>
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="assetflow-search mt-5 w-full rounded-xl px-4 py-3 text-sm outline-none"><option value="">{assetsLoading ? 'Loading assets…' : 'Select asset'}</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select>
          <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setDirection('BUY')} className={`rounded-xl border px-3 py-2 text-sm font-medium ${direction === 'BUY' ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200' : 'border-white/10 text-slate-500'}`}>Buy</button><button onClick={() => setDirection('SELL')} className={`rounded-xl border px-3 py-2 text-sm font-medium ${direction === 'SELL' ? 'border-violet-300/30 bg-violet-300/10 text-violet-200' : 'border-white/10 text-slate-500'}`}>Sell</button></div>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" placeholder="Settlement amount (USD)" className="assetflow-search mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none" />
          <select value={network} onChange={(e) => setNetwork(e.target.value)} className="assetflow-search mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none"><option>Bank rail</option><option>Stablecoin rail</option><option>Ethereum</option><option>Polygon</option></select>
          <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Counterparty (optional)" className="assetflow-search mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none" />
          <button onClick={() => void createSettlement()} disabled={creating || assetsLoading} className="assetflow-primary mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-40"><Send className="h-4 w-4" /> {creating ? 'Staging…' : 'Create instruction'}</button>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-600"><LockKeyhole className="h-3.5 w-3.5" /> Organization-scoped · RLS protected · event logged</div>
        </section>
      </div>

      {selected && <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="text-[10px] uppercase tracking-[.2em] text-slate-600">Selected instruction</div><h2 className="mt-2 text-xl font-semibold text-white">{assets.find((a) => a.id === selected.asset_id)?.name ?? 'Asset'} · {selected.direction}</h2><p className="mt-1 text-sm text-slate-500">${Number(selected.amount).toLocaleString()} {selected.currency} · {selected.settlement_network} · {selected.counterparty ?? 'No counterparty assigned'}</p></div><div className="flex gap-2">{nextStatus && <button onClick={() => void advance(selected.id, nextStatus)} className="assetflow-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"><ArrowRight className="h-4 w-4" /> Move to {statusLabel[nextStatus]}</button>}{!['SETTLED','CANCELLED'].includes(selected.status) && <button onClick={() => void cancel(selected.id)} className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-sm font-semibold text-red-300"><XCircle className="h-4 w-4" /> Cancel</button>}</div></div>
        <div className="mt-6 grid gap-3 md:grid-cols-5">{statusOrder.map((status, index) => { const reached = statusOrder.indexOf(selected.status) >= index; return <div key={status} className={`rounded-xl border p-3 ${reached ? 'border-cyan-400/20 bg-cyan-400/[.06]' : 'border-white/10 bg-black/10'}`}><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-slate-500">0{index + 1}</span>{reached && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" />}</div><div className="mt-3 text-xs font-medium text-slate-300">{statusLabel[status]}</div></div>})}</div>
      </section>}

      <div className="flex items-center gap-2 text-xs text-slate-600"><Landmark className="h-3.5 w-3.5" /> Phase 7 is the operational settlement layer. Real custody, bank and blockchain adapters can plug into these instructions without changing the asset intelligence record.</div>
    </div>
  );
}

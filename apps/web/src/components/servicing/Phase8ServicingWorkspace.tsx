'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CalendarClock, CheckCircle2, CircleDollarSign, Clock3, FileText, Loader2, Plus, RefreshCw, ShieldCheck, WalletCards, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAssets } from '@/components/dashboard/AssetData';

type Action = { id: string; asset_id: string; action_type: string; amount: number; currency: string; record_date: string; payment_date: string; status: string; notes: string | null; external_reference: string | null; created_at: string };
type Allocation = { id: string; corporate_action_id: string; investor_id: string; units: number; amount: number; status: string; paid_at: string | null; external_reference: string | null; transaction_hash: string | null };
type Position = { id: string; asset_id: string; investor_id: string; units: number };
type Metric = [LucideIcon, string, number, string];

const actionTypes = ['INTEREST', 'DIVIDEND', 'PRINCIPAL', 'FEE', 'MATURITY'];

export function Phase8ServicingWorkspace() {
  const { assets } = useAssets();
  const [actions, setActions] = useState<Action[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assetId, setAssetId] = useState('');
  const [actionType, setActionType] = useState('INTEREST');
  const [amount, setAmount] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentDate, setPaymentDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [investorId, setInvestorId] = useState('');
  const [units, setUnits] = useState('');

  const load = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); return; }
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', userData.user.id).single();
    if (!profile?.organization_id) { setLoading(false); return; }
    const [a, al, p] = await Promise.all([
      supabase.from('corporate_actions').select('*').eq('organization_id', profile.organization_id).order('payment_date', { ascending: true }),
      supabase.from('corporate_action_allocations').select('*').order('created_at', { ascending: false }),
      supabase.from('servicing_positions').select('id,asset_id,investor_id,units').eq('organization_id', profile.organization_id),
    ]);
    if (a.error) toast.error(a.error.message); else setActions((a.data ?? []) as Action[]);
    if (al.error) toast.error(al.error.message); else setAllocations((al.data ?? []) as Allocation[]);
    if (p.error) toast.error(p.error.message); else setPositions((p.data ?? []) as Position[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const selected = actions.find(a => a.id === selectedId) ?? actions[0] ?? null;
  const selectedAllocations = useMemo(() => selected ? allocations.filter(a => a.corporate_action_id === selected.id) : [], [allocations, selected]);
  const selectedAsset = selected ? assets.find(a => a.id === selected.asset_id) : null;
  const totalAllocated = selectedAllocations.reduce((s, a) => s + Number(a.amount), 0);
  const coverage = selected && Number(selected.amount) > 0 ? Math.min(100, totalAllocated / Number(selected.amount) * 100) : 0;
  const metrics: Metric[] = [
    [CalendarClock, 'Upcoming', actions.filter(a => ['SCHEDULED', 'READY'].includes(a.status)).length, 'Scheduled / ready'],
    [Clock3, 'Processing', actions.filter(a => a.status === 'PROCESSING').length, 'In distribution'],
    [CheckCircle2, 'Completed', actions.filter(a => a.status === 'COMPLETED').length, 'Closed actions'],
    [WalletCards, 'Positions', positions.length, 'Investor positions'],
  ];

  async function createAction() {
    const value = Number(amount);
    if (!assetId || !value || value <= 0) return toast.error('Choose an asset and enter an amount');
    if (paymentDate < recordDate) return toast.error('Payment date must be on or after record date');
    setCreating(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', userData.user?.id ?? '').single();
    if (!userData.user || !profile?.organization_id) { toast.error('Workspace identity could not be resolved'); setCreating(false); return; }
    const { data, error } = await supabase.from('corporate_actions').insert({ organization_id: profile.organization_id, asset_id: assetId, created_by: userData.user.id, action_type: actionType, amount: value, currency: 'USD', record_date: recordDate, payment_date: paymentDate, status: 'SCHEDULED', notes: notes.trim() || null }).select().single();
    if (error) toast.error(error.message);
    else {
      const related = positions.filter(p => p.asset_id === assetId);
      const totalUnits = related.reduce((s, p) => s + Number(p.units), 0);
      if (related.length && totalUnits > 0) {
        const rows = related.map(p => ({ corporate_action_id: data.id, investor_id: p.investor_id, units: p.units, amount: Math.round(value * Number(p.units) / totalUnits * 100) / 100, status: 'PENDING' }));
        const { error: allocationError } = await supabase.from('corporate_action_allocations').insert(rows);
        if (allocationError) toast.error(`Action created, but allocation failed: ${allocationError.message}`);
      }
      toast.success(related.length ? 'Corporate action scheduled and allocated' : 'Corporate action scheduled');
      setShowCreate(false); setAmount(''); setNotes(''); await load(); setSelectedId(data.id);
    }
    setCreating(false);
  }

  async function addPosition() {
    if (!assetId || !investorId.trim() || !Number(units)) return toast.error('Asset, investor UUID and units are required');
    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', userData.user?.id ?? '').single();
    if (!profile?.organization_id) return toast.error('Workspace organization could not be resolved');
    const { error } = await supabase.from('servicing_positions').upsert({ organization_id: profile.organization_id, asset_id: assetId, investor_id: investorId.trim(), units: Number(units) }, { onConflict: 'asset_id,investor_id' });
    if (error) toast.error(error.message); else { toast.success('Servicing position saved'); setInvestorId(''); setUnits(''); await load(); }
  }

  async function advance(next: string) {
    if (!selected) return;
    if (next === 'READY' && selectedAllocations.length === 0) return toast.error('Create or import investor positions before marking ready');
    const { error } = await supabase.from('corporate_actions').update({ status: next }).eq('id', selected.id);
    if (error) toast.error(error.message); else { toast.success(`Action moved to ${next.toLowerCase()}`); await load(); }
  }

  async function markAllocationPaid(id: string) {
    const { error } = await supabase.from('corporate_action_allocations').update({ status: 'PAID', paid_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Distribution marked paid'); await load(); }
  }

  return <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-8">
    <section className="assetflow-hero rounded-3xl p-6 md:p-8"><div className="assetflow-radar pointer-events-none" /><div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div className="max-w-3xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-300"><CircleDollarSign className="h-3.5 w-3.5" /> Phase 8 · Corporate Actions & Servicing</div><h1 className="font-display text-3xl font-semibold tracking-tight text-[#f3ead9] md:text-5xl">Service the asset after the trade.</h1><p className="assetflow-muted mt-4 max-w-2xl text-sm leading-6 md:text-base">Schedule interest, dividends, principal and maturity events, snapshot investor positions, and maintain a controlled distribution ledger.</p></div><button onClick={() => void load()} className="assetflow-secondary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"><RefreshCw className="h-4 w-4" /> Refresh servicing</button></div></section>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">{metrics.map(([Icon, label, value, detail]) => <div key={label} className="assetflow-card rounded-2xl p-5"><Icon className="h-5 w-5 text-cyan-300" /><p className="mt-4 text-2xl font-semibold text-white">{value}</p><p className="text-sm text-white/70">{label}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}</div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <section className="assetflow-card overflow-hidden rounded-2xl"><div className="flex items-center justify-between border-b border-white/[.06] p-5"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/30">Servicing ledger</p><h2 className="mt-1 text-xl font-semibold text-white">Corporate actions</h2></div><button onClick={() => setShowCreate(true)} className="assetflow-primary inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Schedule</button></div>{loading ? <div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading servicing ledger…</div> : actions.length === 0 ? <div className="p-10 text-center"><FileText className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3 text-sm text-slate-400">No corporate actions scheduled.</p><button onClick={() => setShowCreate(true)} className="mt-4 text-sm text-cyan-300">Schedule the first action →</button></div> : <div className="divide-y divide-white/[.06]">{actions.map(a => <button key={a.id} onClick={() => setSelectedId(a.id)} className={`flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/[.025] ${selected?.id === a.id ? 'bg-cyan-400/[.04]' : ''}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-medium text-white">{a.action_type}</span><span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-400">{a.status}</span></div><p className="mt-1 truncate text-sm text-slate-500">{assets.find(x => x.id === a.asset_id)?.name ?? a.asset_id}</p></div><div className="shrink-0 text-right"><p className="font-semibold text-white">${Number(a.amount).toLocaleString()} {a.currency}</p><p className="mt-1 text-xs text-slate-500">Pay {a.payment_date}</p></div></button>)}</div>}</section>
      <section className="assetflow-card rounded-2xl p-5">{!selected ? <div className="grid min-h-[300px] place-items-center text-center"><div><ShieldCheck className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3 text-sm text-slate-400">Select a corporate action to inspect readiness.</p></div></div> : <><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/30">Action control</p><h2 className="mt-1 text-xl font-semibold text-white">{selected.action_type}</h2><p className="mt-1 text-sm text-slate-500">{selectedAsset?.name ?? selected.asset_id}</p></div><span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-300">{selected.status}</span></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs text-slate-500">Action amount</p><p className="mt-1 text-lg font-semibold text-white">${Number(selected.amount).toLocaleString()}</p></div><div className="rounded-xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs text-slate-500">Allocated</p><p className="mt-1 text-lg font-semibold text-white">${totalAllocated.toLocaleString()}</p></div></div><div className="mt-5"><div className="mb-2 flex justify-between text-xs"><span className="text-slate-500">Allocation coverage</span><span className="text-white">{coverage.toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${coverage}%` }} /></div></div><div className="mt-6 space-y-2">{selectedAllocations.length === 0 ? <div className="rounded-xl border border-amber-400/15 bg-amber-400/[.05] p-4 text-sm text-amber-200">No investor allocations yet. Add servicing positions before releasing this action.</div> : selectedAllocations.map(a => <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.06] p-3"><div><p className="text-sm text-white">{a.investor_id.slice(0, 8)}…</p><p className="text-xs text-slate-500">{Number(a.units).toLocaleString()} units · {a.status}</p></div><div className="flex items-center gap-2"><span className="text-sm font-medium text-white">${Number(a.amount).toLocaleString()}</span>{a.status !== 'PAID' && <button onClick={() => void markAllocationPaid(a.id)} className="rounded-lg border border-emerald-400/15 bg-emerald-400/[.06] px-2 py-1 text-xs text-emerald-300">Mark paid</button>}</div></div>)}</div><div className="mt-6 flex flex-wrap gap-2">{selected.status === 'SCHEDULED' && <button onClick={() => void advance('READY')} className="assetflow-primary rounded-xl px-3 py-2 text-sm font-semibold">Mark ready</button>}{selected.status === 'READY' && <button onClick={() => void advance('PROCESSING')} className="assetflow-primary rounded-xl px-3 py-2 text-sm font-semibold">Start distribution</button>}{selected.status === 'PROCESSING' && <button onClick={() => void advance('COMPLETED')} className="assetflow-primary rounded-xl px-3 py-2 text-sm font-semibold">Complete action</button>}{!['COMPLETED','CANCELLED'].includes(selected.status) && <button onClick={() => void advance('CANCELLED')} className="inline-flex items-center gap-2 rounded-xl border border-red-400/15 px-3 py-2 text-sm text-red-300"><XCircle className="h-4 w-4" /> Cancel</button>}</div></>}</section>
    </div>
    <section className="assetflow-card rounded-2xl p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/30">Position snapshot</p><h2 className="mt-1 text-xl font-semibold text-white">Servicing positions</h2><p className="mt-1 text-sm text-slate-500">These positions determine each investor's pro-rata allocation.</p></div><div className="flex flex-wrap gap-2"><select value={assetId} onChange={e => setAssetId(e.target.value)} className="assetflow-search rounded-xl px-3 py-2 text-sm outline-none"><option value="">Select asset</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select><input value={investorId} onChange={e => setInvestorId(e.target.value)} placeholder="Investor UUID" className="assetflow-search w-44 rounded-xl px-3 py-2 text-sm outline-none" /><input value={units} onChange={e => setUnits(e.target.value)} type="number" min="0" placeholder="Units" className="assetflow-search w-28 rounded-xl px-3 py-2 text-sm outline-none" /><button onClick={() => void addPosition()} className="assetflow-secondary rounded-xl px-3 py-2 text-sm font-semibold">Save position</button></div></div></section>
    {showCreate && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0d13] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="font-display text-xl font-semibold text-white">Schedule corporate action</h2><p className="assetflow-muted mt-1 text-sm">Create the servicing event and snapshot allocations.</p></div><button onClick={() => setShowCreate(false)} className="rounded-xl p-2 text-slate-500 hover:bg-white/[.05] hover:text-white">✕</button></div><div className="mt-6 space-y-3"><select value={assetId} onChange={e => setAssetId(e.target.value)} className="assetflow-search w-full rounded-xl px-4 py-3 outline-none"><option value="">Select asset</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select><select value={actionType} onChange={e => setActionType(e.target.value)} className="assetflow-search w-full rounded-xl px-4 py-3 outline-none">{actionTypes.map(t => <option key={t}>{t}</option>)}</select><input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" placeholder="Total action amount (USD)" className="assetflow-search w-full rounded-xl px-4 py-3 outline-none" /><div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-500">Record date<input value={recordDate} onChange={e => setRecordDate(e.target.value)} type="date" className="assetflow-search mt-1 w-full rounded-xl px-3 py-3 text-sm text-white outline-none" /></label><label className="text-xs text-slate-500">Payment date<input value={paymentDate} onChange={e => setPaymentDate(e.target.value)} type="date" className="assetflow-search mt-1 w-full rounded-xl px-3 py-3 text-sm text-white outline-none" /></label></div><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes / servicing instructions" className="assetflow-search min-h-24 w-full rounded-xl px-4 py-3 text-sm outline-none" /></div><button disabled={creating} onClick={() => void createAction()} className="assetflow-primary mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold">{creating && <Loader2 className="h-4 w-4 animate-spin" />} Schedule action</button></div></div>}
  </div>;
}

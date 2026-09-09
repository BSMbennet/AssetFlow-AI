'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, CheckCircle2, ClipboardCheck, FileClock, LockKeyhole, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Review = {
  id: string;
  title: string;
  review_type: string;
  status: string;
  severity: string;
  rationale: string | null;
  created_at: string;
};

const statusTone: Record<string, string> = {
  OPEN: 'text-amber-300 border-amber-400/20 bg-amber-400/5',
  ACKNOWLEDGED: 'text-cyan-300 border-cyan-400/20 bg-cyan-400/5',
  RESOLVED: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/5',
  WAIVED: 'text-slate-400 border-white/10 bg-white/[.03]',
};

export function Phase11GovernanceWorkspace() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    const { data, error: queryError } = await supabase.from('governance_reviews').select('id,title,review_type,status,severity,rationale,created_at').order('created_at', { ascending: false }).limit(50);
    if (queryError) setError(queryError.message); else setReviews((data ?? []) as Review[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => ({
    open: reviews.filter(r => r.status === 'OPEN').length,
    critical: reviews.filter(r => r.severity === 'CRITICAL' && r.status !== 'RESOLVED').length,
    resolved: reviews.filter(r => r.status === 'RESOLVED').length,
  }), [reviews]);

  async function resolve(review: Review) {
    setBusy(review.id);
    const { error: updateError } = await supabase.from('governance_reviews').update({ status: 'RESOLVED', reviewed_at: new Date().toISOString() }).eq('id', review.id);
    if (updateError) setError(updateError.message); else await load();
    setBusy(null);
  }

  return (
    <div className="mx-auto max-w-[1540px] space-y-6 p-4 md:p-8">
      <section className="assetflow-command rounded-3xl p-5 md:p-7">
        <div className="assetflow-command-grid pointer-events-none" />
        <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2"><span className="assetflow-eyebrow"><ShieldCheck className="h-3.5 w-3.5" /> Phase 11 · Governance + Audit</span><span className="assetflow-status"><span className="assetflow-live-dot" /> Control plane active</span></div>
            <h1 className="font-display max-w-4xl text-3xl font-semibold tracking-[-.04em] text-white md:text-5xl">Make every consequential decision <span className="assetflow-gradient-text">reviewable.</span></h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">A governed control plane for AI decisions, human review, exceptions and audit evidence across the AssetFlow lifecycle.</p>
          </div>
          <button onClick={() => void load()} className="assetflow-secondary flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"><RefreshCw className="h-4 w-4" /> Refresh controls</button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="assetflow-kpi"><p>Open reviews</p><strong>{stats.open}</strong><span>Require human disposition</span></div>
        <div className="assetflow-kpi"><p>Critical exceptions</p><strong>{stats.critical}</strong><span>Escalate before execution</span></div>
        <div className="assetflow-kpi"><p>Resolved</p><strong>{stats.resolved}</strong><span>Evidence retained</span></div>
      </div>

      {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200"><TriangleAlert className="mr-2 inline h-4 w-4" /> {error}</div>}

      <section className="assetflow-panel overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/[.06] px-5 py-4"><div><p className="assetflow-eyebrow">Governance queue</p><h2 className="mt-1 text-lg font-semibold text-white">Reviewable decisions</h2></div><ClipboardCheck className="h-5 w-5 text-cyan-300" /></div>
        {loading ? <div className="p-8 text-sm text-slate-500">Loading control records…</div> : reviews.length === 0 ? <div className="p-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" /><p className="mt-3 text-sm font-medium text-slate-200">No open governance exceptions</p><p className="mt-1 text-xs text-slate-600">New AI, compliance or operational exceptions will appear here.</p></div> : <div className="divide-y divide-white/[.05]">{reviews.map(review => <div key={review.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div className="min-w-0"><div className="flex items-center gap-2"><Activity className="h-4 w-4 shrink-0 text-cyan-300" /><p className="truncate text-sm font-medium text-slate-200">{review.title}</p></div><p className="mt-1 text-xs text-slate-500">{review.review_type} · {review.rationale || 'No rationale recorded'}</p><p className="mt-1 font-mono text-[10px] text-slate-700">{new Date(review.created_at).toLocaleString()}</p></div><span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] ${statusTone[review.status] || statusTone.OPEN}`}>{review.status}</span>{review.status !== 'RESOLVED' && <button onClick={() => void resolve(review)} disabled={busy === review.id} className="assetflow-primary rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-40">{busy === review.id ? 'Saving…' : 'Resolve'}</button>}</div>)}</div>}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[['Decision provenance','AI rationale, actor, timestamp and evidence stay attached to the review.'],['Human-in-the-loop','Critical decisions can be acknowledged or resolved before execution.'],['Immutable-ready audit','Existing audit infrastructure can anchor every control event to a durable record.']].map(([title, detail], i) => <div key={title} className="assetflow-panel rounded-2xl p-5"><div className="flex items-center gap-2 text-cyan-300">{i === 0 ? <FileClock className="h-4 w-4" /> : i === 1 ? <LockKeyhole className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}<span className="text-xs font-semibold uppercase tracking-[.14em]">{title}</span></div><p className="mt-3 text-sm leading-6 text-slate-400">{detail}</p></div>)}
      </div>
    </div>
  );
}

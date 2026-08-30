'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, FileClock, Loader2, MessageSquareWarning, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

type Review = {
  id: string;
  status: ReviewStatus;
  reviewer_note: string | null;
  reviewed_by: string | null;
  created_at: string;
  decided_at: string | null;
};

type AuditEvent = {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

const reviewLabel: Record<ReviewStatus, string> = {
  pending: 'PENDING',
  in_review: 'IN REVIEW',
  approved: 'APPROVED',
  rejected: 'REJECTED',
};

export function HumanApprovalPanel({ assetId, blockedCount, onChanged }: { assetId: string; blockedCount: number; onChanged: () => Promise<void> | void }) {
  const [review, setReview] = useState<Review | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: reviewData, error: reviewError }, { data: eventData, error: eventError }] = await Promise.all([
      supabase.from('asset_reviews').select('id,status,reviewer_note,reviewed_by,created_at,decided_at').eq('asset_id', assetId).maybeSingle(),
      supabase.from('audit_events').select('id,event_type,metadata,created_at').eq('asset_id', assetId).order('created_at', { ascending: false }).limit(8),
    ]);
    if (reviewError || eventError) toast.error(reviewError?.message ?? eventError?.message ?? 'Could not load review history');
    setReview((reviewData as Review | null) ?? null);
    setEvents((eventData as AuditEvent[]) ?? []);
    setNote(reviewData?.reviewer_note ?? '');
    setLoading(false);
  }

  useEffect(() => { void load(); }, [assetId]);

  async function saveReview(status: ReviewStatus) {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error('You must be signed in.');
      setSaving(false);
      return;
    }

    const existing = review?.id;
    const payload = {
      asset_id: assetId,
      status,
      requested_by: review ? undefined : userData.user.id,
      reviewed_by: status === 'approved' || status === 'rejected' ? userData.user.id : review?.reviewed_by ?? null,
      reviewer_note: note.trim() || null,
      decided_at: status === 'approved' || status === 'rejected' ? new Date().toISOString() : null,
    };

    const { error: reviewError } = existing
      ? await supabase.from('asset_reviews').update(payload).eq('id', existing)
      : await supabase.from('asset_reviews').insert(payload);

    if (reviewError) {
      toast.error(reviewError.message);
      setSaving(false);
      return;
    }

    const { error: auditError } = await supabase.from('audit_events').insert({
      asset_id: assetId,
      event_type: `human_review_${status}`,
      actor_id: userData.user.id,
      metadata: { note: note.trim() || null, source: 'AssetFlow Phase 3 human approval workflow' },
    });

    if (auditError) {
      toast.error(auditError.message);
    } else {
      toast.success(status === 'approved' ? 'Asset approved by human reviewer' : status === 'rejected' ? 'Asset review rejected' : 'Review status updated');
    }
    await load();
    await onChanged();
    setSaving(false);
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-xs text-white/40"><Loader2 className="h-4 w-4 animate-spin" /> Loading approval history…</div>;
  }

  const status = review?.status ?? 'pending';
  const canApprove = blockedCount === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">Human approval</p>
            <h3 className="mt-1 text-xl font-semibold">Review & decision gate</h3>
            <p className="mt-1 text-sm leading-6 text-white/45">AI and rules provide evidence. A person makes the final decision.</p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] ${status === 'approved' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : status === 'rejected' ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}`}>{reviewLabel[status]}</span>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
          <div className="flex items-center gap-2 text-xs text-white/45"><Clock3 className="h-4 w-4" /> Decision readiness</div>
          <p className="mt-2 text-sm text-white/70">{blockedCount > 0 ? `${blockedCount} blocked control${blockedCount === 1 ? '' : 's'} must be resolved before approval.` : 'No blocked controls. The asset can be submitted for human approval.'}</p>
        </div>

        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add reviewer rationale or conditions…" className="mt-4 min-h-24 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-400/30" />

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={saving || status === 'in_review'} onClick={() => void saveReview('in_review')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/[0.1] disabled:opacity-40"><FileClock className="h-4 w-4" /> {status === 'in_review' ? 'In review' : 'Start review'}</button>
          <button type="button" disabled={saving || !canApprove || status === 'approved'} onClick={() => void saveReview('approved')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/15 px-4 py-2.5 text-sm font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/20 transition hover:bg-emerald-400/20 disabled:opacity-35"><CheckCircle2 className="h-4 w-4" /> Approve</button>
          <button type="button" disabled={saving || status === 'rejected'} onClick={() => void saveReview('rejected')} className="inline-flex items-center gap-2 rounded-xl bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-300 ring-1 ring-inset ring-red-400/20 transition hover:bg-red-400/15 disabled:opacity-35"><XCircle className="h-4 w-4" /> Reject</button>
          {saving && <Loader2 className="my-auto h-4 w-4 animate-spin text-white/40" />}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2"><MessageSquareWarning className="h-4 w-4 text-cyan-300" /><div><p className="text-xs uppercase tracking-[0.16em] text-white/40">Audit trail</p><h3 className="mt-1 text-xl font-semibold">Recent decisions</h3></div></div>
        <div className="mt-5 space-y-3">
          {events.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/35">No review events recorded yet.</p> : events.map((event) => <div key={event.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-white/75">{event.event_type.replaceAll('_', ' ')}</p><p className="text-[10px] text-white/30">{new Date(event.created_at).toLocaleString()}</p></div>{typeof event.metadata?.note === 'string' && event.metadata.note && <p className="mt-1 text-xs leading-5 text-white/40">{event.metadata.note}</p>}</div>)}
        </div>
      </div>
    </div>
  );
}

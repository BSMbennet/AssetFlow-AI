'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileWarning, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type Status = 'ready' | 'attention' | 'blocked' | 'approved';

type Asset = {
  id: string;
  name: string;
  status: string;
  risk_score: number | null;
  compliance_score: number | null;
};

type ComplianceRecord = {
  id: string;
  asset_id: string;
  compliance_type: string;
  status: Status;
  details: Record<string, unknown>;
  checked_at: string | null;
};

type RiskAssessment = {
  id: string;
  asset_id: string;
  overall_score: number | null;
  risk_level: string | null;
  breakdown: Record<string, unknown>;
  recommendations: unknown;
  model_version: string | null;
  created_at: string;
};

const CHECKS = [
  { type: 'KYC verification', category: 'Identity', owner: 'Operations' },
  { type: 'AML screening', category: 'Financial crime', owner: 'Compliance' },
  { type: 'Required documents', category: 'Documentation', owner: 'Analyst' },
  { type: 'Data privacy controls', category: 'Privacy', owner: 'Security' },
  { type: 'Conflict detection', category: 'Governance', owner: 'Reviewer' },
];

const scoreTone = (score: number) =>
  score >= 60 ? 'text-red-300' : score >= 40 ? 'text-amber-300' : score >= 30 ? 'text-sky-300' : 'text-emerald-300';

function statusCopy(status: Status) {
  return { ready: 'READY', attention: 'REVIEW', blocked: 'BLOCKED', approved: 'APPROVED' }[status];
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    ready: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    attention: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    blocked: 'border-red-400/30 bg-red-400/10 text-red-300',
    approved: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] ${styles[status]}`}>{statusCopy(status)}</span>;
}

function normaliseStatus(value: unknown): Status {
  if (value === 'approved' || value === 'blocked' || value === 'attention') return value;
  return 'ready';
}

export default function ComplianceDashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [auditRunning, setAuditRunning] = useState(false);

  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets[0] ?? null;
  const selectedRecords = records.filter((record) => record.asset_id === selectedAsset?.id);
  const selectedRisk = risks.find((risk) => risk.asset_id === selectedAsset?.id) ?? null;

  const stats = useMemo(() => ({
    total: selectedRecords.length,
    ready: selectedRecords.filter((r) => r.status === 'ready' || r.status === 'approved').length,
    attention: selectedRecords.filter((r) => r.status === 'attention').length,
    blocked: selectedRecords.filter((r) => r.status === 'blocked').length,
  }), [selectedRecords]);

  const overallRisk = selectedRisk?.overall_score ?? selectedAsset?.risk_score ?? 0;

  async function loadData() {
    setLoading(true);
    const [{ data: assetData, error: assetError }, { data: recordData, error: recordError }, { data: riskData, error: riskError }] = await Promise.all([
      supabase.from('assets').select('id,name,status,risk_score,compliance_score').order('created_at', { ascending: false }),
      supabase.from('compliance_records').select('id,asset_id,compliance_type,status,details,checked_at').order('checked_at', { ascending: false }),
      supabase.from('risk_assessments').select('id,asset_id,overall_score,risk_level,breakdown,recommendations,model_version,created_at').order('created_at', { ascending: false }),
    ]);

    if (assetError || recordError || riskError) {
      toast.error(assetError?.message ?? recordError?.message ?? riskError?.message ?? 'Could not load compliance data');
    }
    const nextAssets = (assetData as Asset[]) ?? [];
    setAssets(nextAssets);
    setRecords(((recordData as ComplianceRecord[]) ?? []).map((record) => ({ ...record, status: normaliseStatus(record.status) })));
    setRisks((riskData as RiskAssessment[]) ?? []);
    if (!selectedAssetId && nextAssets[0]) setSelectedAssetId(nextAssets[0].id);
    setLoading(false);
  }

  useEffect(() => { void loadData(); }, []);

  async function runAudit() {
    if (!selectedAsset) {
      toast.error('Create an asset first, then run the readiness audit.');
      return;
    }

    setAuditRunning(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error('You must be signed in.');
      setAuditRunning(false);
      return;
    }

    const missingDocuments = selectedRecords.length === 0 || !selectedRecords.some((r) => r.compliance_type === 'Required documents');
    const nextRecords = CHECKS.map((check) => {
      const existing = selectedRecords.find((record) => record.compliance_type === check.type);
      let status: Status = existing?.status ?? 'ready';
      let detail = 'No exception recorded by the current readiness workflow.';
      if (check.type === 'Required documents' && missingDocuments) {
        status = 'blocked';
        detail = 'Document completeness has not yet been confirmed. Upload supporting documents before approval.';
      }
      if (check.type === 'AML screening' && status === 'ready') {
        status = 'attention';
        detail = 'AML screening is a human-review checkpoint in this prototype; no external screening provider is connected yet.';
      }
      return {
        asset_id: selectedAsset.id,
        compliance_type: check.type,
        status,
        details: { category: check.category, owner: check.owner, detail, source: 'AssetFlow Phase 3 readiness workflow' },
        checked_at: new Date().toISOString(),
        created_by: userData.user.id,
      };
    });

    const blockedCount = nextRecords.filter((record) => record.status === 'blocked').length;
    const attentionCount = nextRecords.filter((record) => record.status === 'attention').length;
    const complianceScore = Math.max(0, 100 - blockedCount * 35 - attentionCount * 10);
    const riskScore = Math.min(100, Math.max(15, 25 + blockedCount * 20 + attentionCount * 8));
    const breakdown = {
      credit: Math.min(100, riskScore),
      market: Math.min(100, riskScore + 6),
      liquidity: Math.min(100, riskScore + 12),
      operational: Math.max(5, riskScore - 5),
      regulatory: Math.min(100, riskScore + blockedCount * 8),
    };
    const recommendations = blockedCount > 0
      ? ['Complete missing asset documentation before approval.', 'Keep AML findings in analyst review until an external screening result is available.']
      : ['Proceed to human review.', 'Continue monitoring liquidity and regulatory exposure.'];

    const { error: recordError } = await supabase.from('compliance_records').upsert(nextRecords, { onConflict: 'asset_id,compliance_type' });
    const { error: riskError } = await supabase.from('risk_assessments').upsert({
      asset_id: selectedAsset.id,
      overall_score: riskScore,
      risk_level: riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
      breakdown,
      recommendations,
      model_version: 'phase-3-rules-v1',
    }, { onConflict: 'asset_id' });
    const { error: assetError } = await supabase.from('assets').update({ risk_score: riskScore, compliance_score: complianceScore }).eq('id', selectedAsset.id);

    if (recordError || riskError || assetError) {
      toast.error(recordError?.message ?? riskError?.message ?? assetError?.message ?? 'Audit failed');
    } else {
      toast.success('Readiness audit completed');
      await loadData();
    }
    setAuditRunning(false);
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-white/50"><Loader2 className="h-4 w-4 animate-spin" /> Loading risk and compliance data…</div>;
  }

  if (assets.length === 0) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-cyan-300" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Phase 3 · Risk & Compliance</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Start with an asset</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">Create a private-credit asset from the Dashboard. Once it exists, AssetFlow can generate a readiness checklist and explainable risk baseline for it.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 text-white">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Phase 3 · Risk & Compliance</p>
          <h2 className="text-2xl font-semibold tracking-tight">Asset readiness command center</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/55">A connected baseline for explainable risk, compliance controls and human approval.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedAsset?.id ?? ''} onChange={(event) => setSelectedAssetId(event.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none">
            {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
          </select>
          <button type="button" onClick={runAudit} disabled={auditRunning} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60">
            {auditRunning && <Loader2 className="h-4 w-4 animate-spin" />}{auditRunning ? 'Running audit…' : 'Run readiness audit'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Checks', stats.total, 'controls recorded'],
          ['Ready', stats.ready, 'cleared or approved'],
          ['Review', stats.attention, 'analyst attention'],
          ['Blocked', stats.blocked, 'must resolve'],
        ].map(([label, value, hint]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-[0.16em] text-white/40">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-white/40">{hint}</p></div>)}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.16em] text-white/40">Explainable risk</p><h3 className="mt-1 text-xl font-semibold">Overall risk score</h3></div><div className="text-right"><p className={`text-4xl font-semibold ${scoreTone(overallRisk)}`}>{overallRisk}</p><p className="text-[10px] uppercase tracking-[0.18em] text-white/35">out of 100</p></div></div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white/60 transition-all" style={{ width: `${overallRisk}%` }} /></div>
          {selectedRisk ? <div className="space-y-3">{Object.entries(selectedRisk.breakdown).map(([name, value]) => <div key={name}><div className="mb-1 flex justify-between text-sm"><span className="capitalize text-white/75">{name}</span><span className={scoreTone(Number(value))}>{String(value)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white/40" style={{ width: `${Math.min(100, Number(value))}%` }} /></div></div>)}</div> : <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/40">Run the readiness audit to generate the first risk baseline.</div>}
          {selectedRisk && <div className="mt-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300/80">Recommendation</p><p className="mt-2 text-sm leading-6 text-white/70">{Array.isArray(selectedRisk.recommendations) ? String(selectedRisk.recommendations[0]) : 'Review the latest risk assessment with an analyst.'}</p><p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/30">Baseline: {selectedRisk.model_version ?? 'recorded assessment'}</p></div>}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-white/40">Readiness controls</p><h3 className="mt-1 text-xl font-semibold">Compliance checklist</h3></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/45">CONNECTED</span></div>
          {selectedRecords.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-6 text-sm leading-6 text-white/45">No compliance checks have been recorded for this asset yet. Run the readiness audit to create the Phase 3 baseline.</div> : <div className="space-y-2">{selectedRecords.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.05]">{item.status === 'blocked' ? <FileWarning className="h-4 w-4 text-red-300" /> : item.status === 'attention' ? <TriangleAlert className="h-4 w-4 text-amber-300" /> : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white/85">{item.compliance_type}</p><p className="mt-0.5 truncate text-xs text-white/35">{String(item.details?.detail ?? 'Readiness control recorded')}</p></div><StatusBadge status={item.status} /></div>)}</div>}
          <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300/80">Approval gate</p><p className="mt-2 text-sm leading-6 text-white/60">AI/rules-based findings support the analyst. They do not automatically approve an asset.</p></div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.16em] text-white/40">Portfolio readiness</p><h3 className="mt-1 text-xl font-semibold">Asset risk & compliance</h3></div><span className="text-xs text-white/35">Live Supabase data</span></div>
        <div className="overflow-x-auto"><table className="min-w-full"><thead><tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.16em] text-white/35"><th className="px-3 py-3">Asset</th><th className="px-3 py-3">Risk</th><th className="px-3 py-3">Compliance</th><th className="px-3 py-3">Status</th></tr></thead><tbody>{assets.map((asset) => <tr key={asset.id} className="border-b border-white/[0.06] last:border-0"><td className="px-3 py-3 text-sm text-white/80">{asset.name}</td><td className={`px-3 py-3 text-sm font-medium ${scoreTone(asset.risk_score ?? 0)}`}>{asset.risk_score ?? '—'}</td><td className="px-3 py-3 text-sm text-white/60">{asset.compliance_score ?? '—'}</td><td className="px-3 py-3 text-xs text-white/45">{asset.status}</td></tr>)}</tbody></table></div>
      </div>
    </section>
  );
}

'use client';

import React, { useMemo, useState } from 'react';

type Status = 'ready' | 'attention' | 'blocked' | 'approved';

interface ComplianceItem {
  id: string;
  name: string;
  status: Status;
  category: string;
  lastChecked: string;
  owner: string;
  detail: string;
}

interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  explanation: string;
}

const complianceItems: ComplianceItem[] = [
  {
    id: 'kyc',
    name: 'KYC verification',
    status: 'ready',
    category: 'Identity',
    lastChecked: 'Today',
    owner: 'Operations',
    detail: 'Borrower and beneficial-owner identity evidence is present.',
  },
  {
    id: 'aml',
    name: 'AML screening',
    status: 'attention',
    category: 'Financial crime',
    lastChecked: 'Today',
    owner: 'Compliance',
    detail: 'One screening result needs analyst review before approval.',
  },
  {
    id: 'docs',
    name: 'Required documents',
    status: 'blocked',
    category: 'Documentation',
    lastChecked: 'Today',
    owner: 'Analyst',
    detail: 'Two supporting documents are missing from the asset record.',
  },
  {
    id: 'privacy',
    name: 'Data privacy controls',
    status: 'ready',
    category: 'Privacy',
    lastChecked: 'Yesterday',
    owner: 'Security',
    detail: 'Access and document handling controls are configured.',
  },
  {
    id: 'conflicts',
    name: 'Conflict detection',
    status: 'approved',
    category: 'Governance',
    lastChecked: 'Yesterday',
    owner: 'Reviewer',
    detail: 'No unresolved related-party conflict was detected in the current review.',
  },
];

const riskFactors: RiskFactor[] = [
  { name: 'Credit risk', score: 28, weight: 30, explanation: 'Repayment profile and borrower strength are currently moderate-to-low risk.' },
  { name: 'Market risk', score: 34, weight: 25, explanation: 'Market sensitivity is manageable but should be monitored.' },
  { name: 'Liquidity risk', score: 41, weight: 15, explanation: 'Liquidity is the largest current risk contributor.' },
  { name: 'Operational risk', score: 22, weight: 15, explanation: 'No major operational exceptions are currently flagged.' },
  { name: 'Regulatory risk', score: 18, weight: 15, explanation: 'The regulatory profile is low risk, subject to document completion.' },
];

const statusCopy: Record<Status, string> = {
  ready: 'READY',
  attention: 'REVIEW',
  blocked: 'BLOCKED',
  approved: 'APPROVED',
};

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    ready: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    attention: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    blocked: 'border-red-400/30 bg-red-400/10 text-red-300',
    approved: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] ${styles[status]}`}>
      {statusCopy[status]}
    </span>
  );
}

const scoreTone = (score: number) =>
  score >= 40 ? 'text-amber-300' : score >= 30 ? 'text-sky-300' : 'text-emerald-300';

const ComplianceDashboard: React.FC = () => {
  const [activeItem, setActiveItem] = useState<ComplianceItem | null>(null);
  const [auditRunning, setAuditRunning] = useState(false);
  const [approved, setApproved] = useState(false);

  const overallRisk = useMemo(() => {
    const weighted = riskFactors.reduce((total, factor) => total + factor.score * factor.weight, 0);
    return Math.round(weighted / 100);
  }, []);

  const stats = useMemo(() => ({
    total: complianceItems.length,
    ready: complianceItems.filter((item) => item.status === 'ready' || item.status === 'approved').length,
    attention: complianceItems.filter((item) => item.status === 'attention').length,
    blocked: complianceItems.filter((item) => item.status === 'blocked').length,
  }), []);

  const runAudit = () => {
    setAuditRunning(true);
    window.setTimeout(() => setAuditRunning(false), 1200);
  };

  return (
    <section className="space-y-6 text-white">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Phase 3 · Risk & Compliance</p>
          <h2 className="text-2xl font-semibold tracking-tight">Asset readiness command center</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/55">Turn asset intelligence into an explainable risk view, compliance checklist and human approval decision.</p>
        </div>
        <button
          type="button"
          onClick={runAudit}
          disabled={auditRunning}
          className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-60"
        >
          {auditRunning ? 'Running audit…' : 'Run readiness audit'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Checks', stats.total.toString(), 'total controls'],
          ['Ready', stats.ready.toString(), 'cleared or approved'],
          ['Review', stats.attention.toString(), 'analyst attention'],
          ['Blocked', stats.blocked.toString(), 'must resolve'],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-white/40">{hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">Explainable risk</p>
              <h3 className="mt-1 text-xl font-semibold">Overall risk score</h3>
            </div>
            <div className="text-right">
              <p className={`text-4xl font-semibold ${scoreTone(overallRisk)}`}>{overallRisk}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">out of 100</p>
            </div>
          </div>

          <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white/60 transition-all" style={{ width: `${overallRisk}%` }} />
          </div>

          <div className="space-y-4">
            {riskFactors.map((factor) => (
              <div key={factor.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-white/80">{factor.name}</span>
                  <span className={scoreTone(factor.score)}>{factor.score}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-white/40" style={{ width: `${factor.score}%` }} />
                </div>
                <p className="mt-1 text-xs leading-5 text-white/40">{factor.explanation} · Weight {factor.weight}%</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">AI recommendation</p>
            <p className="mt-2 text-sm leading-6 text-white/70">Resolve the missing documents and review the AML exception before final human approval. Liquidity is the main risk contributor to monitor.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-white/40">Readiness controls</p>
              <h3 className="mt-1 text-xl font-semibold">Compliance checklist</h3>
            </div>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/45">DEMO DATA</span>
          </div>

          <div className="space-y-2">
            {complianceItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveItem(item)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/85">{item.name}</p>
                  <p className="mt-0.5 text-xs text-white/35">{item.category} · {item.lastChecked}</p>
                </div>
                <StatusBadge status={item.status} />
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300/80">Approval gate</p>
            <p className="mt-2 text-sm leading-6 text-white/60">Human review remains required. AI findings support the analyst; they do not automatically approve an asset.</p>
            <button
              type="button"
              onClick={() => setApproved((value) => !value)}
              className="mt-3 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium hover:bg-white/15"
            >
              {approved ? 'Approval marked for review' : 'Mark analyst review complete'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/40">Audit trail</p>
            <h3 className="mt-1 text-xl font-semibold">Recent decisions</h3>
          </div>
          <span className="text-xs text-white/35">Human + AI activity</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ['09:42', 'Risk assessment generated', 'AI risk engine', 'Score 34/100'],
            ['09:48', 'AML exception flagged', 'Compliance analyst', 'Review required'],
            ['10:03', 'Conflict check completed', 'Reviewer', 'No conflict found'],
          ].map(([time, action, actor, result]) => (
            <div key={time} className="rounded-xl border border-white/8 bg-black/15 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/30">{time} · {actor}</p>
              <p className="mt-2 text-sm font-medium text-white/80">{action}</p>
              <p className="mt-1 text-xs text-white/40">{result}</p>
            </div>
          ))}
        </div>
      </div>

      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center" onClick={() => setActiveItem(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111118] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-white/35">Control detail</p>
                <h3 className="mt-1 text-xl font-semibold">{activeItem.name}</h3>
              </div>
              <StatusBadge status={activeItem.status} />
            </div>
            <p className="mt-5 text-sm leading-6 text-white/60">{activeItem.detail}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3"><span className="text-white/35">Owner</span><p className="mt-1 text-white/70">{activeItem.owner}</p></div>
              <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3"><span className="text-white/35">Last checked</span><p className="mt-1 text-white/70">{activeItem.lastChecked}</p></div>
            </div>
            <button type="button" onClick={() => setActiveItem(null)} className="mt-5 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-white/90">Close</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ComplianceDashboard;

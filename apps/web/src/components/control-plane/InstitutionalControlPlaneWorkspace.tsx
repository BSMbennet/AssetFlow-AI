'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, Bot, Boxes, CheckCircle2, CircleDollarSign, Database,
  FileCheck2, GitBranch, Landmark, LockKeyhole, Network, Play, RefreshCw,
  Scale, ShieldCheck, Sparkles, Users, WalletCards,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Module = {
  phase: number;
  name: string;
  table: string;
  icon: any;
  description: string;
  seed: Record<string, any>;
};

const modules: Module[] = [
  { phase: 16, name: 'Evidence & Audit Intelligence', table: 'evidence_items', icon: FileCheck2, description: 'Evidence objects, hashes and source lineage.', seed: { source_type: 'CONTROL_PLANE', title: 'Initial evidence register' } },
  { phase: 17, name: 'Policy & Control Plane', table: 'control_policies', icon: Scale, description: 'Versioned institutional policies and executable rules.', seed: { name: 'Default institutional controls', rules: { review_required: true, evidence_required: true } } },
  { phase: 18, name: 'Institutional Data Room', table: 'data_rooms', icon: Database, description: 'Organization-scoped diligence rooms and evidence paths.', seed: { name: 'Primary institutional data room' } },
  { phase: 19, name: 'Counterparty Intelligence', table: 'counterparties', icon: Users, description: 'Counterparty records, risk ratings and exposure graph.', seed: { name: 'Initial counterparty', type: 'INSTITUTIONAL', risk_rating: 'WATCH' } },
  { phase: 20, name: 'Valuation & Scenario Engine', table: 'valuation_scenarios', icon: Activity, description: 'Scenario assumptions and valuation outputs.', seed: { name: 'Base case', assumptions: { discount_rate: 0.1, recovery_rate: 0.7 } } },
  { phase: 21, name: 'Treasury & Cash Management', table: 'treasury_positions', icon: WalletCards, description: 'Multi-rail balances and liquidity forecasting.', seed: { account_ref: 'PRIMARY', rail: 'BANK', currency: 'USD', balance: 0 } },
  { phase: 22, name: 'Risk Aggregation', table: 'risk_snapshots', icon: ShieldCheck, description: 'Portfolio and counterparty risk snapshots.', seed: { scope_type: 'PORTFOLIO', metric: 'CONCENTRATION', value: 0, severity: 'STABLE' } },
  { phase: 23, name: 'Compliance Operations', table: 'compliance_cases', icon: LockKeyhole, description: 'Operational compliance cases with ownership and severity.', seed: { case_type: 'CONTROL_REVIEW', status: 'OPEN', severity: 'WATCH', assigned_role: 'COMPLIANCE' } },
  { phase: 24, name: 'Workflow Automation', table: 'automation_runs', icon: Play, description: 'Multi-step automation runs with human checkpoints.', seed: { automation_type: 'CONTROL_PLANE_BOOTSTRAP', status: 'PENDING', steps: [{ step: 1, action: 'REVIEW' }], human_checkpoint_required: true } },
  { phase: 25, name: 'Institutional AI Copilot', table: 'copilot_sessions', icon: Bot, description: 'Organization-scoped AI context and conversation state.', seed: { context: { workspace: 'institutional-control-plane' }, messages: [] } },
  { phase: 26, name: 'Marketplace & Distribution', table: 'marketplace_listings', icon: Boxes, description: 'Distribution inventory and offering terms.', seed: { status: 'DRAFT', terms: { eligibility: 'INSTITUTIONAL' } } },
  { phase: 27, name: 'Custody & Ownership', table: 'custody_positions', icon: Landmark, description: 'Custody positions, ownership references and reconciliation.', seed: { custodian_ref: 'PRIMARY_CUSTODIAN', owner_ref: 'ORGANIZATION', quantity: 0 } },
  { phase: 28, name: 'Multi-Rail Payments', table: 'payment_transfers', icon: CircleDollarSign, description: 'Idempotent payment instructions across financial rails.', seed: { rail: 'BANK', amount: 0, currency: 'USD', status: 'PENDING' } },
  { phase: 29, name: 'Reconciliation & Finance Ops', table: 'reconciliation_breaks', icon: GitBranch, description: 'Break detection and finance-operations resolution.', seed: { domain: 'CONTROL_PLANE', status: 'OPEN', details: { source: 'bootstrap' } } },
  { phase: 30, name: 'Institutional Analytics', table: 'analytics_snapshots', icon: Activity, description: 'Point-in-time institutional metrics and dimensions.', seed: { metric: 'CONTROL_PLANE_HEALTH', value: 1, dimensions: { source: 'bootstrap' } } },
  { phase: 31, name: 'Governance, Security & Resilience', table: 'security_controls', icon: ShieldCheck, description: 'Control tests, evidence and security posture.', seed: { control_key: 'RLS_ORG_ISOLATION', status: 'PASS', evidence: [] } },
  { phase: 32, name: 'Institutional Network', table: 'institutional_connections', icon: Network, description: 'Institutional counterparties, connections and permissions.', seed: { connection_type: 'INSTITUTIONAL', status: 'ACTIVE', permissions: { read: true } } },
  { phase: 33, name: 'Global Regulatory Expansion', table: 'regulatory_rulesets', icon: Scale, description: 'Jurisdiction-specific rulesets and effective dates.', seed: { jurisdiction: 'US', name: 'Baseline institutional rules', version: '1.0' } },
  { phase: 34, name: 'Institutional Liquidity Network', table: 'liquidity_routes', icon: ArrowRight, description: 'Liquidity venues, rails and observed quotes.', seed: { venue: 'PRIMARY', rail: 'BANK', quote: {} } },
  { phase: 35, name: 'Autonomous Institutional Operations', table: 'autonomy_policies', icon: Sparkles, description: 'Bounded autonomy with approval and value limits.', seed: { name: 'Conservative autonomy', allowed_actions: ['READ', 'CLASSIFY', 'FLAG'], approval_required: true, max_value: 0 } },
];

const phaseGroups = [
  { label: 'Evidence & Control', phases: [16, 17, 18] },
  { label: 'Risk & Finance', phases: [19, 20, 21, 22, 23] },
  { label: 'Automation & Intelligence', phases: [24, 25, 26] },
  { label: 'Rails & Operations', phases: [27, 28, 29, 30] },
  { label: 'Institutional Network', phases: [31, 32, 33, 34, 35] },
];

type Row = Record<string, any>;

export default function InstitutionalControlPlaneWorkspace() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Sign in required'); setLoading(false); return; }
    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('organization_id').eq('id', user.id).maybeSingle();
    if (profileError || !profile?.organization_id) {
      setError(profileError?.message || 'No organization is assigned to this account');
      setLoading(false);
      return;
    }
    setOrgId(profile.organization_id);
    const nextCounts: Record<string, number> = {};
    await Promise.all(modules.map(async (m) => {
      const { count, error: e } = await supabase
        .from(m.table).select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id);
      if (!e) nextCounts[m.table] = count || 0;
    }));
    setCounts(nextCounts);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function initialize(m: Module) {
    if (!orgId) return;
    setBusy(m.table); setError(null); setMessage(null);
    const payload: Record<string, any> = { ...m.seed, organization_id: orgId };
    if (m.table === 'copilot_sessions') {
      payload.user_id = (await supabase.auth.getUser()).data.user?.id || null;
    }
    if (m.table === 'payment_transfers') {
      payload.idempotency_key = `control-plane-${Date.now()}`;
    }
    const { error: e } = await supabase.from(m.table).insert(payload);
    if (e) setError(`${m.name}: ${e.message}`);
    else setMessage(`${m.name} initialized with an organization-scoped record.`);
    setBusy(null);
    void load();
  }

  const filtered = useMemo(() => modules.filter((m) =>
    `${m.phase} ${m.name} ${m.description}`.toLowerCase().includes(query.toLowerCase())
  ), [query]);
  const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
  const activeModules = modules.filter((m) => (counts[m.table] || 0) > 0).length;

  return (
    <main className="mx-auto max-w-[1540px] space-y-6 p-4 md:p-8">
      <section className="assetflow-command rounded-3xl p-6 md:p-8">
        <div className="relative z-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="assetflow-eyebrow">Phases 16–35 · Unified Institutional Control Plane</span>
            <span className="assetflow-status"><span className="assetflow-live-dot" /> Organization isolated</span>
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-[-.04em] text-white md:text-5xl">One operating system. Every remaining phase.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Evidence, policy, data rooms, counterparties, valuation, treasury, risk, compliance, automation, AI context, distribution, custody, payments, reconciliation, analytics, security, network, regulation, liquidity and bounded autonomy — wired into one institutional workspace.</p>
            </div>
            <button onClick={() => void load()} className="inline-flex items-center gap-2 self-start rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3 font-mono text-[10px] uppercase tracking-[.16em] text-cyan-200">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh control plane
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <K label="Remaining phases" value={modules.length} hint="16 → 35" />
        <K label="Modules with data" value={activeModules} hint={`of ${modules.length}`} />
        <K label="Control records" value={totalRecords} hint="organization scoped" />
        <K label="Architecture" value={1} hint="unified plane" />
      </div>

      {(error || message) && <div className={`rounded-2xl border p-4 text-sm ${error ? 'border-rose-400/20 bg-rose-400/5 text-rose-200' : 'border-emerald-400/20 bg-emerald-400/5 text-emerald-200'}`}>{error || message}</div>}

      <section className="assetflow-panel rounded-2xl p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><p className="assetflow-eyebrow">Institutional topology</p><h2 className="mt-1 font-display text-xl font-semibold text-white">Phase execution map</h2></div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter phase, domain or capability…" className="w-full rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 md:w-80" />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{phaseGroups.map((g) => <div key={g.label} className="rounded-lg border border-white/[.06] bg-white/[.02] px-3 py-2"><span className="font-mono text-[9px] uppercase tracking-[.16em] text-slate-500">{g.label}</span><div className="mt-1 flex gap-1">{g.phases.map((p) => <span key={p} className="font-mono text-[9px] text-cyan-300">{p}</span>)}</div></div>)}</div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((m) => <ModuleCard key={m.phase} module={m} count={counts[m.table] || 0} loading={loading} busy={busy === m.table} onInitialize={() => void initialize(m)} />)}
      </div>

      <section className="assetflow-panel rounded-2xl p-5 md:p-6"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-cyan-300"/><div><p className="font-display text-sm font-semibold text-white">AI copilot context plane</p><p className="text-[10px] text-slate-600">Phase 25 stores organization-scoped context and messages; model execution remains behind the application service so credentials and policy enforcement never live in the browser.</p></div></div></section>
      <div className="flex items-center gap-2 text-[10px] text-slate-600"><CheckCircle2 className="h-3.5 w-3.5"/> All records are queried with organization scope. The UI does not bypass Supabase RLS.</div>
    </main>
  );
}

function ModuleCard({ module: m, count, loading, busy, onInitialize }: { module: Module; count: number; loading: boolean; busy: boolean; onInitialize: () => void }) {
  const Icon = m.icon;
  return <article className="assetflow-panel group rounded-2xl p-5 transition hover:border-cyan-300/20"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-2.5"><Icon className="h-4 w-4 text-cyan-300"/></div><div><div className="flex items-center gap-2"><span className="font-mono text-[9px] text-cyan-300">PHASE {m.phase}</span><span className="font-mono text-[9px] text-slate-700">{m.table}</span></div><h3 className="mt-1 font-display text-sm font-semibold text-slate-100">{m.name}</h3><p className="mt-1 text-[10px] leading-5 text-slate-500">{m.description}</p></div></div><div className="text-right"><div className="font-display text-2xl font-semibold text-white">{loading ? '—' : count}</div><div className="font-mono text-[8px] uppercase tracking-[.15em] text-slate-600">records</div></div></div><div className="mt-4 flex items-center justify-between border-t border-white/[.05] pt-3"><div className="flex items-center gap-2 text-[9px] text-slate-600"><span className={`h-1.5 w-1.5 rounded-full ${count ? 'bg-emerald-300' : 'bg-slate-700'}`}/>{count ? 'Live data present' : 'Ready to initialize'}</div><button disabled={busy} onClick={onInitialize} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[.12em] text-slate-300 disabled:opacity-40">{busy ? <RefreshCw className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3"/>}{busy ? 'Initializing' : 'Initialize'}</button></div></article>;
}

function K({ label, value, hint }: { label: string; value: number; hint: string }) {
  return <div className="assetflow-panel rounded-2xl p-4"><div className="font-mono text-[9px] uppercase tracking-[.16em] text-slate-600">{label}</div><div className="mt-1 font-display text-3xl font-semibold text-white">{value}</div><div className="mt-1 text-[9px] text-cyan-300/70">{hint}</div></div>;
}

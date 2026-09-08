'use client';

import { useState } from 'react';
import { LayoutDashboard, Building, Coins, Users, Shield, BarChart3, Settings, Bell, Search, Plus, Loader2, FileUp, Sparkles, LogOut, Menu, X, AlertTriangle, ArrowLeftRight, Landmark, CircleDollarSign, Activity, ArrowUpRight, CheckCircle2, Clock3, LockKeyhole, Zap, Copy } from 'lucide-react';
import { StatsCards } from './StatsCards';
import { ActivityFeed } from './ActivityFeed';
import { AssetChart } from './AssetChart';
import { QuickActions } from './QuickActions';
import { useAssets } from './AssetData';
import { AssetDocuments } from './AssetDocuments';
import { Phase3Workspace } from '@/components/compliance/Phase3Workspace';
import { PortfolioMonitoringWorkspace } from '@/components/monitoring/PortfolioMonitoringWorkspace';
import { Phase5TokenizationWorkspace } from '@/components/tokenization/Phase5TokenizationWorkspace';
import { Phase6TradingWorkspace } from '@/components/trading/Phase6TradingWorkspace';
import { Phase7SettlementWorkspace } from '@/components/settlement/Phase7SettlementWorkspace';
import { Phase8ServicingWorkspace } from '@/components/servicing/Phase8ServicingWorkspace';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

const navigation = [
  { icon: LayoutDashboard, label: 'Command Center', id: 'overview' },
  { icon: Building, label: 'Asset Vaults', id: 'assets' },
  { icon: Coins, label: 'Tokenization Studio', id: 'tokens', blurb: 'Issue and track tokenized shares of your credit assets on-chain.' },
  { icon: Users, label: 'Investors', id: 'investors', blurb: 'Your LPs, their commitments, and capital call history in one list.' },
  { icon: Shield, label: 'Compliance', id: 'compliance', blurb: 'KYC and AML checks, audit trails, and filing status per asset.' },
  { icon: BarChart3, label: 'Portfolio Intelligence', id: 'monitoring', blurb: 'Yield curves, portfolio performance, and risk exposure at a glance.' },
  { icon: ArrowLeftRight, label: 'Trading & Liquidity', id: 'trading', blurb: 'Controlled liquidity workflows for institution-ready assets.' },
  { icon: Landmark, label: 'Settlement Rail', id: 'settlement', blurb: 'Stage, review and advance controlled settlement instructions.' },
  { icon: CircleDollarSign, label: 'Servicing', id: 'servicing', blurb: 'Schedule interest, dividends, principal, fees and maturity servicing.' },
  { icon: Settings, label: 'Configuration', id: 'settings', blurb: 'Team access, notification preferences, and account details.' },
];

const vaults = [
  { symbol: '$ACME-CR', name: 'Senior Secured Note', metric: '9.25%', metricLabel: 'Net APY', meta: '100% funded', rail: 'FedNow + USDC', tone: 'cyan' },
  { symbol: '$APEX-LN', name: 'Autonomous Fleet Debt', metric: '8.80%', metricLabel: 'APY', meta: '140% collateral', rail: 'IoT telemetry', tone: 'purple' },
  { symbol: '$MHTN-EQ', name: 'Manhattan Tower Equity', metric: '7.95%', metricLabel: 'Cap Rate', meta: '$4.85M depth', rail: 'Secondary OTC', tone: 'gold' },
  { symbol: '$BIO-REC', name: 'Healthcare Receivables', metric: '10.15%', metricLabel: 'APY', meta: 'Daily waterfall', rail: 'USDC settlement', tone: 'green' },
];

const pipeline = [
  ['01', 'AI Document Intake', '1,420 SEC filings verified', 'complete'],
  ['02', 'Valuation + Oracle Feeds', 'AVM / Chainlink CCIP', 'complete'],
  ['03', 'Delaware Statutory Trust', 'Charter anchored on-chain', 'active'],
  ['04', 'ERC-3643 Permissioned Mint', 'Identity registry 92% synced', 'queued'],
  ['05', 'Liquidity Syndication', 'Allocation + secondary routes', 'queued'],
] as const;

const railEvents = [
  ['09:42:18.420', 'FedNow', 'pacs.008 → Vault 0x8F9a…4B2c', '$4,820,000', 'SETTLED', '840ms'],
  ['09:41:54.112', 'USDC', 'DvP #8410 → $ACME-CR', '$1,250,000', 'ATOMIC', '1.8s'],
  ['09:41:21.902', 'Canton', 'Tokenized deposit → escrow', '$860,000', 'SETTLED', '1.2s'],
  ['09:40:48.774', 'ISO 20022', 'Allocation batch → 14 investors', '$6,420,000', 'QUEUED', '—'],
];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [documentsAssetId, setDocumentsAssetId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('United States');
  const [value, setValue] = useState('');
  const { assets, loading, error, createAsset } = useAssets();

  async function handleCreate() {
    if (!name.trim()) return toast.error('Asset name is required');
    try {
      await createAsset({ name: name.trim(), asset_type: 'Private Credit', jurisdiction, current_value: value ? Number(value) : undefined });
      setName(''); setValue(''); setShowCreate(false); toast.success('Asset added'); setActiveTab('assets');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create asset');
    }
  }

  async function signOut() { await supabase.auth.signOut(); }

  function selectTab(id: string) {
    setActiveTab(id);
    setMobileNavOpen(false);
  }

  return (
    <div className="assetflow-shell flex h-screen overflow-hidden">
      {mobileNavOpen && <div onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" />}

      <aside className={`assetflow-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(88vw,21rem)] shrink-0 flex-col border-r transition-transform duration-300 md:static md:z-auto md:w-64 md:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-white/[.07] px-5 py-5 md:px-6 md:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="assetflow-mark grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-950"><Sparkles className="h-5 w-5" /></div>
              <div className="min-w-0"><h1 className="assetflow-brand font-display truncate text-xl font-bold tracking-tight">AssetFlow AI</h1><p className="text-[9px] font-semibold uppercase tracking-[.22em] text-cyan-300/70">Sovereign Rail OS</p></div>
            </div>
            <button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[.05] hover:text-white md:hidden" aria-label="Close menu"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="border-b border-white/[.06] px-4 py-4">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[.16em] text-slate-500"><span>Network</span><span className="flex items-center gap-1.5 text-emerald-300"><span className="assetflow-live-dot" />Operational</span></div>
          <div className="mt-2 rounded-xl border border-cyan-400/10 bg-cyan-400/[.035] px-3 py-2.5"><p className="font-mono text-[10px] text-slate-300">MAINNET PROT-V4</p><p className="mt-1 text-[10px] text-slate-600">ETH · MATIC · CBDC RAILS</p></div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-600">Institutional Workspace</p>
          {navigation.map((item) => (
            <button key={item.id} onClick={() => selectTab(item.id)} className={`flex w-full items-center rounded-xl border-l-2 px-3 py-2.5 text-left text-[13px] transition-all ${activeTab === item.id ? 'assetflow-nav-active' : 'border-transparent text-slate-500 hover:bg-white/[.035] hover:text-slate-200'}`}>
              <item.icon className="mr-3 h-4 w-4 shrink-0" /><span className="min-w-0 whitespace-normal">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-white/[.07] p-3">
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/[.025] px-3 py-2.5"><div className="grid h-7 w-7 place-items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-[10px] font-bold text-cyan-300">PM</div><div className="min-w-0"><p className="truncate text-xs font-medium text-slate-300">Portfolio Manager</p><p className="font-mono text-[9px] text-slate-600">0x8F9a…4B2c</p></div></div>
          <button onClick={signOut} className="flex w-full items-center rounded-xl px-3 py-2.5 text-xs text-slate-600 transition hover:bg-white/[.04] hover:text-white"><LogOut className="mr-3 h-4 w-4 shrink-0" /> Sign out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto pb-16 md:pb-0">
        <header className="assetflow-topbar sticky top-0 z-30 border-b">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button onClick={() => setMobileNavOpen(true)} className="rounded-xl p-2 text-slate-400 hover:bg-white/[.05] hover:text-white md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
              <div className="relative hidden w-full max-w-2xl sm:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input placeholder="Search assets, borrowers, documents…  ⌘K" className="assetflow-search w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none" /></div>
              <div className="min-w-0 sm:hidden"><p className="truncate text-xs font-semibold text-slate-300">Command Center</p><p className="font-mono text-[9px] text-cyan-300/70">ENCLAVE · LIVE</p></div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden items-center gap-2 rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2 lg:flex"><span className="assetflow-live-dot" /><span className="font-mono text-[10px] text-slate-400">VAULT</span><span className="font-mono text-[11px] text-slate-200">$18.42M USDC</span></div>
              <button className="rounded-xl p-2.5 text-slate-500 hover:bg-white/[.05] hover:text-white" aria-label="Notifications"><Bell className="h-4 w-4" /></button>
              <button onClick={() => setShowCreate(true)} className="assetflow-primary flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Add asset</span></button>
            </div>
          </div>
        </header>

        {activeTab === 'compliance' ? <Phase3Workspace /> : activeTab === 'monitoring' ? <PortfolioMonitoringWorkspace /> : activeTab === 'tokens' ? <Phase5TokenizationWorkspace /> : activeTab === 'trading' ? <Phase6TradingWorkspace /> : activeTab === 'settlement' ? <Phase7SettlementWorkspace /> : activeTab === 'servicing' ? <Phase8ServicingWorkspace /> : <div className="mx-auto max-w-[1540px] space-y-5 p-4 md:space-y-6 md:p-8">
          {activeTab === 'overview' && <>
            <section className="assetflow-command rounded-3xl p-5 md:p-7">
              <div className="assetflow-command-grid pointer-events-none" />
              <div className="assetflow-command-orbit pointer-events-none" />
              <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-2"><span className="assetflow-eyebrow">Institutional RWA Command Center</span><span className="assetflow-status"><span className="assetflow-live-dot" /> All systems nominal</span></div>
                  <h2 className="font-display max-w-3xl text-3xl font-semibold tracking-[-.04em] text-white md:text-5xl">Sovereign infrastructure for the <span className="assetflow-gradient-text">tokenized economy.</span></h2>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">One operating layer for real-world asset issuance, programmable compliance, multi-rail settlement, and continuous asset intelligence.</p>
                  <div className="mt-6 flex flex-wrap gap-2"><span className="assetflow-chip"><Zap className="h-3 w-3 text-cyan-300" /> Atomic DvP</span><span className="assetflow-chip"><LockKeyhole className="h-3 w-3 text-purple-300" /> SGX enclave verified</span><span className="assetflow-chip"><Shield className="h-3 w-3 text-emerald-300" /> Zk-proof ready</span></div>
                </div>
                <div className="assetflow-network-card min-w-[250px] rounded-2xl p-4"><div className="flex items-center justify-between"><span className="assetflow-eyebrow">Network state</span><Activity className="h-4 w-4 text-cyan-300" /></div><p className="mt-3 font-mono text-lg text-slate-100">MAINNET PROT-V4</p><div className="mt-3 grid grid-cols-3 gap-2 text-center"><div><p className="font-mono text-sm text-cyan-300">4</p><p className="text-[8px] uppercase tracking-wider text-slate-600">Rails</p></div><div><p className="font-mono text-sm text-emerald-300">99.4%</p><p className="text-[8px] uppercase tracking-wider text-slate-600">Sentinel</p></div><div><p className="font-mono text-sm text-slate-200">840ms</p><p className="text-[8px] uppercase tracking-wider text-slate-600">DvP</p></div></div></div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="assetflow-kpi"><p>TVL</p><strong>$2.485B</strong><span>+8.4% / 90D</span></div>
              <div className="assetflow-kpi"><p>Tokenized RWAs</p><strong>1,247</strong><span>$1.82B credit</span></div>
              <div className="assetflow-kpi"><p>24h Rail Volume</p><strong>$148.93M</strong><span>FedNow · ISO · USDC</span></div>
              <div className="assetflow-kpi"><p>AI Covenant Sentinel</p><strong>99.4%</strong><span>Continuous verified</span></div>
            </div>

            <StatsCards />

            <section className="assetflow-panel overflow-hidden rounded-2xl">
              <div className="flex flex-col gap-2 border-b border-white/[.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="assetflow-eyebrow">Institutional Asset Vaults</p><h3 className="mt-1 text-base font-semibold text-slate-100">Live tokenized instruments</h3></div><button onClick={() => selectTab('assets')} className="flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200">Open vault <ArrowUpRight className="h-3.5 w-3.5" /></button></div>
              <div className="grid gap-px bg-white/[.055] md:grid-cols-2 xl:grid-cols-4">{vaults.map((vault) => <div key={vault.symbol} className="assetflow-vault bg-[#0b111a] p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-semibold text-cyan-200">{vault.symbol}</p><p className="mt-1 text-xs text-slate-500">{vault.name}</p></div><span className={`assetflow-vault-dot ${vault.tone}`} /></div><div className="mt-6 flex items-end justify-between"><div><p className="font-mono text-xl font-medium text-slate-100">{vault.metric}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-slate-600">{vault.metricLabel}</p></div><div className="text-right"><p className="text-xs text-slate-300">{vault.meta}</p><p className="mt-1 text-[9px] text-slate-600">{vault.rail}</p></div></div><div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full w-[88%] rounded-full bg-gradient-to-r from-cyan-400/50 to-cyan-200/90" /></div></div>)}</div>
            </section>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_.65fr]">
              <section className="assetflow-panel rounded-2xl p-5"><div className="flex items-center justify-between"><div><p className="assetflow-eyebrow">Tokenization Pipeline Orchestrator</p><h3 className="mt-1 text-base font-semibold text-slate-100">Asset → compliant token → liquidity</h3></div><span className="font-mono text-[10px] text-slate-600">5 STAGES</span></div><div className="mt-6 grid gap-2 md:grid-cols-5">{pipeline.map(([step, title, detail, status], index) => <div key={step} className="relative rounded-xl border border-white/[.06] bg-white/[.018] p-3.5"><div className="flex items-center justify-between"><span className="font-mono text-[9px] text-slate-600">{step}</span>{status === 'complete' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : status === 'active' ? <Activity className="h-3.5 w-3.5 animate-pulse text-cyan-300" /> : <Clock3 className="h-3.5 w-3.5 text-slate-600" />}</div><p className="mt-4 text-xs font-semibold text-slate-200">{title}</p><p className="mt-1 text-[10px] leading-4 text-slate-600">{detail}</p>{index < pipeline.length - 1 && <span className="absolute -right-2 top-1/2 z-10 hidden h-px w-2 bg-cyan-400/30 md:block" />}</div>)}</div></section>
              <section className="assetflow-panel rounded-2xl p-5"><div className="flex items-center justify-between"><div><p className="assetflow-eyebrow">Solvency & Proof</p><h3 className="mt-1 text-base font-semibold text-slate-100">Continuous attestation</h3></div><LockKeyhole className="h-4 w-4 text-cyan-300" /></div><div className="mt-5 space-y-3"><div className="flex items-center justify-between rounded-xl border border-white/[.06] bg-white/[.018] p-3"><span className="text-xs text-slate-500">Chainlink PoR heartbeat</span><span className="font-mono text-xs text-emerald-300">4.0s · LIVE</span></div><div className="flex items-center justify-between rounded-xl border border-white/[.06] bg-white/[.018] p-3"><span className="text-xs text-slate-500">Reserve coverage</span><span className="font-mono text-xs text-cyan-300">102.48%</span></div><div className="rounded-xl border border-cyan-400/10 bg-cyan-400/[.025] p-3"><p className="text-[9px] uppercase tracking-[.15em] text-slate-600">Merkle root</p><div className="mt-2 flex items-center justify-between gap-2"><code className="truncate font-mono text-[10px] text-slate-300">0x7f2a9c84…e8410b</code><button onClick={() => { navigator.clipboard?.writeText('0x7f2a9c84c9d10e8410b'); toast.success('Merkle root copied'); }} className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:bg-white/[.05] hover:text-cyan-300" aria-label="Copy Merkle root"><Copy className="h-3.5 w-3.5" /></button></div></div></div></section>
            </div>

            <section className="assetflow-panel overflow-hidden rounded-2xl"><div className="flex items-center justify-between border-b border-white/[.06] px-5 py-4"><div><p className="assetflow-eyebrow">Live Multi-Rail Settlement Stream</p><h3 className="mt-1 text-base font-semibold text-slate-100">Atomic execution telemetry</h3></div><span className="flex items-center gap-1.5 font-mono text-[9px] text-emerald-300"><span className="assetflow-live-dot" /> STREAMING</span></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full"><thead><tr className="border-b border-white/[.05]"><th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-slate-600">Time</th><th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-slate-600">Rail</th><th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-slate-600">Execution</th><th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-slate-600">Amount</th><th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-slate-600">Status</th></tr></thead><tbody>{railEvents.map(([time, rail, execution, amount, status, latency]) => <tr key={time} className="border-b border-white/[.04] hover:bg-white/[.02]"><td className="px-5 py-3.5 font-mono text-[10px] text-slate-600">{time}</td><td className="px-5 py-3.5 font-mono text-[10px] text-cyan-300/80">{rail}</td><td className="px-5 py-3.5 text-xs text-slate-400">{execution}</td><td className="px-5 py-3.5 text-right font-mono text-xs text-slate-200">{amount}</td><td className="px-5 py-3.5 text-right"><span className="mr-2 font-mono text-[9px] text-slate-600">{latency}</span><span className={`rounded-full border px-2 py-1 text-[8px] font-semibold ${status === 'QUEUED' ? 'border-amber-400/15 bg-amber-400/[.05] text-amber-300' : 'border-emerald-400/15 bg-emerald-400/[.05] text-emerald-300'}`}>{status}</span></td></tr>)}</tbody></table></div></section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="lg:col-span-2"><AssetChart /></div><div><QuickActions /></div></div>
            <ActivityFeed />
          </>}

          {activeTab === 'assets' && <section className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="assetflow-eyebrow">Institutional Asset Vaults</p><h2 className="font-display mt-1 text-3xl font-semibold tracking-tight">Asset registry</h2><p className="assetflow-muted mt-1 text-sm">Every private-credit asset in your portfolio, updated in real time.</p></div><button onClick={() => setShowCreate(true)} className="assetflow-primary flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"><Plus className="h-4 w-4" /> Add asset</button></div>{loading ? <div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" /> Loading assets…</div> : error ? <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" /><div><p className="text-sm font-medium text-red-200">Couldn’t load assets</p><p className="mt-1 text-sm text-red-300/80">{error.includes('schema cache') ? 'Supabase has the assets table, but its API schema cache is stale. Refresh the page and try again.' : error}</p></div></div> : <div className="assetflow-panel overflow-hidden rounded-2xl"><div className="overflow-x-auto"><table className="min-w-full"><thead className="bg-white/[.02]"><tr><th className="px-5 py-4 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">Asset</th><th className="px-5 py-4 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">Type</th><th className="px-5 py-4 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">Jurisdiction</th><th className="px-5 py-4 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">Value</th><th className="px-5 py-4 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-500">Status</th><th className="px-5 py-4 text-right text-[9px] font-semibold uppercase tracking-wider text-slate-500">Documents</th></tr></thead><tbody>{assets.map((asset) => <tr key={asset.id} className="border-t border-white/[.05] transition hover:bg-white/[.025]"><td className="px-5 py-4 font-medium text-white">{asset.name}</td><td className="px-5 py-4 text-sm text-slate-500">{asset.asset_type}</td><td className="px-5 py-4 text-sm text-slate-500">{asset.jurisdiction ?? '—'}</td><td className="px-5 py-4 font-mono text-sm text-slate-300">{asset.current_value != null ? `$${Number(asset.current_value).toLocaleString()}` : '—'}</td><td className="px-5 py-4"><span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">{asset.status}</span></td><td className="px-5 py-4 text-right"><button onClick={() => setDocumentsAssetId(asset.id)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[.07]"><FileUp className="h-4 w-4" /> Upload</button></td></tr>)}</tbody></table></div>{assets.length === 0 && <div className="p-10 text-center text-slate-500">No assets yet. Create your first private-credit asset.</div>}</div>}</section>}
          {activeTab !== 'overview' && activeTab !== 'assets' && <div className="assetflow-hero rounded-3xl p-8"><p className="assetflow-muted text-xs">Workspace module</p><h2 className="font-display mt-1 text-3xl font-semibold text-white">{navigation.find((item) => item.id === activeTab)?.label ?? activeTab}</h2><p className="assetflow-muted mt-2 max-w-xl">{navigation.find((item) => item.id === activeTab)?.blurb ?? "This part of AssetFlow isn't built yet."}</p></div>}
        </div>}
      </main>

      <nav className="assetflow-mobile-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-2 py-2 md:hidden">{[
        ['overview', LayoutDashboard, 'Command'], ['assets', Building, 'Assets'], ['tokens', Coins, 'Tokens'], ['settlement', Landmark, 'Treasury'], ['settings', Settings, 'Config']
      ].map(([id, Icon, label]) => <button key={id as string} onClick={() => selectTab(id as string)} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[9px] ${activeTab === id ? 'text-cyan-300' : 'text-slate-600'}`}><Icon className="h-4 w-4" /><span>{label as string}</span></button>)}</nav>

      {showCreate && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl border border-cyan-400/10 bg-[#0a0f17] p-6 shadow-2xl shadow-black/60"><div className="flex justify-between"><div><p className="assetflow-eyebrow">New vault position</p><h2 className="font-display mt-1 text-xl font-semibold">Add a private-credit asset</h2><p className="assetflow-muted text-sm">It’ll appear in your portfolio right away.</p></div><button onClick={() => setShowCreate(false)} className="h-9 w-9 rounded-xl text-slate-500 hover:bg-white/[.05] hover:text-white">✕</button></div><div className="mt-6 space-y-3"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset name" className="assetflow-search w-full rounded-xl px-4 py-3 outline-none" /><select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="assetflow-search w-full rounded-xl px-4 py-3 outline-none"><option>United States</option><option>European Union</option><option>United Kingdom</option></select><input value={value} onChange={(e) => setValue(e.target.value)} type="number" min="0" placeholder="Current value (optional)" className="assetflow-search w-full rounded-xl px-4 py-3 outline-none" /></div><button onClick={handleCreate} className="assetflow-primary mt-5 w-full rounded-xl px-4 py-3 font-semibold">Add asset</button></div></div>}
      {documentsAssetId && <AssetDocuments assetId={documentsAssetId} onClose={() => setDocumentsAssetId(null)} />}
    </div>
  );
}

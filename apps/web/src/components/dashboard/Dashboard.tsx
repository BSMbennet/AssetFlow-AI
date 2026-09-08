'use client';

import { useState } from 'react';
import { LayoutDashboard, Building, Coins, Users, Shield, BarChart3, Settings, Bell, Search, Plus, Loader2, FileUp, Sparkles, LogOut, Menu, X, AlertTriangle, ArrowLeftRight, Landmark, CircleDollarSign } from 'lucide-react';
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
  { icon: LayoutDashboard, label: 'Dashboard', id: 'overview' },
  { icon: Building, label: 'Assets', id: 'assets' },
  { icon: Coins, label: 'Tokenization', id: 'tokens', blurb: 'Issue and track tokenized shares of your credit assets on-chain.' },
  { icon: Users, label: 'Investors', id: 'investors', blurb: 'Your LPs, their commitments, and capital call history in one list.' },
  { icon: Shield, label: 'Compliance', id: 'compliance', blurb: 'KYC and AML checks, audit trails, and filing status per asset.' },
  { icon: BarChart3, label: 'Portfolio Monitoring', id: 'monitoring', blurb: 'Yield curves, portfolio performance, and risk exposure at a glance.' },
  { icon: ArrowLeftRight, label: 'Trading & Liquidity', id: 'trading', blurb: 'Controlled liquidity workflows for institution-ready assets.' },
  { icon: Landmark, label: 'Settlement', id: 'settlement', blurb: 'Stage, review and advance controlled settlement instructions.' },
  { icon: CircleDollarSign, label: 'Corporate Actions', id: 'servicing', blurb: 'Schedule interest, dividends, principal, fees and maturity servicing.' },
  { icon: Settings, label: 'Settings', id: 'settings', blurb: 'Team access, notification preferences, and account details.' },
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

  return (
    <div className="assetflow-shell flex h-screen overflow-hidden">
      {mobileNavOpen && <div onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden" />}

      <aside className={`assetflow-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(86vw,20rem)] shrink-0 flex-col border-r shadow-2xl shadow-black/60 transition-transform duration-300 ease-out md:static md:z-auto md:w-64 md:translate-x-0 md:shadow-none ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-white/10 px-5 py-5 md:px-6 md:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-cyan-400 to-amber-500 text-slate-950 shadow-lg shadow-cyan-500/20"><Sparkles className="h-5 w-5" /></div>
              <div className="min-w-0"><h1 className="assetflow-brand font-display truncate text-xl font-bold tracking-tight">AssetFlow AI</h1><p className="text-[11px] uppercase tracking-[.18em] text-slate-500">Private Credit OS</p></div>
            </div>
            <button onClick={() => setMobileNavOpen(false)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/[.05] hover:text-white md:hidden"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-slate-600">Workspace</p>
          {navigation.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }} className={`flex w-full items-center rounded-xl border-l-2 px-3 py-3 text-left text-sm transition-all ${activeTab === item.id ? 'assetflow-nav-active' : 'border-transparent text-slate-500 hover:bg-white/[.04] hover:text-white'}`}>
              <item.icon className="mr-3 h-4 w-4 shrink-0" /><span className="min-w-0 whitespace-normal">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button onClick={signOut} className="flex w-full items-center rounded-xl px-3 py-3 text-sm text-slate-500 transition hover:bg-white/[.04] hover:text-white"><LogOut className="mr-3 h-4 w-4 shrink-0" /> Sign out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <header className="assetflow-topbar sticky top-0 z-20 border-b">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button onClick={() => setMobileNavOpen(true)} className="rounded-xl p-2 text-slate-400 transition hover:bg-white/[.05] hover:text-white md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
              <div className="md:hidden"><div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-amber-500 text-slate-950"><Sparkles className="h-4 w-4" /></div></div>
              <div className="relative hidden w-full max-w-xl sm:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" /><input placeholder="Search assets, borrowers, documents..." className="assetflow-search w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10" /></div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button className="rounded-xl p-2.5 text-slate-500 transition hover:bg-white/[.05] hover:text-white" aria-label="Notifications"><Bell className="h-4 w-4" /></button>
              <button onClick={() => setShowCreate(true)} className="assetflow-primary flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:scale-[1.02]"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add asset</span></button>
            </div>
          </div>
        </header>

        {activeTab === 'compliance' ? <Phase3Workspace /> : activeTab === 'monitoring' ? <PortfolioMonitoringWorkspace /> : activeTab === 'tokens' ? <Phase5TokenizationWorkspace /> : activeTab === 'trading' ? <Phase6TradingWorkspace /> : activeTab === 'settlement' ? <Phase7SettlementWorkspace /> : activeTab === 'servicing' ? <Phase8ServicingWorkspace /> : <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-8">
          {activeTab === 'overview' && <>
            <section className="assetflow-hero rounded-3xl p-6 md:p-8">
              <div className="assetflow-radar pointer-events-none" />
              <div className="assetflow-orb pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <h2 className="font-display max-w-xl text-3xl font-semibold tracking-tight text-[#f3ead9] md:text-5xl">Everything about your portfolio, in one place.</h2>
                <p className="assetflow-muted mt-4 max-w-xl text-sm leading-6 md:text-base">Assets, documents, investors, and compliance — tracked together instead of scattered across spreadsheets and email.</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="assetflow-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"><span className="assetflow-live-dot" />Live portfolio</span>
                  <span className="assetflow-chip rounded-full px-3 py-1.5 text-xs">Synced just now</span>
                </div>
              </div>
            </section>
            <StatsCards />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><div className="lg:col-span-2"><AssetChart /></div><div><QuickActions /></div></div>
            <ActivityFeed />
          </>}

          {activeTab === 'assets' && <section className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-display text-3xl font-semibold tracking-tight">Assets</h2><p className="assetflow-muted mt-1 text-sm">Every private-credit asset in your portfolio, updated in real time.</p></div><button onClick={() => setShowCreate(true)} className="assetflow-primary flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"><Plus className="h-4 w-4" /> Add asset</button></div>{loading ? <div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" /> Loading assets…</div> : error ? <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" /><div><p className="text-sm font-medium text-red-200">Couldn't load assets</p><p className="mt-1 text-sm text-red-300/80">{error.includes('schema cache') ? 'Supabase has the assets table, but its API schema cache is stale. Refresh the page and try again.' : error}</p></div></div> : <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]"><div className="overflow-x-auto"><table className="min-w-full"><thead className="bg-white/[.025]"><tr><th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Asset</th><th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Type</th><th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Jurisdiction</th><th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Value</th><th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th><th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Documents</th></tr></thead><tbody>{assets.map((asset) => <tr key={asset.id} className="border-t border-white/[.06] transition hover:bg-white/[.025]"><td className="px-5 py-4 font-medium text-white">{asset.name}</td><td className="px-5 py-4 text-sm text-slate-500">{asset.asset_type}</td><td className="px-5 py-4 text-sm text-slate-500">{asset.jurisdiction ?? '—'}</td><td className="px-5 py-4 text-sm text-slate-300">{asset.current_value != null ? `$${Number(asset.current_value).toLocaleString()}` : '—'}</td><td className="px-5 py-4"><span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">{asset.status}</span></td><td className="px-5 py-4 text-right"><button onClick={() => setDocumentsAssetId(asset.id)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[.07]"><FileUp className="h-4 w-4" /> Upload</button></td></tr>)}</tbody></table></div>{assets.length === 0 && <div className="p-10 text-center text-slate-500">No assets yet. Create your first private-credit asset.</div>}</div>}</section>}
          {activeTab !== 'overview' && activeTab !== 'assets' && <div className="assetflow-hero rounded-3xl p-8"><p className="assetflow-muted text-xs">Coming soon</p><h2 className="font-display mt-1 text-3xl font-semibold text-[#f3ead9]">{navigation.find((item) => item.id === activeTab)?.label ?? activeTab}</h2><p className="assetflow-muted mt-2 max-w-xl">{navigation.find((item) => item.id === activeTab)?.blurb ?? "This part of AssetFlow isn't built yet."}</p></div>}
        </div>}
      </main>

      {showCreate && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0d13] p-6 shadow-2xl shadow-black/50"><div className="flex justify-between"><div><h2 className="font-display text-xl font-semibold">Add a private-credit asset</h2><p className="assetflow-muted text-sm">It'll appear in your portfolio right away.</p></div><button onClick={() => setShowCreate(false)} className="h-9 w-9 rounded-xl text-slate-500 hover:bg-white/[.05] hover:text-white">✕</button></div><div className="mt-6 space-y-3"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset name" className="assetflow-search w-full rounded-xl px-4 py-3 outline-none" /><select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="assetflow-search w-full rounded-xl px-4 py-3 outline-none"><option>United States</option><option>European Union</option><option>United Kingdom</option></select><input value={value} onChange={(e) => setValue(e.target.value)} type="number" min="0" placeholder="Current value (optional)" className="assetflow-search w-full rounded-xl px-4 py-3 outline-none" /></div><button onClick={handleCreate} className="assetflow-primary mt-5 w-full rounded-xl px-4 py-3 font-semibold">Add asset</button></div></div>}
      {documentsAssetId && <AssetDocuments assetId={documentsAssetId} onClose={() => setDocumentsAssetId(null)} />}
    </div>
  );
}

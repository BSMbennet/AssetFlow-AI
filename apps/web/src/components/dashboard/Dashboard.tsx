'use client';

import { useState } from 'react';
import { LayoutDashboard, Building, Coins, Users, Shield, BarChart3, Settings, Bell, Search, Plus, Loader2, FileUp } from 'lucide-react';
import { StatsCards } from './StatsCards';
import { ActivityFeed } from './ActivityFeed';
import { AssetChart } from './AssetChart';
import { QuickActions } from './QuickActions';
import { useAssets } from './AssetData';
import { AssetDocuments } from './AssetDocuments';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

const navigation = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'overview' },
  { icon: Building, label: 'Assets', id: 'assets' },
  { icon: Coins, label: 'Tokenization', id: 'tokens' },
  { icon: Users, label: 'Investors', id: 'investors' },
  { icon: Shield, label: 'Compliance', id: 'compliance' },
  { icon: BarChart3, label: 'Analytics', id: 'analytics' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
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
      setName(''); setValue(''); setShowCreate(false); toast.success('Asset created'); setActiveTab('assets');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create asset');
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-primary">AssetFlow AI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Private Credit Intelligence</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              <item.icon className="w-5 h-5 mr-3" />{item.label}
            </button>
          ))}
        </nav>
        <button onClick={signOut} className="m-4 text-left text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">Sign out</button>
      </aside>

      <div className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center flex-1"><div className="relative w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search assets, borrowers, documents..." className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary" /></div></div>
            <div className="flex items-center space-x-4"><button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Bell className="w-5 h-5" /></button><button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"><Plus className="w-4 h-4" /> New Asset</button></div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'overview' && <div className="space-y-6"><StatsCards /><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><AssetChart /></div><div><QuickActions /></div></div><ActivityFeed /></div>}
          {activeTab === 'assets' && <section className="space-y-5"><div className="flex items-center justify-between"><div><h2 className="text-2xl font-semibold">Assets</h2><p className="text-sm text-gray-500">Live private-credit assets from Supabase.</p></div><button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white"><Plus className="h-4 w-4" /> Add asset</button></div>{loading ? <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin" /> Loading assets…</div> : error ? <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div> : <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"><table className="min-w-full"><thead className="bg-gray-50 dark:bg-gray-900"><tr><th className="px-5 py-3 text-left text-xs font-semibold uppercase">Asset</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase">Type</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase">Jurisdiction</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase">Value</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase">Status</th><th className="px-5 py-3 text-right text-xs font-semibold uppercase">Documents</th></tr></thead><tbody>{assets.map((asset) => <tr key={asset.id} className="border-t border-gray-100 dark:border-gray-700"><td className="px-5 py-4 font-medium">{asset.name}</td><td className="px-5 py-4 text-sm text-gray-500">{asset.asset_type}</td><td className="px-5 py-4 text-sm text-gray-500">{asset.jurisdiction ?? '—'}</td><td className="px-5 py-4 text-sm">{asset.current_value != null ? `$${Number(asset.current_value).toLocaleString()}` : '—'}</td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{asset.status}</span></td><td className="px-5 py-4 text-right"><button onClick={() => setDocumentsAssetId(asset.id)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"><FileUp className="h-4 w-4" /> Upload</button></td></tr>)}</tbody></table>{assets.length === 0 && <div className="p-10 text-center text-gray-500">No assets yet. Create your first private-credit asset.</div>}</div>}</section>}
          {activeTab !== 'overview' && activeTab !== 'assets' && <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800"><h2 className="text-2xl font-semibold capitalize">{activeTab}</h2><p className="mt-2 text-gray-500">This module is planned for the next AssetFlow milestone.</p></div>}
        </div>
      </div>

      {showCreate && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-6"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"><div className="flex justify-between"><div><h2 className="text-xl font-semibold">Create private-credit asset</h2><p className="text-sm text-gray-500">Start an Asset Intelligence Profile.</p></div><button onClick={() => setShowCreate(false)} className="text-gray-500">✕</button></div><div className="mt-6 space-y-4"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asset name" className="w-full rounded-lg border px-4 py-3 dark:bg-gray-900" /><select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="w-full rounded-lg border px-4 py-3 dark:bg-gray-900"><option>United States</option><option>European Union</option><option>United Kingdom</option></select><input value={value} onChange={(e) => setValue(e.target.value)} type="number" min="0" placeholder="Current value (optional)" className="w-full rounded-lg border px-4 py-3 dark:bg-gray-900" /></div><button onClick={handleCreate} className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white">Create asset</button></div></div>}
      {documentsAssetId && <AssetDocuments assetId={documentsAssetId} onClose={() => setDocumentsAssetId(null)} />}
    </div>
  );
}

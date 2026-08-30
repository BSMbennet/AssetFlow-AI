'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { HumanApprovalPanel } from './HumanApprovalPanel';

type Asset = { id: string; name: string };
type ComplianceRecord = { asset_id: string; status: string };

export function HumanApprovalWorkspace() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: assetData, error: assetError }, { data: recordData, error: recordError }] = await Promise.all([
      supabase.from('assets').select('id,name').order('created_at', { ascending: false }),
      supabase.from('compliance_records').select('asset_id,status'),
    ]);
    if (assetError || recordError) toast.error(assetError?.message ?? recordError?.message ?? 'Could not load approval data');
    const nextAssets = (assetData as Asset[]) ?? [];
    setAssets(nextAssets);
    setRecords((recordData as ComplianceRecord[]) ?? []);
    if (!selectedAssetId && nextAssets[0]) setSelectedAssetId(nextAssets[0].id);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const blockedCount = useMemo(() => records.filter((record) => record.asset_id === selectedAssetId && record.status === 'blocked').length, [records, selectedAssetId]);
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? null;

  if (loading) return <div className="flex items-center gap-2 text-sm text-white/40"><Loader2 className="h-4 w-4 animate-spin" /> Loading human review workflow…</div>;
  if (!selectedAsset) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Milestone 3</p><h2 className="mt-1 text-xl font-semibold">Human approval & audit trail</h2></div></div>
        <select value={selectedAssetId} onChange={(event) => setSelectedAssetId(event.target.value)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none">
          {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
        </select>
      </div>
      <HumanApprovalPanel assetId={selectedAsset.id} blockedCount={blockedCount} onChanged={load} />
    </section>
  );
}

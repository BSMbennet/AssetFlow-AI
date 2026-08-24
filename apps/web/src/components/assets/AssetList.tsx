'use client';

import { useAssets } from '@/components/dashboard/AssetData';

export function AssetList() {
  const { assets, loading, error } = useAssets();
  if (loading) return <div className="rounded-xl border p-6 text-gray-500">Loading assets…</div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  if (!assets.length) return <div className="rounded-xl border p-10 text-center text-gray-500">No assets yet. Create your first private-credit asset from the dashboard.</div>;
  return <div className="overflow-hidden rounded-xl border bg-white"><table className="min-w-full"><thead className="bg-gray-50"><tr><th className="px-5 py-3 text-left text-xs uppercase">Asset</th><th className="px-5 py-3 text-left text-xs uppercase">Type</th><th className="px-5 py-3 text-left text-xs uppercase">Jurisdiction</th><th className="px-5 py-3 text-right text-xs uppercase">Value</th></tr></thead><tbody>{assets.map((asset) => <tr key={asset.id} className="border-t"><td className="px-5 py-4 font-medium">{asset.name}</td><td className="px-5 py-4 text-sm text-gray-500">{asset.asset_type}</td><td className="px-5 py-4 text-sm text-gray-500">{asset.jurisdiction ?? '—'}</td><td className="px-5 py-4 text-right">{asset.current_value != null ? `$${Number(asset.current_value).toLocaleString()}` : '—'}</td></tr>)}</tbody></table></div>;
}

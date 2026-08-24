'use client';

export function InvestorList() {
  return <div className="rounded-xl border bg-white p-8"><h3 className="text-lg font-semibold">Investor workspace</h3><p className="mt-2 text-sm text-gray-500">Investor onboarding, allocation and reporting will appear here.</p><div className="mt-6 grid gap-4 md:grid-cols-3">{[['Investors','0'],['Committed capital','$0'],['Active allocations','0']].map(([label,value]) => <div key={label} className="rounded-lg border p-4"><p className="text-sm text-gray-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</div></div>;
}

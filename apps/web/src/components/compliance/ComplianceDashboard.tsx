'use client';

export function ComplianceDashboard() {
  const checks = [
    ['KYC / KYB', 'Ready for review'],
    ['Document completeness', 'Needs review'],
    ['Jurisdiction', 'Configured'],
    ['Risk disclosures', 'Pending'],
  ];
  return <div className="grid gap-4 md:grid-cols-2">{checks.map(([name, status]) => <div key={name} className="rounded-xl border bg-white p-5"><div className="flex items-center justify-between"><h3 className="font-semibold">{name}</h3><span className="rounded-full bg-gray-100 px-3 py-1 text-xs">{status}</span></div><p className="mt-2 text-sm text-gray-500">Compliance workflow status for AssetFlow review.</p></div>)}</div>;
}

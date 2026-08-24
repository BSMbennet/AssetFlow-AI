'use client';

export function SettingsDashboard() {
  return <div className="space-y-4"><div className="rounded-xl border bg-white p-6"><h3 className="font-semibold">Workspace settings</h3><p className="mt-2 text-sm text-gray-500">Configure organization, jurisdiction and workflow preferences.</p></div><div className="rounded-xl border bg-white p-6"><h3 className="font-semibold">Security</h3><p className="mt-2 text-sm text-gray-500">Authentication and access controls are managed through Supabase.</p></div></div>;
}

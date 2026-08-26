import SettingsDashboard from '@/components/settings/SettingsDashboard';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <Suspense fallback={<LoadingSpinner />}>
        <SettingsDashboard />
      </Suspense>
    </div>
  );
}

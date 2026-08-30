import ComplianceDashboard from '@/components/compliance/ComplianceDashboard';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CompliancePage() {
  return (
    <main className="min-h-screen bg-[#07070b]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <Suspense fallback={<LoadingSpinner />}>
          <ComplianceDashboard />
        </Suspense>
      </div>
    </main>
  );
}

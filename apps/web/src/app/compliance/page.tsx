import ComplianceDashboard from '@/components/compliance/ComplianceDashboard';
import { AuthGate } from '@/components/auth/AuthGate';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CompliancePage() {
  return (
    <main className="min-h-screen bg-[#07070b]">
      <Suspense fallback={<LoadingSpinner />}>
        <AuthGate>
          <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
            <ComplianceDashboard />
          </div>
        </AuthGate>
      </Suspense>
    </main>
  );
}

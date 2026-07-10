import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CompliancePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Compliance</h1>
      <Suspense fallback={<LoadingSpinner />}>
        <ComplianceDashboard />
      </Suspense>
    </div>
  );
}

import { Phase3Workspace } from '@/components/compliance/Phase3Workspace';
import { AuthGate } from '@/components/auth/AuthGate';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CompliancePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthGate>
        <Phase3Workspace />
      </AuthGate>
    </Suspense>
  );
}

import { TradingDashboard } from '@/components/trading/TradingDashboard';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function TradingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Trading</h1>
      <Suspense fallback={<LoadingSpinner />}>
        <TradingDashboard />
      </Suspense>
    </div>
  );
}

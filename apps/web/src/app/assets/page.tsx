import AssetList from '@/components/assets/AssetList';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AssetsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Assets</h1>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
          + New Asset
        </button>
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <AssetList />
      </Suspense>
    </div>
  );
}

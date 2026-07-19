import { Loader2 } from 'lucide-react';

export function Loading({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="mt-3 text-sm text-gray-500">{label}</p>
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
        <p className="mt-4 text-sm font-medium text-gray-600">Memuat aplikasi...</p>
      </div>
    </div>
  );
}

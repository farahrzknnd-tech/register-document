import { AlertCircle, LogOut, RefreshCw } from 'lucide-react';

interface AppErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  onLogout?: () => void;
  retrying?: boolean;
}

export function AppErrorState({
  title,
  message,
  onRetry,
  onLogout,
  retrying = false,
}: AppErrorStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-red-100 p-3 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-red-700">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {onLogout && (
            <button type="button" className="btn-secondary" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
          {onRetry && (
            <button type="button" className="btn-primary" onClick={onRetry} disabled={retrying}>
              <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Mencoba ulang...' : 'Coba Lagi'}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

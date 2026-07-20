import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  FileImage,
  Mail,
  Database,
  BarChart3,
  Menu,
  X,
  Building2,
  FileSignature,
  FileCheck,
  ReceiptText,
  Shield,
  Eye,
} from 'lucide-react';
import type { UserRole } from '../lib/types';
import { ROLE_LABELS } from '../lib/types';
import { Footer } from './Footer';

export type PageId = 'dashboard' | 'gambar' | 'surat' | 'beritaAcara' | 'suratPenunjukan' | 'billing' | 'master' | 'laporan';

interface LayoutProps {
  current: PageId;
  onNavigate: (p: PageId) => void;
  role: UserRole;
  email: string | null;
  onLogout: () => void;
  children: ReactNode;
}

const allMenuItems: { id: PageId; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gambar', label: 'Register Gambar', icon: FileImage },
  { id: 'surat', label: 'Register Surat', icon: Mail },
  { id: 'beritaAcara', label: 'Register Berita Acara', icon: FileCheck },
  { id: 'suratPenunjukan', label: 'Register Surat Penunjukan', icon: FileSignature },
  { id: 'billing', label: 'Monitoring Tagihan', icon: ReceiptText },
  { id: 'master', label: 'Master Data', icon: Database, adminOnly: true },
  { id: 'laporan', label: 'Laporan', icon: BarChart3 },
];

export function Layout({ current, onNavigate, role, email, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = allMenuItems.filter((m) => !(m.adminOnly && role !== 'admin'));

  const handleNav = (p: PageId) => {
    onNavigate(p);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-gray-900">Register Dokumen</h1>
            <p className="truncate text-xs text-gray-500">Proyek Admin</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = current === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-brand-600' : 'text-gray-400'}`} />
                {item.label}
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" />}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {role === 'admin' ? 'A' : 'V'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{email ?? 'Pengguna'}</p>
              <p className="truncate text-xs text-gray-500">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <button onClick={onLogout} className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">Logout</button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md lg:hidden no-print">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-gray-900">Register Dokumen</span>
          </div>
        </header>

        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-8 backdrop-blur-md lg:flex no-print">
          <h2 className="text-base font-bold text-gray-900">
            {menuItems.find((m) => m.id === current)?.label}
          </h2>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              role === 'admin' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {role === 'admin' ? <Shield className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {ROLE_LABELS[role]}
            </span>
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Data tersinkron online
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        <Footer />
      </div>

      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed right-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg lg:hidden"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      )}
    </div>
  );
}

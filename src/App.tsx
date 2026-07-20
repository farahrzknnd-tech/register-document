import { useCallback, useEffect, useState } from 'react';
import { Layout, type PageId } from './components/Layout';
import { getInitialPage, pageToHash } from './lib/pageNavigation';
import { ToastProvider } from './components/Toast';
import { FullPageLoading } from './components/Loading';
import { Dashboard } from './pages/Dashboard';
import { RegisterGambar } from './pages/RegisterGambar';
import { RegisterSurat } from './pages/RegisterSurat';
import { RegisterBeritaAcara } from './pages/RegisterBeritaAcara';
import { RegisterSuratPenunjukan } from './pages/RegisterSuratPenunjukan';
import { MasterData } from './pages/MasterData';
import { Laporan } from './pages/Laporan';
import {
  fetchGambar, fetchSurat, fetchBeritaAcara, fetchSuratPenunjukan, fetchProjects, fetchClusters,
} from './lib/api';
import type { Gambar, Surat, BeritaAcara, SuratPenunjukan, Project, Cluster, DocType } from './lib/types';
import { useAuth } from './lib/auth';
import { Login } from './pages/Login';
import { BillingMonitoring } from './features/billing/pages/BillingMonitoring';
import { BillingDashboard } from './features/billing/pages/BillingDashboard';

type PendingDetail =
  | { type: 'gambar'; doc: Gambar }
  | { type: 'surat'; doc: Surat }
  | { type: 'berita_acara'; doc: BeritaAcara }
  | { type: 'surat_penunjukan'; doc: SuratPenunjukan }
  | null;

type PendingBillingAction =
  | { type: 'create'; suratPenunjukan: SuratPenunjukan }
  | { type: 'detail'; billingId: string }
  | null;

function App() {
  const [page, setPage] = useState<PageId>(() => getInitialPage());
  const [loading, setLoading] = useState(true);
  const [gambar, setGambar] = useState<Gambar[]>([]);
  const [surat, setSurat] = useState<Surat[]>([]);
  const [beritaAcara, setBeritaAcara] = useState<BeritaAcara[]>([]);
  const [suratPenunjukan, setSuratPenunjukan] = useState<SuratPenunjukan[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [pendingDetail, setPendingDetail] = useState<PendingDetail>(null);
  const [pendingBillingAction, setPendingBillingAction] = useState<PendingBillingAction>(null);
  const { user, role, loading: authLoading, error: authError, signOut } = useAuth();

  const navigateToPage = useCallback((targetPage: PageId, replace = false) => {
    setPage(targetPage);
    if (typeof window === 'undefined') return;

    const targetHash = pageToHash(targetPage);
    if (window.location.hash === targetHash) return;

    if (replace) {
      window.history.replaceState(null, '', targetHash);
    } else {
      window.history.pushState(null, '', targetHash);
    }
  }, []);

  useEffect(() => {
    const syncPageFromUrl = () => setPage(getInitialPage());

    window.addEventListener('popstate', syncPageFromUrl);
    window.addEventListener('hashchange', syncPageFromUrl);

    if (!window.location.hash) {
      navigateToPage('dashboard', true);
    }

    return () => {
      window.removeEventListener('popstate', syncPageFromUrl);
      window.removeEventListener('hashchange', syncPageFromUrl);
    };
  }, [navigateToPage]);

  const loadAll = useCallback(async () => {
    const [g, s, ba, sp, p, c] = await Promise.all([
      fetchGambar(), fetchSurat(), fetchBeritaAcara(), fetchSuratPenunjukan(), fetchProjects(), fetchClusters(),
    ]);
    setGambar(g); setSurat(s); setBeritaAcara(ba); setSuratPenunjukan(sp); setProjects(p); setClusters(c);
  }, []);

  useEffect(() => {
    if (!user || !role) { setLoading(false); return; }
    loadAll()
      .catch((err) => console.error('Failed to load data:', err))
      .finally(() => setLoading(false));
  }, [loadAll, role, user]);

  const handleRefresh = useCallback(() => {
    loadAll().catch((err) => console.error('Failed to refresh:', err));
  }, [loadAll]);

  const handleOpenDoc = useCallback((type: DocType, id: string) => {
    if (type === 'gambar') {
      const doc = gambar.find((g) => g.id === id);
      if (doc) { setPendingDetail({ type: 'gambar', doc }); navigateToPage('gambar'); }
    } else if (type === 'surat') {
      const doc = surat.find((s) => s.id === id);
      if (doc) { setPendingDetail({ type: 'surat', doc }); navigateToPage('surat'); }
    } else if (type === 'berita_acara') {
      const doc = beritaAcara.find((b) => b.id === id);
      if (doc) { setPendingDetail({ type: 'berita_acara', doc }); navigateToPage('beritaAcara'); }
    } else {
      const doc = suratPenunjukan.find((sp) => sp.id === id);
      if (doc) { setPendingDetail({ type: 'surat_penunjukan', doc }); navigateToPage('suratPenunjukan'); }
    }
  }, [gambar, surat, beritaAcara, suratPenunjukan, navigateToPage]);

  const consumeDetail = useCallback(() => setPendingDetail(null), []);

  const handleCreateBillingFromSuratPenunjukan = useCallback((doc: SuratPenunjukan) => {
    setPendingBillingAction({ type: 'create', suratPenunjukan: doc });
    navigateToPage('billing');
  }, [navigateToPage]);

  const handleOpenBilling = useCallback((billingId: string) => {
    setPendingBillingAction({ type: 'detail', billingId });
    navigateToPage('billing');
  }, [navigateToPage]);

  const consumeBillingAction = useCallback(() => setPendingBillingAction(null), []);

  const handleOpenSuratPenunjukan = useCallback((id: string) => {
    handleOpenDoc('surat_penunjukan', id);
  }, [handleOpenDoc]);

  const openAddModal = (targetPage: PageId) => {
    if (role !== 'admin') return;
    navigateToPage(targetPage);
    setPendingDetail(null);
  };

  if (authLoading || loading) return <FullPageLoading />;
  if (!user) return <ToastProvider><Login /></ToastProvider>;
  if (authError || !role) return <ToastProvider><div className="p-6 text-red-700">{authError ?? 'Profil pengguna tidak ditemukan.'}</div></ToastProvider>;

  return (
    <ToastProvider>
      <Layout current={page} onNavigate={navigateToPage} role={role} email={user.email ?? null} onLogout={() => { void signOut(); }}>
        {page === 'dashboard' && (
          <Dashboard
            gambar={gambar}
            surat={surat}
            beritaAcara={beritaAcara}
            suratPenunjukan={suratPenunjukan}
            clusters={clusters}
            loading={false}
            role={role}
            onOpenDoc={handleOpenDoc}
            onQuickAdd={openAddModal}
          />
        )}
        {page === 'gambar' && (
          <RegisterGambar
            gambar={gambar}
            surat={surat}
            suratPenunjukan={suratPenunjukan}
            beritaAcara={beritaAcara}
            clusters={clusters}
            projects={projects}
            loading={false}
            role={role}
            onRefresh={handleRefresh}
            onOpenDoc={handleOpenDoc}
            initialDetailItem={pendingDetail?.type === 'gambar' ? pendingDetail.doc : null}
            onConsumeInitialDetail={consumeDetail}
          />
        )}
        {page === 'surat' && (
          <RegisterSurat
            surat={surat}
            gambar={gambar}
            suratPenunjukan={suratPenunjukan}
            beritaAcara={beritaAcara}
            clusters={clusters}
            projects={projects}
            loading={false}
            role={role}
            onRefresh={handleRefresh}
            onOpenDoc={handleOpenDoc}
            initialDetailItem={pendingDetail?.type === 'surat' ? pendingDetail.doc : null}
            onConsumeInitialDetail={consumeDetail}
          />
        )}
        {page === 'beritaAcara' && (
          <RegisterBeritaAcara
            beritaAcara={beritaAcara}
            gambar={gambar}
            surat={surat}
            suratPenunjukan={suratPenunjukan}
            projects={projects}
            clusters={clusters}
            loading={false}
            role={role}
            onRefresh={handleRefresh}
            onOpenDoc={handleOpenDoc}
            initialDetailItem={pendingDetail?.type === 'berita_acara' ? pendingDetail.doc : null}
            onConsumeInitialDetail={consumeDetail}
          />
        )}
        {page === 'suratPenunjukan' && (
          <RegisterSuratPenunjukan
            suratPenunjukan={suratPenunjukan}
            gambar={gambar}
            surat={surat}
            beritaAcara={beritaAcara}
            projects={projects}
            clusters={clusters}
            loading={false}
            role={role}
            onRefresh={handleRefresh}
            onOpenDoc={handleOpenDoc}
            initialDetailItem={pendingDetail?.type === 'surat_penunjukan' ? pendingDetail.doc : null}
            onConsumeInitialDetail={consumeDetail}
            onCreateBilling={handleCreateBillingFromSuratPenunjukan}
            onOpenBilling={handleOpenBilling}
          />
        )}
        {page === 'billingDashboard' && (
          <BillingDashboard
            projects={projects}
            clusters={clusters}
            onOpenBilling={handleOpenBilling}
            onOpenMonitoring={() => navigateToPage('billing')}
          />
        )}
        {page === 'billing' && (
          <BillingMonitoring
            projects={projects}
            clusters={clusters}
            role={role}
            initialCreateFrom={pendingBillingAction?.type === 'create' ? pendingBillingAction.suratPenunjukan : null}
            initialDetailBillingId={pendingBillingAction?.type === 'detail' ? pendingBillingAction.billingId : null}
            onConsumeInitialAction={consumeBillingAction}
            onOpenSuratPenunjukan={handleOpenSuratPenunjukan}
          />
        )}
        {page === 'master' && role === 'admin' && (
          <MasterData
            projects={projects}
            clusters={clusters}
            loading={false}
            onRefresh={handleRefresh}
          />
        )}
        {page === 'laporan' && (
          <Laporan
            gambar={gambar}
            surat={surat}
            clusters={clusters}
            loading={false}
          />
        )}
      </Layout>
    </ToastProvider>
  );
}

export default App;

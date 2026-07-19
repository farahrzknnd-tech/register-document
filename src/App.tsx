import { useCallback, useEffect, useState } from 'react';
import { Layout, type PageId } from './components/Layout';
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
import type { Gambar, Surat, BeritaAcara, SuratPenunjukan, Project, Cluster, DocType, UserRole } from './lib/types';

type PendingDetail =
  | { type: 'gambar'; doc: Gambar }
  | { type: 'surat'; doc: Surat }
  | { type: 'berita_acara'; doc: BeritaAcara }
  | { type: 'surat_penunjukan'; doc: SuratPenunjukan }
  | null;

function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [loading, setLoading] = useState(true);
  const [gambar, setGambar] = useState<Gambar[]>([]);
  const [surat, setSurat] = useState<Surat[]>([]);
  const [beritaAcara, setBeritaAcara] = useState<BeritaAcara[]>([]);
  const [suratPenunjukan, setSuratPenunjukan] = useState<SuratPenunjukan[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [pendingDetail, setPendingDetail] = useState<PendingDetail>(null);
  const [role, setRole] = useState<UserRole>('admin');

  const loadAll = useCallback(async () => {
    const [g, s, ba, sp, p, c] = await Promise.all([
      fetchGambar(), fetchSurat(), fetchBeritaAcara(), fetchSuratPenunjukan(), fetchProjects(), fetchClusters(),
    ]);
    setGambar(g); setSurat(s); setBeritaAcara(ba); setSuratPenunjukan(sp); setProjects(p); setClusters(c);
  }, []);

  useEffect(() => {
    loadAll()
      .catch((err) => console.error('Failed to load data:', err))
      .finally(() => setLoading(false));
  }, [loadAll]);

  const handleRefresh = useCallback(() => {
    loadAll().catch((err) => console.error('Failed to refresh:', err));
  }, [loadAll]);

  const handleOpenDoc = useCallback((type: DocType, id: string) => {
    if (type === 'gambar') {
      const doc = gambar.find((g) => g.id === id);
      if (doc) { setPendingDetail({ type: 'gambar', doc }); setPage('gambar'); }
    } else if (type === 'surat') {
      const doc = surat.find((s) => s.id === id);
      if (doc) { setPendingDetail({ type: 'surat', doc }); setPage('surat'); }
    } else if (type === 'berita_acara') {
      const doc = beritaAcara.find((b) => b.id === id);
      if (doc) { setPendingDetail({ type: 'berita_acara', doc }); setPage('beritaAcara'); }
    } else {
      const doc = suratPenunjukan.find((sp) => sp.id === id);
      if (doc) { setPendingDetail({ type: 'surat_penunjukan', doc }); setPage('suratPenunjukan'); }
    }
  }, [gambar, surat, beritaAcara, suratPenunjukan]);

  const consumeDetail = useCallback(() => setPendingDetail(null), []);

  const openAddModal = (targetPage: PageId) => {
    if (role !== 'admin') return;
    setPage(targetPage);
    setPendingDetail(null);
  };

  if (loading) return <FullPageLoading />;

  return (
    <ToastProvider>
      <Layout current={page} onNavigate={setPage} role={role} onRoleChange={setRole}>
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
            loading={false}
            role={role}
            onRefresh={handleRefresh}
            onOpenDoc={handleOpenDoc}
            initialDetailItem={pendingDetail?.type === 'surat_penunjukan' ? pendingDetail.doc : null}
            onConsumeInitialDetail={consumeDetail}
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

import { useMemo, useState } from 'react';
import {
  FileImage, Mail, FileCheck, FileSignature, Layers, Search, X, Calendar,
  FolderOpen, Folder, ChevronRight, ChevronDown, Plus, Clock, ArrowRight,
  FileText, ChevronLeft, ArrowUpDown, Download, Printer, Eye, ExternalLink,
} from 'lucide-react';
import type { Gambar, Surat, BeritaAcara, SuratPenunjukan, Cluster, DocType, DocumentSummary, UserRole } from '../lib/types';
import {
  JENIS_SURAT_LIST, JENIS_BERITA_ACARA_LIST,
  DOC_TYPE_LABELS,
} from '../lib/types';
import { FilterBar, type FilterOption, Badge } from '../components/FilterBar';
import { Loading } from '../components/Loading';
import { formatDate, toDocSummary } from '../lib/utils';
import { exportToCsv, printDocuments, type ExportRow } from '../lib/export';
import {
  getSuratPenunjukanAgendaSubtitle,
  getSuratPenunjukanAgendaTitle,
  getSuratPenunjukanDashboardTitle,
  matchesDashboardExplorerSelection,
  type DashboardExplorerSelection,
} from './dashboardUtils';

interface DashboardProps {
  gambar: Gambar[];
  surat: Surat[];
  beritaAcara: BeritaAcara[];
  suratPenunjukan: SuratPenunjukan[];
  clusters: Cluster[];
  loading: boolean;
  role: UserRole;
  onOpenDoc: (type: DocType, id: string) => void;
  onQuickAdd: (page: 'gambar' | 'surat' | 'beritaAcara' | 'suratPenunjukan') => void;
}

type SortField = 'register' | 'title' | 'cluster' | 'type' | 'date' | 'status';
type SortDir = 'asc' | 'desc';

interface FlatDoc {
  summary: DocumentSummary;
  clusterName: string;
  status: string;
  link: string | null;
  createdAt: string;
}

// Explorer selection: { kind, clusterName?, type?, subtype? }
type ExplorerSel = DashboardExplorerSelection;

const docTypeIcons: Record<DocType, typeof FileImage> = {
  gambar: FileImage,
  surat: Mail,
  surat_penunjukan: FileSignature,
  berita_acara: FileCheck,
};

const docTypeColors: Record<DocType, string> = {
  gambar: 'blue',
  surat: 'cyan',
  surat_penunjukan: 'amber',
  berita_acara: 'purple',
};

const cardColors: Record<string, string> = {
  blue: 'bg-brand-50 text-brand-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
};

export function Dashboard({
  gambar, surat, beritaAcara, suratPenunjukan, clusters, loading, role, onOpenDoc, onQuickAdd,
}: DashboardProps) {
  const [quickSearch, setQuickSearch] = useState('');
  const [explorerExpanded, setExplorerExpanded] = useState<Set<string>>(new Set(['cluster-0']));
  const [explorerSel, setExplorerSel] = useState<ExplorerSel | null>(null);
  const [previewDoc, setPreviewDoc] = useState<FlatDoc | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [filterCluster, setFilterCluster] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const allDocs: FlatDoc[] = useMemo(() => {
    const flat: FlatDoc[] = [];
    gambar.forEach((g) => flat.push({
      summary: toDocSummary('gambar', g),
      clusterName: g.cluster?.name || 'Tanpa Cluster',
      status: g.status_gambar === 'Aktif (Latest)' ? 'Aktif' : 'Digantikan',
      link: g.link_drive,
      createdAt: g.created_at,
    }));
    surat.forEach((s) => flat.push({
      summary: toDocSummary('surat', s),
      clusterName: s.cluster?.name || 'Tanpa Cluster',
      status: s.jenis_surat,
      link: s.link_drive,
      createdAt: s.created_at,
    }));
    beritaAcara.forEach((b) => flat.push({
      summary: toDocSummary('berita_acara', b),
      clusterName: b.cluster?.name || 'Tanpa Cluster',
      status: b.jenis_berita_acara,
      link: b.link_drive,
      createdAt: b.created_at,
    }));
    suratPenunjukan.forEach((sp) => {
      const summary = toDocSummary('surat_penunjukan', sp);
      flat.push({
        summary: { ...summary, title: getSuratPenunjukanDashboardTitle(sp) },
        clusterName: sp.cluster?.name || 'Tanpa Cluster',
        status: 'SP',
        link: sp.link_risalah,
        createdAt: sp.created_at,
      });
    });
    return flat;
  }, [gambar, surat, beritaAcara, suratPenunjukan]);

  const years = useMemo(() => {
    const ys = new Set<number>();
    allDocs.forEach((d) => ys.add(new Date(d.summary.date).getFullYear()));
    return Array.from(ys).sort((a, b) => b - a);
  }, [allDocs]);

  const jenisOptions: FilterOption[] = useMemo(() => {
    const set = new Set<string>();
    allDocs.forEach((d) => set.add(d.summary.subtitle));
    return Array.from(set).sort().map((j) => ({ value: j, label: j }));
  }, [allDocs]);

  const clusterOptions: FilterOption[] = clusters.map((c) => ({ value: c.id, label: c.name }));
  const yearOptions: FilterOption[] = years.map((y) => ({ value: String(y), label: String(y) }));

  const quickResults = useMemo(() => {
    const q = quickSearch.toLowerCase().trim();
    if (!q) return [];
    return allDocs.filter((d) => {
      const hay = [
        d.summary.register_no || '', d.summary.title, d.summary.subtitle,
        d.clusterName, DOC_TYPE_LABELS[d.summary.type],
      ].join(' ').toLowerCase();
      return hay.includes(q);
    }).slice(0, 20);
  }, [allDocs, quickSearch]);

  const tableDocs = useMemo(() => {
    let docs = [...allDocs];

    // Explorer selection filter — always respects the selected cluster hierarchy.
    if (explorerSel) {
      docs = docs.filter((document) =>
        matchesDashboardExplorerSelection(document, explorerSel),
      );
    }

    const q = tableSearch.toLowerCase().trim();
    if (q) {
      docs = docs.filter((d) => {
        const hay = [
          d.summary.register_no || '', d.summary.title, d.summary.subtitle,
          d.clusterName, DOC_TYPE_LABELS[d.summary.type],
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    if (filterCluster) {
      const cn = clusters.find((c) => c.id === filterCluster)?.name;
      docs = docs.filter((d) => d.clusterName === cn);
    }
    if (filterTahun) {
      docs = docs.filter((d) => new Date(d.summary.date).getFullYear() === Number(filterTahun));
    }
    if (filterJenis) {
      docs = docs.filter((d) => d.summary.subtitle === filterJenis);
    }

    docs.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'register': cmp = (a.summary.register_no || '').localeCompare(b.summary.register_no || ''); break;
        case 'title': cmp = a.summary.title.localeCompare(b.summary.title); break;
        case 'cluster': cmp = a.clusterName.localeCompare(b.clusterName); break;
        case 'type': cmp = a.summary.type.localeCompare(b.summary.type); break;
        case 'date': cmp = new Date(a.summary.date).getTime() - new Date(b.summary.date).getTime(); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return docs;
  }, [allDocs, explorerSel, tableSearch, filterCluster, filterTahun, filterJenis, sortField, sortDir, clusters]);

  const totalPages = Math.ceil(tableDocs.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const pagedDocs = tableDocs.slice((safePage - 1) * pageSize, safePage * pageSize);

  const totalAsBuilt = gambar.filter((g) => g.jenis_gambar === 'As Built Drawing').length;
  const cards = [
    { label: 'Total Gambar', value: gambar.length, icon: FileImage, color: 'blue' },
    { label: 'Total Surat', value: surat.length, icon: Mail, color: 'cyan' },
    { label: 'Total Berita Acara', value: beritaAcara.length, icon: FileCheck, color: 'purple' },
    { label: 'Total Surat Penunjukan', value: suratPenunjukan.length, icon: FileSignature, color: 'amber' },
    { label: 'Total As Built Drawing', value: totalAsBuilt, icon: Layers, color: 'green' },
  ];

  const agendaItems = useMemo(() => {
    const items: { date: string; title: string; type: DocType; id: string; kind: string }[] = [];
    beritaAcara.forEach((b) => {
      const kind = b.jenis_berita_acara === 'Berita Acara Aanwijzing' ? 'Meeting Aanwijzing' : 'Meeting Klarifikasi';
      items.push({ date: b.tanggal, title: b.perihal, type: 'berita_acara', id: b.id, kind });
    });
    suratPenunjukan.forEach((sp) => {
      if (sp.tanggal_kickoff) {
        items.push({
          date: sp.tanggal_kickoff,
          title: getSuratPenunjukanAgendaSubtitle(sp),
          type: 'surat_penunjukan',
          id: sp.id,
          kind: getSuratPenunjukanAgendaTitle(sp),
        });
      }
    });
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [beritaAcara, suratPenunjukan]);

  const recentActivity = useMemo(() => {
    return [...allDocs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [allDocs]);

  const explorerTree = useMemo(() => {
    const clusterNames = Array.from(new Set([
      ...clusters.map((c) => c.name),
      ...allDocs.map((d) => d.clusterName),
    ]));
    return clusterNames.map((cn) => {
      const clusterDocs = allDocs.filter((d) => d.clusterName === cn);
      const byType: Record<DocType, FlatDoc[]> = {
        gambar: clusterDocs.filter((d) => d.summary.type === 'gambar'),
        surat: clusterDocs.filter((d) => d.summary.type === 'surat'),
        berita_acara: clusterDocs.filter((d) => d.summary.type === 'berita_acara'),
        surat_penunjukan: clusterDocs.filter((d) => d.summary.type === 'surat_penunjukan'),
      };
      return { name: cn, byType, total: clusterDocs.length };
    });
  }, [clusters, allDocs]);

  const toggleExpand = (key: string) => {
    setExplorerExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectExplorer = (sel: ExplorerSel) => {
    setExplorerSel(sel);
    setCurrentPage(1);
    setTableSearch('');
  };

  const handleRowClick = (d: FlatDoc) => {
    setPreviewDoc(d);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const clearTableFilters = () => {
    setFilterCluster(''); setFilterTahun(''); setFilterJenis('');
    setExplorerSel(null);
    setTableSearch('');
    setCurrentPage(1);
  };

  const activeFiltersText = useMemo(() => {
    const parts: string[] = [];
    if (explorerSel?.kind === 'cluster') parts.push(`Cluster: ${explorerSel.clusterName}`);
    if (explorerSel?.kind === 'type') {
      if (explorerSel.clusterName) parts.push(`Cluster: ${explorerSel.clusterName}`);
      parts.push(`Jenis: ${DOC_TYPE_LABELS[explorerSel.type!]}`);
    }
    if (explorerSel?.kind === 'subtype') {
      if (explorerSel.clusterName) parts.push(`Cluster: ${explorerSel.clusterName}`);
      parts.push(`Sub: ${explorerSel.subtype}`);
    }
    if (filterCluster) parts.push(`Cluster: ${clusters.find((c) => c.id === filterCluster)?.name}`);
    if (filterTahun) parts.push(`Tahun: ${filterTahun}`);
    if (filterJenis) parts.push(`Jenis: ${filterJenis}`);
    if (tableSearch) parts.push(`Search: "${tableSearch}"`);
    return parts;
  }, [explorerSel, filterCluster, filterTahun, filterJenis, tableSearch, clusters]);

  const handleExportCsv = () => {
    const rows: ExportRow[] = tableDocs.map((d) => ({
      register_no: d.summary.register_no,
      title: d.summary.title,
      clusterName: d.clusterName,
      type: d.summary.type,
      subtitle: d.summary.subtitle,
      date: d.summary.date,
      status: d.status,
      link: d.link,
    }));
    exportToCsv(rows, { title: 'Daftar Dokumen - Project Document Register', filters: activeFiltersText });
  };

  const handlePrint = () => {
    const rows: ExportRow[] = tableDocs.map((d) => ({
      register_no: d.summary.register_no,
      title: d.summary.title,
      clusterName: d.clusterName,
      type: d.summary.type,
      subtitle: d.summary.subtitle,
      date: d.summary.date,
      status: d.status,
      link: d.link,
    }));
    printDocuments(rows, { title: 'Daftar Dokumen - Project Document Register', filters: activeFiltersText });
  };

  if (loading) return <Loading label="Memuat dashboard..." />;

  const quickAddButtons = [
    { label: 'Tambah Gambar', icon: FileImage, page: 'gambar' as const, color: 'blue' },
    { label: 'Tambah Surat', icon: Mail, page: 'surat' as const, color: 'cyan' },
    { label: 'Tambah Berita Acara', icon: FileCheck, page: 'beritaAcara' as const, color: 'purple' },
    { label: 'Tambah Surat Penunjukan', icon: FileSignature, page: 'suratPenunjukan' as const, color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Search */}
      <div className="card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
          <Search className="h-4 w-4 text-brand-500" />
          Pencarian Cepat
        </h3>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Cari berdasarkan Register, Judul, Perihal, Cluster, Kontraktor, Jenis Dokumen..."
            className="input pl-10 pr-10"
          />
          {quickSearch && (
            <button onClick={() => setQuickSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {quickSearch && quickResults.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2.5">Register</th>
                  <th className="px-4 py-2.5">Jenis</th>
                  <th className="px-4 py-2.5">Judul / Perihal</th>
                  <th className="px-4 py-2.5">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quickResults.map((d) => {
                  const Icon = docTypeIcons[d.summary.type];
                  return (
                    <tr key={`${d.summary.type}-${d.summary.id}`} className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                      onClick={() => onOpenDoc(d.summary.type, d.summary.id)}>
                      <td className="px-4 py-2.5"><span className="font-mono text-xs font-semibold text-brand-600">{d.summary.register_no || '-'}</span></td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          <Icon className="h-3.5 w-3.5" />
                          {DOC_TYPE_LABELS[d.summary.type]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900 hover:text-brand-600">{d.summary.title}</td>
                      <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(d.summary.date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ringkasan Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card p-4 hover:shadow-card-hover transition-shadow">
              <div className={`mb-3 inline-flex rounded-lg p-2.5 ${cardColors[c.color]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">{c.label}</p>
            </div>
          );
        })}
      </div>

      {/* Akses Cepat — admin only */}
      {role === 'admin' && (
        <div className="card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
            <Plus className="h-4 w-4 text-brand-500" />
            Akses Cepat
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickAddButtons.map((b) => {
              const Icon = b.icon;
              return (
                <button key={b.label} onClick={() => onQuickAdd(b.page)}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 hover:shadow-sm">
                  <span className={`inline-flex rounded-lg p-2 ${cardColors[b.color]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Document Explorer + Daftar Dokumen + Preview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Explorer */}
        <div className="card overflow-hidden lg:col-span-3">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <FolderOpen className="h-4 w-4 text-brand-500" />
              Document Explorer
            </h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto p-2">
            <button
              onClick={() => selectExplorer({ kind: 'all' })}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                explorerSel?.kind === 'all' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FolderOpen className="h-4 w-4 text-brand-500" />
              Semua Dokumen
              <span className="ml-auto text-xs text-gray-400">{allDocs.length}</span>
            </button>
            {explorerTree.map((cl, ci) => {
              const clusterKey = `cluster-${ci}`;
              const isExpanded = explorerExpanded.has(clusterKey);
              const clusterSelected = explorerSel?.kind === 'cluster' && explorerSel.clusterName === cl.name;
              return (
                <div key={cl.name}>
                  <button
                    onClick={() => toggleExpand(clusterKey)}
                    onDoubleClick={() => selectExplorer({ kind: 'cluster', clusterName: cl.name })}
                    className={`flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      clusterSelected ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    <Folder className="h-4 w-4 text-amber-500" />
                    <span className="truncate">{cl.name}</span>
                    <span className="ml-auto text-xs text-gray-400">{cl.total}</span>
                  </button>
                  {isExpanded && (
                    <div className="ml-4 border-l border-gray-100 pl-2">
                      {JENIS_BERITA_ACARA_LIST.map((jenis) => {
                        const docs = cl.byType.berita_acara.filter((d) => d.summary.subtitle === jenis);
                        if (docs.length === 0) return null;
                        const selected = explorerSel?.kind === 'subtype'
                          && explorerSel.type === 'berita_acara'
                          && explorerSel.subtype === jenis
                          && explorerSel.clusterName === cl.name;
                        return (
                          <button
                            key={jenis}
                            onClick={() => selectExplorer({ kind: 'subtype', clusterName: cl.name, type: 'berita_acara', subtype: jenis })}
                            className={`flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                              selected ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <FileCheck className="h-3.5 w-3.5 text-purple-500" />
                            <span className="truncate">{jenis}</span>
                            <span className="ml-auto text-xs text-gray-400">{docs.length}</span>
                          </button>
                        );
                      })}

                      {cl.byType.surat_penunjukan.length > 0 && (
                        <button
                          onClick={() => selectExplorer({ kind: 'type', clusterName: cl.name, type: 'surat_penunjukan' })}
                          className={`flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                            explorerSel?.kind === 'type'
                              && explorerSel.type === 'surat_penunjukan'
                              && explorerSel.clusterName === cl.name
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <FileSignature className="h-3.5 w-3.5 text-amber-500" />
                          <span className="truncate">Surat Penunjukan</span>
                          <span className="ml-auto text-xs text-gray-400">{cl.byType.surat_penunjukan.length}</span>
                        </button>
                      )}

                      {JENIS_SURAT_LIST.map((jenis) => {
                        const docs = cl.byType.surat.filter((d) => d.status === jenis);
                        if (docs.length === 0) return null;
                        const selected = explorerSel?.kind === 'subtype'
                          && explorerSel.type === 'surat'
                          && explorerSel.subtype === jenis
                          && explorerSel.clusterName === cl.name;
                        return (
                          <button
                            key={jenis}
                            onClick={() => selectExplorer({ kind: 'subtype', clusterName: cl.name, type: 'surat', subtype: jenis })}
                            className={`flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                              selected ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Mail className="h-3.5 w-3.5 text-cyan-500" />
                            <span className="truncate">{jenis}</span>
                            <span className="ml-auto text-xs text-gray-400">{docs.length}</span>
                          </button>
                        );
                      })}

                      {[
                        { parent: 'Gambar Tender', child: 'Gambar Revisi Tender' },
                        { parent: 'Gambar Pelaksanaan', child: 'Gambar Revisi Pelaksanaan' },
                      ].map(({ parent, child }) => {
                        const parentDocs = cl.byType.gambar.filter((d) => d.summary.subtitle === parent);
                        const childDocs = cl.byType.gambar.filter((d) => d.summary.subtitle === child);
                        if (parentDocs.length === 0 && childDocs.length === 0) return null;
                        const groupKey = `${clusterKey}-${parent}`;
                        const groupExpanded = explorerExpanded.has(groupKey);
                        const parentSelected = explorerSel?.kind === 'subtype'
                          && explorerSel.type === 'gambar'
                          && explorerSel.subtype === parent
                          && explorerSel.clusterName === cl.name;
                        const childSelected = explorerSel?.kind === 'subtype'
                          && explorerSel.type === 'gambar'
                          && explorerSel.subtype === child
                          && explorerSel.clusterName === cl.name;
                        return (
                          <div key={parent}>
                            <div className="flex items-center">
                              {childDocs.length > 0 ? (
                                <button
                                  type="button"
                                  aria-label={`${groupExpanded ? 'Tutup' : 'Buka'} ${parent}`}
                                  onClick={() => toggleExpand(groupKey)}
                                  className="rounded p-1 text-gray-400 hover:bg-gray-100"
                                >
                                  {groupExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                </button>
                              ) : <span className="w-5" />}
                              <button
                                onClick={() => selectExplorer({ kind: 'subtype', clusterName: cl.name, type: 'gambar', subtype: parent })}
                                className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                                  parentSelected ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <FileImage className="h-3.5 w-3.5 text-brand-500" />
                                <span className="truncate">{parent}</span>
                                <span className="ml-auto text-xs text-gray-400">{parentDocs.length}</span>
                              </button>
                            </div>
                            {groupExpanded && childDocs.length > 0 && (
                              <button
                                onClick={() => selectExplorer({ kind: 'subtype', clusterName: cl.name, type: 'gambar', subtype: child })}
                                className={`ml-7 flex w-[calc(100%-1.75rem)] items-center gap-1.5 rounded-lg px-3 py-1 text-xs transition-colors ${
                                  childSelected ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <FileText className="h-3 w-3 text-gray-400" />
                                <span className="truncate">{child}</span>
                                <span className="ml-auto text-xs text-gray-400">{childDocs.length}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {(['Gambar Informasi', 'As Built Drawing'] as const).map((jenis) => {
                        const docs = cl.byType.gambar.filter((d) => d.summary.subtitle === jenis);
                        if (docs.length === 0) return null;
                        const selected = explorerSel?.kind === 'subtype'
                          && explorerSel.type === 'gambar'
                          && explorerSel.subtype === jenis
                          && explorerSel.clusterName === cl.name;
                        return (
                          <button
                            key={jenis}
                            onClick={() => selectExplorer({ kind: 'subtype', clusterName: cl.name, type: 'gambar', subtype: jenis })}
                            className={`flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                              selected ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <FileImage className="h-3.5 w-3.5 text-brand-500" />
                            <span className="truncate">{jenis}</span>
                            <span className="ml-auto text-xs text-gray-400">{docs.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Daftar Dokumen Table */}
        <div className={`card overflow-hidden ${previewDoc ? 'lg:col-span-6' : 'lg:col-span-9'}`}>
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <FileText className="h-4 w-4 text-brand-500" />
                Daftar Dokumen
                <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">{tableDocs.length}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
                  title="Export ke Excel (CSV)">
                  <Download className="h-3.5 w-3.5" /> Excel
                </button>
                <button onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-900 transition-colors"
                  title="Print / Export PDF">
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-100 p-3">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Cari dalam daftar dokumen..."
                  className="input pl-10 pr-10 py-2 text-sm"
                />
                {tableSearch && (
                  <button onClick={() => setTableSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <FilterBar
                filters={[
                  { id: 'cluster', label: 'Semua Cluster', value: filterCluster, options: clusterOptions, onChange: setFilterCluster },
                  { id: 'tahun', label: 'Semua Tahun', value: filterTahun, options: yearOptions, onChange: setFilterTahun },
                  { id: 'jenis', label: 'Semua Jenis', value: filterJenis, options: jenisOptions, onChange: setFilterJenis },
                ]}
                onClear={clearTableFilters}
              />
            </div>
          </div>

          {tableDocs.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <FileText className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">Tidak ada dokumen ditemukan</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort('register')}>
                        <span className="inline-flex items-center gap-1">Register <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort('title')}>
                        <span className="inline-flex items-center gap-1">Judul <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort('cluster')}>
                        <span className="inline-flex items-center gap-1">Cluster <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort('type')}>
                        <span className="inline-flex items-center gap-1">Jenis <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort('date')}>
                        <span className="inline-flex items-center gap-1">Tanggal <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort('status')}>
                        <span className="inline-flex items-center gap-1">Status <ArrowUpDown className="h-3 w-3" /></span>
                      </th>
                      <th className="px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedDocs.map((d) => {
                      const Icon = docTypeIcons[d.summary.type];
                      const isPreview = previewDoc?.summary.id === d.summary.id;
                      return (
                        <tr key={`${d.summary.type}-${d.summary.id}`}
                          className={`cursor-pointer transition-colors ${isPreview ? 'bg-brand-50/50' : 'hover:bg-gray-50/50'}`}
                          onClick={() => handleRowClick(d)}>
                          <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-brand-600">{d.summary.register_no || '-'}</span></td>
                          <td className="min-w-[12rem] max-w-[18rem] whitespace-normal break-words px-4 py-3 align-top font-medium leading-snug text-gray-900 sm:min-w-[14rem]" title={d.summary.title}>{d.summary.title}</td>
                          <td className="px-4 py-3 text-gray-600">{d.clusterName}</td>
                          <td className="px-4 py-3">
                            <Badge color={docTypeColors[d.summary.type]}>
                              <Icon className="h-3 w-3" />
                              {d.summary.subtitle}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(d.summary.date)}</td>
                          <td className="px-4 py-3 text-gray-600">{d.status}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-start gap-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => onOpenDoc(d.summary.type, d.summary.id)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600" title="Detail">
                                <Eye className="h-4 w-4" />
                              </button>
                              {d.link && (
                                <a href={d.link} target="_blank" rel="noopener noreferrer"
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600" title="Google Drive">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Menampilkan {(safePage - 1) * pageSize + 1}-{Math.min(safePage * pageSize, tableDocs.length)} dari {tableDocs.length} dokumen
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 text-sm font-medium text-gray-700">{safePage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Preview Panel */}
        {previewDoc && (
          <div className="card overflow-hidden lg:col-span-3">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Eye className="h-4 w-4 text-brand-500" />
                Preview Dokumen
              </h3>
              <button onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">
              {(() => {
                const d = previewDoc;
                const Icon = docTypeIcons[d.summary.type];
                return (
                  <div className="space-y-3">
                    <div className={`inline-flex rounded-lg p-3 ${cardColors[docTypeColors[d.summary.type]]}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="label">Nomor Register</p>
                      <p className="font-mono text-sm font-bold text-brand-700">{d.summary.register_no || '-'}</p>
                    </div>
                    <div>
                      <p className="label">Judul / Perihal</p>
                      <p className="break-words text-sm font-medium text-gray-900">{d.summary.title}</p>
                    </div>
                    <div>
                      <p className="label">Cluster</p>
                      <p className="text-sm text-gray-700">{d.clusterName}</p>
                    </div>
                    <div>
                      <p className="label">Jenis</p>
                      <Badge color={docTypeColors[d.summary.type]}>
                        <Icon className="h-3 w-3" />
                        {d.summary.subtitle}
                      </Badge>
                    </div>
                    <div>
                      <p className="label">Tanggal</p>
                      <p className="text-sm text-gray-700">{formatDate(d.summary.date)}</p>
                    </div>
                    <div>
                      <p className="label">Status</p>
                      <p className="text-sm text-gray-700">{d.status}</p>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <button onClick={() => onOpenDoc(d.summary.type, d.summary.id)}
                        className="btn-primary w-full justify-center text-sm">
                        <Eye className="h-4 w-4" /> Buka Detail
                      </button>
                      {d.link ? (
                        <a href={d.link} target="_blank" rel="noopener noreferrer"
                          className="btn-secondary w-full justify-center text-sm">
                          <ExternalLink className="h-4 w-4" /> Google Drive
                        </a>
                      ) : (
                        <p className="text-center text-xs text-gray-400">Tidak ada link Google Drive</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Agenda + Aktivitas Terakhir */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Calendar className="h-4 w-4 text-brand-500" />
              Kalender Agenda
            </h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {agendaItems.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Calendar className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">Belum ada agenda</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {agendaItems.map((a, i) => (
                  <button key={i}
                    onClick={() => onOpenDoc(a.type, a.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50">
                    <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <span className="text-xs font-bold">{new Date(a.date).toLocaleDateString('id-ID', { month: 'short' })}</span>
                      <span className="text-sm font-bold leading-none">{new Date(a.date).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-normal break-words text-sm font-medium leading-snug text-gray-900">{a.kind}</p>
                      <p className="mt-0.5 whitespace-normal break-words text-xs leading-snug text-gray-500">{a.title}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Clock className="h-4 w-4 text-brand-500" />
              Aktivitas Terakhir
            </h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Clock className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentActivity.map((d) => {
                  const Icon = docTypeIcons[d.summary.type];
                  return (
                    <button key={`${d.summary.type}-${d.summary.id}`}
                      onClick={() => onOpenDoc(d.summary.type, d.summary.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50">
                      <span className={`inline-flex flex-shrink-0 rounded-lg p-2 ${cardColors[docTypeColors[d.summary.type]]}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-normal break-words text-sm font-medium leading-snug text-gray-900">
                          <span className="font-mono text-brand-600">{d.summary.register_no || '-'}</span> ditambahkan
                        </p>
                        <p className="mt-0.5 whitespace-normal break-words text-xs leading-snug text-gray-500">{d.summary.title}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

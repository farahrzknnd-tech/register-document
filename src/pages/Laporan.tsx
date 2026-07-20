import { useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, Printer, BarChart3, FileImage, Mail } from 'lucide-react';
import type { Gambar, Surat, Cluster } from '../lib/types';
import { JENIS_GAMBAR_LIST, JENIS_SURAT_LIST } from '../lib/types';
import { FilterBar, type FilterOption } from '../components/FilterBar';
import { Loading } from '../components/Loading';
import { useToast } from '../components/Toast';

interface LaporanProps {
  gambar: Gambar[];
  surat: Surat[];
  clusters: Cluster[];
  loading: boolean;
}

export function Laporan({ gambar, surat, clusters, loading }: LaporanProps) {
  const toast = useToast();
  const [filterTahun, setFilterTahun] = useState('');
  const [filterCluster, setFilterCluster] = useState('');

  const clusterMap = useMemo(() => new Map(clusters.map((c) => [c.id, c])), [clusters]);

  const years = useMemo(() => {
    const ys = new Set<number>();
    gambar.forEach((g) => ys.add(new Date(g.tanggal_diterima).getFullYear()));
    surat.forEach((s) => ys.add(new Date(s.tanggal_surat).getFullYear()));
    return Array.from(ys).sort((a, b) => b - a);
  }, [gambar, surat]);

  const clusterOptions: FilterOption[] = clusters.map((c) => ({ value: c.id, label: c.name }));
  const yearOptions: FilterOption[] = years.map((y) => ({ value: String(y), label: String(y) }));

  const filteredGambar = useMemo(() => {
    return gambar.filter((g) => {
      if (filterCluster && g.cluster_id !== filterCluster) return false;
      if (filterTahun && new Date(g.tanggal_diterima).getFullYear() !== Number(filterTahun)) return false;
      return true;
    });
  }, [gambar, filterCluster, filterTahun]);

  const filteredSurat = useMemo(() => {
    return surat.filter((s) => {
      if (filterCluster && s.cluster_id !== filterCluster) return false;
      if (filterTahun && new Date(s.tanggal_surat).getFullYear() !== Number(filterTahun)) return false;
      return true;
    });
  }, [surat, filterCluster, filterTahun]);

  const recap = useMemo(() => ({
    totalGambar: filteredGambar.length,
    totalSurat: filteredSurat.length,
    gambarByJenis: JENIS_GAMBAR_LIST.map((j) => ({ jenis: j, count: filteredGambar.filter((g) => g.jenis_gambar === j).length })),
    suratByJenis: JENIS_SURAT_LIST.map((j) => ({ jenis: j, count: filteredSurat.filter((s) => s.jenis_surat === j).length })),
  }), [filteredGambar, filteredSurat]);

  const clearFilters = () => { setFilterTahun(''); setFilterCluster(''); };

  const getFilterLabel = () => {
    const parts: string[] = [];
    if (filterTahun) parts.push(`Tahun ${filterTahun}`);
    if (filterCluster) parts.push(clusterMap.get(filterCluster)?.name || '');
    return parts.length ? parts.join(' - ') : 'Semua Data';
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const recapData = [
        ['LAPORAN REGISTER GAMBAR & SURAT PROYEK'],
        ['Filter: ' + getFilterLabel()],
        ['Tanggal Cetak: ' + new Date().toLocaleDateString('id-ID')],
        [],
        ['REKAPITULASI'],
        ['Total Gambar', recap.totalGambar],
        ['Total Surat', recap.totalSurat],
        [],
        ['JUMLAH GAMBAR BERDASARKAN JENIS'],
        ['Jenis Gambar', 'Jumlah'],
        ...recap.gambarByJenis.map((d) => [d.jenis, d.count]),
        [],
        ['JUMLAH SURAT BERDASARKAN JENIS'],
        ['Jenis Surat', 'Jumlah'],
        ...recap.suratByJenis.map((d) => [d.jenis, d.count]),
      ];
      const wsRecap = XLSX.utils.aoa_to_sheet(recapData);
      XLSX.utils.book_append_sheet(wb, wsRecap, 'Rekap');

      const gambarRows = filteredGambar.map((g) => ({
        'Register No': g.register_no || '', 'Judul Gambar': g.judul_gambar,
        'Cluster': g.cluster?.name || '', 'Jenis Gambar': g.jenis_gambar,
        'Revisi': g.revisi || '', 'Status': g.status_gambar, 'Tanggal Diterima': g.tanggal_diterima,
        'Link': g.link_drive || '', 'Keterangan': g.keterangan || '',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gambarRows), 'Detail Gambar');

      const suratRows = filteredSurat.map((s) => ({
        'Register No': s.register_no || '', 'Nomor Surat': s.nomor_surat, 'Perihal': s.perihal,
        'Cluster': s.cluster?.name || '', 'Jenis Surat': s.jenis_surat,
        'Kategori': s.kategori_surat || '', 'Pengirim': s.pengirim || '', 'Penerima': s.penerima || '',
        'Tanggal Surat': s.tanggal_surat, 'Link': s.link_drive || '', 'Keterangan': s.keterangan || '',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suratRows), 'Detail Surat');

      XLSX.writeFile(wb, `Laporan_Register_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.show('File Excel berhasil diunduh', 'success');
    } catch (err: unknown) { toast.show('Gagal export Excel: ' + (err instanceof Error ? err.message : String(err)), 'error'); }
  };

  const exportPDF = async () => {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN REGISTER GAMBAR & SURAT PROYEK', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Filter: ${getFilterLabel()}`, pageWidth / 2, 22, { align: 'center' });
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, 27, { align: 'center' });

      autoTable(doc, {
        startY: 35, head: [['Rekapitulasi', 'Jumlah']],
        body: [['Total Gambar', String(recap.totalGambar)], ['Total Surat', String(recap.totalSurat)]],
        theme: 'striped', headStyles: { fillColor: [37, 99, 235] }, styles: { fontSize: 9 },
      });

      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
        head: [['Jenis Gambar', 'Jumlah']],
        body: recap.gambarByJenis.map((d) => [d.jenis, String(d.count)]),
        theme: 'striped', headStyles: { fillColor: [37, 99, 235] }, styles: { fontSize: 9 },
      });

      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
        head: [['Jenis Surat', 'Jumlah']],
        body: recap.suratByJenis.map((d) => [d.jenis, String(d.count)]),
        theme: 'striped', headStyles: { fillColor: [37, 99, 235] }, styles: { fontSize: 9 },
      });

      doc.save(`Laporan_Register_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.show('File PDF berhasil diunduh', 'success');
    } catch (err: unknown) { toast.show('Gagal export PDF: ' + (err instanceof Error ? err.message : String(err)), 'error'); }
  };

  if (loading) return <Loading label="Memuat laporan..." />;

  return (
    <div className="space-y-6">
      <div className="no-print space-y-4">
        <div className="card p-4">
          <FilterBar filters={[
            { id: 'tahun', label: 'Semua Tahun', value: filterTahun, options: yearOptions, onChange: setFilterTahun },
            { id: 'cluster', label: 'Semua Cluster', value: filterCluster, options: clusterOptions, onChange: setFilterCluster },
          ]} onClear={clearFilters} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={() => void exportExcel()}><FileSpreadsheet className="h-4 w-4" /> Export Excel</button>
          <button className="btn-secondary" onClick={() => void exportPDF()}><FileText className="h-4 w-4" /> Export PDF</button>
          <button className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
        </div>
      </div>

      <div className="card p-6 print-full">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">LAPORAN REGISTER GAMBAR & SURAT PROYEK</h1>
          <p className="mt-1 text-sm text-gray-500">Filter: {getFilterLabel()}</p>
          <p className="text-xs text-gray-400">Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500"><FileImage className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Total Gambar</span></div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{recap.totalGambar}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500"><Mail className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Total Surat</span></div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{recap.totalSurat}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500"><BarChart3 className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Jenis Gambar</span></div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{recap.gambarByJenis.filter((d) => d.count > 0).length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-gray-500"><BarChart3 className="h-4 w-4" /><span className="text-xs font-semibold uppercase">Jenis Surat</span></div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{recap.suratByJenis.filter((d) => d.count > 0).length}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Jumlah Gambar berdasarkan Jenis</h3>
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <th className="border-b border-gray-200 px-4 py-2.5">Jenis Gambar</th>
                <th className="border-b border-gray-200 px-4 py-2.5">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {recap.gambarByJenis.map((d) => (
                <tr key={d.jenis} className="border-b border-gray-100">
                  <td className="px-4 py-2.5 text-gray-700">{d.jenis}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{d.count}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-2.5 text-gray-900">Total</td>
                <td className="px-4 py-2.5 text-gray-900">{recap.totalGambar}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-gray-900">Jumlah Surat berdasarkan Jenis</h3>
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <th className="border-b border-gray-200 px-4 py-2.5">Jenis Surat</th>
                <th className="border-b border-gray-200 px-4 py-2.5">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {recap.suratByJenis.map((d) => (
                <tr key={d.jenis} className="border-b border-gray-100">
                  <td className="px-4 py-2.5 text-gray-700">{d.jenis}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{d.count}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-2.5 text-gray-900">Total</td>
                <td className="px-4 py-2.5 text-gray-900">{recap.totalSurat}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

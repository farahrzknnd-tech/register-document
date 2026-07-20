import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  FileJson,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useToast } from '../../../components/toastContext';
import { mapAppError } from '../../../lib/errors';
import { formatDate } from '../../../lib/utils';
import {
  executeLegacyBillingImport,
  fetchBillingImportRuns,
  previewLegacyBillingImport,
} from '../api/legacyImport';
import {
  parseLegacyBillingBackup,
  sha256Text,
  summarizeLegacyBackup,
  type BillingImportRun,
  type LegacyBillingBackup,
  type LegacyImportSummary,
} from '../utils/legacyImport';

interface SelectedImportFile {
  name: string;
  size: number;
  checksum: string;
  payload: LegacyBillingBackup;
  localSummary: ReturnType<typeof summarizeLegacyBackup>;
}

function SummaryCard({ label, value, tone = 'neutral' }: {
  label: string;
  value: number;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneClass = {
    neutral: 'bg-gray-50 text-gray-900',
    success: 'bg-green-50 text-green-800',
    warning: 'bg-amber-50 text-amber-800',
    danger: 'bg-red-50 text-red-800',
  }[tone];

  return (
    <div className={`rounded-xl p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function ImportSummaryView({ summary }: { summary: LegacyImportSummary }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total SPK" value={summary.total_records} />
        <SummaryCard label="Siap Diimpor" value={summary.importable_records} tone="success" />
        <SummaryCard label="Duplikat" value={summary.duplicate_records} tone="warning" />
        <SummaryCard label="Tidak Valid" value={summary.invalid_records} tone="danger" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Scope Tak Terpetakan" value={summary.unresolved_scopes} tone="warning" />
        <SummaryCard label="Kontraktor Baru" value={summary.created_contractors} />
        <SummaryCard label="Status Baru" value={summary.created_statuses} />
        <SummaryCard label="Template Baru" value={summary.created_templates} />
      </div>

      {summary.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Peringatan Import
          </div>
          <ul className="mt-3 max-h-52 space-y-1 overflow-auto text-sm text-amber-800">
            {summary.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`} className="list-inside list-disc">{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function BillingLegacyImport() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedImportFile | null>(null);
  const [preview, setPreview] = useState<LegacyImportSummary | null>(null);
  const [result, setResult] = useState<LegacyImportSummary | null>(null);
  const [history, setHistory] = useState<BillingImportRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      setHistory(await fetchBillingImportRuns());
    } catch (error) {
      toast.show(mapAppError(error), 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const fileSizeLabel = useMemo(() => {
    if (!selectedFile) return '';
    return `${(selectedFile.size / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} KB`;
  }, [selectedFile]);

  const handleFile = async (file: File) => {
    setProcessing(true);
    setPreview(null);
    setResult(null);
    setConfirmed(false);
    try {
      const text = await file.text();
      const payload = parseLegacyBillingBackup(text);
      const checksum = await sha256Text(text);
      setSelectedFile({
        name: file.name,
        size: file.size,
        checksum,
        payload,
        localSummary: summarizeLegacyBackup(payload),
      });
    } catch (error) {
      setSelectedFile(null);
      toast.show(mapAppError(error), 'error');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const runPreview = async () => {
    if (!selectedFile) return;
    setProcessing(true);
    setResult(null);
    try {
      setPreview(await previewLegacyBillingImport(
        selectedFile.payload,
        selectedFile.name,
        selectedFile.checksum,
      ));
      toast.show('Validasi import selesai. Periksa ringkasan sebelum melanjutkan.', 'success');
    } catch (error) {
      toast.show(mapAppError(error), 'error');
    } finally {
      setProcessing(false);
    }
  };

  const runImport = async () => {
    if (!selectedFile || !preview || !confirmed) return;
    setProcessing(true);
    try {
      const imported = await executeLegacyBillingImport(
        selectedFile.payload,
        selectedFile.name,
        selectedFile.checksum,
      );
      setResult(imported);
      setPreview(null);
      setConfirmed(false);
      toast.show(`${imported.imported_records} monitoring tagihan berhasil diimpor.`, 'success');
      await loadHistory();
    } catch (error) {
      toast.show(mapAppError(error), 'error');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setConfirmed(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Data Monitoring Legacy</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">
            Impor backup JSON dari aplikasi Monitoring Billing lama secara aditif. Data yang sudah ada tidak ditimpa dan nomor SPK duplikat akan dilewati.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => void loadHistory()} disabled={historyLoading}>
          <RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
          Muat Ulang Riwayat
        </button>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-bold">Import aman dan tidak bersifat restore penuh</p>
            <p className="mt-1">
              Project/Cluster yang tidak dapat dipetakan akan dibiarkan kosong, kontraktor/status/template yang belum ada dapat dibuat, dan seluruh import dicatat pada audit history.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">1. Pilih Backup JSON</h2>
            <p className="text-sm text-gray-500">Format yang didukung adalah hasil Download Backup dari aplikasi Monitoring Billing lama.</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {!selectedFile ? (
          <button
            type="button"
            className="mt-5 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-12 text-center hover:border-brand-400 hover:bg-brand-50/30"
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
          >
            <FileJson className="h-10 w-10 text-gray-400" />
            <span className="mt-3 text-sm font-bold text-gray-700">Pilih file backup JSON</span>
            <span className="mt-1 text-xs text-gray-500">Maksimal 10 MB dan 5.000 SPK per file</span>
          </button>
        ) : (
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <FileJson className="h-8 w-8 text-brand-600" />
                <div>
                  <p className="font-bold text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{fileSizeLabel} · SHA-256 {selectedFile.checksum.slice(0, 16) || '-'}…</p>
                </div>
              </div>
              <button className="btn-secondary" onClick={reset} disabled={processing}>Ganti File</button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <SummaryCard label="SPK" value={selectedFile.localSummary.records} />
              <SummaryCard label="Valid" value={selectedFile.localSummary.validRecords} tone="success" />
              <SummaryCard label="Invalid" value={selectedFile.localSummary.invalidRecords} tone="danger" />
              <SummaryCard label="Kontraktor" value={selectedFile.localSummary.contractors} />
              <SummaryCard label="Status" value={selectedFile.localSummary.statuses} />
              <SummaryCard label="Template" value={selectedFile.localSummary.templates} />
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button className="btn-primary" onClick={() => void runPreview()} disabled={!selectedFile || processing}>
            <ShieldCheck className="h-4 w-4" />
            {processing ? 'Memproses...' : 'Validasi Import'}
          </button>
        </div>
      </section>

      {preview && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">2. Hasil Validasi</h2>
              <p className="text-sm text-gray-500">Belum ada data yang ditulis ke database.</p>
            </div>
          </div>

          <ImportSummaryView summary={preview} />

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span className="text-sm text-gray-700">
              Saya memahami bahwa import bersifat aditif, SPK duplikat akan dilewati, dan Project/Cluster yang tidak terpetakan akan dikosongkan.
            </span>
          </label>

          <div className="mt-5 flex justify-end">
            <button className="btn-primary" onClick={() => void runImport()} disabled={!confirmed || processing}>
              <DatabaseBackup className="h-4 w-4" />
              {processing ? 'Mengimpor...' : `Import ${preview.importable_records} SPK`}
            </button>
          </div>
        </section>
      )}

      {result && (
        <section className="rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="mb-4 flex items-center gap-3 text-green-800">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <h2 className="font-bold">Import selesai</h2>
              <p className="text-sm">{result.imported_records} monitoring tagihan berhasil ditambahkan.</p>
            </div>
          </div>
          <ImportSummaryView summary={result} />
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-bold text-gray-900">Riwayat Import</h2>
          <p className="text-sm text-gray-500">25 aktivitas import terakhir.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left">Tanggal</th>
                <th className="px-5 py-3 text-left">File</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Diimpor</th>
                <th className="px-5 py-3 text-left">Duplikat</th>
                <th className="px-5 py-3 text-left">Peringatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historyLoading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-left text-gray-500">Memuat riwayat...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-left text-gray-500">Belum ada riwayat import.</td></tr>
              ) : history.map((run) => (
                <tr key={run.id}>
                  <td className="px-5 py-3 text-left text-gray-600">{formatDate(run.created_at)}</td>
                  <td className="px-5 py-3 text-left font-medium text-gray-900">{run.file_name || '-'}</td>
                  <td className="px-5 py-3 text-left">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      run.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {run.status === 'completed' ? 'Selesai' : 'Selesai dengan peringatan'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-left text-gray-700">{run.summary.imported_records}</td>
                  <td className="px-5 py-3 text-left text-gray-700">{run.summary.duplicate_records}</td>
                  <td className="px-5 py-3 text-left text-gray-700">{run.summary.warnings.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

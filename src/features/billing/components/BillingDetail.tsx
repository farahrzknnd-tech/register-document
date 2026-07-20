import {
  CalendarDays,
  Circle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileSignature,
  FileText,
  MapPin,
  Pencil,
  ReceiptText,
  UserRound,
  Wallet,
} from 'lucide-react';
import { Modal } from '../../../components/Modal';
import { formatDate } from '../../../lib/utils';
import type { UserRole } from '../../../lib/types';
import type { SpkBillingDetail } from '../types';
import { formatRupiah } from '../utils/monitoring';
import { BillingStatusBadge } from './BillingStatusBadge';

interface BillingDetailProps {
  open: boolean;
  billing: SpkBillingDetail | null;
  loading: boolean;
  error: string | null;
  role: UserRole;
  onClose: () => void;
  onEdit: () => void;
  onOpenSuratPenunjukan?: (id: string) => void;
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

const stageStyles = {
  not_started: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  skipped: 'bg-amber-100 text-amber-700',
};

const stageLabels = {
  not_started: 'Belum Dimulai',
  in_progress: 'Proses',
  completed: 'Selesai',
  skipped: 'Dilewati',
};

const terminLabels = {
  not_billed: 'Belum Ditagihkan',
  in_process: 'Sedang Diproses',
  billed: 'Ditagihkan',
  partially_paid: 'Dibayar Sebagian',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
};

export function BillingDetail({
  open,
  billing,
  loading,
  error,
  role,
  onClose,
  onEdit,
  onOpenSuratPenunjukan,
}: BillingDetailProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Monitoring Tagihan"
      subtitle={billing ? `${billing.spk_number} — ${billing.work_name}` : undefined}
      size="xl"
      footer={
        role === 'admin' && billing ? (
          <button className="btn-primary" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit Data Inti
          </button>
        ) : undefined
      }
    >
      {loading && <div className="py-16 text-center text-sm text-gray-500">Memuat detail monitoring...</div>}
      {!loading && error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!loading && !error && billing && (
        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500"><Wallet className="h-4 w-4" /> Nilai Kontrak</div>
              <p className="mt-2 text-lg font-bold text-gray-900">{formatRupiah(billing.contract_value)}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600"><ReceiptText className="h-4 w-4" /> Sudah Ditagihkan</div>
              <p className="mt-2 text-lg font-bold text-blue-800">{formatRupiah(billing.financial.total_billed)}</p>
              <p className="mt-1 text-xs text-blue-600">{billing.financial.billing_percentage}% kontrak</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-green-600"><CheckCircle2 className="h-4 w-4" /> Sudah Dibayar</div>
              <p className="mt-2 text-lg font-bold text-green-800">{formatRupiah(billing.financial.total_paid)}</p>
              <p className="mt-1 text-xs text-green-600">{billing.financial.payment_percentage}% dari tagihan</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600"><Clock3 className="h-4 w-4" /> Sisa Kontrak</div>
              <p className="mt-2 text-lg font-bold text-amber-800">{formatRupiah(billing.financial.remaining_contract)}</p>
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Informasi Utama</h3>
                <p className="mt-0.5 text-xs text-gray-500">Data SPK dan ruang lingkup pekerjaan</p>
              </div>
              <BillingStatusBadge status={billing.status} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Value label="Nomor SPK" value={billing.spk_number} />
              <Value label="Tanggal SPK" value={formatDate(billing.spk_date)} />
              <Value label="Nama Pekerjaan" value={billing.work_name} />
              <Value label="Kontraktor" value={billing.contractor_name_snapshot} />
              <Value label="Project" value={billing.project?.name ?? '-'} />
              <Value label="Cluster" value={billing.cluster?.name ?? '-'} />
              <Value label="Lokasi" value={billing.work_location ?? '-'} />
              <Value label="Mulai" value={formatDate(billing.work_start_date)} />
              <Value label="Selesai" value={formatDate(billing.work_finish_date)} />
              <Value label="Kickoff" value={formatDate(billing.kickoff_date)} />
              <Value label="Bobot Tahapan" value={billing.stage_weight ?? '-'} />
              <Value label="Template Termin" value={billing.termin_template?.name ?? '-'} />
            </div>
            {billing.surat_penunjukan && onOpenSuratPenunjukan && (
              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
                onClick={() => {
                  onClose();
                  onOpenSuratPenunjukan(billing.surat_penunjukan!.id);
                }}
              >
                <FileSignature className="h-4 w-4" />
                Lihat Surat Penunjukan {billing.surat_penunjukan.register_no || billing.surat_penunjukan.nomor_sp}
              </button>
            )}
            {billing.document_drive_url && (
              <a
                href={billing.document_drive_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                <ExternalLink className="h-4 w-4" /> Buka Dokumen
              </a>
            )}
            {billing.notes && <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{billing.notes}</p>}
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900">Timeline Approval</h3>
              <p className="mt-0.5 text-xs text-gray-500">Read-only pada Patch 3; perubahan status masuk Patch 5.</p>
            </div>
            <div className="divide-y divide-gray-100">
              {billing.stages.map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-5 py-3">
                  <div className={`mt-0.5 rounded-full p-1.5 ${stageStyles[item.status]}`}>
                    {item.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{item.stage.name}</p>
                      <span className={`badge ${stageStyles[item.status]}`}>{stageLabels[item.status]}</span>
                    </div>
                    {item.completed_at && <p className="mt-1 text-xs text-gray-500">Selesai: {formatDate(item.completed_at)}</p>}
                    {item.note && <p className="mt-1 text-xs text-gray-600">{item.note}</p>}
                  </div>
                </div>
              ))}
              {billing.stages.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-500">Belum ada tahapan approval.</p>}
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900">Termin Pembayaran</h3>
              <p className="mt-0.5 text-xs text-gray-500">Read-only pada Patch 3; pengelolaan termin masuk Patch 5.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Termin</th>
                    <th className="px-4 py-3 text-left">Persentase</th>
                    <th className="px-4 py-3 text-left">Rencana</th>
                    <th className="px-4 py-3 text-left">Ditagihkan</th>
                    <th className="px-4 py-3 text-left">Dibayar</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {billing.termins.map((termin) => (
                    <tr key={termin.id}>
                      <td className="px-4 py-3 text-left font-medium text-gray-900">{termin.name}</td>
                      <td className="px-4 py-3 text-left text-gray-600">{termin.percentage === null ? '-' : `${termin.percentage}%`}</td>
                      <td className="px-4 py-3 text-left text-gray-700">{formatRupiah(termin.planned_amount)}</td>
                      <td className="px-4 py-3 text-left text-gray-700">{formatRupiah(termin.billed_amount)}</td>
                      <td className="px-4 py-3 text-left text-gray-700">{formatRupiah(termin.paid_amount)}</td>
                      <td className="px-4 py-3 text-left"><span className="badge bg-gray-100 text-gray-700">{terminLabels[termin.status]}</span></td>
                    </tr>
                  ))}
                  {billing.termins.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Belum ada template atau termin pembayaran.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="text-sm font-bold text-gray-900">Riwayat Aktivitas</h3>
            <div className="mt-4 space-y-3">
              {billing.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                  <FileText className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {activity.action === 'created' ? 'Monitoring dibuat' : activity.action === 'updated' ? 'Data inti diperbarui' : activity.action}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{formatDate(activity.created_at)}</p>
                  </div>
                </div>
              ))}
              {billing.activities.length === 0 && <p className="text-sm text-gray-500">Belum ada riwayat aktivitas.</p>}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"><UserRound className="h-4 w-4 text-gray-400" /><span className="text-xs text-gray-600">Kontraktor: {billing.contractor_name_snapshot}</span></div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"><MapPin className="h-4 w-4 text-gray-400" /><span className="text-xs text-gray-600">{billing.work_location ?? 'Tanpa lokasi'}</span></div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"><CalendarDays className="h-4 w-4 text-gray-400" /><span className="text-xs text-gray-600">Dibuat {formatDate(billing.created_at)}</span></div>
          </section>
        </div>
      )}
    </Modal>
  );
}

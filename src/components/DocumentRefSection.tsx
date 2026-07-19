import { FileImage, Mail, FileSignature, FileCheck, Link2 } from 'lucide-react';
import type { DocType, DocumentSummary } from '../lib/types';
import { DOC_TYPE_LABELS } from '../lib/types';
import { formatDate } from '../lib/utils';

const docIcons: Record<DocType, typeof FileImage> = {
  gambar: FileImage,
  surat: Mail,
  surat_penunjukan: FileSignature,
  berita_acara: FileCheck,
};

const docIconColors: Record<DocType, string> = {
  gambar: 'text-brand-600',
  surat: 'text-cyan-600',
  surat_penunjukan: 'text-amber-600',
  berita_acara: 'text-purple-600',
};

interface DocumentRefSectionProps {
  title: string;
  icon: typeof Link2;
  docs: DocumentSummary[];
  emptyMessage: string;
  onOpenDoc: (type: DocType, id: string) => void;
}

export function DocumentRefSection({
  title, icon: Icon, docs, emptyMessage, onOpenDoc,
}: DocumentRefSectionProps) {
  return (
    <div className="border-t border-gray-200 px-6 py-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
        <Icon className="h-4 w-4 text-brand-500" />
        {title}
      </h3>
      {docs.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Nomor Register</th>
                <th className="px-4 py-2.5">Jenis Dokumen</th>
                <th className="px-4 py-2.5">Judul / Perihal</th>
                <th className="px-4 py-2.5">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((d) => {
                const DocIcon = docIcons[d.type];
                return (
                  <tr
                    key={`${d.type}-${d.id}`}
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() => onOpenDoc(d.type, d.id)}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-semibold text-brand-600 hover:underline">{d.register_no || '-'}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <DocIcon className={`h-3.5 w-3.5 ${docIconColors[d.type]}`} />
                        {DOC_TYPE_LABELS[d.type]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-900 hover:text-brand-600 hover:underline">{d.title}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(d.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

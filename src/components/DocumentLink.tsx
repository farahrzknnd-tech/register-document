import { FileText, ExternalLink } from 'lucide-react';

export function DocumentLink({ url, label }: { url: string | null; label?: string }) {
  if (!url || url.trim() === '') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
        <FileText className="h-3.5 w-3.5" />
        Belum Ada Dokumen
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {label || 'Buka Dokumen'}
    </a>
  );
}

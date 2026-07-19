import { Download, ExternalLink, Printer, Pencil } from 'lucide-react';
import { isValidDriveUrl, isDriveFolder, getDriveDownloadUrl } from '../lib/utils';

export function DriveButtons({ url }: { url: string | null }) {
  if (!url || !isValidDriveUrl(url)) {
    return (
      <div className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
          Belum ada link Google Drive
        </span>
      </div>
    );
  }

  const isFolder = isDriveFolder(url);
  const downloadUrl = getDriveDownloadUrl(url);

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Buka Google Drive
      </a>
      {isFolder || !downloadUrl ? (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-400" title="Link merupakan folder Google Drive">
          <Download className="h-3.5 w-3.5" />
          Folder (tidak dapat diunduh)
        </span>
      ) : (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download File
        </a>
      )}
    </div>
  );
}

interface DetailActionsProps {
  onEdit?: () => void;
  onPrint: () => void;
  isAdmin: boolean;
}

export function DetailActions({ onEdit, onPrint, isAdmin }: DetailActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 border-t border-gray-200 px-6 py-4">
      {isAdmin && onEdit && (
        <button className="btn-secondary" onClick={onEdit}>
          <Pencil className="h-4 w-4" /> Edit
        </button>
      )}
      <button className="btn-ghost" onClick={onPrint}>
        <Printer className="h-4 w-4" /> Print
      </button>
    </div>
  );
}

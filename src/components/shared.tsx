import { Eye, Pencil, Trash2, type LucideIcon } from 'lucide-react';

export function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className={`text-sm text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center py-16">
      <Icon className="h-12 w-12 text-gray-300" />
      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function TableActions({ onPreview, onEdit, onDelete }: {
  onPreview?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onPreview && (
        <button onClick={onPreview} className="rounded-lg p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600" title="Preview">
          <Eye className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600" title="Edit">
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Hapus">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

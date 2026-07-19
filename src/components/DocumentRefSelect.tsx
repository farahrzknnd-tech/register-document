import { useMemo, useState } from 'react';
import { Search, X, Check, FileImage, Mail, FileSignature, FileCheck } from 'lucide-react';
import type { DocType, DocumentSummary } from '../lib/types';
import { DOC_TYPE_LABELS } from '../lib/types';

interface DocumentRefSelectProps {
  allDocs: DocumentSummary[];
  selectedRefs: { ref_type: DocType; ref_id: string }[];
  onChange: (refs: { ref_type: DocType; ref_id: string }[]) => void;
  excludeId?: string;
  excludeType?: DocType;
}

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

export function DocumentRefSelect({ allDocs, selectedRefs, onChange, excludeId, excludeType }: DocumentRefSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allDocs.filter((d) => {
      if (excludeId && d.id === excludeId && excludeType && d.type === excludeType) return false;
      if (q) {
        const hay = [d.register_no || '', d.title, d.subtitle, DOC_TYPE_LABELS[d.type]].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allDocs, query, excludeId, excludeType]);

  const selectedDocs = useMemo(() =>
    selectedRefs.map((r) => allDocs.find((d) => d.id === r.ref_id && d.type === r.ref_type)).filter(Boolean) as DocumentSummary[],
    [selectedRefs, allDocs]);

  const isSelected = (doc: DocumentSummary) =>
    selectedRefs.some((r) => r.ref_id === doc.id && r.ref_type === doc.type);

  const toggle = (doc: DocumentSummary) => {
    if (isSelected(doc)) {
      onChange(selectedRefs.filter((r) => !(r.ref_id === doc.id && r.ref_type === doc.type)));
    } else {
      onChange([...selectedRefs, { ref_type: doc.type, ref_id: doc.id }]);
    }
  };

  const removeChip = (doc: DocumentSummary) => {
    onChange(selectedRefs.filter((r) => !(r.ref_id === doc.id && r.ref_type === doc.type)));
  };

  return (
    <div className="relative">
      <label className="label">Referensi Dokumen (Opsional)</label>

      {selectedDocs.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedDocs.map((d) => {
            const Icon = docIcons[d.type];
            return (
              <span key={`${d.type}-${d.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
                <Icon className={`h-3 w-3 ${docIconColors[d.type]}`} />
                <span className="font-mono">{d.register_no || d.title}</span>
                <span className="max-w-[120px] truncate">{d.title}</span>
                <button onClick={() => removeChip(d)} className="text-brand-400 hover:text-brand-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Cari dokumen berdasarkan register no, judul, perihal..."
          className="input pl-10"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.slice(0, 50).map((d) => {
            const Icon = docIcons[d.type];
            const sel = isSelected(d);
            return (
              <button
                key={`${d.type}-${d.id}`}
                type="button"
                onClick={() => toggle(d)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                  sel ? 'bg-brand-50' : ''
                }`}
              >
                <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                  sel ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
                }`}>
                  {sel && <Check className="h-3 w-3 text-white" />}
                </div>
                <Icon className={`h-4 w-4 flex-shrink-0 ${docIconColors[d.type]}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-brand-600">{d.register_no || '-'}</p>
                  <p className="truncate text-sm text-gray-900">{d.title}</p>
                  <p className="truncate text-xs text-gray-400">{d.subtitle}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-gray-400">{DOC_TYPE_LABELS[d.type]}</span>
              </button>
            );
          })}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 shadow-lg">
          Tidak ada dokumen ditemukan
        </div>
      )}
    </div>
  );
}

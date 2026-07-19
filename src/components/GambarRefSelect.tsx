import { useMemo, useRef, useState } from 'react';
import { Search, X, Check, FileImage } from 'lucide-react';
import type { Gambar } from '../lib/types';

interface GambarRefSelectProps {
  gambar: Gambar[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function GambarRefSelect({ gambar, selectedIds, onChange }: GambarRefSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return gambar;
    return gambar.filter((g) =>
      [g.register_no || '', g.judul_gambar, g.jenis_gambar].join(' ').toLowerCase().includes(q)
    );
  }, [gambar, query]);

  const selectedGambar = useMemo(() =>
    selectedIds.map((id) => gambar.find((g) => g.id === id)).filter(Boolean) as Gambar[],
    [selectedIds, gambar]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeChip = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="label">Referensi Gambar (Opsional)</label>

      {selectedGambar.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedGambar.map((g) => (
            <span key={g.id} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
              <FileImage className="h-3 w-3" />
              <span className="font-mono">{g.register_no}</span>
              <span className="max-w-[150px] truncate">{g.judul_gambar}</span>
              <button onClick={() => removeChip(g.id)} className="text-brand-400 hover:text-brand-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
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
          placeholder="Cari gambar berdasarkan register no atau judul..."
          className="input pl-10"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.slice(0, 50).map((g) => {
            const isSelected = selectedIds.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle(g.id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 ${
                  isSelected ? 'bg-brand-50' : ''
                }`}
              >
                <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                  isSelected ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-brand-600">{g.register_no}</p>
                  <p className="truncate text-sm text-gray-900">{g.judul_gambar}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-gray-400">{g.jenis_gambar}</span>
              </button>
            );
          })}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 shadow-lg">
          Tidak ada gambar ditemukan
        </div>
      )}
    </div>
  );
}

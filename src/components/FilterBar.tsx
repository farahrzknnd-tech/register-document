import type { ReactNode } from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  filters: {
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (v: string) => void;
  }[];
  onClear?: () => void;
}

export function FilterBar({ filters, onClear }: FilterBarProps) {
  const hasActive = filters.some((f) => f.value);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600">
        <Filter className="h-4 w-4" />
        Filter
      </div>
      {filters.map((f) => (
        <div key={f.id} className="min-w-[140px] flex-1">
          <select
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="input py-2 text-sm"
          >
            <option value="">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      {hasActive && onClear && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
          Reset
        </button>
      )}
    </div>
  );
}

export function Badge({ children, color = 'gray' }: { children: ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-brand-50 text-brand-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    cyan: 'bg-cyan-50 text-cyan-700',
  };
  return <span className={`badge ${colors[color] || colors.gray}`}>{children}</span>;
}

import type { BillingStatusSummary } from '../types';

const colorClasses: Record<BillingStatusSummary['color_key'], string> = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

export function BillingStatusBadge({ status }: { status: BillingStatusSummary }) {
  return <span className={`badge ${colorClasses[status.color_key]}`}>{status.name}</span>;
}

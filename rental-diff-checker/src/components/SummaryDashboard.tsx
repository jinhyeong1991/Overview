import type { SummaryStats } from '@/types';

interface Props {
  stats: SummaryStats;
}

const ITEMS = [
  { key: '신규' as const, label: '신규', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', dot: '🟡' },
  { key: '업데이트' as const, label: '변동', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', dot: '🟠' },
  { key: '유지' as const, label: '유지', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300', dot: '⚪' },
  { key: '단종' as const, label: '단종', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400', dot: '⚫' },
];

export function SummaryDashboard({ stats }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-center py-3 px-4 rounded-xl bg-card border">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-2">비교 결과 요약</span>
      {ITEMS.map((item) => (
        <div key={item.key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${item.color}`}>
          <span>{item.dot}</span>
          <span>{item.label}</span>
          <span className="font-bold">{stats[item.key]}건</span>
        </div>
      ))}
      <div className="ml-auto text-xs text-muted-foreground">
        전체 <strong>{stats.total}</strong>건
      </div>
    </div>
  );
}

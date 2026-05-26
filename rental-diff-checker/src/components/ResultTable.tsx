import { useState, useMemo } from 'react';
import type { DiffResult, ItemStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Props {
  results: DiffResult[];
  visibleHeaders: string[];
  feeColumn: string;
  promoColumn?: string;
}

const STATUS_STYLE: Record<ItemStatus, string> = {
  신규: 'bg-yellow-50 dark:bg-yellow-950/25',
  업데이트: 'bg-orange-50 dark:bg-orange-950/20',
  유지: '',
  단종: 'bg-gray-100 dark:bg-gray-900/50',
};

const BADGE_STYLE: Record<ItemStatus, string> = {
  신규: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200 border-0',
  업데이트: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-0',
  유지: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-0',
  단종: 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border-0',
};

const FILTER_OPTIONS: { value: ItemStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: '신규', label: '🟡 신규' },
  { value: '업데이트', label: '🟠 변동' },
  { value: '유지', label: '⚪ 유지' },
  { value: '단종', label: '⚫ 단종' },
];

export function ResultTable({ results, visibleHeaders, feeColumn, promoColumn }: Props) {
  const [filter, setFilter] = useState<ItemStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (filter !== 'all' && r._status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return visibleHeaders.some((h) => String(r[h] ?? '').toLowerCase().includes(q));
      }
      return true;
    });
  }, [results, filter, search, visibleHeaders]);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex rounded-lg border overflow-hidden">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-7 h-8 w-52 text-sm"
            placeholder="검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length}건</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-auto max-h-[520px]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/80 backdrop-blur-sm border-b">
              <th className="px-3 py-2.5 text-left font-semibold text-xs text-muted-foreground whitespace-nowrap w-20">
                상태
              </th>
              {visibleHeaders.map((h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 text-left font-semibold text-xs text-muted-foreground whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={`${row._key}-${i}`}
                className={`border-b last:border-0 transition-colors hover:brightness-95 dark:hover:brightness-110 ${STATUS_STYLE[row._status]}`}
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <Badge className={`text-xs ${BADGE_STYLE[row._status]}`}>
                    {row._status}
                  </Badge>
                </td>
                {visibleHeaders.map((h) => {
                  const isDiscontinued = row._status === '단종';
                  const isFeeUpdated = h === feeColumn && row._status === '업데이트';
                  const isPromoUpdated = promoColumn && h === promoColumn && row._status === '업데이트' && row._prevPromo !== undefined;

                  return (
                    <td
                      key={h}
                      className={`px-3 py-2 whitespace-nowrap ${
                        isDiscontinued ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {isFeeUpdated ? (
                        <span className="inline-flex flex-col gap-0.5">
                          <span className="font-semibold text-orange-700 dark:text-orange-400">
                            {String(row[h] ?? '')}
                          </span>
                          {row._prevRentalFee !== undefined && (
                            <span className="text-xs text-muted-foreground line-through">
                              {String(row._prevRentalFee)}
                            </span>
                          )}
                        </span>
                      ) : isPromoUpdated ? (
                        <span className="inline-flex flex-col gap-0.5">
                          <span className="font-semibold text-orange-700 dark:text-orange-400">
                            {String(row[h] ?? '')}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            {String(row._prevPromo)}
                          </span>
                        </span>
                      ) : (
                        String(row[h] ?? '')
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={visibleHeaders.length + 1}
                  className="px-3 py-12 text-center text-muted-foreground text-sm"
                >
                  해당하는 항목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

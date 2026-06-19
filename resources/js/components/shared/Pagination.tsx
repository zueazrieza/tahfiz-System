interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to   = Math.min(currentPage * itemsPerPage, totalItems);

  // Show at most 5 page numbers centered around currentPage
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 ${className}`}>
      <p className="text-xs text-slate-500">
        Papar <span className="font-semibold text-slate-700">{from}–{to}</span> daripada <span className="font-semibold text-slate-700">{totalItems}</span> rekod
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          ← Sebelum
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dot-${i}`} className="px-2 text-slate-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-8 h-8 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                p === currentPage
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Seterus →
        </button>
      </div>
    </div>
  );
}

export default function Pagination({ page, totalPages, onChange, label, alwaysShow }) {
    if (!alwaysShow && totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50">
            <span className="text-xs text-slate-500">{label || `Page ${page} sur ${totalPages}`}</span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg text-slate-500 hover:text-deep-blue hover:bg-deep-blue-soft disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all duration-150"
                >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                    }, [])
                    .map((p, i) =>
                        p === '...' ? (
                            <span key={`dots-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onChange(p)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    p === page
                                        ? 'bg-deep-blue text-white shadow-sm scale-105'
                                        : 'text-slate-600 hover:bg-deep-blue-soft hover:text-deep-blue'
                                }`}
                            >
                                {p}
                            </button>
                        )
                    )}
                <button
                    onClick={() => onChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:text-deep-blue hover:bg-deep-blue-soft disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all duration-150"
                >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.08-1.04l4.25 4.5a.75.75 0 0 1 0 1.08l-4.25 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>
                </button>
            </div>
        </div>
    );
}
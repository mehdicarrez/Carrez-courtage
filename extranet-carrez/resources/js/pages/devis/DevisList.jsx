import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const statutLabels = {
    BROUILLON: 'Brouillon',
    ENVOYE: 'Envoyé',
    ACCEPTE: 'Accepté',
    REFUSE: 'Refusé',
    EXPIRE: 'Expiré',
    TRANSFORME: 'Transformé',
    DEVIS_SIGNE: 'Devis signé',
};

const statutConfig = {
    BROUILLON: { cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    ENVOYE: { cls: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
    ACCEPTE: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    REFUSE: { cls: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
    EXPIRE: { cls: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
    TRANSFORME: { cls: 'bg-green-50 text-green-700 ring-green-200', dot: 'bg-green-600' },
    DEVIS_SIGNE: { cls: 'bg-teal-50 text-teal-700 ring-teal-200', dot: 'bg-teal-600' },
};

const eur = (cts) => cts != null ? (cts / 100).toFixed(2) + ' €' : '—';

export default function DevisList() {
    const [devis, setDevis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statut, setStatut] = useState('');
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / 25));

    const charger = (p = 1) => {
        setLoading(true);
        setPage(p);
        const params = { per_page: 25, page: p };
        if (statut) params.statut = statut;
        if (q.trim()) params.q = q.trim();
        api.get('/devis', { params })
            .then((res) => {
                setDevis(res.data.data);
                setTotal(res.data.meta?.total || 0);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        charger(1);
    }, [statut]);

    const rechercher = (e) => {
        e.preventDefault();
        charger(1);
    };

    return (
        <div>
            <div className="anim-in relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-50/60 p-6 mb-5 shadow-sm">
                <h1 className="text-2xl font-bold tracking-tight">
                    <span style={{ color: 'oklch(0.52 0.21 27.14)' }}>Devis</span>{' '}
                    <span style={{ color: 'oklch(0.39 0.21 263.59)' }}>émis</span>
                </h1>
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-deep-blue" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                    </svg>
                    Liste de tous les devis émis sur les demandes.
                </p>
            </div>

            <div className="bg-gradient-to-b from-slate-50 to-slate-50/60 border border-slate-200 rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center text-sm shadow-sm">
                <form onSubmit={rechercher} className="relative flex-1 min-w-[200px]">
                    <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                    </svg>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Rechercher (référence, client, amont)..."
                        className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue transition-shadow"
                    />
                </form>
                <select value={statut} onChange={(e) => setStatut(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-deep-blue">
                    <option value="">Tous les statuts</option>
                    {Object.entries(statutLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
            </div>

            {loading && (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                            <div className="flex gap-4">
                                <div className="h-4 bg-slate-200 rounded w-32"></div>
                                <div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div>
                            </div>
                            <div className="h-4 bg-slate-200 rounded w-2/3 mt-3"></div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && devis.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <p className="text-slate-500 font-medium">Aucun devis trouvé.</p>
                    <p className="text-sm text-slate-400 mt-1">Les devis apparaissent ici une fois créés depuis une demande.</p>
                </div>
            )}

            {!loading && devis.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3">Demande</th>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Branche</th>
                                    <th className="px-4 py-3">Prime HT</th>
                                    <th className="px-4 py-3">Prime TTC</th>
                                    <th className="px-4 py-3">Statut</th>
                                    <th className="px-4 py-3">Validité</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {devis.map((d) => {
                                    const sc = statutConfig[d.statut] || statutConfig.BROUILLON;
                                    return (
                                        <tr key={d.id} className="group border-b border-slate-100 hover:bg-slate-100 hover:shadow-sm transition-all duration-150">
                                            <td className="px-4 py-3 font-semibold text-deep-blue whitespace-nowrap">
                                                <Link to={`/demandes/${d.demande_id}`}>
                                                    {d.demande?.reference || '—'}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 font-medium">
                                                {d.demande?.client || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {d.demande?.branche || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                                                {eur(d.prime_ht_cts)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-medium">
                                                {eur(d.prime_ttc_cts)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${sc.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                                                    {statutLabels[d.statut] || d.statut}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                {d.date_validite ? new Date(d.date_validite).toLocaleDateString('fr-FR') : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    to={`/demandes/${d.demande_id}`}
                                                    title="Voir la demande"
                                                    className="p-2 rounded-lg text-slate-400 hover:text-deep-blue hover:bg-deep-blue-soft transition-colors inline-flex"
                                                >
                                                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" /></svg>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                            <span className="text-xs text-slate-500">
                                Page <span className="font-semibold text-slate-700">{page}</span> sur{' '}
                                <span className="font-semibold text-slate-700">{totalPages}</span>
                                {' · '}{total} devis au total
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => charger(page - 1)}
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
                                                onClick={() => charger(p)}
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
                                    onClick={() => charger(page + 1)}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg text-slate-500 hover:text-deep-blue hover:bg-deep-blue-soft disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all duration-150"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.08-1.04l4.25 4.5a.75.75 0 0 1 0 1.08l-4.25 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

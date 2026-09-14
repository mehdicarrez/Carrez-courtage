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
};

const statutConfig = {
    BROUILLON: { cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    ENVOYE: { cls: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
    ACCEPTE: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    REFUSE: { cls: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
    EXPIRE: { cls: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
    TRANSFORME: { cls: 'bg-green-50 text-green-700 ring-green-200', dot: 'bg-green-600' },
};

const eur = (cts) => cts != null ? (cts / 100).toFixed(2) + ' €' : '—';

export default function DevisList() {
    const [devis, setDevis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statut, setStatut] = useState('');
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

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
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-slate-900">Devis</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Liste de tous les devis émis sur les demandes.
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center text-sm shadow-sm">
                <form onSubmit={rechercher} className="relative flex-1 min-w-[200px]">
                    <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                    </svg>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Rechercher (référence, client, amont)..."
                        className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                </form>
                <select value={statut} onChange={(e) => setStatut(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
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
                                        <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-blue-700 whitespace-nowrap">
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
                                                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex"
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
                    {total > 25 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm text-slate-500">
                            <span>{total} devis au total</span>
                            <div className="flex gap-2">
                                <button onClick={() => charger(page - 1)} disabled={page <= 1}
                                    className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40">
                                    Précédent
                                </button>
                                <span className="px-3 py-1">Page {page}</span>
                                <button onClick={() => charger(page + 1)} disabled={devis.length < 25}
                                    className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40">
                                    Suivant
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

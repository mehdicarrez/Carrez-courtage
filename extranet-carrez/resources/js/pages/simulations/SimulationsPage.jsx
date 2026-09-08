import { useEffect, useState } from 'react';
import api from '../../api';

export default function SimulationsPage() {
    const [simulations, setSimulations] = useState([]);
    const [clients, setClients] = useState([]);
    const [filtres, setFiltres] = useState({ client_id: '', date_de: '', date_a: '' });
    const [selection, setSelection] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/clients', { params: { per_page: 500, ordre: 'nom' } })
            .then((res) => setClients(res.data.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        setSelection({});
        api.get('/simulations', { params: filtres })
            .then((res) => setSimulations(res.data.data))
            .catch(() => setError('Erreur de chargement.'))
            .finally(() => setLoading(false));
    }, [filtres]);

    const set = (k) => (e) => setFiltres((f) => ({ ...f, [k]: e.target.value }));

    const toggle = (id) =>
        setSelection((sel) => {
            const next = { ...sel };
            if (next[id]) delete next[id];
            else next[id] = true;
            return next;
        });

    const tousSelectionnables = simulations.length > 0 && Object.keys(selection).length === simulations.length;
    const toggleTous = () => setSelection(tousSelectionnables ? {} : Object.fromEntries(simulations.map((s) => [s.id, true])));

    const prime = (s) => {
        const est = s.estimation || {};
        if (est.prime_min == null || est.prime_max == null) return '—';
        return `${Number(est.prime_min).toFixed(2)} € – ${Number(est.prime_max).toFixed(2)} €` + (est.prime_mensuelle_min != null
            ? ` (${Number(est.prime_mensuelle_min).toFixed(2)}/mois)` : '');
    };

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-4">Mes simulations</h1>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

            {/* Filtres */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 flex flex-wrap items-end gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Client</label>
                    <select value={filtres.client_id} onChange={set('client_id')}
                        className="border border-slate-300 rounded-md px-2 py-1.5 text-sm min-w-[200px]">
                        <option value="">Tous les clients</option>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>{c.nom_complet || c.raison_sociale || `Client ${c.id}`}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date (période)</label>
                    <div className="flex items-center gap-2">
                        <input type="date" value={filtres.date_de} onChange={set('date_de')}
                            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
                        <span className="text-slate-500 text-sm">au</span>
                        <input type="date" value={filtres.date_a} onChange={set('date_a')}
                            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
                    </div>
                </div>
            </div>

            {/* Tableau */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-left">
                        <tr>
                            <th className="px-4 py-2 w-10">
                                <input type="checkbox" checked={tousSelectionnables}
                                    onChange={toggleTous} className="accent-blue-600" />
                            </th>
                            <th className="px-4 py-2">Référence</th>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Client</th>
                            <th className="px-4 py-2">Produit</th>
                            <th className="px-4 py-2">Simulation</th>
                            <th className="px-4 py-2">Document</th>
                        </tr>
                    </thead>
                    <tbody>
                        {simulations.map((s) => (
                            <tr key={s.id} className="border-t border-slate-100">
                                <td className="px-4 py-2">
                                    <input type="checkbox" checked={!!selection[s.id]}
                                        onChange={() => toggle(s.id)} className="accent-blue-600" />
                                </td>
                                <td className="px-4 py-2 text-blue-700 font-medium">{s.reference}</td>
                                <td className="px-4 py-2">{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                                <td className="px-4 py-2">{s.client_nom || '—'}</td>
                                <td className="px-4 py-2 text-slate-500">{s.produit}</td>
                                <td className="px-4 py-2">{prime(s)}</td>
                                <td className="px-4 py-2">
                                    {s.document ? (
                                        <a href={s.document.url} download={s.document.nom}
                                            className="inline-flex items-center gap-1.5 text-blue-700 hover:underline text-xs font-medium">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12a8.25 8.25 0 0 1 14.757-5.737m-1.12 4.36a8.15 8.15 0 0 1 2.114 1.094M8.25 20.25a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm10.5-4.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" />
                                            </svg>
                                            {s.document.nom}
                                        </a>
                                    ) : '—'}
                                </td>
                            </tr>
                        ))}
                        {!loading && simulations.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                    Aucune donnée à afficher
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {!loading && (
                    <div className="border-t border-slate-200 px-4 py-2.5 text-sm text-slate-500 bg-slate-50">
                        {Object.keys(selection).length > 0 && `${Object.keys(selection).length} sélectionnée(s) — `}{simulations.length} total
                    </div>
                )}
            </div>
        </div>
    );
}
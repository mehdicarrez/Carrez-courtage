import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';

const actions = [
    'login', 'logout', 'acces_', 'transition_etat',
    'demande.', 'devis.', 'contrat.', 'commission.', 'bordereau.',
    'partenaire.', 'utilisateur.', 'document.', 'message.', 'rgpd.', 'referentiel.',
];

export default function AuditPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({ action: '', objet_type: '', user_id: '', objet_id: '', depuis: '', jusqu_au: '', q: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const estAdmin = user?.role === 'ADMIN';

    const params = () => {
        const p = {};
        if (filters.action) p.action = filters.action;
        if (filters.objet_type) p.objet_type = filters.objet_type;
        if (filters.user_id) p.user_id = filters.user_id;
        if (filters.objet_id) p.objet_id = filters.objet_id;
        if (filters.depuis) p.depuis = filters.depuis;
        if (filters.jusqu_au) p.jusqu_au = filters.jusqu_au;
        if (filters.q) p.q = filters.q;
        return p;
    };

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/audit', { params: params() });
            setLogs(res.data.data);
            setTotal(res.data.meta?.total || 0);
        } catch (err) {
            setError(err.response?.status === 403 ? 'Accès réservé à un administrateur.' : 'Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, []);

    const exporter = async () => {
        try {
            const res = await api.get('/audit/export', { params: params(), responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'journal-audit.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            setError('Erreur d\'export.');
        }
    };

    if (estAdmin === false && user) {
        return <div className="bg-red-50 text-red-700 p-4 rounded">Accès réservé à un administrateur.</div>;
    }

    const input = 'border border-slate-300 rounded px-2 py-1.5 text-sm';

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold text-slate-900">Journal d'audit</h1>
                <button onClick={exporter} className="text-sm px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800">Exporter CSV</button>
            </div>
            <div className="text-sm text-slate-500 mb-4">{total} entrée(s) — journal en ajout seul, aucune modification/suppression possible (RG-62/63).</div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4">
                <div className="flex flex-wrap gap-2 items-center">
                    <input className={input} value={filters.q} placeholder="Recherche libre (action/détail)..."
                        onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
                    <select className={input} value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
                        <option value="">Toutes actions</option>
                        {actions.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select className={input} value={filters.objet_type} onChange={(e) => setFilters({ ...filters, objet_type: e.target.value })}>
                        <option value="">Tous objets</option>
                        {['demande', 'devis', 'contrat', 'partenaire', 'utilisateur', 'conversation', 'document', 'bordereau', 'user', 'referentiel', 'journal_audit'].map((o) => (
                            <option key={o} value={o}>{o}</option>
                        ))}
                    </select>
                    <input className={`${input} w-24`} value={filters.user_id} placeholder="User ID"
                        onChange={(e) => setFilters({ ...filters, user_id: e.target.value })} />
                    <input className={`${input} w-24`} value={filters.objet_id} placeholder="Objet ID"
                        onChange={(e) => setFilters({ ...filters, objet_id: e.target.value })} />
                    <label className="text-xs text-slate-500 flex items-center gap-1">Du
                        <input type="date" className={input} value={filters.depuis} onChange={(e) => setFilters({ ...filters, depuis: e.target.value })} />
                    </label>
                    <label className="text-xs text-slate-500 flex items-center gap-1">Au
                        <input type="date" className={input} value={filters.jusqu_au} onChange={(e) => setFilters({ ...filters, jusqu_au: e.target.value })} />
                    </label>
                    <button onClick={load} className="px-3 py-1.5 rounded bg-slate-800 text-white text-sm">Filtrer</button>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
            {loading && <div className="text-slate-500">Chargement...</div>}

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-left">
                        <tr>
                            <th className="px-4 py-2">Horodatage</th>
                            <th className="px-4 py-2">Utilisateur</th>
                            <th className="px-4 py-2">Action</th>
                            <th className="px-4 py-2">Objet</th>
                            <th className="px-4 py-2">Détail</th>
                            <th className="px-4 py-2">IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((l) => (
                            <tr key={l.id} className="border-t border-slate-100">
                                <td className="px-4 py-2 whitespace-nowrap">{l.horodatage}</td>
                                <td className="px-4 py-2">{l.user || '—'}</td>
                                <td className="px-4 py-2 font-mono text-xs">{l.action}</td>
                                <td className="px-4 py-2">{l.objet_type} {l.objet_id ? `#${l.objet_id}` : ''}</td>
                                <td className="px-4 py-2 text-slate-500">{l.detail || '—'}</td>
                                <td className="px-4 py-2">{l.ip || '—'}</td>
                            </tr>
                        ))}
                        {!loading && logs.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Aucune entrée.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

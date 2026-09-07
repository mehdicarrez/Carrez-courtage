import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../auth';

export default function EcheancesPage() {
    const { user } = useAuth();
    const estCabinet = ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user?.role);
    const [echeances, setEcheances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(null);

    useEffect(() => {
        api.get('/echeances')
            .then((res) => setEcheances(res.data.data))
            .catch(() => setError('Erreur de chargement.'))
            .finally(() => setLoading(false));
    }, []);

    const relancer = async (id) => {
        setBusy(id);
        try {
            const res = await api.post(`/contrats/${id}/relancer`);
            setEcheances((prev) => prev.map((e) => e.id === id ? { ...e, derniere_relance: res.data.data.derniere_relance } : e));
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur.');
        } finally {
            setBusy(null);
        }
    };

    const couleur = (j) => {
        if (j <= 30) return 'bg-red-50 text-red-700';
        if (j <= 60) return 'bg-amber-50 text-amber-700';
        return 'bg-slate-50 text-slate-700';
    };

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-4">Échéancier (120 jours)</h1>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
            {loading && <div className="text-slate-500">Chargement...</div>}

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-left">
                        <tr>
                            <th className="px-4 py-2">Référence</th>
                            <th className="px-4 py-2">Client</th>
                            <th className="px-4 py-2">Partenaire</th>
                            <th className="px-4 py-2">Produit</th>
                            <th className="px-4 py-2">Échéance</th>
                            <th className="px-4 py-2">Jours</th>
                            <th className="px-4 py-2 text-right">Prime TTC</th>
                            <th className="px-4 py-2">Dernière relance</th>
                            {estCabinet && <th className="px-4 py-2">Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {echeances.map((e) => (
                            <tr key={e.id} className="border-t border-slate-100">
                                <td className="px-4 py-2">
                                    <Link to={`/contrats/${e.id}`} className="text-blue-700 hover:underline">{e.reference}</Link>
                                </td>
                                <td className="px-4 py-2">{e.client || '—'}</td>
                                <td className="px-4 py-2 text-slate-500">{e.partenaire || '—'}</td>
                                <td className="px-4 py-2 text-slate-500">{e.produit || '—'}</td>
                                <td className="px-4 py-2">{e.date_echeance}</td>
                                <td className="px-4 py-2">
                                    <span className={`text-xs px-2 py-1 rounded ${couleur(e.j_restants)}`}>{e.j_restants} j</span>
                                </td>
                                <td className="px-4 py-2 text-right font-medium">{((e.prime_ttc_cts ?? 0) / 100).toFixed(2)} €</td>
                                <td className="px-4 py-2 text-slate-500 text-xs">
                                    {e.derniere_relance ? new Date(e.derniere_relance).toLocaleDateString('fr-FR') : '—'}
                                </td>
                                {estCabinet && (
                                    <td className="px-4 py-2">
                                        <button onClick={() => relancer(e.id)} disabled={busy === e.id}
                                            className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                                            {busy === e.id ? '...' : 'Relancer'}
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {!loading && echeances.length === 0 && (
                            <tr>
                                <td colSpan={estCabinet ? 9 : 8} className="px-4 py-6 text-center text-slate-500">
                                    Aucune échéance dans les 120 prochains jours.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

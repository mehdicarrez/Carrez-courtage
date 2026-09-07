import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const statutBadge = (s) => {
    const map = {
        ACTIVE: 'bg-emerald-50 text-emerald-700',
        EN_VALIDATION: 'bg-amber-50 text-amber-700',
        SUSPENDUE: 'bg-red-50 text-red-700',
        REFUSEE: 'bg-gray-100 text-gray-600',
    };
    return `text-xs px-2 py-0.5 inline-block rounded ${map[s] || 'bg-slate-100 text-slate-600'}`;
};

export default function PartenairesList() {
    const [partenaires, setPartenaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [statut, setStatut] = useState('');
    const [q, setQ] = useState('');

    const load = async () => {
        setLoading(true);
        setMsg('');
        try {
            const params = {};
            if (statut) params.statut = statut;
            if (q.trim()) params.q = q.trim();
            const res = await api.get('/partenaires', { params });
            setPartenaires(res.data.data);
        } catch {
            setMsg('Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, [statut, q]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-slate-900">Gestion des partenaires</h1>
            </div>

            {msg && <div className="bg-amber-50 text-amber-700 p-3 rounded mb-4 text-sm">{msg}</div>}

            {/* Filtres */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 flex flex-wrap gap-2 items-center text-sm">
                <input value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher (nom, SIREN, ORIAS)..."
                    className="border border-slate-300 rounded px-2 py-1 w-64" />
                <select value={statut} onChange={(e) => setStatut(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-1">
                    <option value="">Tous les statuts</option>
                    <option value="ACTIVE">Actifs</option>
                    <option value="EN_VALIDATION">En validation</option>
                    <option value="SUSPENDUE">Suspendus</option>
                    <option value="REFUSEE">Refusés</option>
                </select>
            </div>

            {loading && <div className="text-slate-500">Chargement...</div>}

            <div className="space-y-3">
                {partenaires.map((p) => (
                    <Link key={p.id} to={`/partenaires/${p.id}`}
                        className="block bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-slate-900">{p.raison_sociale}</div>
                                <div className="text-sm text-slate-500 mt-0.5">
                                    SIREN {p.siren || '—'} · ORIAS {p.numero_orias || '—'}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {p.nb_pieces_expirees > 0 && (
                                    <span className="text-xs text-red-600 font-medium">{p.nb_pieces_expirees} pièce(s) expirée(s)</span>
                                )}
                                <span className={statutBadge(p.statut)}>{p.statut}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                            <span>{p.nb_utilisateurs ?? 0} utilisateur(s)</span>
                            <span>{p.nb_contrats ?? 0} demande(s)</span>
                        </div>
                    </Link>
                ))}
                {!loading && partenaires.length === 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">Aucun partenaire.</div>
                )}
            </div>
        </div>
    );
}

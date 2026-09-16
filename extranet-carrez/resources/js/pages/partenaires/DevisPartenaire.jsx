import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const statutBadges = {
    BROUILLON: 'bg-slate-100 text-slate-600',
    ENVOYE: 'bg-blue-50 text-blue-700',
    ACCEPTE: 'bg-emerald-50 text-emerald-700',
    REFUSE: 'bg-red-50 text-red-700',
    EXPIRE: 'bg-amber-50 text-amber-700',
    TRANSFORME: 'bg-violet-50 text-violet-700',
    CONTRAT_SIGNE: 'bg-teal-50 text-teal-700',
};

const statutLabels = {
    BROUILLON: 'Brouillon',
    ENVOYE: 'Envoyé',
    ACCEPTE: 'Accepté',
    REFUSE: 'Refusé',
    EXPIRE: 'Expiré',
    TRANSFORME: 'Transformé',
    CONTRAT_SIGNE: 'Contrat signé',
};

const montant = (cts) =>
    cts == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cts / 100);

export default function DevisPartenaire() {
    const [devis, setDevis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statut, setStatut] = useState('');
    const [total, setTotal] = useState(0);

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (statut) params.statut = statut;
            const res = await api.get('/devis', { params });
            setDevis(res.data.data);
            setTotal(res.data.meta.total);
        } catch {
            // silencieux
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statut]);

    return (
        <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Devis</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {total > 0 ? `${total} devis` : 'Aucune donnée'}
                    </p>
                </div>
                <div className="ml-auto">
                    {['', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE', 'TRANSFORME', 'CONTRAT_SIGNE'].map((s) => (
                        <button
                            key={s || 'tous'}
                            onClick={() => setStatut(s)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium mr-2 last:mr-0 transition-colors ${
                                statut === s
                                    ? 'bg-blue-700 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {s === '' ? 'Tous' : statutLabels[s] || s}
                        </button>
                    ))}
                </div>
            </div>

            {loading && <div className="text-slate-500">Chargement...</div>}

            {!loading && devis.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
                    <p className="text-slate-500 font-medium">Aucun devis trouvé.</p>
                </div>
            )}

            {!loading && devis.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3">Référence</th>
                                    <th className="px-4 py-3">Demande</th>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Branche</th>
                                    <th className="px-4 py-3">Prime TTC</th>
                                    <th className="px-4 py-3">Validité</th>
                                    <th className="px-4 py-3">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {devis.map((d) => (
                                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                            {d.reference_amont || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                to={`/espace-partenaire/demandes/${d.demande.id}`}
                                                className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
                                            >
                                                {d.demande.reference}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{d.demande.client || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{d.demande.branche || '—'}</td>
                                        <td className="px-4 py-3 text-slate-900 font-medium whitespace-nowrap">
                                            {montant(d.prime_ttc_cts)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                            {d.date_validite ? new Date(d.date_validite).toLocaleDateString('fr-FR') : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statutBadges[d.statut] || statutBadges.BROUILLON}`}>
                                                {statutLabels[d.statut] || d.statut}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

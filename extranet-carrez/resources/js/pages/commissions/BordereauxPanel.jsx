import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';

const fmt = (cts) => ((cts ?? 0) / 100).toFixed(2);
const fmtDate = (d) => (d ? String(d).slice(0, 10) : '—');

const telecharger = async (id, format) => {
    try {
        const res = await api.get(`/bordereaux/${id}/${format}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `bordereau-${id}.${format === 'pdf' ? 'pdf' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch {
        // silencieux
    }
};

const statutBadge = (s) => {
    const map = {
        GENERATION: 'bg-slate-100 text-slate-600',
        A_VERIFIER: 'bg-amber-50 text-amber-700',
        VALIDE: 'bg-blue-50 text-blue-700',
        PUBLIE: 'bg-purple-50 text-purple-700',
        PAYE: 'bg-emerald-50 text-emerald-700',
    };
    return `text-xs px-2 py-0.5 rounded ${map[s] || 'bg-slate-100 text-slate-600'}`;
};

export default function BordereauxPanel() {
    const { user } = useAuth();
    const estCabinet = ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user?.role);

    const [bordereaux, setBordereaux] = useState([]);
    const [partenaires, setPartenaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Vue détail
    const [détailId, setDétailId] = useState(null);
    const [détail, setDétail] = useState(null);
    const [détailLoading, setDétailLoading] = useState(false);

    // Formulaire génération
    const [genForm, setGenForm] = useState(null);
    const [genBusy, setGenBusy] = useState(false);

    // Déclaration paiement
    const [paiementForm, setPaiementForm] = useState(false);
    const [paiement, setPaiement] = useState({ date_paiement: '', montant_cts: '' });
    const [paiementBusy, setPaiementBusy] = useState(false);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get('/bordereaux');
            setBordereaux(res.data.data);
            if (estCabinet && partenaires.length === 0) {
                api.get('/partenaires?per_page=100').then((r) => setPartenaires(r.data.data)).catch(() => {});
            }
        } catch {
            setError('Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, []);

    const chargerDetail = async (id) => {
        setDétailId(id);
        setDétail(null);
        setDétailLoading(true);
        try {
            const res = await api.get(`/bordereaux/${id}`);
            setDétail(res.data);
        } catch {
            setError('Erreur de chargement du détail.');
        } finally {
            setDétailLoading(false);
        }
    };

    const generer = async () => {
        if (!genForm || !genForm.organisation_id || !genForm.periode_debut || !genForm.periode_fin) return;
        setGenBusy(true);
        try {
            await api.post('/bordereaux', genForm);
            setGenForm(null);
            await load();
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur de génération.');
        } finally {
            setGenBusy(false);
        }
    };

    const action = async (id, actionName) => {
        try {
            await api.post(`/bordereaux/${id}/${actionName}`);
            await load();
            if (détailId === id) await chargerDetail(id);
        } catch (e) {
            setError(e.response?.data?.message || "Erreur lors de l'action.");
        }
    };

    const declarerPaiement = async () => {
        if (!détail || !paiement.date_paiement || !paiement.montant_cts) return;
        setPaiementBusy(true);
        try {
            await api.post(`/bordereaux/${détail.data.id}/paiement`, {
                date_paiement: paiement.date_paiement,
                montant_cts: parseInt(paiement.montant_cts, 10),
            });
            setPaiementForm(false);
            setPaiement({ date_paiement: '', montant_cts: '' });
            await chargerDetail(détail.data.id);
            await load();
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur.');
        } finally {
            setPaiementBusy(false);
        }
    };

    return (
        <div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

            {/* Bouton génération */}
            {estCabinet && (
                <div className="mb-4">
                    <button
                        onClick={() => setGenForm({ organisation_id: '', periode_debut: '', periode_fin: '' })}
                        className="text-sm px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800"
                    >
                        + Générer un bordereau
                    </button>
                </div>
            )}

            {/* Formulaire génération */}
            {genForm && (
                <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-4 text-sm">
                    <h3 className="font-semibold text-slate-900 mb-3">Génération d'un bordereau</h3>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                            <label className="text-slate-500 text-xs">Partenaire</label>
                            <select
                                value={genForm.organisation_id}
                                onChange={(e) => setGenForm({ ...genForm, organisation_id: e.target.value })}
                                className="block w-full border border-slate-300 rounded px-2 py-1 mt-1"
                            >
                                <option value="">Sélectionner...</option>
                                {partenaires.map((p) => <option key={p.id} value={p.id}>{p.raison_sociale}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-slate-500 text-xs">Période début</label>
                            <input type="date" value={genForm.periode_debut}
                                onChange={(e) => setGenForm({ ...genForm, periode_debut: e.target.value })}
                                className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                        </div>
                        <div>
                            <label className="text-slate-500 text-xs">Période fin</label>
                            <input type="date" value={genForm.periode_fin}
                                onChange={(e) => setGenForm({ ...genForm, periode_fin: e.target.value })}
                                className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={generer} disabled={genBusy || !genForm.organisation_id || !genForm.periode_debut || !genForm.periode_fin}
                            className="px-3 py-1 rounded text-sm bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">
                            {genBusy ? 'Génération...' : 'Générer'}
                        </button>
                        <button onClick={() => setGenForm(null)} className="px-3 py-1 rounded text-sm border border-slate-300">Annuler</button>
                    </div>
                </div>
            )}

            {loading && <div className="text-slate-500">Chargement...</div>}

            {!loading && bordereaux.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">Aucun bordereau.</div>
            )}

            {/* Liste */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-left">
                        <tr>
                            <th className="px-4 py-2">Référence</th>
                            {estCabinet && <th className="px-4 py-2">Partenaire</th>}
                            <th className="px-4 py-2">Période</th>
                            <th className="px-4 py-2 text-right">Brut</th>
                            <th className="px-4 py-2 text-right">Reprises</th>
                            <th className="px-4 py-2 text-right">Net</th>
                            <th className="px-4 py-2">Statut</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {bordereaux.map((b) => (
                            <tr key={b.id} className="border-t border-slate-100">
                                <td className="px-4 py-2 font-medium">{b.reference}</td>
                                {estCabinet && <td className="px-4 py-2">{b.partenaire || '—'}</td>}
                                <td className="px-4 py-2">{fmtDate(b.periode_debut)} → {fmtDate(b.periode_fin)}</td>
                                <td className="px-4 py-2 text-right">{fmt(b.total_brut_cts)} €</td>
                                <td className="px-4 py-2 text-right">{fmt(b.total_reprises_cts)} €</td>
                                <td className="px-4 py-2 text-right font-medium">{fmt(b.net_a_payer_cts)} €</td>
                                <td className="px-4 py-2"><span className={statutBadge(b.statut)}>{b.statut}</span></td>
                                <td className="px-4 py-2 text-right">
                                    <button onClick={() => chargerDetail(b.id)} className="text-blue-700 hover:underline text-xs font-medium">
                                        {détailId === b.id ? 'Masquer' : 'Détail'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && bordereaux.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">Aucun bordereau.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Détail */}
            {détailId && (
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                    {détailLoading && <div className="text-slate-500">Chargement du détail...</div>}
                    {détail && (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-900">
                                    {détail.data.reference}
                                    <span className={`ml-2 ${statutBadge(détail.data.statut)}`}>{détail.data.statut}</span>
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => telecharger(détail.data.id, 'pdf')}
                                        className="text-xs px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50">PDF</button>
                                    <button onClick={() => telecharger(détail.data.id, 'csv')}
                                        className="text-xs px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50">CSV</button>
                                </div>
                            </div>
                            <div className="text-sm text-slate-500 mb-4">
                                {estCabinet && (<span>Partenaire : {détail.partenaire || '—'} · </span>)}
                                {fmtDate(détail.data.periode_debut)} → {fmtDate(détail.data.periode_fin)}
                                {détail.data.commentaire_comptable && <span> · {détail.data.commentaire_comptable}</span>}
                            </div>

                            {estCabinet && !détail.data.est_immuable && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {détail.data.statut === 'A_VERIFIER' && (
                                        <button onClick={() => action(détail.data.id, 'valider')}
                                            className="text-xs px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800">Valider</button>
                                    )}
                                    {détail.data.statut === 'VALIDE' && (
                                        <button onClick={() => action(détail.data.id, 'publier')}
                                            className="text-xs px-3 py-1.5 rounded bg-purple-700 text-white hover:bg-purple-800">Publier</button>
                                    )}
                                    {détail.data.statut === 'PUBLIE' && (
                                        <button onClick={() => { setPaiementForm(true); setPaiement({ date_paiement: '', montant_cts: '' }); }}
                                            className="text-xs px-3 py-1.5 rounded bg-emerald-700 text-white hover:bg-emerald-800">Déclarer paiement</button>
                                    )}
                                </div>
                            )}

                            {paiementForm && (
                                <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-4 text-sm">
                                    <h4 className="font-semibold text-slate-900 mb-2">Déclaration de paiement</h4>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="text-slate-500 text-xs">Date de paiement</label>
                                            <input type="date" value={paiement.date_paiement}
                                                onChange={(e) => setPaiement({ ...paiement, date_paiement: e.target.value })}
                                                className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                        </div>
                                        <div>
                                            <label className="text-slate-500 text-xs">Montant (cts)</label>
                                            <input type="number" value={paiement.montant_cts}
                                                onChange={(e) => setPaiement({ ...paiement, montant_cts: e.target.value })}
                                                className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={declarerPaiement} disabled={paiementBusy || !paiement.date_paiement || !paiement.montant_cts}
                                            className="px-3 py-1 rounded text-sm bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50">Enregistrer</button>
                                        <button onClick={() => setPaiementForm(false)} className="px-3 py-1 rounded text-sm border border-slate-300">Annuler</button>
                                    </div>
                                </div>
                            )}

                            {/* Lignes */}
                            <h4 className="font-medium text-slate-900 mb-2 text-sm">Lignes ({détail.lignes.length})</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-left">
                                        <tr>
                                            <th className="px-3 py-2">Contrat</th>
                                            <th className="px-3 py-2">Client</th>
                                            <th className="px-3 py-2">Produit</th>
                                            <th className="px-3 py-2">Période</th>
                                            <th className="px-3 py-2 text-right">Assiette</th>
                                            <th className="px-3 py-2 text-right">Taux</th>
                                            <th className="px-3 py-2 text-right">Montant</th>
                                            <th className="px-3 py-2">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {détail.lignes.map((l) => (
                                            <tr key={l.id} className="border-t border-slate-100">
                                                <td className="px-3 py-2">{l.contrat_reference || '—'}</td>
                                                <td className="px-3 py-2">{l.client || '—'}</td>
                                                <td className="px-3 py-2">{l.produit || '—'}</td>
                                                <td className="px-3 py-2">{fmtDate(l.periode_debut)} → {fmtDate(l.periode_fin)}</td>
                                                <td className="px-3 py-2 text-right">{l.assiette_cts ? fmt(l.assiette_cts) + ' €' : '—'}</td>
                                                <td className="px-3 py-2 text-right">{l.taux != null ? `${l.taux} %` : '—'}</td>
                                                <td className="px-3 py-2 text-right font-medium">{fmt(l.montant_cts)} €</td>
                                                <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded bg-slate-100">{l.statut}</span></td>
                                            </tr>
                                        ))}
                                        {détail.lignes.length === 0 && (
                                            <tr><td colSpan={8} className="px-3 py-4 text-center text-slate-500">Aucune ligne.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paiements */}
                            {détail.paiements.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-medium text-slate-900 mb-2 text-sm">Paiements déclarés</h4>
                                    {détail.paiements.map((p) => (
                                        <div key={p.id} className="text-sm text-slate-600 border-t border-slate-100 py-1.5 flex justify-between">
                                            <span>{fmtDate(p.date_paiement)}{p.reference ? ` — ${p.reference}` : ''}</span>
                                            <span className="font-medium">{fmt(p.montant_cts)} €</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

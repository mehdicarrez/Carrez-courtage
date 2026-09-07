import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../auth';

const fmt = (cts) => ((cts ?? 0) / 100).toFixed(2);
const fmtDate = (d) => (d ? String(d).slice(0, 10) : '—');

const statutBadge = (s) => {
    const map = {
        ACTIVE: 'bg-emerald-50 text-emerald-700',
        EN_VALIDATION: 'bg-amber-50 text-amber-700',
        SUSPENDUE: 'bg-red-50 text-red-700',
        REFUSEE: 'bg-gray-100 text-gray-600',
    };
    return `text-xs px-2 py-1 rounded ${map[s] || 'bg-slate-100 text-slate-600'}`;
};

const TABS = [
    { key: 'detail', label: 'Détail' },
    { key: 'pieces', label: 'Pièces' },
    { key: 'baremes', label: 'Barèmes' },
    { key: 'stats', label: 'Statistiques' },
];

export default function PartenaireDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const estAdmin = user?.role === 'ADMIN';
    const estCabinet = ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user?.role);

    const [data, setData] = useState(null);
    const [onglet, setOnglet] = useState('detail');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Validation candidature
    const [checklist, setChecklist] = useState([]);
    const [branchesAut, setBranchesAut] = useState([]);
    const [refusMotif, setRefusMotif] = useState('');
    const [showRefus, setShowRefus] = useState(false);
    const [busy, setBusy] = useState(false);

    // Pièces
    const [pieceForm, setPieceForm] = useState(null);

    // Barème
    const [baremeForm, setBaremeForm] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/partenaires/${id}`);
            setData(res.data.data);
            if (res.data.data.checklist_validation?.length) setChecklist(res.data.data.checklist_validation);
            if (res.data.data.branches_autorisees?.length) setBranchesAut(res.data.data.branches_autorisees);
        } catch (e) {
            setError(e.response?.status === 404 ? 'Partenaire introuvable.' : 'Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const toggleCheck = (cle) => {
        setChecklist((prev) => prev.map((c) => (c.cle === cle ? { ...c, ok: !c.ok } : c)));
    };

    const valider = async () => {
        setBusy(true);
        try {
            await api.post(`/partenaires/${id}/valider`, { checklist_validation: checklist, branches_autorisees: branchesAut });
            await load();
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur de validation.');
        } finally {
            setBusy(false);
        }
    };

    const refuser = async () => {
        if (!refusMotif.trim()) return;
        setBusy(true);
        try {
            await api.post(`/partenaires/${id}/refuser`, { motif: refusMotif.trim() });
            setShowRefus(false);
            setRefusMotif('');
            await load();
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur.');
        } finally {
            setBusy(false);
        }
    };

    const suspendre = async () => {
        const motif = window.prompt('Motif de la suspension :');
        if (motif === null) return;
        try {
            await api.post(`/partenaires/${id}/suspendre`, { motif });
            await load();
        } catch (e) { setError(e.response?.data?.message || 'Erreur.'); }
    };

    const reactiver = async () => {
        try {
            await api.post(`/partenaires/${id}/reactiver`);
            await load();
        } catch (e) { setError(e.response?.data?.message || 'Erreur.'); }
    };

    const controlePiece = async (pieceId) => {
        setBusy(true);
        try {
            await api.put(`/partenaires/${id}/pieces/${pieceId}`, pieceForm);
            setPieceForm(null);
            await load();
        } catch (e) { setError(e.response?.data?.message || 'Erreur.'); }
        finally { setBusy(false); }
    };

    const creerBareme = async () => {
        setBusy(true);
        try {
            await api.post(`/partenaires/${id}/baremes`, baremeForm);
            setBaremeForm(null);
            await load();
        } catch (e) { setError(e.response?.data?.message || 'Erreur.'); }
        finally { setBusy(false); }
    };

    if (loading) return <div className="text-slate-500">Chargement...</div>;
    if (!data) return <div className="bg-red-50 text-red-700 p-4 rounded">{error || 'Fiche indisponible.'}</div>;

    const toutesCochees = checklist.length > 0 && checklist.every((c) => c.ok);

    return (
        <div>
            <button onClick={() => navigate('/partenaires')} className="text-sm text-blue-700 hover:underline mb-2">← Retour</button>
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl font-bold text-slate-900">{data.raison_sociale}</h1>
                <span className={statutBadge(data.statut)}>{data.statut}</span>
            </div>
            <div className="text-sm text-slate-500 mb-4">
                {data.siren ? `SIREN ${data.siren}` : '—'} · ORIAS {data.numero_orias || '—'} · {data.ville || '—'}
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

            {/* Actions admin */}
            {estAdmin && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {data.statut === 'EN_VALIDATION' && (
                        <>
                            <button onClick={valider} disabled={busy || !toutesCochees || branchesAut.length === 0}
                                className="text-sm px-3 py-1.5 rounded bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50">
                                Valider la candidature
                            </button>
                            <button onClick={() => setShowRefus(true)} className="text-sm px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">Refuser</button>
                        </>
                    )}
                    {data.statut === 'ACTIVE' && (
                        <button onClick={suspendre} className="text-sm px-3 py-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100">Suspendre</button>
                    )}
                    {data.statut === 'SUSPENDUE' && (
                        <button onClick={reactiver} className="text-sm px-3 py-1.5 rounded bg-green-50 text-green-700 hover:bg-green-100">Réactiver</button>
                    )}
                </div>
            )}

            {/* Onglets */}
            <div className="flex gap-1 border-b border-slate-200 mb-4">
                {TABS.filter((t) => t.key !== 'stats' || estCabinet).map((t) => (
                    <button key={t.key} onClick={() => setOnglet(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px ${
                            onglet === t.key ? 'bg-white border border-slate-200 text-blue-700' : 'text-slate-500 hover:text-slate-700'
                        }`}>{t.label}</button>
                ))}
            </div>

            {/* ===== DÉTAIL ===== */}
            {onglet === 'detail' && (
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {[
                            ['Forme juridique', data.forme_juridique || '—'],
                            ['SIRET', data.siret || '—'],
                            ['Adresse', data.adresse || '—'],
                            ['Ville / CP', `${data.ville || '—'} ${data.code_postal || ''}`.trim()],
                            ['Catégories ORIAS', (data.categories_orias || []).join(', ') || '—'],
                            ['Date activation', fmtDate(data.date_activation)],
                            ['Décision', data.decision || '—'],
                            ['Motif décision', data.motif_decision || '—'],
                            ['Utilisateurs', data.utilisateurs?.length ?? data.nb_utilisateurs ?? 0],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <dt className="text-slate-500 text-xs uppercase tracking-wide">{k}</dt>
                                <dd className="mt-0.5 font-medium text-slate-900">{v}</dd>
                            </div>
                        ))}
                    </dl>

                    {data.statut === 'SUSPENDUE' && data.motif_suspension && (
                        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded text-sm">
                            Suspension : {data.motif_suspension} (le {fmtDate(data.date_suspension)})
                        </div>
                    )}

                    <h3 className="font-medium text-slate-900 mt-6 mb-2 text-sm">Utilisateurs</h3>
                    <div className="text-sm border-t border-slate-100">
                        {(data.utilisateurs || []).map((u) => (
                            <div key={u.id} className="flex items-center justify-between py-2 border-b border-slate-100">
                                <div>
                                    <span className="font-medium">{u.name}</span>
                                    <span className="text-slate-500 ml-2">{u.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{u.role}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${u.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {u.actif ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {(data.utilisateurs || []).length === 0 && <div className="py-2 text-slate-500">Aucun utilisateur.</div>}
                    </div>
                </div>
            )}

            {/* ===== PIÈCES ===== */}
            {onglet === 'pieces' && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-left">
                            <tr>
                                <th className="px-4 py-2">Pièce</th>
                                <th className="px-4 py-2">Validité</th>
                                <th className="px-4 py-2">Statut</th>
                                <th className="px-4 py-2">Commentaire</th>
                                {estCabinet && <th className="px-4 py-2"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {(data.pieces || []).map((p) => (
                                <tr key={p.id} className="border-t border-slate-100">
                                    <td className="px-4 py-2">
                                        <span className="font-medium">{p.type_libelle || p.type_code || '—'}</span>
                                        <span className="text-slate-400 ml-2 text-xs">{p.type_code}</span>
                                    </td>
                                    <td className="px-4 py-2">{fmtDate(p.date_validite)}{p.expiree && <span className="text-red-600 ml-1 text-xs">expirée</span>}</td>
                                    <td className="px-4 py-2">
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            p.statut_controle === 'VALIDE' ? 'bg-emerald-50 text-emerald-700' :
                                            p.statut_controle === 'EXPIREE' ? 'bg-red-50 text-red-700' :
                                            'bg-amber-50 text-amber-700'
                                        }`}>{p.statut_controle || 'EN_ATTENTE'}</span>
                                    </td>
                                    <td className="px-4 py-2 text-slate-500">{p.commentaire_controle || '—'}</td>
                                    {estCabinet && (
                                        <td className="px-4 py-2 text-right">
                                            <button onClick={() => setPieceForm({
                                                pieceId: p.id,
                                                statut_controle: p.statut_controle || 'EN_ATTENTE',
                                                date_validite: p.date_validite || '',
                                                commentaire: p.commentaire_controle || '',
                                            })} className="text-xs text-blue-700 hover:underline">Contrôler</button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {(data.pieces || []).length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Aucune pièce réglementaire.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {pieceForm && (
                        <div className="border-t border-slate-200 bg-slate-50 p-4 text-sm">
                            <h4 className="font-medium text-slate-900 mb-3">Contrôle de la pièce</h4>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div>
                                    <label className="text-slate-500 text-xs">Statut du contrôle</label>
                                    <select value={pieceForm.statut_controle}
                                        onChange={(e) => setPieceForm({ ...pieceForm, statut_controle: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1">
                                        <option value="VALIDE">Valide</option>
                                        <option value="EXPIREE">Expirée</option>
                                        <option value="EN_ATTENTE">En attente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Date de validité</label>
                                    <input type="date" value={pieceForm.date_validite}
                                        onChange={(e) => setPieceForm({ ...pieceForm, date_validite: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Commentaire</label>
                                    <input value={pieceForm.commentaire}
                                        onChange={(e) => setPieceForm({ ...pieceForm, commentaire: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => controlePiece(pieceForm.pieceId)} disabled={busy}
                                    className="px-3 py-1 rounded text-sm bg-blue-700 text-white hover:bg-blue-800">Enregistrer</button>
                                <button onClick={() => setPieceForm(null)} className="px-3 py-1 rounded text-sm border border-slate-300">Annuler</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===== BARÈMES ===== */}
            {onglet === 'baremes' && (
                <div>
                    {estCabinet && (
                        <div className="mb-4">
                            <button onClick={() => setBaremeForm({
                                produit_id: '', date_debut: '', date_fin: '',
                                assiette: 'PERCENT_COMMISSION_CABINET', taux_1ere_annee: '',
                                taux_renouvellement: '', duree_reprise_mois: '', modalite_reprise: 'PRORATA',
                            })} className="text-sm px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800">
                                + Nouveau barème
                            </button>
                        </div>
                    )}

                    {baremeForm && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-4 text-sm">
                            <h4 className="font-medium text-slate-900 mb-3">Nouveau barème</h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-slate-500 text-xs">Date début</label>
                                    <input type="date" value={baremeForm.date_debut}
                                        onChange={(e) => setBaremeForm({ ...baremeForm, date_debut: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Date fin</label>
                                    <input type="date" value={baremeForm.date_fin}
                                        onChange={(e) => setBaremeForm({ ...baremeForm, date_fin: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Assiette</label>
                                    <select value={baremeForm.assiette}
                                        onChange={(e) => setBaremeForm({ ...baremeForm, assiette: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1">
                                        <option value="PERCENT_COMMISSION_CABINET">% commission cabinet</option>
                                        <option value="PERCENT_PRIME_HT">% prime HT</option>
                                        <option value="FORFAIT">Forfait</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Taux 1ère année (%)</label>
                                    <input type="number" value={baremeForm.taux_1ere_annee}
                                        onChange={(e) => setBaremeForm({ ...baremeForm, taux_1ere_annee: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Taux renouvellement (%)</label>
                                    <input type="number" value={baremeForm.taux_renouvellement}
                                        onChange={(e) => setBaremeForm({ ...baremeForm, taux_renouvellement: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Durée reprise (mois)</label>
                                    <input type="number" value={baremeForm.duree_reprise_mois}
                                        onChange={(e) => setBaremeForm({ ...baremeForm, duree_reprise_mois: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Modalité reprise</label>
                                    <select value={baremeForm.modalite_reprise}
                                        onChange={(e) => setBaremeForm({ ...baremeForm, modalite_reprise: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1">
                                        <option value="PRORATA">Prorata</option>
                                        <option value="INTEGRAL">Intégral</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={creerBareme} disabled={busy || !baremeForm.date_debut}
                                    className="px-3 py-1 rounded text-sm bg-blue-700 text-white hover:bg-blue-800">Enregistrer</button>
                                <button onClick={() => setBaremeForm(null)} className="px-3 py-1 rounded text-sm border border-slate-300">Annuler</button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 text-left">
                                <tr>
                                    <th className="px-4 py-2">Début</th>
                                    <th className="px-4 py-2">Fin</th>
                                    <th className="px-4 py-2">Assiette</th>
                                    <th className="px-4 py-2 text-right">Taux 1ère</th>
                                    <th className="px-4 py-2 text-right">Taux renouv.</th>
                                    <th className="px-4 py-2">Courant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.baremes || []).map((b) => (
                                    <tr key={b.id} className="border-t border-slate-100">
                                        <td className="px-4 py-2">{fmtDate(b.date_debut)}</td>
                                        <td className="px-4 py-2">{fmtDate(b.date_fin)}</td>
                                        <td className="px-4 py-2">{b.assiette}</td>
                                        <td className="px-4 py-2 text-right">{b.taux_1ere_annee ?? '—'} %</td>
                                        <td className="px-4 py-2 text-right">{b.taux_renouvellement ?? '—'} %</td>
                                        <td className="px-4 py-2">
                                            {b.courant ? <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">courant</span> : <span className="text-xs text-slate-400">historique</span>}
                                        </td>
                                    </tr>
                                ))}
                                {(data.baremes || []).length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Aucun barème.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== STATISTIQUES ===== */}
            {onglet === 'stats' && estCabinet && data.statistiques && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        ['Demandes totales', data.statistiques.demandes_totales],
                        ['Demandes en cours', data.statistiques.demandes_en_cours],
                        ['Transformées', data.statistiques.demandes_transformees],
                        ['Contrats actifs', data.statistiques.contrats_actifs],
                        ['Contrats totaux', data.statistiques.contrats_totaux],
                        ['Primes année (HT)', fmt(data.statistiques.primes_annee_cts) + ' €'],
                        ['Commissions année', fmt(data.statistiques.commissions_annee_cts) + ' €'],
                        ['Pièces expirées', data.nb_pieces_expirees ?? 0],
                    ].map(([label, v], i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                            <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
                            <div className="text-xl font-bold text-slate-900 mt-1">{v}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Checklist validation / refus (statut EN_VALIDATION) */}
            {data.statut === 'EN_VALIDATION' && estAdmin && (
                <div className="mt-6 bg-white border border-slate-200 rounded-lg p-5">
                    <h3 className="font-medium text-slate-900 mb-3">Liste de contrôle réglementaire (RG-60)</h3>
                    <div className="space-y-2 mb-4">
                        {checklist.map((c) => (
                            <label key={c.cle} className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="checkbox" checked={!!c.ok} onChange={() => toggleCheck(c.cle)} />
                                <span>{c.libelle}</span>
                                <span className="text-xs text-slate-400">({c.cle})</span>
                            </label>
                        ))}
                    </div>
                    <div className="mb-4">
                        <label className="text-slate-500 text-xs">Branches autorisées</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {(data.branches_disponibles || []).map((b) => (
                                <label key={b.id} className="flex items-center gap-1 text-sm border border-slate-200 rounded px-2 py-1 cursor-pointer">
                                    <input type="checkbox"
                                        checked={branchesAut.includes(b.id)}
                                        onChange={() => setBranchesAut((prev) =>
                                            prev.includes(b.id) ? prev.filter((x) => x !== b.id) : [...prev, b.id]
                                        )} />
                                    {b.nom}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal refus */}
            {showRefus && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-3">Refuser la candidature</h2>
                        <label className="block text-sm text-slate-600 mb-1">Motif du refus</label>
                        <textarea className="w-full border border-slate-300 rounded p-2 text-sm mb-4" rows={3}
                            value={refusMotif} onChange={(e) => setRefusMotif(e.target.value)}
                            placeholder="Motif obligatoire..." />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowRefus(false)} className="text-sm px-4 py-2 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                            <button onClick={refuser} disabled={!refusMotif.trim() || busy}
                                className="text-sm px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">Confirmer le refus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

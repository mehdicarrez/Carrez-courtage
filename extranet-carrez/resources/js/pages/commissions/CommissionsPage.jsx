import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';
import BordereauxPanel from './BordereauxPanel';

const TABS = [
    { key: 'lignes', label: 'Lignes' },
    { key: 'bordereaux', label: 'Bordereaux' },
    { key: 'perques', label: 'Perçues', cabinetOnly: true },
    { key: 'rapprochement', label: 'Rapprochement', cabinetOnly: true },
];

export default function CommissionsPage() {
    const { user } = useAuth();
    const estCabinet = ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user?.role);
    const [onglet, setOnglet] = useState('lignes');
    const [lignes, setLignes] = useState([]);
    const [perques, setPerques] = useState([]);
    const [rapprochement, setRapprochement] = useState({ data: [], totaux: {} });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    // Form perçue
    const [formPerque, setFormPerque] = useState(null);
    const [contrats, setContrats] = useState([]);

    // Import CSV
    const [importFile, setImportFile] = useState(null);
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        setLoading(true);
        api.get('/commissions')
            .then((l) => setLignes(l.data.data))
            .catch(() => setError('Erreur de chargement.'))
            .finally(() => setLoading(false));
    }, []);

    const chargerPerques = () => {
        api.get('/commissions/perques').then((res) => setPerques(res.data.data));
    };

    const chargerRapprochement = () => {
        api.get('/commissions/rapprochement').then((res) => setRapprochement(res.data));
    };

    const chargerContrats = () => {
        if (contrats.length === 0) {
            api.get('/contrats?per_page=200').then((res) => setContrats(res.data.data));
        }
    };

    const switchOnglet = (key) => {
        setOnglet(key);
        if (key === 'perques') { chargerPerques(); chargerContrats(); }
        if (key === 'rapprochement') chargerRapprochement();
    };

    const saisirPerque = async () => {
        setBusy(true);
        try {
            const res = await api.post('/commissions/perques', formPerque);
            setPerques([res.data.data, ...perques]);
            setFormPerque(null);
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur.');
        } finally {
            setBusy(false);
        }
    };

    const importerCsv = async () => {
        if (!importFile) return;
        setBusy(true);
        setImportResult(null);
        try {
            const fd = new FormData();
            fd.append('file', importFile);
            const res = await api.post('/commissions/import-csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setImportResult(res.data);
            chargerPerques();
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur.');
        } finally {
            setBusy(false);
        }
    };

    const fmt = (cts) => ((cts ?? 0) / 100).toFixed(2);

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-4">
                {estCabinet ? 'Commissions' : 'Mes commissions rétrocédées'}
            </h1>
            {!estCabinet && (
                <div className="bg-slate-100 text-slate-600 text-xs p-3 rounded mb-4">
                    Les taux et montants de commission perçue par le cabinet ne sont pas accessibles (RG-03).
                </div>
            )}
            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

            {/* Onglets */}
            <div className="flex gap-1 border-b border-slate-200 mb-4">
                {TABS.filter((t) => !t.cabinetOnly || estCabinet).map((t) => (
                    <button key={t.key} onClick={() => switchOnglet(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px ${
                            onglet === t.key ? 'bg-white border border-slate-200 text-blue-700' : 'text-slate-500 hover:text-slate-700'
                        }`}>{t.label}</button>
                ))}
            </div>

            {loading && <div className="text-slate-500">Chargement...</div>}

            {/* ===== LIGNES ===== */}
            {onglet === 'lignes' && !loading && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600 text-left">
                            <tr>
                                <th className="px-4 py-2">Contrat</th>
                                <th className="px-4 py-2">Client</th>
                                <th className="px-4 py-2">Nature</th>
                                <th className="px-4 py-2">Période</th>
                                <th className="px-4 py-2 text-right">Assiette</th>
                                <th className="px-4 py-2 text-right">Taux</th>
                                <th className="px-4 py-2 text-right">Montant</th>
                                <th className="px-4 py-2">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lignes.map((l) => (
                                <tr key={l.id} className="border-t border-slate-100">
                                    <td className="px-4 py-2">{l.contrat_reference || '—'}</td>
                                    <td className="px-4 py-2">{l.client || '—'}</td>
                                    <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded bg-slate-100">{l.nature}</span></td>
                                    <td className="px-4 py-2">{l.periode_debut || '—'} → {l.periode_fin || '—'}</td>
                                    <td className="px-4 py-2 text-right">{l.assiette_cts ? fmt(l.assiette_cts) + ' €' : '—'}</td>
                                    <td className="px-4 py-2 text-right">{l.taux != null ? `${l.taux} %` : '—'}</td>
                                    <td className="px-4 py-2 text-right font-medium">{fmt(l.montant_cts)} €</td>
                                    <td className="px-4 py-2">
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{l.statut}</span>
                                        {l.statut === 'REPRISE' && <span className="text-xs text-slate-400 ml-1">(de {l.ligne_reprise_de})</span>}
                                    </td>
                                </tr>
                            ))}
                            {lignes.length === 0 && (
                                <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">Aucune ligne de commission.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===== BORDEREAUX ===== */}
            {onglet === 'bordereaux' && !loading && (
                <BordereauxPanel />
            )}

            {/* ===== PERÇUES ===== */}
            {onglet === 'perques' && estCabinet && (
                <div>
                    <div className="flex gap-3 mb-4">
                        <button onClick={() => setFormPerque({ contrat_id: '', montant_cts: '', periode_debut: '', periode_fin: '', commentaire: '' })}
                            className="text-sm px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800">+ Saisir</button>
                        <label className="text-sm px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
                            Importer CSV
                            <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => setImportFile(e.target.files[0])} />
                        </label>
                        {importFile && (
                            <button onClick={importerCsv} disabled={busy}
                                className="text-sm px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50">
                                Importer {importFile.name}
                            </button>
                        )}
                    </div>

                    {importResult && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-4 text-sm">
                            <span className="text-emerald-700 font-medium">{importResult.crees} ligne(s) créée(s)</span>
                            {importResult.erreurs.length > 0 && (
                                <span className="text-red-600 ml-3">{importResult.erreurs.length} erreur(s)</span>
                            )}
                        </div>
                    )}

                    {formPerque && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-4 text-sm">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-slate-500 text-xs">Contrat</label>
                                    <select value={formPerque.contrat_id} onChange={(e) => setFormPerque({ ...formPerque, contrat_id: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1">
                                        <option value="">Sélectionner...</option>
                                        {contrats.map((c) => <option key={c.id} value={c.id}>{c.reference} — {c.client}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Montant (cts)</label>
                                    <input type="number" value={formPerque.montant_cts} onChange={(e) => setFormPerque({ ...formPerque, montant_cts: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Période début</label>
                                    <input type="date" value={formPerque.periode_debut} onChange={(e) => setFormPerque({ ...formPerque, periode_debut: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Période fin</label>
                                    <input type="date" value={formPerque.periode_fin} onChange={(e) => setFormPerque({ ...formPerque, periode_fin: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-slate-500 text-xs">Commentaire</label>
                                    <input value={formPerque.commentaire} onChange={(e) => setFormPerque({ ...formPerque, commentaire: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={saisirPerque} disabled={busy || !formPerque.contrat_id || !formPerque.montant_cts}
                                    className="px-3 py-1 rounded text-sm bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">Enregistrer</button>
                                <button onClick={() => setFormPerque(null)} className="px-3 py-1 rounded text-sm border border-slate-300">Annuler</button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 text-left">
                                <tr>
                                    <th className="px-4 py-2">Contrat</th>
                                    <th className="px-4 py-2">Client</th>
                                    <th className="px-4 py-2">Période</th>
                                    <th className="px-4 py-2 text-right">Montant</th>
                                    <th className="px-4 py-2">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {perques.map((l) => (
                                    <tr key={l.id} className="border-t border-slate-100">
                                        <td className="px-4 py-2">{l.contrat_reference || '—'}</td>
                                        <td className="px-4 py-2">{l.client || '—'}</td>
                                        <td className="px-4 py-2">{l.periode_debut || '—'} → {l.periode_fin || '—'}</td>
                                        <td className="px-4 py-2 text-right font-medium">{fmt(l.montant_cts)} €</td>
                                        <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded bg-slate-100">{l.statut}</span></td>
                                    </tr>
                                ))}
                                {perques.length === 0 && (
                                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Aucune commission perçue.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ===== RAPPROCHEMENT ===== */}
            {onglet === 'rapprochement' && estCabinet && (
                <div>
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 text-left">
                                <tr>
                                    <th className="px-4 py-2">Contrat</th>
                                    <th className="px-4 py-2">Client</th>
                                    <th className="px-4 py-2">Produit</th>
                                    <th className="px-4 py-2 text-right">Perçues</th>
                                    <th className="px-4 py-2 text-right">Rétrocédées</th>
                                    <th className="px-4 py-2 text-right">Écart</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rapprochement.data.map((r, i) => (
                                    <tr key={i} className="border-t border-slate-100">
                                        <td className="px-4 py-2 font-medium">{r.reference || '—'}</td>
                                        <td className="px-4 py-2">{r.client || '—'}</td>
                                        <td className="px-4 py-2 text-slate-500">{r.produit || '—'}</td>
                                        <td className="px-4 py-2 text-right">{fmt(r.total_percues)} €</td>
                                        <td className="px-4 py-2 text-right">{fmt(r.total_retrocedees)} €</td>
                                        <td className={`px-4 py-2 text-right font-medium ${r.ecart === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {fmt(r.ecart)} €
                                        </td>
                                    </tr>
                                ))}
                                {rapprochement.data.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Aucune donnée de rapprochement.</td></tr>
                                )}
                            </tbody>
                            {rapprochement.data.length > 0 && (
                                <tfoot className="bg-slate-50 font-medium">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-2">Totaux</td>
                                        <td className="px-4 py-2 text-right">{fmt(rapprochement.totaux.percues)} €</td>
                                        <td className="px-4 py-2 text-right">{fmt(rapprochement.totaux.retrocedees)} €</td>
                                        <td className={`px-4 py-2 text-right ${rapprochement.totaux.ecart === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {fmt(rapprochement.totaux.ecart)} €
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

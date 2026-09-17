import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { useAuth, estPartenaire } from '../../auth';

const eur = (cts) => ((cts ?? 0) / 100).toFixed(2);

export default function SaisieDevis() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [demande, setDemande] = useState(null);
    const [referentiels, setReferentiels] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [envoyerApres, setEnvoyerApres] = useState(false);
    const [form, setForm] = useState({
        porteur_risque_id: '',
        grossiste_id: '',
        produit_id: '',
        reference_amont: '',
        prime_ht_cts: '',
        taxes_cts: '',
        premiere_echeance_cts: '',
        frais_courtage_cts: '',
        fractionnement: 'ANNUEL',
        date_effet_possible: '',
        date_validite: '',
        conditions_particulieres: '',
        reserves: '',
        taux_commission_percue: '',
    });
    const [garanties, setGaranties] = useState([]);
    const [nouvelleGarantie, setNouvelleGarantie] = useState({
        intitule: '',
        plafond_cts: '',
        franchise_cts: '',
        type: 'INCLUSE',
        prix_option_cts: '',
    });

    // Documents à joindre au devis
    const [piecesJointes, setPiecesJointes] = useState([]);
    const [nouveauDoc, setNouveauDoc] = useState({ type_document_id: '', file: null });

    useEffect(() => {
        Promise.all([
            api.get(`/demandes/${id}`),
            api.get('/referentiels/actifs'),
        ])
            .then(([d, r]) => {
                setDemande(d.data.data);
                setReferentiels(r.data);
            })
            .catch(() => setError('Erreur de chargement.'))
            .finally(() => setLoading(false));
    }, [id]);

    const estCabinet = user && ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER'].includes(user.role);
    const basePath = estPartenaire(user) ? '/espace-partenaire' : '';

    // Produits rattachés à la branche de la demande
    const produitsDeLaBranche = useMemo(() => {
        if (!referentiels?.produits || !demande) return [];
        return referentiels.produits.filter(
            (p) => !demande.branche_id || String(p.branche_id) === String(demande.branche_id)
        );
    }, [referentiels, demande]);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const choisirProduit = (e) => {
        const pid = e.target.value;
        setForm((f) => {
            const produit = referentiels?.produits?.find((p) => String(p.id) === String(pid));
            return {
                ...f,
                produit_id: pid,
                // Pré-remplissage automatique du porteur et du grossiste du produit
                porteur_risque_id: f.porteur_risque_id || produit?.porteur_risque_id || '',
                grossiste_id: f.grossiste_id || produit?.grossiste_id || '',
            };
        });
    };

    // Calcul live de la prime TTC
    const primeTtcCts = (Number(form.prime_ht_cts) || 0) + (Number(form.taxes_cts) || 0);

    const ajouterGarantie = () => {
        if (!nouvelleGarantie.intitule.trim()) return;
        setGaranties((g) => [
            ...g,
            {
                intitule: nouvelleGarantie.intitule.trim(),
                plafond_cts: nouvelleGarantie.plafond_cts ? Number(nouvelleGarantie.plafond_cts) : null,
                franchise_cts: nouvelleGarantie.franchise_cts ? Number(nouvelleGarantie.franchise_cts) : null,
                type: nouvelleGarantie.type,
                optionnelle: nouvelleGarantie.type === 'OPTIONNELLE',
                prix_option_cts: nouvelleGarantie.type === 'OPTIONNELLE' && nouvelleGarantie.prix_option_cts
                    ? Number(nouvelleGarantie.prix_option_cts)
                    : null,
            },
        ]);
        setNouvelleGarantie({ intitule: '', plafond_cts: '', franchise_cts: '', type: 'INCLUSE', prix_option_cts: '' });
    };

    const soumettre = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...form,
                prime_ht_cts: Number(form.prime_ht_cts),
                taxes_cts: form.taxes_cts ? Number(form.taxes_cts) : undefined,
                frais_courtage_cts: form.frais_courtage_cts ? Number(form.frais_courtage_cts) : undefined,
                premiere_echeance_cts: form.premiere_echeance_cts ? Number(form.premiere_echeance_cts) : undefined,
                taux_commission_percue: form.taux_commission_percue ? Number(form.taux_commission_percue) : undefined,
                porteur_risque_id: form.porteur_risque_id || undefined,
                grossiste_id: form.grossiste_id || undefined,
                produit_id: form.produit_id || undefined,
                garanties: garanties.map((g) => ({
                    intitule: g.intitule,
                    plafond_cts: g.plafond_cts || undefined,
                    franchise_cts: g.franchise_cts || undefined,
                    incluse: g.type !== 'OPTIONNELLE',
                    optionnelle: g.type === 'OPTIONNELLE',
                    prix_option_cts: g.prix_option_cts || undefined,
                })),
            };
            const res = await api.post(`/demandes/${id}/devis`, payload);
            const devisId = res.data.data?.id;
            if (envoyerApres && devisId) {
                await api.post(`/devis/${devisId}/transitions`, { action: 'envoyer' });
            }
            for (const p of piecesJointes) {
                const fd = new FormData();
                fd.append('type_document_id', p.type_document_id);
                fd.append('objet_type', 'devis');
                fd.append('objet_id', devisId);
                fd.append('file', p.file);
                await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            navigate(`${basePath}/demandes/${id}`, { state: { devis_cree: devisId } });
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        } finally {
            setSaving(false);
        }
    };

    const ajouterDocument = () => {
        if (!nouveauDoc.type_document_id || !nouveauDoc.file) return;
        setPiecesJointes((arr) => [...arr, nouveauDoc]);
        setNouveauDoc({ type_document_id: '', file: null });
    };

    const retirerDocument = (index) => setPiecesJointes((arr) => arr.filter((_, i) => i !== index));

    if (loading) return <div className="text-slate-500">Chargement...</div>;

    const input = 'w-full border border-slate-300 rounded px-2 py-1.5 text-sm';
    const label = 'block text-sm text-slate-600 mb-1';

    return (
        <div className="max-w-4xl">
            <h1 className="text-xl font-bold text-slate-900 mb-1">
                Saisie d'un devis — {demande?.reference}
            </h1>
            <div className="text-sm text-slate-500 mb-4">
                {demande?.client} · {demande?.branche} · statut {demande?.statut}
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

            <form onSubmit={soumettre} className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                    <h2 className="font-semibold text-slate-900">Offre et produit</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={label}>Référence amont</label>
                            <input className={input} value={form.reference_amont} onChange={set('reference_amont')} placeholder="Référence chez le partenaire / l'amont" />
                        </div>
                        <div>
                            <label className={label}>Produit <span className="text-slate-400">(branche {demande?.branche})</span></label>
                            <select className={input} value={form.produit_id} onChange={choisirProduit}>
                                <option value="">— Choisir un produit —</option>
                                {produitsDeLaBranche.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nom} {p.branche ? `(${p.branche.nom})` : ''}
                                    </option>
                                ))}
                            </select>
                            {produitsDeLaBranche.length === 0 && (
                                <div className="text-xs text-amber-600 mt-1">
                                    Aucun produit configuré pour cette branche.
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={label}>Porteur de risque</label>
                            <select className={input} value={form.porteur_risque_id} onChange={set('porteur_risque_id')}>
                                <option value="">—</option>
                                {referentiels?.porteurs_risque?.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nom}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={label}>Grossiste</label>
                            <select className={input} value={form.grossiste_id} onChange={set('grossiste_id')}>
                                <option value="">—</option>
                                {referentiels?.grossistes?.map((g) => (
                                    <option key={g.id} value={g.id}>{g.nom}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                    <h2 className="font-semibold text-slate-900">Prime et tarification</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={label}>Prime HT * <span className="text-xs text-slate-400">(cts)</span></label>
                            <input type="number" required className={input} value={form.prime_ht_cts} onChange={set('prime_ht_cts')} placeholder="ex. 48000" />
                        </div>
                        <div>
                            <label className={label}>Taxes <span className="text-xs text-slate-400">(cts)</span></label>
                            <input type="number" className={input} value={form.taxes_cts} onChange={set('taxes_cts')} placeholder="ex. 6360" />
                        </div>
                        <div>
                            <label className={label}>Fractionnement</label>
                            <select className={input} value={form.fractionnement} onChange={set('fractionnement')}>
                                <option>ANNUEL</option>
                                <option>SEMESTRIEL</option>
                                <option>TRIMESTRIEL</option>
                                <option>MENSUEL</option>
                            </select>
                        </div>
                        <div>
                            <label className={label}>Frais de courtage <span className="text-xs text-slate-400">(cts)</span></label>
                            <input type="number" className={input} value={form.frais_courtage_cts} onChange={set('frais_courtage_cts')} />
                        </div>
                        <div>
                            <label className={label}>Première échéance <span className="text-xs text-slate-400">(cts)</span></label>
                            <input type="number" className={input} value={form.premiere_echeance_cts} onChange={set('premiere_echeance_cts')} />
                        </div>
                        <div>
                            <label className={label}>Taux commission perçue <span className="text-xs text-slate-400">(%)</span></label>
                            <input type="number" step="0.01" className={input} value={form.taux_commission_percue} onChange={set('taux_commission_percue')} placeholder="ex. 20" />
                        </div>
                        <div>
                            <label className={label}>Date effet possible</label>
                            <input type="date" className={input} value={form.date_effet_possible} onChange={set('date_effet_possible')} />
                        </div>
                        <div>
                            <label className={label}>Date de validité *</label>
                            <input type="date" required className={input} value={form.date_validite} onChange={set('date_validite')} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-3">
                        <div className="text-sm text-slate-600">Prime HT : <strong>{eur(form.prime_ht_cts)} €</strong></div>
                        <div className="text-sm text-slate-600">Taxes : <strong>{eur(form.taxes_cts)} €</strong></div>
                        <div className="ml-auto text-sm font-semibold text-blue-700">
                            Prime TTC : {eur(primeTtcCts)} €
                        </div>
                    </div>
                    <div>
                        <label className={label}>Conditions particulières</label>
                        <textarea rows={2} className={input} value={form.conditions_particulieres} onChange={set('conditions_particulieres')} />
                    </div>
                    <div>
                        <label className={label}>Réserves</label>
                        <textarea rows={2} className={input} value={form.reserves} onChange={set('reserves')} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <h2 className="font-semibold text-slate-900 mb-3">Garanties</h2>
                    {garanties.length === 0 && (
                        <div className="text-sm text-slate-400 mb-3">Aucune garantie ajoutée.</div>
                    )}
                    {garanties.map((g, i) => (
                        <div key={i} className="flex items-center gap-3 mb-2 text-sm bg-gray-50 rounded px-3 py-2">
                            <span className="flex-1 font-medium">{g.intitule}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${g.type === 'OPTIONNELLE' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {g.type === 'OPTIONNELLE' ? `Option — ${eur(g.prix_option_cts)} €` : 'Incluse'}
                            </span>
                            {g.plafond_cts != null && <span className="text-slate-500">plaf. {eur(g.plafond_cts)} €</span>}
                            {g.franchise_cts != null && <span className="text-slate-500">fran. {eur(g.franchise_cts)} €</span>}
                            <button
                                type="button"
                                onClick={() => setGaranties((arr) => arr.filter((_, j) => j !== i))}
                                className="text-red-600 text-xs"
                            >
                                Supprimer
                            </button>
                        </div>
                    ))}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mt-3 items-end">
                        <div className="md:col-span-2">
                            <label className={label}>Intitulé</label>
                            <input className={input} placeholder="Intitulé de la garantie" value={nouvelleGarantie.intitule} onChange={(e) => setNouvelleGarantie((g) => ({ ...g, intitule: e.target.value }))} />
                        </div>
                        <div>
                            <label className={label}>Plafond (cts)</label>
                            <input type="number" className={input} placeholder="0" value={nouvelleGarantie.plafond_cts} onChange={(e) => setNouvelleGarantie((g) => ({ ...g, plafond_cts: e.target.value }))} />
                        </div>
                        <div>
                            <label className={label}>Franchise (cts)</label>
                            <input type="number" className={input} placeholder="0" value={nouvelleGarantie.franchise_cts} onChange={(e) => setNouvelleGarantie((g) => ({ ...g, franchise_cts: e.target.value }))} />
                        </div>
                        <div>
                            <label className={label}>Type</label>
                            <select className={input} value={nouvelleGarantie.type} onChange={(e) => setNouvelleGarantie((g) => ({ ...g, type: e.target.value }))}>
                                <option value="INCLUSE">Incluse</option>
                                <option value="OPTIONNELLE">Optionnelle</option>
                            </select>
                        </div>
                        {nouvelleGarantie.type === 'OPTIONNELLE' && (
                            <div>
                                <label className={label}>Prix option (cts)</label>
                                <input type="number" className={input} placeholder="0" value={nouvelleGarantie.prix_option_cts} onChange={(e) => setNouvelleGarantie((g) => ({ ...g, prix_option_cts: e.target.value }))} />
                            </div>
                        )}
                        <div className="md:col-span-1">
                            <button type="button" onClick={ajouterGarantie} className="w-full px-3 py-1.5 rounded bg-slate-800 text-white text-sm">
                                Ajouter
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <h2 className="font-semibold text-slate-900 mb-3">Documents du devis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end mb-3">
                        <div className="md:col-span-3">
                            <label className={label}>Type de document <span className="text-red-500">*</span></label>
                            <select
                                className={input}
                                value={nouveauDoc.type_document_id}
                                onChange={(e) => setNouveauDoc((d) => ({ ...d, type_document_id: e.target.value }))}
                            >
                                <option value="">— Choisir un type —</option>
                                {(referentiels?.types_documents || []).map((t) => (
                                    <option key={t.id} value={t.id}>{t.libelle}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className={label}>Fichier <span className="text-red-500">*</span></label>
                            <input
                                type="file"
                                className={input}
                                onChange={(e) => setNouveauDoc((d) => ({ ...d, file: e.target.files[0] }))}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <button
                                type="button"
                                onClick={ajouterDocument}
                                disabled={!nouveauDoc.type_document_id || !nouveauDoc.file}
                                className="w-full px-3 py-1.5 rounded bg-slate-800 text-white text-sm disabled:opacity-40"
                            >
                                Ajouter
                            </button>
                        </div>
                    </div>
                    {piecesJointes.length === 0 && (
                        <div className="text-sm text-slate-400 mb-2">Aucun document sélectionné.</div>
                    )}
                    {piecesJointes.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 mb-2 text-sm bg-gray-50 rounded px-3 py-2">
                            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V9.621a1.5 1.5 0 0 0-.44-1.06L11.94 3.44A1.5 1.5 0 0 0 10.878 3H4.5Zm2 3.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75ZM7 10.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 10.5Zm0 3a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
                            <span className="flex-1 truncate font-medium">
                                {p.file.name}
                            </span>
                            <span className="text-xs text-slate-500">
                                {(referentiels?.types_documents || []).find((t) => String(t.id) === String(p.type_document_id))?.libelle || 'Document'}
                            </span>
                            <span className="text-xs text-slate-400">
                                {(p.file.size / 1024).toFixed(0)} Ko
                            </span>
                            <button
                                type="button"
                                onClick={() => retirerDocument(i)}
                                className="text-red-600 text-xs"
                            >
                                Supprimer
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        onClick={() => setEnvoyerApres(false)}
                        disabled={saving}
                        className="px-4 py-2 rounded bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 disabled:opacity-50"
                    >
                        Enregistrer en brouillon
                    </button>
                    <button
                        type="submit"
                        onClick={() => setEnvoyerApres(true)}
                        disabled={saving}
                        className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Envoi...' : 'Enregistrer et envoyer'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`${basePath}/demandes/${id}`)}
                        className="px-4 py-2 rounded bg-slate-100 text-slate-600 text-sm"
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../auth';

const TABS = [
    { key: 'detail', label: 'Détail' },
    { key: 'avenants', label: 'Avenants' },
    { key: 'quittances', label: 'Quittances' },
    { key: 'sinistres', label: 'Sinistres' },
    { key: 'souscription', label: 'Souscription' },
];

const ETAPES_ORDER = [
    'pieces_completes', 'devis_accepte', 'garanties_validees',
    'police_generee', 'envoye_signature', 'signe', 'mise_en_vigueur',
];
const ETAPES_LABELS = {
    pieces_completes: 'Pièces complètes', devis_accepte: 'Devis accepté',
    garanties_validees: 'Garanties validées', police_generee: 'Police générée',
    envoye_signature: 'Envoyé en signature', signe: 'Signé', mise_en_vigueur: 'Mis en vigueur',
};

const STATUT_COLORS = {
    A_ECHELONNER: 'bg-slate-100 text-slate-700', APPELEE: 'bg-blue-50 text-blue-700',
    ENCAISSEE: 'bg-emerald-50 text-emerald-700', IMPAYEE: 'bg-red-50 text-red-700',
    ANNULEE: 'bg-slate-100 text-slate-400', OUVERT: 'bg-amber-50 text-amber-700',
    EN_COURS_EXPERTISE: 'bg-blue-50 text-blue-700', CLOS: 'bg-slate-100 text-slate-500',
};

const DOC_GENERE_CODES = ['FICHE_CONSEIL', 'ORDRE_REMPLACEMENT', 'MANDAT_EXCLUSIF', 'POLICE'];

export default function ContratDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const estCabinet = ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user?.role);

    const [contrat, setContrat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [onglet, setOnglet] = useState('detail');

    // Édition fiche
    const [edition, setEdition] = useState(false);
    const [form, setForm] = useState({});

    // Form avenant
    const [formAvenant, setFormAvenant] = useState(null);
    // Form sinistre
    const [formSinistre, setFormSinistre] = useState(null);
    // Document de courtage actif (fiche conseil / ordre de remplacement / mandat exclusif)
    const [docMode, setDocMode] = useState(null);
    const [docForm, setDocForm] = useState({});
    const [clientDossierDocs, setClientDossierDocs] = useState([]);
    // Création de tâche (comme dans le client)
    const [tacheOpen, setTacheOpen] = useState(false);
    const [tacheForm, setTacheForm] = useState({});
    const [tacheFiles, setTacheFiles] = useState([]);
    const [tacheSuiveurs, setTacheSuiveurs] = useState([]);
    const [savingTache, setSavingTache] = useState(false);
    // Création de sinistre (comme dans le client)
    const [sinistreOpen, setSinistreOpen] = useState(false);
    const [sinistreForm, setSinistreForm] = useState({});
    const [sinistreFiles, setSinistreFiles] = useState([]);
    const [sinistreSuiveurs, setSinistreSuiveurs] = useState([]);
    const [savingSinistre, setSavingSinistre] = useState(false);

    const DOC_TYPES = {
        FICHE_CONSEIL: { label: 'Fiche conseil', empty: { garanties_souhaitees: '', observations: '', compagnie: '', numero_projet: '', montant_frais_courtage: '' } },
        ORDRE_REMPLACEMENT: { label: 'Ordre de remplacement', empty: { ancien_police: '' } },
        MANDAT_EXCLUSIF: { label: 'Mandat exclusif de placement', empty: { reference: '', date: '', duree: '', objet: '', commissions: '' } },
    };

    const genererDocument = async () => {
        try {
            setBusy(true);
            setError('');
            const res = await api.post(`/contrats/${id}/documents/generer-document`, { type: docMode, data: docForm });
            const docId = res.data?.document_id;
            setDocMode(null);
            setDocForm({});
            charger();
            if (docId) {
                const u = await api.get(`/documents/${docId}/url`);
                window.open(u.data.url, '_blank');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur de génération du document.');
        } finally {
            setBusy(false);
        }
    };

    const ouvrirDoc = (mode) => {
        setDocMode(mode);
        setDocForm(DOC_TYPES[mode] ? DOC_TYPES[mode].empty : {});
    };

    const charger = () => {
        api.get(`/contrats/${id}`)
            .then((res) => {
                setContrat(res.data.data);
                setForm({
                    numero_police: res.data.data.numero_police || '',
                    date_effet: res.data.data.date_effet || '',
                    date_echeance_principale: res.data.data.date_echeance_principale || '',
                    fractionnement: res.data.data.fractionnement || '',
                });
            })
            .catch((err) => setError(err.response?.status === 404 ? 'Contrat introuvable.' : 'Erreur.'))
            .finally(() => setLoading(false));
        api.get('/documents').catch(() => ({ data: { data: [] } }))
            .then((res) => setClientDossierDocs(res.data.data || []));
    };

    useEffect(() => { charger(); }, [id]);

    const call = async (method, url, data) => {
        setBusy(true);
        try {
            const res = data ? await api[method](url, data) : await api[method](url);
            setContrat(res.data.data);
            return true;
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur.');
            return false;
        } finally {
            setBusy(false);
        }
    };

    const sauvegarderFiche = async () => {
        const ok = await call('put', `/contrats/${id}`, form);
        if (ok) setEdition(false);
    };

    const cocher = (etape, coche) => call('patch', `/contrats/${id}/souscription/checklist`, { etape, coche });
    const genererPolice = () => call('post', `/contrats/${id}/documents/generer-police`);
    const envoyerSignature = () => call('post', `/contrats/${id}/souscription/envoyer-signature`);
    const marquerSigne = () => call('post', `/contrats/${id}/souscription/marquer-signe`);

    const creerAvenant = async () => {
        const ok = await call('post', `/contrats/${id}/avenants`, formAvenant);
        if (ok) setFormAvenant(null);
    };

    const genererQuittances = () => call('post', `/contrats/${id}/quittances`);
    const majQuittance = (qid, statut) => call('patch', `/quittances/${qid}`, { statut });

    const declarerSinistre = async () => {
        const ok = await call('post', `/contrats/${id}/sinistres`, formSinistre);
        if (ok) setFormSinistre(null);
    };

    const telecharger = async (docId) => {
        try {
            const res = await api.get(`/documents/${docId}/url`);
            window.open(res.data.url, '_blank');
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur de téléchargement.');
        }
    };

    const fmtTaille = (octets) => {
        if (octets == null) return '';
        if (octets < 1024) return `${octets} o`;
        if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
        return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
    };

    const supprimerDocument = async (d) => {
        if (!window.confirm(`Supprimer le fichier « ${d.nom_origine} » ?`)) return;
        try {
            await api.delete(`/documents/${d.id}`);
            charger();
        } catch (e) {
            setError(e.response?.data?.message || 'Erreur de suppression.');
        }
    };

    const openTache = async () => {
        setTacheForm({
            titre: '', type: 'SINISTRE', objet: 'Ouvrir sinistre', description: '',
            priorite: 'FAIBLE', statut: 'A_FAIRE', date_echeance: '',
            date_debut: '', date_fin: '', montant: '', avancement: 0,
            temps_passe_h: '', assignee_id: '',
        });
        setTacheFiles([]);
        setError('');
        setTacheOpen(true);
        try {
            const res = await api.get('/clients/affectation/utilisateurs');
            setTacheSuiveurs(res.data.data || []);
        } catch (e) { /* silencieux */ }
    };

    const saveTache = async (e) => {
        e.preventDefault();
        if (!contrat.client_id) { setError('Client du contrat introuvable.'); return; }
        setSavingTache(true);
        setError('');
        try {
            const res = await api.post(`/clients/${contrat.client_id}/taches`, {
                titre: tacheForm.objet,
                type: tacheForm.type,
                objet: tacheForm.objet,
                description: tacheForm.description,
                priorite: tacheForm.priorite,
                statut: tacheForm.statut,
                date_echeance: tacheForm.date_echeance || null,
                date_debut: tacheForm.date_debut || null,
                date_fin: tacheForm.date_fin || null,
                montant: tacheForm.montant !== '' ? tacheForm.montant : null,
                avancement: tacheForm.avancement ?? 0,
                temps_passe_h: tacheForm.temps_passe_h !== '' ? tacheForm.temps_passe_h : null,
                assignee_id: tacheForm.assignee_id || null,
            });
            const tacheId = res.data.data.id;
            if (tacheFiles.length > 0) {
                const ref = await api.get('/referentiels/actifs');
                const types = ref.data.types_documents || [];
                const t = types.find((x) => x.code === 'DOC_SINISTRE') || types[0];
                const typeId = t ? String(t.id) : '';
                if (typeId) {
                    for (const file of tacheFiles) {
                        const fd = new FormData();
                        fd.append('type_document_id', typeId);
                        fd.append('objet_type', 'tache');
                        fd.append('objet_id', String(tacheId));
                        fd.append('file', file);
                        await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    }
                }
            }
            setTacheOpen(false);
            setTacheFiles([]);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de création de la tâche.");
        } finally {
            setSavingTache(false);
        }
    };

    const openSinistre = async () => {
        setSinistreForm({
            contrat_id: id,
            date_survenance: new Date().toISOString().slice(0, 10),
            ref_compagnie: '', suivi_par_id: '', statut: 'NON_OUVERT', garantie: '',
            franchise: '', circonstance: '', description_dommages: '', responsabilite: '',
            montant_estime_cts: '', beneficiaire: '', expertise: '', recours: '', etat: 'OUVERT', cloture_le: '',
        });
        setError('');
        setSinistreFiles([]);
        setSinistreOpen(true);
        try {
            const res = await api.get('/clients/affectation/utilisateurs');
            setSinistreSuiveurs(res.data.data || []);
        } catch (e) { /* silencieux */ }
    };

    const saveSinistre = async (e) => {
        e.preventDefault();
        if (!contrat.client_id) { setError('Client du contrat introuvable.'); return; }
        setSavingSinistre(true);
        setError('');
        try {
            const res = await api.post(`/clients/${contrat.client_id}/sinistres`, {
                contrat_id: sinistreForm.contrat_id,
                date_survenance: sinistreForm.date_survenance,
                ref_compagnie: sinistreForm.ref_compagnie,
                suivi_par_id: sinistreForm.suivi_par_id || null,
                statut: sinistreForm.statut,
                garantie: sinistreForm.garantie,
                franchise: sinistreForm.franchise,
                circonstance: sinistreForm.circonstance,
                description_dommages: sinistreForm.description_dommages,
                responsabilite: sinistreForm.responsabilite,
                montant_estime_cts: sinistreForm.montant_estime_cts ? Math.round(parseFloat(sinistreForm.montant_estime_cts) * 100) : null,
                beneficiaire: sinistreForm.beneficiaire,
                expertise: sinistreForm.expertise,
                recours: sinistreForm.recours,
                etat: sinistreForm.etat,
                cloture_le: sinistreForm.cloture_le || null,
            });
            const sinistreId = res.data.data.id;
            if (sinistreFiles.length > 0) {
                const ref = await api.get('/referentiels/actifs');
                const types = ref.data.types_documents || [];
                const t = types.find((x) => x.code === 'DOC_SINISTRE') || types[0];
                const typeId = t ? String(t.id) : '';
                if (typeId) {
                    for (const file of sinistreFiles) {
                        const fd = new FormData();
                        fd.append('type_document_id', typeId);
                        fd.append('objet_type', 'sinistre');
                        fd.append('objet_id', String(sinistreId));
                        fd.append('file', file);
                        await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                    }
                }
            }
            setSinistreOpen(false);
            setSinistreFiles([]);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de création du sinistre.");
        } finally {
            setSavingSinistre(false);
        }
    };

    if (loading) return <div className="text-slate-500">Chargement...</div>;
    if (error) return <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>;
    if (!contrat) return null;

    const signature = contrat.signature || {};
    const checklist = contrat.souscription_checklist || {};
    const progression = contrat.progression_souscription || 0;

    const allDocs = contrat.documents || [];
    const docsGenere = allDocs.filter((d) => DOC_GENERE_CODES.includes(d.type_document_code));

    return (
        <>
        <div>
            <button onClick={() => navigate('/contrats')} className="text-sm text-blue-700 mb-3">← Retour aux contrats</button>
            <h1 className="text-xl font-bold text-slate-900 mb-2">{contrat.reference}</h1>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">{contrat.statut}</span>
                {contrat.numero_police && <span className="text-sm text-slate-500">Police {contrat.numero_police}</span>}
            </div>

            {/* Onglets */}
            <div className="flex gap-1 border-b border-slate-200 mb-4">
                {TABS.map((t) => (
                    <button key={t.key} onClick={() => setOnglet(t.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg -mb-px ${
                            onglet === t.key ? 'bg-white border border-slate-200 text-blue-700' : 'text-slate-500 hover:text-slate-700'
                        }`}>{t.label}</button>
                ))}
            </div>

            {/* ===== ONGLET DÉTAIL ===== */}
            {onglet === 'detail' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Div 1 — Infos de l'assurance */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm border-t-4 border-t-blue-600">
                        <h2 className="font-semibold text-slate-900 mb-3">Assurance</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div><span className="text-slate-500">Fournisseur :</span> <span className="font-medium">{contrat.fournisseur || '—'}</span></div>
                        </div>
                    </div>

                    {/* Div 2 — Infos du contrat */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm border-t-4 border-t-emerald-600">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-semibold text-slate-900">Contrat</h2>
                            {estCabinet && !edition && (
                                <button onClick={() => setEdition(true)} className="text-sm px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Modifier</button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div><span className="text-slate-500">Client :</span> {contrat.client}</div>
                            <div><span className="text-slate-500">Produit :</span> {contrat.produit || '—'}</div>
                            <div><span className="text-slate-500">Prime HT :</span> {(contrat.prime_ht_cts ?? 0) / 100} €</div>
                            <div><span className="text-slate-500">Prime TTC :</span> {(contrat.prime_ttc_cts ?? 0) / 100} €</div>
                            {edition ? (
                                <>
                                    <div>
                                        <label className="text-slate-500 text-xs">N° Police</label>
                                        <input value={form.numero_police} onChange={(e) => setForm({ ...form, numero_police: e.target.value })}
                                            className="block w-full border border-slate-300 rounded px-2 py-1 text-sm mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs">Date effet</label>
                                        <input type="date" value={form.date_effet} onChange={(e) => setForm({ ...form, date_effet: e.target.value })}
                                            className="block w-full border border-slate-300 rounded px-2 py-1 text-sm mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs">Échéance</label>
                                        <input type="date" value={form.date_echeance_principale} onChange={(e) => setForm({ ...form, date_echeance_principale: e.target.value })}
                                            className="block w-full border border-slate-300 rounded px-2 py-1 text-sm mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-slate-500 text-xs">Fractionnement</label>
                                        <select value={form.fractionnement} onChange={(e) => setForm({ ...form, fractionnement: e.target.value })}
                                            className="block w-full border border-slate-300 rounded px-2 py-1 text-sm mt-1">
                                            <option value="ANNUEL">Annuel</option>
                                            <option value="SEMESTRIEL">Semestriel</option>
                                            <option value="TRIMESTRIEL">Trimestriel</option>
                                            <option value="MENSUEL">Mensuel</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div><span className="text-slate-500">Fractionnement :</span> {contrat.fractionnement}</div>
                                    <div><span className="text-slate-500">Effet :</span> {contrat.date_effet}</div>
                                    <div><span className="text-slate-500">Échéance :</span> {contrat.date_echeance_principale}</div>
                                </>
                            )}
                            <div><span className="text-slate-500">Année assurance :</span> {contrat.annee_assurance}</div>
                        </div>
                        {edition && (
                            <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100">
                                <button onClick={sauvegarderFiche} disabled={busy}
                                    className="px-4 py-1.5 rounded text-sm bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">Enregistrer</button>
                                <button onClick={() => { setEdition(false); setForm({ numero_police: contrat.numero_police || '', date_effet: contrat.date_effet || '', date_echeance_principale: contrat.date_echeance_principale || '', fractionnement: contrat.fractionnement || '' }); }}
                                    className="px-4 py-1.5 rounded text-sm border border-slate-300 text-slate-700 hover:bg-slate-50">Annuler</button>
                            </div>
                        )}
                    </div>

                    {/* Div 3 — Statut */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm border-t-4 border-t-amber-500">
                        <h2 className="font-semibold text-slate-900 mb-3">Statut</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500">Statut :</span>{' '}
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">{contrat.statut}</span>
                            </div>
                            <div><span className="text-slate-500">Souscription :</span> {progression}%</div>
                            <div><span className="text-slate-500">Quittances :</span> {contrat.nb_quittances}</div>
                            <div><span className="text-slate-500">Avenants :</span> {contrat.nb_avenants}</div>
                            <div><span className="text-slate-500">Sinistres :</span> {contrat.nb_sinistres}</div>
                            {contrat.date_resiliation && (
                                <div><span className="text-slate-500">Résilié le :</span> {contrat.date_resiliation} ({contrat.motif_resiliation})</div>
                            )}
                        </div>
                    </div>

                    {/* Div 4 — Documents de courtage */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm border-t-4 border-t-indigo-600">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-semibold text-slate-900">Documents de courtage</h2>
                            <span className="text-xs text-slate-400">{docsGenere.length} document(s)</span>
                        </div>

                        {/* Boutons de génération de documents de courtage */}
                        {estCabinet && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {Object.keys(DOC_TYPES).map((k) => (
                                    <button key={k}
                                        onClick={() => (docMode === k ? setDocMode(null) : ouvrirDoc(k))}
                                        className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                                            docMode === k
                                                ? 'bg-blue-700 border-blue-700 text-white'
                                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}>
                                        {DOC_TYPES[k].label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Formulaire du document sélectionné */}
                        {docMode && (
                            <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-4 text-sm">
                                <div className="font-semibold text-slate-900 mb-3">Nouveau document — {DOC_TYPES[docMode].label}</div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                    {docMode === 'FICHE_CONSEIL' && (
                                        <>
                                            <div className="col-span-2 md:col-span-3">
                                                <label className="text-slate-500 text-xs">Garanties souhaitées par l'assuré</label>
                                                <textarea value={docForm.garanties_souhaitees} onChange={(e) => setDocForm({ ...docForm, garanties_souhaitees: e.target.value })}
                                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" rows={2} />
                                            </div>
                                            <div className="col-span-2 md:col-span-3">
                                                <label className="text-slate-500 text-xs">Observations</label>
                                                <textarea value={docForm.observations} onChange={(e) => setDocForm({ ...docForm, observations: e.target.value })}
                                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" rows={2} />
                                            </div>
                                            <div>
                                                <label className="text-slate-500 text-xs">Compagnie</label>
                                                <input value={docForm.compagnie} onChange={(e) => setDocForm({ ...docForm, compagnie: e.target.value })}
                                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-slate-500 text-xs">Numéro de projet</label>
                                                <input value={docForm.numero_projet} onChange={(e) => setDocForm({ ...docForm, numero_projet: e.target.value })}
                                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-slate-500 text-xs">Montant des frais de courtage</label>
                                                <input value={docForm.montant_frais_courtage} onChange={(e) => setDocForm({ ...docForm, montant_frais_courtage: e.target.value })}
                                                    placeholder="Ex: 1 200,00 €" className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                            </div>
                                        </>
                                    )}
                                    {docMode === 'ORDRE_REMPLACEMENT' && (
                                        <>
                                            <div>
                                                <label className="text-slate-500 text-xs">Numéro de l'ancien contrat</label>
                                                <input value={docForm.ancien_police} onChange={(e) => setDocForm({ ...docForm, ancien_police: e.target.value })}
                                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                            </div>
                                        </>
                                    )}
                                    {docMode === 'MANDAT_EXCLUSIF' && (
                                        <>
                                            <div>
                                                <label className="text-slate-500 text-xs">Référence</label>
                                                <input value={docForm.reference} onChange={(e) => setDocForm({ ...docForm, reference: e.target.value })}
                                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-slate-500 text-xs">Date</label>
                                                <input type="date" value={docForm.date} onChange={(e) => setDocForm({ ...docForm, date: e.target.value })}
                                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-slate-500 text-xs">Durée</label>
                                                <input value={docForm.duree} onChange={(e) => setDocForm({ ...docForm, duree: e.target.value })}
                                                    placeholder="Ex: 1 an renouvelable" className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-slate-500 text-xs">Objet du mandat</label>
                                                <input value={docForm.objet} onChange={(e) => setDocForm({ ...docForm, objet: e.target.value })}
                                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-slate-500 text-xs">Contrepartie / Commissions</label>
                                                <input value={docForm.commissions} onChange={(e) => setDocForm({ ...docForm, commissions: e.target.value })}
                                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={genererDocument} disabled={busy}
                                        className="px-4 py-1.5 rounded text-sm bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">Générer et télécharger</button>
                                    <button onClick={() => { setDocMode(null); setDocForm({}); }}
                                        className="px-4 py-1.5 rounded text-sm border border-slate-300 text-slate-700 hover:bg-slate-50">Annuler</button>
                                </div>
                            </div>
                        )}

                        {/* Liste des documents — affichage horizontal */}
                        {docsGenere.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {docsGenere.map((d) => (
                                    <div key={d.id} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2 hover:shadow-sm transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-slate-700">{d.type_document || 'Document'}</span>
                                            <span className="text-xs text-slate-400">v{d.version}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate" title={d.nom_origine}>{d.nom_origine}</div>
                                        <button onClick={() => telecharger(d.id)}
                                            className="text-xs px-2 py-1 rounded border border-blue-700 text-blue-700 hover:bg-blue-50 self-start">Télécharger</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">Aucun document de courtage.</p>
                        )}
                    </div>

                    {/* Div 5 — Fichiers uploadés par le client */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm border-t-4 border-t-purple-600">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-semibold text-slate-900">Fichiers uploadés par le client</h2>
                            <span className="text-xs text-slate-400">{clientDossierDocs.length} fichier(s)</span>
                        </div>
                        {clientDossierDocs.length > 0 ? (
                            <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                                {clientDossierDocs.map((d) => (
                                    <li key={d.id} className="px-4 py-3 flex items-center gap-3">
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-sm font-medium text-slate-900 truncate">{d.nom_origine}</span>
                                            <span className="block text-xs text-slate-400">{d.type_document}{d.taille ? ` • ${fmtTaille(d.taille)}` : ''}</span>
                                        </span>
                                        <button onClick={() => telecharger(d.id)} title="Télécharger"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                            </svg>
                                        </button>
                                        <button onClick={() => supprimerDocument(d)} title="Supprimer"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-400">Aucun fichier uploadé par le client.</p>
                        )}
                    </div>

                    {/* Div 6 — Actions */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm border-t-4 border-t-rose-500">
                        <h2 className="font-semibold text-slate-900 mb-3">Actions</h2>
                        {estCabinet ? (
                            <div className="flex flex-wrap gap-2">
                                <button onClick={openTache}
                                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Créer une tâche
                                </button>
                                <button onClick={openSinistre}
                                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                    </svg>
                                    Ajouter sinistre
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">Actions réservées au cabinet.</p>
                        )}
                    </div>
                </div>
            )}

            {/* ===== ONGLET AVENANTS ===== */}
            {onglet === 'avenants' && (
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-slate-900">Avenants</h2>
                        {estCabinet && (
                            <button onClick={() => setFormAvenant({ type: '', date_effet: '', variation_prime_cts: '', description: '' })}
                                className="text-sm px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800">+ Nouvel avenant</button>
                        )}
                    </div>
                    {formAvenant && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-4 text-sm">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-slate-500 text-xs">Type</label>
                                    <input value={formAvenant.type} onChange={(e) => setFormAvenant({ ...formAvenant, type: e.target.value })}
                                        placeholder="Ex: MODIFICATION" className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Date effet</label>
                                    <input type="date" value={formAvenant.date_effet} onChange={(e) => setFormAvenant({ ...formAvenant, date_effet: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Variation prime (cts)</label>
                                    <input type="number" value={formAvenant.variation_prime_cts} onChange={(e) => setFormAvenant({ ...formAvenant, variation_prime_cts: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Description</label>
                                    <input value={formAvenant.description} onChange={(e) => setFormAvenant({ ...formAvenant, description: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={creerAvenant} disabled={busy || !formAvenant.type || !formAvenant.date_effet}
                                    className="px-3 py-1 rounded text-sm bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">Créer</button>
                                <button onClick={() => setFormAvenant(null)} className="px-3 py-1 rounded text-sm border border-slate-300">Annuler</button>
                            </div>
                        </div>
                    )}
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-600">
                            <tr><th className="px-3 py-2">Type</th><th className="px-3 py-2">Date effet</th><th className="px-3 py-2 text-right">Variation</th><th className="px-3 py-2">Description</th><th className="px-3 py-2">Statut</th></tr>
                        </thead>
                        <tbody>
                            {(contrat.avenants || []).map((a) => (
                                <tr key={a.id} className="border-t border-slate-100">
                                    <td className="px-3 py-2 font-medium">{a.type}</td>
                                    <td className="px-3 py-2">{a.date_effet}</td>
                                    <td className="px-3 py-2 text-right">{a.variation_prime_cts ? `${a.variation_prime_cts / 100} €` : '—'}</td>
                                    <td className="px-3 py-2 text-slate-500">{a.description || '—'}</td>
                                    <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded bg-slate-100">{a.statut}</span></td>
                                </tr>
                            ))}
                            {(!contrat.avenants || contrat.avenants.length === 0) && (
                                <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-400">Aucun avenant.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===== ONGLET QUITTANCES ===== */}
            {onglet === 'quittances' && (
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-slate-900">Quittances</h2>
                        {estCabinet && (!contrat.quittances || contrat.quittances.length === 0) && (
                            <button onClick={genererQuittances} disabled={busy}
                                className="text-sm px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">Générer l'échéancier</button>
                        )}
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-600">
                            <tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Appel</th><th className="px-3 py-2">Échéance</th><th className="px-3 py-2 text-right">Montant</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2">Encaissée</th>{estCabinet && <th className="px-3 py-2">Action</th>}</tr>
                        </thead>
                        <tbody>
                            {(contrat.quittances || []).map((q) => (
                                <tr key={q.id} className="border-t border-slate-100">
                                    <td className="px-3 py-2">{q.numero}</td>
                                    <td className="px-3 py-2">{q.date_appel}</td>
                                    <td className="px-3 py-2">{q.date_echeance}</td>
                                    <td className="px-3 py-2 text-right font-medium">{(q.montant_cts / 100).toFixed(2)} €</td>
                                    <td className="px-3 py-2">
                                        <span className={`text-xs px-2 py-0.5 rounded ${STATUT_COLORS[q.statut] || 'bg-slate-100'}`}>{q.statut}</span>
                                    </td>
                                    <td className="px-3 py-2 text-slate-500">{q.date_encaissee || '—'}</td>
                                    {estCabinet && (
                                        <td className="px-3 py-2">
                                            {q.statut === 'APPELEE' && (
                                                <div className="flex gap-1">
                                                    <button onClick={() => majQuittance(q.id, 'ENCAISSEE')} disabled={busy}
                                                        className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Encaisser</button>
                                                    <button onClick={() => majQuittance(q.id, 'IMPAYEE')} disabled={busy}
                                                        className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100">Impayée</button>
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {(!contrat.quittances || contrat.quittances.length === 0) && (
                                <tr><td colSpan={estCabinet ? 7 : 6} className="px-3 py-4 text-center text-slate-400">Aucune quittance. Générez l'échéancier.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===== ONGLET SINISTRES ===== */}
            {onglet === 'sinistres' && (
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-slate-900">Sinistres</h2>
                        <button onClick={() => setFormSinistre({ date_survenance: '', nature: '', montant_estime_cts: '' })}
                            className="text-sm px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800">+ Déclarer</button>
                    </div>
                    {formSinistre && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-4 text-sm">
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div>
                                    <label className="text-slate-500 text-xs">Date survenance</label>
                                    <input type="date" value={formSinistre.date_survenance} onChange={(e) => setFormSinistre({ ...formSinistre, date_survenance: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Nature</label>
                                    <input value={formSinistre.nature} onChange={(e) => setFormSinistre({ ...formSinistre, nature: e.target.value })}
                                        placeholder="Ex: Incendie" className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                                <div>
                                    <label className="text-slate-500 text-xs">Montant estimé (cts)</label>
                                    <input type="number" value={formSinistre.montant_estime_cts} onChange={(e) => setFormSinistre({ ...formSinistre, montant_estime_cts: e.target.value })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={declarerSinistre} disabled={busy || !formSinistre.date_survenance}
                                    className="px-3 py-1 rounded text-sm bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">Déclarer</button>
                                <button onClick={() => setFormSinistre(null)} className="px-3 py-1 rounded text-sm border border-slate-300">Annuler</button>
                            </div>
                        </div>
                    )}
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-600">
                            <tr><th className="px-3 py-2">N°</th><th className="px-3 py-2">Survenance</th><th className="px-3 py-2">Nature</th><th className="px-3 py-2 text-right">Estimé</th><th className="px-3 py-2 text-right">Réglé</th><th className="px-3 py-2">Statut</th><th className="px-3 py-2">Déclaré par</th></tr>
                        </thead>
                        <tbody>
                            {(contrat.sinistres || []).map((s) => (
                                <tr key={s.id} className="border-t border-slate-100">
                                    <td className="px-3 py-2">{s.numero || '—'}</td>
                                    <td className="px-3 py-2">{s.date_survenance}</td>
                                    <td className="px-3 py-2">{s.nature || '—'}</td>
                                    <td className="px-3 py-2 text-right">{s.montant_estime_cts ? `${s.montant_estime_cts / 100} €` : '—'}</td>
                                    <td className="px-3 py-2 text-right">{s.montant_regle_cts ? `${s.montant_regle_cts / 100} €` : '—'}</td>
                                    <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded ${STATUT_COLORS[s.statut] || 'bg-slate-100'}`}>{s.statut}</span></td>
                                    <td className="px-3 py-2 text-slate-500">{s.declare_par}</td>
                                </tr>
                            ))}
                            {(!contrat.sinistres || contrat.sinistres.length === 0) && (
                                <tr><td colSpan={7} className="px-3 py-4 text-center text-slate-400">Aucun sinistre déclaré.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ===== ONGLET SOUSCRIPTION ===== */}
            {onglet === 'souscription' && estCabinet && (
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-slate-900">Souscription</h2>
                        <span className="text-sm text-slate-500">Progression : {progression}% — {progression === 100 ? 'Terminée' : 'En cours'}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all" style={{ width: `${progression}%` }} />
                        </div>
                    </div>
                    <div className="space-y-2 mb-5">
                        {ETAPES_ORDER.map((etape) => (
                            <label key={etape} className="flex items-center gap-3 text-sm cursor-pointer">
                                <input type="checkbox" checked={!!checklist[etape]} onChange={(e) => cocher(etape, e.target.checked)} disabled={busy} className="h-4 w-4" />
                                <span className={checklist[etape] ? 'text-slate-700' : 'text-slate-500'}>{ETAPES_LABELS[etape]}</span>
                            </label>
                        ))}
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-3">
                        <button onClick={genererPolice} disabled={busy} className="px-3 py-1.5 rounded text-sm bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">Générer la police</button>
                        {contrat.statut === 'EN_CONSTITUTION' && (
                            <button onClick={envoyerSignature} disabled={busy || !contrat.documents?.length}
                                className="px-3 py-1.5 rounded text-sm bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50">Envoyer en signature</button>
                        )}
                        {contrat.statut === 'EN_ATTENTE_SIGNATURE' && (
                            <button onClick={marquerSigne} disabled={busy}
                                className="px-3 py-1.5 rounded text-sm bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50">Marquer signé</button>
                        )}
                    </div>
                    {signature && Object.keys(signature).length > 0 && (
                        <div className="mt-4 p-3 rounded bg-slate-50 border border-slate-200 text-sm">
                            <div className="font-medium text-slate-700 mb-1">Dossier de signature</div>
                            {signature.statut === 'SIGNEE'
                                ? <div className="text-emerald-700">Signé le {signature.signee_le}</div>
                                : <div className="text-slate-600">Envoyé le {signature.envoye_le} à {signature.email}</div>
                            }
                        </div>
                    )}
                    {contrat.documents?.length > 0 && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <div className="font-medium text-slate-700 text-sm mb-2">Documents</div>
                            {contrat.documents.map((d) => (
                                <div key={d.id} className="flex items-center justify-between text-sm py-1">
                                    <span className="text-slate-600">{d.nom_origine}{d.version > 1 && ` (v${d.version})`}</span>
                                    <button onClick={() => telecharger(d.id)} className="text-blue-700 hover:underline">Télécharger</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                    )}
        </div>

        {tacheOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                        <h2 className="text-lg font-bold">Créer une tâche</h2>
                        <button onClick={() => setTacheOpen(false)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        <form onSubmit={saveTache}>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Réf</span>
                                        <input value="(Généré automatiquement)" disabled className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Type *</span>
                                        <select value={tacheForm.type} disabled className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500">
                                            <option value="SINISTRE">SINISTRE</option>
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Suivi par *</span>
                                        <select value={tacheForm.assignee_id} onChange={(e) => setTacheForm({ ...tacheForm, assignee_id: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="">Choisir...</option>
                                            {tacheSuiveurs.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Objet *</span>
                                        <select value={tacheForm.objet} onChange={(e) => setTacheForm({ ...tacheForm, objet: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="Ouvrir sinistre">Ouvrir sinistre</option>
                                            <option value="Suivi sinistre">Suivi sinistre</option>
                                            <option value="Clôturer sinistre">Clôturer sinistre</option>
                                            <option value="Expertise">Expertise</option>
                                            <option value="Relance">Relance</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Date début *</span>
                                        <input type="date" value={tacheForm.date_debut} onChange={(e) => setTacheForm({ ...tacheForm, date_debut: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Montant</span>
                                        <input type="number" min="0" step="0.01" value={tacheForm.montant} onChange={(e) => setTacheForm({ ...tacheForm, montant: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Date fin *</span>
                                        <input type="date" value={tacheForm.date_fin} onChange={(e) => setTacheForm({ ...tacheForm, date_fin: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Priorité *</span>
                                        <select value={tacheForm.priorite} onChange={(e) => setTacheForm({ ...tacheForm, priorite: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <option value="FAIBLE">Faible</option>
                                            <option value="BASSE">Basse</option>
                                            <option value="MOYENNE">Moyenne</option>
                                            <option value="HAUTE">Haute</option>
                                            <option value="URGENTE">Urgente</option>
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Avancement (%)</span>
                                        <input type="number" min="0" max="100" value={tacheForm.avancement} onChange={(e) => setTacheForm({ ...tacheForm, avancement: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div className="col-span-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Description *</span>
                                        <textarea value={tacheForm.description} onChange={(e) => setTacheForm({ ...tacheForm, description: e.target.value })} rows={3} required
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Temps passé (h)</span>
                                        <input type="number" min="0" step="0.5" value={tacheForm.temps_passe_h} onChange={(e) => setTacheForm({ ...tacheForm, temps_passe_h: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Statut *</span>
                                        <select value={tacheForm.statut} onChange={(e) => setTacheForm({ ...tacheForm, statut: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <option value="A_FAIRE">À faire</option>
                                            <option value="EN_COURS">En cours</option>
                                            <option value="TERMINEE">Terminée</option>
                                        </select>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-6 mb-3 pb-3 border-b border-slate-200">
                                <h3 className="text-base font-bold text-blue-700 uppercase tracking-wide">Documents à joindre</h3>
                            </div>
                            <label className="cursor-pointer block">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-sm hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
                                    <div className="text-3xl mb-1">⬆</div>
                                    Déposez vos fichiers ici... ou cliquez pour parcourir
                                </div>
                                <input type="file" multiple className="hidden"
                                    onChange={(e) => setTacheFiles([...tacheFiles, ...Array.from(e.target.files)])} />
                            </label>
                            {tacheFiles.length > 0 && (
                                <ul className="mt-3 space-y-2">
                                    {tacheFiles.map((f, i) => (
                                        <li key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                            <span className="text-slate-700 truncate">{f.name}</span>
                                            <button type="button" onClick={() => setTacheFiles(tacheFiles.filter((_, j) => j !== i))}
                                                className="text-slate-400 hover:text-red-600 text-lg leading-none ml-2">&times;</button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setTacheOpen(false)}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                                <button type="submit" disabled={savingTache}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50">
                                    {savingTache ? 'Enregistrement...' : 'Créer la tâche'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}

        {sinistreOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white">
                        <div className="flex items-center gap-3">
                            <span className="w-1.5 h-10 bg-white/70 rounded-full"></span>
                            <div>
                                <h2 className="text-lg font-bold leading-tight">Ajouter un sinistre</h2>
                                <p className="text-xs text-red-100">La référence sera générée après la création</p>
                            </div>
                        </div>
                        <button onClick={() => setSinistreOpen(false)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        <form onSubmit={saveSinistre}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Contrat *</span>
                                        <input value={contrat.reference} disabled className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Date sinistre</span>
                                        <input type="date" value={sinistreForm.date_survenance} onChange={(e) => setSinistreForm({ ...sinistreForm, date_survenance: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Référence sinistre</span>
                                        <input value="" disabled placeholder="Générée après création" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Référence compagnie</span>
                                        <input value={sinistreForm.ref_compagnie} onChange={(e) => setSinistreForm({ ...sinistreForm, ref_compagnie: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Suivi par *</span>
                                        <select value={sinistreForm.suivi_par_id} onChange={(e) => setSinistreForm({ ...sinistreForm, suivi_par_id: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="">Sélectionner...</option>
                                            {sinistreSuiveurs.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Statut *</span>
                                        <select value={sinistreForm.statut} onChange={(e) => setSinistreForm({ ...sinistreForm, statut: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="NON_OUVERT">Non ouvert</option>
                                            <option value="OUVERT">Ouvert</option>
                                            <option value="EN_COURS">En cours</option>
                                            <option value="REGLE">Réglé</option>
                                            <option value="REJETE">Rejeté</option>
                                            <option value="CLASURE">Clôturé</option>
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Garantie applicable</span>
                                        <input value={sinistreForm.garantie} onChange={(e) => setSinistreForm({ ...sinistreForm, garantie: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Franchise</span>
                                        <input value={sinistreForm.franchise} onChange={(e) => setSinistreForm({ ...sinistreForm, franchise: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div className="col-span-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Circonstance *</span>
                                        <input value={sinistreForm.circonstance} onChange={(e) => setSinistreForm({ ...sinistreForm, circonstance: e.target.value })} required
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div className="col-span-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Description des dommages</span>
                                        <textarea value={sinistreForm.description_dommages} onChange={(e) => setSinistreForm({ ...sinistreForm, description_dommages: e.target.value })} rows={3}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Responsabilité *</span>
                                        <input value={sinistreForm.responsabilite} onChange={(e) => setSinistreForm({ ...sinistreForm, responsabilite: e.target.value })} required
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Montant des dommages (€)</span>
                                        <input type="number" step="0.01" min="0" value={sinistreForm.montant_estime_cts} onChange={(e) => setSinistreForm({ ...sinistreForm, montant_estime_cts: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Bénéficiaire</span>
                                        <input value={sinistreForm.beneficiaire} onChange={(e) => setSinistreForm({ ...sinistreForm, beneficiaire: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Expertise</span>
                                        <input value={sinistreForm.expertise} onChange={(e) => setSinistreForm({ ...sinistreForm, expertise: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Recours</span>
                                        <input value={sinistreForm.recours} onChange={(e) => setSinistreForm({ ...sinistreForm, recours: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">État</span>
                                        <select value={sinistreForm.etat} onChange={(e) => setSinistreForm({ ...sinistreForm, etat: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                            <option value="OUVERT">Ouvert</option>
                                            <option value="EN_COURS_EXPERTISE">En cours d'expertise</option>
                                            <option value="CLOS">Clos</option>
                                            <option value="SANS_SUITE">Sans suite</option>
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Clôturé le</span>
                                        <input type="date" value={sinistreForm.cloture_le} onChange={(e) => setSinistreForm({ ...sinistreForm, cloture_le: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-6 mb-3 pb-3 border-b border-slate-200">
                                <h3 className="text-base font-bold text-red-700 uppercase tracking-wide">Documents à joindre</h3>
                            </div>
                            <label className="cursor-pointer block">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-sm hover:border-red-400 hover:bg-red-50/40 transition-colors">
                                    <div className="text-3xl mb-1">⬆</div>
                                    Déposez vos fichiers ici... ou cliquez pour parcourir
                                </div>
                                <input type="file" multiple className="hidden"
                                    onChange={(e) => setSinistreFiles([...sinistreFiles, ...Array.from(e.target.files)])} />
                            </label>
                            {sinistreFiles.length > 0 && (
                                <ul className="mt-3 space-y-2">
                                    {sinistreFiles.map((f, i) => (
                                        <li key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                            <span className="text-slate-700 truncate">{f.name}</span>
                                            <button type="button" onClick={() => setSinistreFiles(sinistreFiles.filter((_, j) => j !== i))}
                                                className="text-slate-400 hover:text-red-600 text-lg leading-none ml-2">&times;</button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setSinistreOpen(false)}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                                <button type="submit" disabled={savingSinistre}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm disabled:opacity-50">
                                    {savingSinistre ? 'Enregistrement...' : 'Créer le sinistre'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

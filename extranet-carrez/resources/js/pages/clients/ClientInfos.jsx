import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

const statutConfig = {
    BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
    SOUMISE: { label: 'Soumise', cls: 'bg-blue-50 text-blue-700' },
    EN_ETUDE: { label: 'En étude', cls: 'bg-amber-50 text-amber-700' },
    PIECES_MANQUANTES: { label: 'Pièces manquantes', cls: 'bg-red-50 text-red-700' },
    DEVIS_EMIS: { label: 'Devis émis', cls: 'bg-purple-50 text-purple-700' },
    ACCEPTEE: { label: 'Acceptée', cls: 'bg-emerald-50 text-emerald-700' },
    EN_SOUSCRIPTION: { label: 'En souscription', cls: 'bg-teal-50 text-teal-700' },
    TRANSFORMEE: { label: 'Transformée', cls: 'bg-green-50 text-green-700' },
    NON_ELIGIBLE: { label: 'Non éligible', cls: 'bg-gray-100 text-gray-500' },
    SANS_SUITE: { label: 'Sans suite', cls: 'bg-gray-100 text-gray-500' },
    EXPIREE: { label: 'Expirée', cls: 'bg-gray-100 text-gray-500' },
};

const contratStatutConfig = {
    EN_CONSTITUTION: { label: 'En constitution', cls: 'bg-slate-100 text-slate-600' },
    EN_ATTENTE_SIGNATURE: { label: 'En attente signature', cls: 'bg-amber-50 text-amber-700' },
    SIGNE: { label: 'Signé', cls: 'bg-blue-50 text-blue-700' },
    EN_ATTENTE_EMISSION: { label: 'En attente émission', cls: 'bg-indigo-50 text-indigo-700' },
    EN_VIGUEUR: { label: 'En vigueur', cls: 'bg-emerald-50 text-emerald-700' },
    IMPAYE: { label: 'Impayé', cls: 'bg-red-50 text-red-700' },
    SUSPENDU: { label: 'Suspendu', cls: 'bg-amber-50 text-amber-700' },
    RESILIE: { label: 'Résilié', cls: 'bg-gray-100 text-gray-500' },
    SANS_EFFET: { label: 'Sans effet', cls: 'bg-gray-100 text-gray-500' },
    EXPIRE: { label: 'Expiré', cls: 'bg-gray-100 text-gray-500' },
};

const factureStatutConfig = {
    BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600' },
    EMISE: { label: 'Émise', cls: 'bg-blue-50 text-blue-700' },
    PAYEE: { label: 'Payée', cls: 'bg-emerald-50 text-emerald-700' },
    IMPAYEE: { label: 'Impayée', cls: 'bg-red-50 text-red-700' },
    ANNULEE: { label: 'Annulée', cls: 'bg-gray-100 text-gray-500' },
};

const sinistreStatutConfig = {
    DECLARE: { label: 'Déclaré', cls: 'bg-blue-50 text-blue-700' },
    EN_COURS: { label: 'En cours', cls: 'bg-amber-50 text-amber-700' },
    REGLE: { label: 'Réglé', cls: 'bg-emerald-50 text-emerald-700' },
    REJETE: { label: 'Rejeté', cls: 'bg-red-50 text-red-700' },
    CLASURE: { label: 'Clôturé', cls: 'bg-gray-100 text-gray-500' },
};

const sinistreEtatConfig = {
    OUVERT: { label: 'Ouvert', cls: 'bg-blue-50 text-blue-700' },
    EN_COURS_EXPERTISE: { label: 'En cours d\'expertise', cls: 'bg-amber-50 text-amber-700' },
    CLOS: { label: 'Clos', cls: 'bg-emerald-50 text-emerald-700' },
    SANS_SUITE: { label: 'Sans suite', cls: 'bg-gray-100 text-gray-500' },
};

const tachePrioriteConfig = {
    FAIBLE: { label: 'Faible', cls: 'bg-slate-100 text-slate-600' },
    BASSE: { label: 'Basse', cls: 'bg-slate-100 text-slate-600' },
    MOYENNE: { label: 'Moyenne', cls: 'bg-blue-50 text-blue-700' },
    HAUTE: { label: 'Haute', cls: 'bg-amber-50 text-amber-700' },
    URGENTE: { label: 'Urgente', cls: 'bg-red-50 text-red-700' },
};

const tacheStatutConfig = {
    A_FAIRE: { label: 'À faire', cls: 'bg-slate-100 text-slate-600' },
    EN_COURS: { label: 'En cours', cls: 'bg-amber-50 text-amber-700' },
    TERMINEE: { label: 'Terminée', cls: 'bg-emerald-50 text-emerald-700' },
};

const EMPTY = { type: 'PHYSIQUE', civilite: '', nom: '', prenom: '', date_naissance: '', raison_sociale: '', siren: '', siret: '', email: '', telephone: '', adresse: '', code_postal: '', ville: '', notes: '', preference_contact: '', email2: '', origine: '', rgpd_consentement: false, exclure_marketing: false };

export default function ClientInfos() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [demandes, setDemandes] = useState([]);
    const [contrats, setContrats] = useState([]);
    const [factures, setFactures] = useState([]);
    const [sinistres, setSinistres] = useState([]);
    const [sinistreOpen, setSinistreOpen] = useState(false);
    const [sinistreSuiveurs, setSinistreSuiveurs] = useState([]);
    const [sinistreForm, setSinistreForm] = useState({ contrat_id: '', date_survenance: '', ref_compagnie: '', suivi_par_id: '', statut: 'NON_OUVERT', garantie: '', franchise: '', circonstance: '', description_dommages: '', responsabilite: '', montant_estime_cts: '', beneficiaire: '', expertise: '', recours: '', etat: 'OUVERT', cloture_le: '' });
    const [sinistreFiles, setSinistreFiles] = useState([]);
    const [sinistreDocTypeId, setSinistreDocTypeId] = useState('');
    const [savingSinistre, setSavingSinistre] = useState(false);
    const [factureOpen, setFactureOpen] = useState(false);
    const [factureEtape, setFactureEtape] = useState(1);
    const [factureDraft, setFactureDraft] = useState(null);
    const [factureHeader, setFactureHeader] = useState({ souscripteur: '', adresse: '', code_postal: '', ville: '', contact_commercial: '', date_facture: '', date_echeance: '', moyens_reglement: [] });
    const [factureLignes, setFactureLignes] = useState([{ type: '', designation: '', quantite: 1, prix_unitaire_ht_cts: '', taxe: 20 }]);
    const [savingFacture, setSavingFacture] = useState(false);
    const [selFactures, setSelFactures] = useState([]);
    const [clientDocs, setClientDocs] = useState([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [taches, setTaches] = useState([]);
    const [tacheOpen, setTacheOpen] = useState(false);
    const [tacheForm, setTacheForm] = useState({
        titre: '', type: 'SINISTRE', objet: 'Ouvrir sinistre', description: '',
        priorite: 'FAIBLE', statut: 'A_FAIRE', date_echeance: '',
        date_debut: '', date_fin: '', montant: '', avancement: 0,
        temps_passe_h: '', assignee_id: '',
    });
    const [tacheSuiveurs, setTacheSuiveurs] = useState([]);
    const [tacheFiles, setTacheFiles] = useState([]);
    const [tacheDocTypeId, setTacheDocTypeId] = useState('');
    const [savingTache, setSavingTache] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [tab, setTab] = useState('fiche');
    const [editor, setEditor] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [notesDraft, setNotesDraft] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    const load = () => {
        setLoading(true);
        setError('');
        Promise.all([
            api.get(`/clients/${id}`),
            api.get(`/clients/${id}/demandes`),
            api.get(`/clients/${id}/contrats`),
            api.get(`/clients/${id}/factures`),
            api.get(`/clients/${id}/sinistres`),
            api.get(`/clients/${id}/taches`),
            api.get('/documents').catch(() => ({ data: { data: [] } })),
        ])
            .then(([cRes, dRes, coRes, fRes, sRes, tRes, dcRes]) => {
                setClient(cRes.data.data);
                setNotesDraft(cRes.data.data.notes || '');
                setDemandes(dRes.data.data);
                setContrats(coRes.data.data);
                setFactures(fRes.data.data);
                setSinistres(sRes.data.data);
                setTaches(tRes.data.data);
                setClientDocs(dcRes.data.data || []);
            })
            .catch(() => setError('Erreur de chargement.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [id]);

    const telechargerDoc = async (docId) => {
        try {
            const res = await api.get(`/documents/${docId}/url`);
            window.open(res.data.url, '_blank');
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de téléchargement du document.");
        }
    };

    const supprimerDoc = async (d) => {
        if (!window.confirm(`Supprimer le document « ${d.nom_origine} » ?`)) return;
        try {
            await api.delete(`/documents/${d.id}`);
            setClientDocs(clientDocs.filter((x) => x.id !== d.id));
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de suppression du document.");
        }
    };

    const fmtTaille = (octets) => {
        if (octets == null) return '';
        if (octets < 1024) return `${octets} o`;
        if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
        return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
    };

    const openEdit = () => {
        setForm({
            type: client.type || 'PHYSIQUE', civilite: client.civilite || '', nom: client.nom || '', prenom: client.prenom || '',
            date_naissance: client.date_naissance || '', raison_sociale: client.raison_sociale || '',
            siren: client.siren || '', siret: client.siret || '', email: client.email || '', telephone: client.telephone || '',
            adresse: client.adresse || '', code_postal: client.code_postal || '', ville: client.ville || '',
            notes: client.notes || '',
            preference_contact: client.preference_contact || '', email2: client.email2 || '',
            origine: client.origine || '', rgpd_consentement: client.rgpd_consentement || false,
            exclure_marketing: client.exclure_marketing || false,
        });
        setError('');
        setEditor(true);
    };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.put(`/clients/${client.id}`, form);
            setEditor(false);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'enregistrement.");
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!window.confirm(`Supprimer le client « ${client.nom_complet} » ?`)) return;
        setDeleting(true);
        setError('');
        try {
            await api.delete(`/clients/${client.id}`);
            navigate('/clients');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de suppression.');
            setDeleting(false);
        }
    };

    const fmtDate = (s) => {
        if (!s) return '—';
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return s;
        return d.toLocaleDateString('fr-FR');
    };

    const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const openFacture = () => {
        setFactureEtape(1);
        setFactureDraft(null);
        setFactureHeader({
            souscripteur: client.nom_complet || '',
            adresse: client.adresse || '',
            code_postal: client.code_postal || '',
            ville: client.ville || '',
            contact_commercial: '',
            date_facture: new Date().toISOString().slice(0, 10),
            date_echeance: '',
            moyens_reglement: [],
        });
        setFactureLignes([{ type: '', designation: '', quantite: 1, prix_unitaire_ht_cts: '', taxe: 20 }]);
        setFactureOpen(true);
    };

    const basculerMoyen = (moyen) => {
        setFactureHeader((prev) => {
            const has = prev.moyens_reglement.includes(moyen);
            return {
                ...prev,
                moyens_reglement: has ? prev.moyens_reglement.filter((m) => m !== moyen) : [...prev.moyens_reglement, moyen],
            };
        });
    };

    const poursuivreFacture = (e) => {
        e.preventDefault();
        if (!factureHeader.date_facture || !factureHeader.date_echeance) {
            setError('Les dates de facture et d’échéance sont requises.');
            return;
        }
        setError('');
        setFactureEtape(2);
    };

    const ajouterLigne = () => {
        setFactureLignes([...factureLignes, { type: '', designation: '', quantite: 1, prix_unitaire_ht_cts: '', taxe: 20 }]);
    };

    const majLigne = (idx, champ, valeur) => {
        setFactureLignes(factureLignes.map((l, i) => (i === idx ? { ...l, [champ]: valeur } : l)));
    };

    const supprimerLigne = (idx) => {
        if (factureLignes.length === 1) return;
        setFactureLignes(factureLignes.filter((_, i) => i !== idx));
    };

    const totalLigne = (l) => {
        const qte = parseFloat(l.quantite) || 0;
        const pu = Math.round((parseFloat(l.prix_unitaire_ht_cts) || 0) * 100);
        const ht = Math.round(qte * pu);
        const taxes = Math.round(ht * (parseFloat(l.taxe) || 0) / 100);
        return { ht, taxes, ttc: ht + taxes };
    };

    const totalsFacture = factureLignes.reduce(
        (acc, l) => { const t = totalLigne(l); return { ht: acc.ht + t.ht, taxes: acc.taxes + t.taxes, ttc: acc.ttc + t.ttc }; },
        { ht: 0, taxes: 0, ttc: 0 }
    );

    const saveFacture = async (e) => {
        e.preventDefault();
        setSavingFacture(true);
        setError('');
        try {
            let facture = factureDraft;
            if (!facture) {
                const res = await api.post(`/clients/${client.id}/factures`, {
                    souscripteur: factureHeader.souscripteur,
                    adresse: factureHeader.adresse,
                    code_postal: factureHeader.code_postal,
                    ville: factureHeader.ville,
                    contact_commercial: factureHeader.contact_commercial,
                    date_facture: factureHeader.date_facture,
                    date_echeance: factureHeader.date_echeance,
                    moyens_reglement: factureHeader.moyens_reglement,
                });
                facture = res.data.data;
            }
            const lignes = factureLignes
                .filter((l) => l.designation.trim() !== '')
                .map((l) => ({
                    type: l.type,
                    designation: l.designation,
                    quantite: parseFloat(l.quantite) || 0,
                    prix_unitaire_ht_cts: Math.round((parseFloat(l.prix_unitaire_ht_cts) || 0) * 100),
                    taxe: parseFloat(l.taxe) || 0,
                }));
            await api.post(`/factures/${facture.id}/lignes`, { lignes });
            setFactureOpen(false);
            setTab('factures');
            await api.get(`/clients/${client.id}/factures`)
                .then((res) => setFactures(res.data.data));
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'enregistrement.");
        } finally {
            setSavingFacture(false);
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
        try {
            const ref = await api.get('/referentiels/actifs');
            const types = ref.data.types_documents || [];
            const t = types.find((x) => x.code === 'DOC_SINISTRE') || types[0];
            setTacheDocTypeId(t ? String(t.id) : '');
        } catch (e) { /* silencieux */ }
    };

    const saveTache = async (e) => {
        e.preventDefault();
        setSavingTache(true);
        setError('');
        try {
            const res = await api.post(`/clients/${client.id}/taches`, {
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
            if (tacheFiles.length > 0 && tacheDocTypeId) {
                for (const file of tacheFiles) {
                    const fd = new FormData();
                    fd.append('type_document_id', tacheDocTypeId);
                    fd.append('objet_type', 'tache');
                    fd.append('objet_id', String(tacheId));
                    fd.append('file', file);
                    await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                }
            }

            setTacheOpen(false);
            setTab('taches');
            await api.get(`/clients/${client.id}/taches`).then((res) => setTaches(res.data.data));
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'enregistrement.");
        } finally {
            setSavingTache(false);
        }
    };

    const basculerTache = async (t) => {
        const nouveauStatut = t.statut === 'TERMINEE' ? 'A_FAIRE' : 'TERMINEE';
        try {
            await api.put(`/taches/${t.id}`, { statut: nouveauStatut });
            await api.get(`/clients/${client.id}/taches`).then((res) => setTaches(res.data.data));
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de mise à jour.");
        }
    };

    const supprimerTache = async (t) => {
        if (!window.confirm(`Supprimer la tâche « ${t.titre} » ?`)) return;
        try {
            await api.delete(`/taches/${t.id}`);
            await api.get(`/clients/${client.id}/taches`).then((res) => setTaches(res.data.data));
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de suppression.");
        }
    };

    const openSinistre = async () => {
        setSinistreForm({
            contrat_id: contrats.length ? String(contrats[0].id) : '',
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
        try {
            const ref = await api.get('/referentiels/actifs');
            const types = ref.data.types_documents || [];
            const t = types.find((x) => x.code === 'DOC_SINISTRE') || types[0];
            setSinistreDocTypeId(t ? String(t.id) : '');
        } catch (e) { /* silencieux */ }
    };

    const saveSinistre = async (e) => {
        e.preventDefault();
        setSavingSinistre(true);
        setError('');
        try {
            const res = await api.post(`/clients/${client.id}/sinistres`, {
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
            if (sinistreFiles.length > 0 && sinistreDocTypeId) {
                for (const file of sinistreFiles) {
                    const fd = new FormData();
                    fd.append('type_document_id', sinistreDocTypeId);
                    fd.append('objet_type', 'sinistre');
                    fd.append('objet_id', String(sinistreId));
                    fd.append('file', file);
                    await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                }
            }

            setSinistreOpen(false);
            setTab('sinistres');
            await api.get(`/clients/${client.id}/sinistres`).then((res) => setSinistres(res.data.data));
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'enregistrement.");
        } finally {
            setSavingSinistre(false);
        }
    };

    const saveNotes = async () => {
        setSavingNotes(true);
        try {
            await api.put(`/clients/${client.id}`, { notes: notesDraft });
            setClient({ ...client, notes: notesDraft });
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'enregistrement.");
        } finally {
            setSavingNotes(false);
        }
    };

    if (loading) return <div className="text-slate-500">Chargement...</div>;

    if (!client) {
        return (
            <div>
                <button onClick={() => navigate('/clients')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-700 mb-4">← Retour à la liste</button>
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">Client introuvable.</div>
            </div>
        );
    }

    const row = (label, value) => (
        <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium text-slate-800 text-right">{value || '—'}</dd>
        </div>
    );

    return (
        <div>
            <button onClick={() => navigate('/clients')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-700 mb-4">← Retour à la liste</button>

            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl px-6 py-5 flex items-center gap-4 mb-4 shadow-lg">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg ${client.type === 'MORALE' ? 'bg-gradient-to-br from-purple-400 to-purple-600' : 'bg-gradient-to-br from-sky-400 to-blue-600'}`}>
                    {client.nom_complet?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-white">{client.nom_complet}</h1>
                    {client.raison_sociale && <div className="text-sm text-blue-100">{client.raison_sociale}</div>}
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${client.type === 'MORALE' ? 'bg-purple-500/40 text-white' : 'bg-sky-500/40 text-white'}`}>
                        {client.type === 'MORALE' ? 'Personne morale' : 'Personne physique'}
                    </span>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-4 w-fit shadow-sm">
                <button onClick={() => setTab('fiche')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'fiche' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Fiche Client
                </button>
                <button onClick={() => setTab('projets')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'projets' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Projets
                    <span className={`text-xs px-1.5 rounded-full ${tab === 'projets' ? 'bg-white/20' : 'bg-slate-100'}`}>{demandes.length}</span>
                </button>
                <button onClick={() => setTab('contrats')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'contrats' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Contrats
                    <span className={`text-xs px-1.5 rounded-full ${tab === 'contrats' ? 'bg-white/20' : 'bg-slate-100'}`}>{contrats.length}</span>
                </button>
                <button onClick={() => setTab('factures')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'factures' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Factures
                    <span className={`text-xs px-1.5 rounded-full ${tab === 'factures' ? 'bg-white/20' : 'bg-slate-100'}`}>{factures.length}</span>
                </button>
                <button onClick={() => setTab('sinistres')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'sinistres' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Sinistres
                    <span className={`text-xs px-1.5 rounded-full ${tab === 'sinistres' ? 'bg-white/20' : 'bg-slate-100'}`}>{sinistres.length}</span>
                </button>
                <button onClick={() => setTab('taches')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'taches' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Tâches
                    <span className={`text-xs px-1.5 rounded-full ${tab === 'taches' ? 'bg-white/20' : 'bg-slate-100'}`}>{taches.length}</span>
                </button>
                <button onClick={() => setTab('documents')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'documents' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Documents
                    <span className={`text-xs px-1.5 rounded-full ${tab === 'documents' ? 'bg-white/20' : 'bg-slate-100'}`}>{clientDocs.length}</span>
                </button>
            </div>

            {tab === 'documents' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {['Documents', 'Édition'].map((titre) => (
                        <div key={titre} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900">{titre}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{clientDocs.length}</span>
                            </div>
                            {clientDocs.length === 0 ? (
                                <p className="px-5 py-8 text-sm text-slate-400 text-center">Aucun document.</p>
                            ) : (
                                <ul className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                                    {clientDocs.map((d) => (
                                        <li key={d.id} className="px-4 py-3 flex items-center gap-3">
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-sm font-medium text-slate-900 truncate">{d.nom_origine}</span>
                                                <span className="block text-xs text-slate-400">{d.type_document}{d.taille ? ` • ${fmtTaille(d.taille)}` : ''}</span>
                                            </span>
                                            <button onClick={() => telechargerDoc(d.id)} title="Télécharger"
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                </svg>
                                            </button>
                                            <button onClick={() => supprimerDoc(d)} title="Supprimer"
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {tab === 'fiche' && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <div className="rounded-xl border border-slate-200 p-5 bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.9 0-7 2.7-7 5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1c0-2.3-3.1-5-7-5Z" /></svg>
                            </div>
                            <h3 className="font-semibold text-slate-900">Identité</h3>
                        </div>
                        <dl className="space-y-2 text-sm">
                            {row('Type', client.type === 'MORALE' ? 'Personne morale' : 'Personne physique')}
                            {client.type === 'PHYSIQUE' && row('Civilité', client.civilite)}
                            {row('Date de naissance', client.date_naissance)}
                            {row('Raison sociale', client.raison_sociale)}
                            {row('Forme juridique', client.forme_juridique)}
                            {row('SIREN', client.siren)}
                            {row('SIRET', client.siret)}
                            {row('Adresse', client.adresse)}
                            {row('Localisation', [client.code_postal, client.ville].filter(Boolean).join(' '))}
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-500">Origine</dt>
                                <dd className="flex flex-wrap justify-end gap-1">
                                    {(client.origine || '').split(',').map(s => s.trim()).filter(Boolean).length > 0
                                        ? (client.origine || '').split(',').map(s => s.trim()).filter(Boolean).map((v) => (
                                            <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{v}</span>
                                        ))
                                        : <span className="text-slate-400">—</span>
                                    }
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-slate-500">Préférence de contact</dt>
                                <dd className="flex flex-wrap justify-end gap-1">
                                    {(client.preference_contact || '').split(',').map(s => s.trim()).filter(Boolean).length > 0
                                        ? (client.preference_contact || '').split(',').map(s => s.trim()).filter(Boolean).map((v) => (
                                            <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{v}</span>
                                        ))
                                        : <span className="text-slate-400">—</span>
                                    }
                                </dd>
                            </div>
                            {row('Personne à contacter', client.personne_a_contacter)}
                            {row('RGPD consentement', client.rgpd_consentement ? 'Oui' : 'Non')}
                            {row('Exclure marketing', client.exclure_marketing ? 'Oui' : 'Non')}
                        </dl>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5 bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z" /></svg>
                                </div>
                                <h3 className="font-semibold text-slate-900">Contact</h3>
                            </div>
                            <dl className="space-y-2 text-sm">
                                {row('E-mail', client.email)}
                                {row('E-mail 2', client.email2)}
                                {row('Téléphone', client.telephone)}
                                {row('Téléphone 2', client.tel2)}
                                {row('Préférence de contact', client.preference_contact)}
                            </dl>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {client.email && (
                                    <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100">Envoyer un e-mail</a>
                                )}
                                {client.telephone && (
                                    <a href={`tel:${client.telephone}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100">Appeler</a>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-5 bg-white shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                                </div>
                                <h3 className="font-semibold text-slate-900">Conseillers affectés</h3>
                            </div>
                            <dl className="space-y-2 text-sm">
                                {(!client.utilisateurs || client.utilisateurs.length === 0) ? (
                                    <dt className="text-slate-400">Aucun conseiller affecté</dt>
                                ) : (
                                    client.utilisateurs.map((u) => (
                                        <div key={u.id} className="flex justify-between gap-3">
                                            <dt className="text-slate-500">{u.name}</dt>
                                            <dd className="font-medium text-slate-800 text-right">{u.email}</dd>
                                        </div>
                                    ))
                                )}
                            </dl>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-5 bg-white shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /></svg>
                                </div>
                                <h3 className="font-semibold text-slate-900">Action</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={openEdit} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">Modifier</button>
                                <button onClick={remove} disabled={deleting}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors">
                                    {deleting ? 'Suppression...' : 'Supprimer'}
                                </button>
                            </div>
                        </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-5 bg-white shadow-sm mt-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" /></svg>
                        </div>
                        <h3 className="font-semibold text-slate-900">Notes</h3>
                    </div>
                    <textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        rows={4}
                        placeholder="Notes sur le client..."
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                    />
                    <div className="flex justify-end">
                        <button onClick={saveNotes} disabled={savingNotes}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors">
                            {savingNotes ? 'Enregistrement...' : 'Enregistrer les notes'}
                        </button>
                    </div>
                </div>
            </>)}

            {tab === 'projets' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {demandes.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Aucun projet (demande) assigné à ce client.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Référence</th>
                                    <th className="px-4 py-3">Statut</th>
                                    <th className="px-4 py-3">Branche</th>
                                    <th className="px-4 py-3">Gestionnaire</th>
                                    <th className="px-4 py-3">Soumission</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {demandes.map((d) => {
                                    const sc = statutConfig[d.statut] || { label: d.statut, cls: 'bg-slate-100 text-slate-600' };
                                    return (
                                        <tr key={d.id} onClick={() => navigate(`/demandes/${d.id}`)}
                                            className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900">{d.reference}</td>
                                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                            <td className="px-4 py-3 text-slate-600">{d.branche || '—'}</td>
                                            <td className="px-4 py-3 text-slate-600">{d.gestionnaire || '—'}</td>
                                            <td className="px-4 py-3 text-slate-600">{fmtDate(d.date_soumission)}</td>
                                            <td className="px-4 py-3 text-right text-blue-600">Ouvrir →</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'contrats' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {contrats.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Aucun contrat pour ce client.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Référence</th>
                                    <th className="px-4 py-3">N° Police</th>
                                    <th className="px-4 py-3">Statut</th>
                                    <th className="px-4 py-3">Produit</th>
                                    <th className="px-4 py-3">Date effet</th>
                                    <th className="px-4 py-3">Échéance</th>
                                    <th className="px-4 py-3 text-right">Prime TTC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contrats.map((c) => {
                                    const sc = contratStatutConfig[c.statut] || { label: c.statut, cls: 'bg-slate-100 text-slate-600' };
                                    return (
                                        <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900">{c.reference || '—'}</td>
                                            <td className="px-4 py-3 text-slate-600">{c.numero_police || '—'}</td>
                                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                            <td className="px-4 py-3 text-slate-600">{c.produit || '—'}</td>
                                            <td className="px-4 py-3 text-slate-600">{fmtDate(c.date_effet)}</td>
                                            <td className="px-4 py-3 text-slate-600">{fmtDate(c.date_echeance_principale)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-900">{c.prime_ttc_cts != null ? `${(c.prime_ttc_cts / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'factures' && (
                <div>
                    <div className="flex justify-end mb-3">
                        <button onClick={openFacture}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">
                            + Ajouter une facture
                        </button>
                    </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 w-8">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={factures.length > 0 && selFactures.length === factures.length}
                                        onChange={(e) => setSelFactures(e.target.checked ? factures.map((f) => f.id) : [])}
                                    />
                                </th>
                                <th className="px-4 py-3">Id</th>
                                <th className="px-4 py-3">Numéro</th>
                                <th className="px-4 py-3 text-right">Montant TTC</th>
                                <th className="px-4 py-3">Date Facture</th>
                                <th className="px-4 py-3">Date Échéance</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3 text-right">Solde</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {factures.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-6 text-center text-slate-500">Aucune donnée à afficher</td>
                            </tr>
                        ) : (
                            factures.map((f) => {
                                const sc = factureStatutConfig[f.statut] || { label: f.statut, cls: 'bg-slate-100 text-slate-600' };
                                const soldeCts = f.statut === 'PAYEE' ? 0 : (f.montant_ttc_cts ?? 0);
                                return (
                                    <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selFactures.includes(f.id)}
                                                onChange={(e) => setSelFactures(e.target.checked ? [...selFactures, f.id] : selFactures.filter((x) => x !== f.id))}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{f.id}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{f.reference || '—'}</td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-900">{f.montant_ttc_cts != null ? `${(f.montant_ttc_cts / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{fmtDate(f.date_facture)}</td>
                                        <td className="px-4 py-3 text-slate-600">{fmtDate(f.date_echeance)}</td>
                                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-900">{soldeCts > 0 ? `${(soldeCts / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</td>
                                        <td className="px-4 py-3 text-right text-slate-400 hover:text-blue-600 cursor-pointer">⋯</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                    </div>
                    <div className="px-4 py-2 text-sm text-slate-500 border-t border-slate-200 bg-slate-50">
                        {selFactures.length} sélectionné{selFactures.length > 1 ? 's' : ''} / {factures.length} total
                    </div>
                </div>
                </div>
            )}

            {tab === 'sinistres' && (
                <div>
                    <div className="flex justify-end mb-3">
                        <button onClick={openSinistre}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">
                            + Ajouter sinistre
                        </button>
                    </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Réf interne</th>
                                <th className="px-4 py-3">Réf compagnie</th>
                                <th className="px-4 py-3">Type de contrat</th>
                                <th className="px-4 py-3">Réf contrat</th>
                                <th className="px-4 py-3">Compagnie</th>
                                <th className="px-4 py-3">Gtie applicable</th>
                                <th className="px-4 py-3">Statut</th>
                                <th className="px-4 py-3">État</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {sinistres.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-6 text-center text-slate-500">Aucune donnée à afficher</td>
                            </tr>
                        ) : (
                            sinistres.map((s) => {
                                const sc = sinistreStatutConfig[s.statut] || { label: s.statut, cls: 'bg-slate-100 text-slate-600' };
                                const ec = sinistreEtatConfig[s.etat] || { label: s.etat, cls: 'bg-slate-100 text-slate-600' };
                                return (
                                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-900">{s.numero || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{s.ref_compagnie || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{s.type_contrat || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{s.contrat_numero_police || s.contrat_reference || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{s.compagnie || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{s.garantie || '—'}</td>
                                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${ec.cls}`}>{ec.label}</span></td>
                                        <td className="px-4 py-3 text-slate-600">{fmtDate(s.date_survenance)}</td>
                                        <td className="px-4 py-3 text-right text-slate-400 hover:text-blue-600 cursor-pointer">⋯</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                    </div>
                </div>
                </div>
            )}

            {tab === 'taches' && (
                <div>
                    <div className="flex justify-end mb-3">
                        <button onClick={openTache}
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">
                            + Ajouter une tâche
                        </button>
                    </div>
                    {taches.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">Aucune tâche pour ce client.</div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
                                        <th className="px-4 py-3 font-semibold">Réf</th>
                                        <th className="px-4 py-3 font-semibold">Date limite</th>
                                        <th className="px-4 py-3 font-semibold">Type</th>
                                        <th className="px-4 py-3 font-semibold">Objet</th>
                                        <th className="px-4 py-3 font-semibold">Statut</th>
                                        <th className="px-4 py-3 font-semibold">Priorité</th>
                                        <th className="px-4 py-3 font-semibold text-right">Montant en jeu</th>
                                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {taches.map((t) => {
                                        const pc = tachePrioriteConfig[t.priorite] || { label: t.priorite, cls: 'bg-slate-100 text-slate-600' };
                                        const sc = tacheStatutConfig[t.statut] || { label: t.statut, cls: 'bg-slate-100 text-slate-600' };
                                        const dl = t.date_echeance || t.date_fin;
                                        return (
                                            <tr key={t.id} className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${t.statut === 'TERMINEE' ? 'opacity-60' : ''}`}>
                                                <td className="px-4 py-3 font-medium text-slate-900">{t.reference || t.id}</td>
                                                <td className="px-4 py-3 text-slate-600">{dl ? fmtDate(dl) : '—'}</td>
                                                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t.type || 'SINISTRE'}</span></td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-slate-900">{t.objet || t.titre}</div>
                                                    {t.assignee_name && <div className="text-xs text-slate-400">Suivi par : {t.assignee_name}</div>}
                                                </td>
                                                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${pc.cls}`}>{pc.label}</span></td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-900">{t.montant != null ? `${Number(t.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => basculerTache(t)}
                                                        title={t.statut === 'TERMINEE' ? 'Réouvrir' : 'Marquer terminée'}
                                                        className="text-slate-400 hover:text-blue-600 text-lg leading-none mr-2">
                                                        {t.statut === 'TERMINEE' ? '↺' : '✓'}
                                                    </button>
                                                    <button onClick={() => supprimerTache(t)} className="text-slate-400 hover:text-red-600 text-lg leading-none">&times;</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}


            {factureOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-4xl shadow-2xl my-4 max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Ajouter une facture</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Étape {factureEtape} sur 2 — {factureEtape === 1 ? 'Informations' : 'Facturation'}</p>
                            </div>
                            <button onClick={() => setFactureOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                        </div>
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                        {factureEtape === 1 && (
                            <form onSubmit={poursuivreFacture}>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Field label="Souscripteur *" value={factureHeader.souscripteur} onChange={(e) => setFactureHeader({ ...factureHeader, souscripteur: e.target.value })} required />
                                    </div>
                                    <div className="col-span-2">
                                        <Field label="Adresse" value={factureHeader.adresse} onChange={(e) => setFactureHeader({ ...factureHeader, adresse: e.target.value })} />
                                    </div>
                                    <Field label="Code postal" value={factureHeader.code_postal} onChange={(e) => setFactureHeader({ ...factureHeader, code_postal: e.target.value })} />
                                    <Field label="Ville" value={factureHeader.ville} onChange={(e) => setFactureHeader({ ...factureHeader, ville: e.target.value })} />
                                    <div className="col-span-2">
                                        <Field label="Contact commercial" value={factureHeader.contact_commercial} onChange={(e) => setFactureHeader({ ...factureHeader, contact_commercial: e.target.value })} />
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-sm font-medium text-slate-700 mb-1">Numéro Facture</div>
                                        <div className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                            La référence sera générée après la création de la facture
                                        </div>
                                    </div>
                                    <Field label="Date de facture *" type="date" value={factureHeader.date_facture} onChange={(e) => setFactureHeader({ ...factureHeader, date_facture: e.target.value })} />
                                    <Field label="Date d'échéance *" type="date" value={factureHeader.date_echeance} onChange={(e) => setFactureHeader({ ...factureHeader, date_echeance: e.target.value })} />
                                    <div className="col-span-2">
                                        <label className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-slate-700">Autoriser les moyens de règlement pour cette facture *</span>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={factureHeader.moyens_reglement.length > 0}
                                                onChange={(e) => setFactureHeader({ ...factureHeader, moyens_reglement: e.target.checked ? ['Carte bancaire'] : [] })}
                                            />
                                        </label>
                                        {factureHeader.moyens_reglement.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {['Carte bancaire', 'Virement'].filter((m) => factureHeader.moyens_reglement.includes(m)).map((m) => (
                                                    <span key={m} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                                                        {m}
                                                        <button type="button" onClick={() => basculerMoyen(m)} className="text-blue-400 hover:text-blue-700">&times;</button>
                                                    </span>
                                                ))}
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {['Carte bancaire', 'Virement'].filter((m) => !factureHeader.moyens_reglement.includes(m)).map((m) => (
                                                        <button type="button" key={m} onClick={() => basculerMoyen(m)}
                                                            className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600">
                                                            + {m}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" onClick={() => setFactureOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                                    <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                                        Poursuivre
                                    </button>
                                </div>
                            </form>
                        )}

                        {factureEtape === 2 && (
                            <form onSubmit={saveFacture}>
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold text-slate-900">Facturation</h3>
                                        <button type="button" onClick={ajouterLigne} className="text-sm font-medium text-blue-600 hover:text-blue-700">+ Ajouter une ligne</button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                                                    <th className="px-2 py-2">Type *</th>
                                                    <th className="px-2 py-2">Désignation *</th>
                                                    <th className="px-2 py-2 w-16">Qté *</th>
                                                    <th className="px-2 py-2 w-28">Prix unitaire HT *</th>
                                                    <th className="px-2 py-2 w-20">Taxe *</th>
                                                    <th className="px-2 py-2 w-28 text-right">Total TTC *</th>
                                                    <th className="px-2 py-2 w-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {factureLignes.map((l, i) => {
                                                    const t = totalLigne(l);
                                                    return (
                                                        <tr key={i} className="border-b border-slate-100">
                                                            <td className="px-1 py-1">
                                                                <input value={l.type} onChange={(e) => majLigne(i, 'type', e.target.value)} placeholder="Prestation"
                                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
                                                            </td>
                                                            <td className="px-1 py-1">
                                                                <input value={l.designation} onChange={(e) => majLigne(i, 'designation', e.target.value)} placeholder="Libellé"
                                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" required />
                                                            </td>
                                                            <td className="px-1 py-1">
                                                                <input type="number" min="0" step="any" value={l.quantite} onChange={(e) => majLigne(i, 'quantite', e.target.value)}
                                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" required />
                                                            </td>
                                                            <td className="px-1 py-1">
                                                                <input type="number" min="0" step="0.01" value={l.prix_unitaire_ht_cts} onChange={(e) => majLigne(i, 'prix_unitaire_ht_cts', e.target.value)}
                                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" required />
                                                            </td>
                                                            <td className="px-1 py-1">
                                                                <input type="number" min="0" max="100" step="any" value={l.taxe} onChange={(e) => majLigne(i, 'taxe', e.target.value)}
                                                                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" required />
                                                            </td>
                                                            <td className="px-1 py-1 text-right font-medium text-slate-900">
                                                                {(t.ttc / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                                            </td>
                                                            <td className="px-1 py-1 text-right">
                                                                <button type="button" onClick={() => supprimerLigne(i)} className="text-slate-400 hover:text-red-600">&times;</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="text-sm">
                                                    <td colSpan={4}></td>
                                                    <td className="px-2 py-2 text-slate-500 text-right">Total HT</td>
                                                    <td className="px-2 py-2 text-right font-semibold">{(totalsFacture.ht / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                                                    <td></td>
                                                </tr>
                                                <tr className="text-sm">
                                                    <td colSpan={4}></td>
                                                    <td className="px-2 py-2 text-slate-500 text-right">Total taxes</td>
                                                    <td className="px-2 py-2 text-right font-semibold">{(totalsFacture.taxes / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                                                    <td></td>
                                                </tr>
                                                <tr className="text-sm font-bold">
                                                    <td colSpan={4}></td>
                                                    <td className="px-2 py-2 text-slate-700 text-right">Total TTC</td>
                                                    <td className="px-2 py-2 text-right">{(totalsFacture.ttc / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button type="button" onClick={() => setFactureEtape(1)} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Retour</button>
                                    <button type="submit" disabled={savingFacture} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50">
                                        {savingFacture ? 'Enregistrement...' : 'Créer la facture'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {tacheOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl my-6 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-10 bg-white/70 rounded-full"></span>
                                <div>
                                    <h2 className="text-xl font-bold leading-tight">Données Générales</h2>
                                    <p className="text-xs text-blue-100">Ajouter une tâche — la référence sera générée après la création</p>
                                </div>
                            </div>
                            <button onClick={() => setTacheOpen(false)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        <form onSubmit={saveTache}>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Réf" value="(Généré automatiquement)" disabled />
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Type *</span>
                                        <select value={tacheForm.type} onChange={(e) => setTacheForm({ ...tacheForm, type: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" disabled>
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
                                <Field label="Date début *" type="date" value={tacheForm.date_debut} onChange={(e) => setTacheForm({ ...tacheForm, date_debut: e.target.value })} required />
                                <Field label="Montant" type="number" min="0" step="0.01" value={tacheForm.montant} onChange={(e) => setTacheForm({ ...tacheForm, montant: e.target.value })} />
                                <Field label="Date fin *" type="date" value={tacheForm.date_fin} onChange={(e) => setTacheForm({ ...tacheForm, date_fin: e.target.value })} required />
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
                                <Field label="Avancement (%)" type="number" min="0" max="100" value={tacheForm.avancement} onChange={(e) => setTacheForm({ ...tacheForm, avancement: e.target.value })} />
                                <div className="col-span-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Description *</span>
                                        <textarea value={tacheForm.description} onChange={(e) => setTacheForm({ ...tacheForm, description: e.target.value })} rows={3} required
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <Field label="Temps passé (h)" type="number" min="0" step="0.5" value={tacheForm.temps_passe_h} onChange={(e) => setTacheForm({ ...tacheForm, temps_passe_h: e.target.value })} />
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
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => setTacheFiles([...tacheFiles, ...Array.from(e.target.files)])}
                                />
                            </label>
                            {tacheFiles.length > 0 && (
                                <ul className="mt-3 space-y-2">
                                    {tacheFiles.map((f, i) => (
                                        <li key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                            <span className="text-slate-700 truncate">{f.name}</span>
                                            <button type="button"
                                                onClick={() => setTacheFiles(tacheFiles.filter((_, j) => j !== i))}
                                                className="text-slate-400 hover:text-red-600 text-lg leading-none ml-2">&times;</button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setTacheOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                                <button type="submit" disabled={savingTache} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50">
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
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl my-6 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-10 bg-white/70 rounded-full"></span>
                                <div>
                                    <h2 className="text-xl font-bold leading-tight">Données Générales</h2>
                                    <p className="text-xs text-blue-100">Ajouter un sinistre — la référence sera générée après la création</p>
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
                                        <select value={sinistreForm.contrat_id} onChange={(e) => setSinistreForm({ ...sinistreForm, contrat_id: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="">Choisir un contrat...</option>
                                            {contrats.map((c) => (
                                                <option key={c.id} value={c.id}>{c.numero_police || c.reference || c.id}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <Field label="Date sinistre" type="date" value={sinistreForm.date_survenance} onChange={(e) => setSinistreForm({ ...sinistreForm, date_survenance: e.target.value })} />
                                <Field label="Référence sinistre" value="" onChange={() => {}} placeholder="Générée après création" disabled />
                                <Field label="Référence compagnie" value={sinistreForm.ref_compagnie} onChange={(e) => setSinistreForm({ ...sinistreForm, ref_compagnie: e.target.value })} />
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
                                <Field label="Garantie applicable" value={sinistreForm.garantie} onChange={(e) => setSinistreForm({ ...sinistreForm, garantie: e.target.value })} />
                                <Field label="Franchise" value={sinistreForm.franchise} onChange={(e) => setSinistreForm({ ...sinistreForm, franchise: e.target.value })} />
                                <div className="col-span-2">
                                    <Field label="Circonstance *" value={sinistreForm.circonstance} onChange={(e) => setSinistreForm({ ...sinistreForm, circonstance: e.target.value })} required />
                                </div>
                                <div className="col-span-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Description des dommages</span>
                                        <textarea value={sinistreForm.description_dommages} onChange={(e) => setSinistreForm({ ...sinistreForm, description_dommages: e.target.value })} rows={3}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                    </label>
                                </div>
                                <Field label="Responsabilité *" value={sinistreForm.responsabilite} onChange={(e) => setSinistreForm({ ...sinistreForm, responsabilite: e.target.value })} required />
                                <Field label="Montant des dommages (€)" type="number" step="0.01" min="0" value={sinistreForm.montant_estime_cts} onChange={(e) => setSinistreForm({ ...sinistreForm, montant_estime_cts: e.target.value })} />
                                <Field label="Bénéficiaire" value={sinistreForm.beneficiaire} onChange={(e) => setSinistreForm({ ...sinistreForm, beneficiaire: e.target.value })} />
                                <Field label="Expertise" value={sinistreForm.expertise} onChange={(e) => setSinistreForm({ ...sinistreForm, expertise: e.target.value })} />
                                <Field label="Recours" value={sinistreForm.recours} onChange={(e) => setSinistreForm({ ...sinistreForm, recours: e.target.value })} />
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
                                <Field label="Clôturé le" type="date" value={sinistreForm.cloture_le} onChange={(e) => setSinistreForm({ ...sinistreForm, cloture_le: e.target.value })} />
                            </div>

                            <div className="flex items-center gap-2 mt-6 mb-3 pb-3 border-b border-slate-200">
                                <h3 className="text-base font-bold text-blue-700 uppercase tracking-wide">Documents à joindre</h3>
                            </div>
                            <label className="cursor-pointer block">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-sm hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
                                    <div className="text-3xl mb-1">⬆</div>
                                    Déposez vos fichiers ici... ou cliquez pour parcourir
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => setSinistreFiles([...sinistreFiles, ...Array.from(e.target.files)])}
                                />
                            </label>
                            {sinistreFiles.length > 0 && (
                                <ul className="mt-3 space-y-2">
                                    {sinistreFiles.map((f, i) => (
                                        <li key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                            <span className="text-slate-700 truncate">{f.name}</span>
                                            <button type="button"
                                                onClick={() => setSinistreFiles(sinistreFiles.filter((_, j) => j !== i))}
                                                className="text-slate-400 hover:text-red-600 text-lg leading-none ml-2">&times;</button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setSinistreOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                                <button type="submit" disabled={savingSinistre} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50">
                                    {savingSinistre ? 'Enregistrement...' : 'Créer le sinistre'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {editor && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-4xl shadow-2xl my-4 max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Modifier : {client.nom_complet}</h2>
                            <button onClick={() => { setEditor(false); setError(''); }} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                        </div>
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        <form onSubmit={save}>
                            <div className="flex gap-3 mb-4">
                                <button type="button" onClick={() => setForm({ ...form, type: 'PHYSIQUE' })}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'PHYSIQUE' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>Personne physique</button>
                                <button type="button" onClick={() => setForm({ ...form, type: 'MORALE' })}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'MORALE' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>Entreprise</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {form.type === 'PHYSIQUE' ? (
                                    <>
                                        <Field label="Civilité" value={form.civilite} onChange={setF('civilite')} placeholder="M., Mme" />
                                        <Field label="Prénom" value={form.prenom} onChange={setF('prenom')} required />
                                        <Field label="Nom" value={form.nom} onChange={setF('nom')} required />
                                        <Field label="Date de naissance" type="date" value={form.date_naissance} onChange={setF('date_naissance')} />
                                    </>
                                ) : (
                                    <>
                                        <div className="col-span-2"><Field label="Raison sociale" value={form.raison_sociale} onChange={setF('raison_sociale')} required /></div>
                                        <Field label="SIREN" value={form.siren} onChange={setF('siren')} />
                                        <Field label="SIRET" value={form.siret} onChange={setF('siret')} />
                                    </>
                                )}
                                <Field label="E-mail" type="email" value={form.email} onChange={setF('email')} />
                                <Field label="Téléphone" value={form.telephone} onChange={setF('telephone')} />
                                <div className="col-span-2"><Field label="Adresse" value={form.adresse} onChange={setF('adresse')} /></div>
                                <Field label="Code postal" value={form.code_postal} onChange={setF('code_postal')} />
                                <Field label="Ville" value={form.ville} onChange={setF('ville')} />
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <Field label="E-mail 2" type="email" value={form.email2} onChange={setF('email2')} />
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <span className="block text-sm font-medium text-slate-700 mb-2">Préférence de contact</span>
                                <div className="flex flex-wrap gap-4">
                                    {['Téléphone', 'E-mail', 'WhatsApp', 'Courrier'].map((opt) => {
                                        const checked = (form.preference_contact || '').split(',').map(s => s.trim()).filter(Boolean).includes(opt);
                                        return (
                                            <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                <input type="checkbox" checked={checked}
                                                    onChange={() => {
                                                        const list = (form.preference_contact || '').split(',').map(s => s.trim()).filter(Boolean);
                                                        const next = checked ? list.filter((v) => v !== opt) : [...list, opt];
                                                        setForm({ ...form, preference_contact: next.join(', ') });
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                {opt}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <span className="block text-sm font-medium text-slate-700 mb-2">Origine</span>
                                <div className="flex flex-wrap gap-4">
                                    {['Prospection LinkedIn', 'Prospection Facebook', 'Prospection Twitter', 'Radio', 'Famille', 'Bouche à oreille'].map((opt) => {
                                        const checked = (form.origine || '').split(',').map(s => s.trim()).filter(Boolean).includes(opt);
                                        return (
                                            <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                                <input type="checkbox" checked={checked}
                                                    onChange={() => {
                                                        const list = (form.origine || '').split(',').map(s => s.trim()).filter(Boolean);
                                                        const next = checked ? list.filter((v) => v !== opt) : [...list, opt];
                                                        setForm({ ...form, origine: next.join(', ') });
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                {opt}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-200">
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={form.rgpd_consentement} onChange={(e) => setForm({ ...form, rgpd_consentement: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    Consentement RGPD
                                    <span className="relative group">
                                        <svg className="w-4 h-4 text-slate-400 hover:text-slate-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-slate-800 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10 pointer-events-none">
                                            Indique que le client a donné son accord pour le traitement de ses données personnelles conformément au RGPD.
                                        </span>
                                    </span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={form.exclure_marketing} onChange={(e) => setForm({ ...form, exclure_marketing: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    Exclure des opérations de communication et marketing
                                    <span className="relative group">
                                        <svg className="w-4 h-4 text-slate-400 hover:text-slate-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-slate-800 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10 pointer-events-none">
                                            Le client ne recevra aucune communication promotionnelle, newsletter ou opération marketing.
                                        </span>
                                    </span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => { setEditor(false); setError(''); }} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, type = 'text', required, placeholder, disabled, min, max, step }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</span>
            <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled}
                min={min} max={max} step={step}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400" />
        </label>
    );
}

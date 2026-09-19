import { Fragment, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';

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

const reglementStatutConfig = {
    ENCAISSE: { label: 'Encaissé', cls: 'bg-emerald-50 text-emerald-700' },
    EN_ATTENTE: { label: 'En attente', cls: 'bg-amber-50 text-amber-700' },
    REJETE: { label: 'Rejeté', cls: 'bg-red-50 text-red-700' },
};

const MODES_REGLEMENT_DEFAUT = ['Carte bancaire', 'Virement'];

const CATEGORIES_MODELE = [
    'Administration',
    'Contract',
    'Legaux',
    'Finaux',
    'Nouvelle tech',
    'Plan affaire',
    'Production',
    'Ressource',
    'Vente',
];

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
    const [reglements, setReglements] = useState([]);
    const [reglementOpen, setReglementOpen] = useState(false);
    const [reglementForm, setReglementForm] = useState({ facture_id: '', mode_reglement: '', montant_euros: '', details: '', mentions: '', date_reglement: '' });
    const [savingReglement, setSavingReglement] = useState(false);
    const [bibliotheque, setBibliotheque] = useState([]);
    const [modeleOpen, setModeleOpen] = useState(false);
    const [modeleForm, setModeleForm] = useState({ categorie: CATEGORIES_MODELE[0], titre: '' });
    const [modeleFile, setModeleFile] = useState(null);
    const [savingModele, setSavingModele] = useState(false);
    const [bibliothequeOpen, setBibliothequeOpen] = useState(false);
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
    const [expandedProjetId, setExpandedProjetId] = useState(null);
    const [projetData, setProjetData] = useState(null);
    const [projetBusy, setProjetBusy] = useState(false);

    const PER_PAGE = 10;
    const [pageProjets, setPageProjets] = useState(1);
    const [pageContrats, setPageContrats] = useState(1);
    const [pageFactures, setPageFactures] = useState(1);
    const [pageReglements, setPageReglements] = useState(1);
    const [pageSinistres, setPageSinistres] = useState(1);
    const [pageTaches, setPageTaches] = useState(1);

    const pager = (list, page) => {
        const total = list.length;
        const cur = total === 0 ? 1 : Math.min(page, Math.max(1, Math.ceil(total / PER_PAGE)));
        return { items: list.slice((cur - 1) * PER_PAGE, cur * PER_PAGE), cur, total };
    };

    const load = () => {
        setLoading(true);
        setError('');
        Promise.all([
            api.get(`/clients/${id}`),
            api.get(`/clients/${id}/demandes`),
            api.get(`/clients/${id}/contrats`),
            api.get(`/clients/${id}/factures`),
            api.get(`/clients/${id}/reglements`),
            api.get(`/clients/${id}/sinistres`),
            api.get(`/clients/${id}/taches`),
            api.get('/documents').catch(() => ({ data: { data: [] } })),
            api.get('/bibliotheque').catch(() => ({ data: { data: [] } })),
        ])
            .then(([cRes, dRes, coRes, fRes, rRes, sRes, tRes, dcRes, bRes]) => {
                setClient(cRes.data.data);
                setNotesDraft(cRes.data.data.notes || '');
                setDemandes(dRes.data.data);
                setContrats(coRes.data.data);
                setFactures(fRes.data.data);
                setReglements(rRes.data.data);
                setSinistres(sRes.data.data);
                setTaches(tRes.data.data);
                setClientDocs(dcRes.data.data || []);
                setBibliotheque(bRes.data.data || []);
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

    const openReglement = () => {
        setReglementForm({
            facture_id: '',
            mode_reglement: '',
            montant_euros: '',
            details: '',
            mentions: '',
            date_reglement: new Date().toISOString().slice(0, 10),
        });
        setError('');
        setReglementOpen(true);
    };

    const modesReglementPourFacture = (factureId) => {
        const f = factures.find((x) => String(x.id) === String(factureId));
        return f?.moyens_reglement?.length ? f.moyens_reglement : MODES_REGLEMENT_DEFAUT;
    };

    const choisirFactureReglement = (factureId) => {
        const modes = modesReglementPourFacture(factureId);
        setReglementForm((prev) => ({ ...prev, facture_id: factureId, mode_reglement: modes[0] || '' }));
    };

    const saveReglement = async (e) => {
        e.preventDefault();
        setSavingReglement(true);
        setError('');
        try {
            await api.post(`/clients/${client.id}/reglements`, {
                facture_id: Number(reglementForm.facture_id),
                mode_reglement: reglementForm.mode_reglement,
                montant_cts: Math.round((parseFloat(reglementForm.montant_euros) || 0) * 100),
                details: reglementForm.details || null,
                mentions: reglementForm.mentions || null,
                date_reglement: reglementForm.date_reglement,
            });
            setReglementOpen(false);
            setTab('reglements');
            const [rRes, fRes] = await Promise.all([
                api.get(`/clients/${client.id}/reglements`),
                api.get(`/clients/${client.id}/factures`),
            ]);
            setReglements(rRes.data.data);
            setFactures(fRes.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'enregistrement.");
        } finally {
            setSavingReglement(false);
        }
    };

    const supprimerReglement = async (r) => {
        if (!window.confirm(`Supprimer le règlement « ${r.reference || r.id} » ?`)) return;
        setError('');
        try {
            await api.delete(`/reglements/${r.id}`);
            const [rRes, fRes] = await Promise.all([
                api.get(`/clients/${client.id}/reglements`),
                api.get(`/clients/${client.id}/factures`),
            ]);
            setReglements(rRes.data.data);
            setFactures(fRes.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de suppression.');
        }
    };

    const supprimerFacture = async (f) => {
        if (!window.confirm(`Supprimer la facture « ${f.reference || f.id} » ?`)) return;
        setError('');
        try {
            await api.delete(`/factures/${f.id}`);
            const [fRes, rRes] = await Promise.all([
                api.get(`/clients/${client.id}/factures`),
                api.get(`/clients/${client.id}/reglements`),
            ]);
            setFactures(fRes.data.data);
            setReglements(rRes.data.data);
            setSelFactures((prev) => prev.filter((x) => x !== f.id));
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de suppression.');
        }
    };

    const openModele = () => {
        setModeleForm({ categorie: CATEGORIES_MODELE[0], titre: '' });
        setModeleFile(null);
        setError('');
        setModeleOpen(true);
    };

    const saveModele = async (e) => {
        e.preventDefault();
        if (!modeleFile) {
            setError('Veuillez joindre un document.');
            return;
        }
        setSavingModele(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('categorie', modeleForm.categorie);
            fd.append('titre', modeleForm.titre);
            fd.append('file', modeleFile);
            await api.post('/bibliotheque', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setModeleOpen(false);
            const res = await api.get('/bibliotheque');
            setBibliotheque(res.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'ajout du document.");
        } finally {
            setSavingModele(false);
        }
    };

    const ouvrirBibliotheque = async () => {
        setBibliothequeOpen(true);
        setError('');
        try {
            const res = await api.get('/bibliotheque');
            setBibliotheque(res.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de chargement de la bibliothèque.');
        }
    };

    const telechargerModele = async (m) => {
        try {
            const res = await api.get(`/bibliotheque/${m.id}/url`);
            window.open(res.data.url, '_blank');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de téléchargement.');
        }
    };

    const supprimerModele = async (m) => {
        if (!window.confirm(`Supprimer « ${m.titre} » ?`)) return;
        setError('');
        try {
            await api.delete(`/bibliotheque/${m.id}`);
            setBibliotheque(bibliotheque.filter((x) => x.id !== m.id));
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de suppression.');
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

    const toggleProjet = async (id) => {
        if (expandedProjetId === id) {
            setExpandedProjetId(null);
            setProjetData(null);
            return;
        }
        setExpandedProjetId(id);
        setProjetData(null);
        setProjetBusy(true);
        setError('');
        try {
            const res = await api.get(`/demandes/${id}`);
            setProjetData(res.data.data);
        } catch {
            setError('Erreur de chargement des détails.');
        } finally {
            setProjetBusy(false);
        }
    };

    if (loading) return <div className="text-slate-500">Chargement...</div>;

    if (!client) {
        return (
            <div>
                <button onClick={() => navigate('/clients')} className="anim-in group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-deep-blue/40 hover:text-deep-blue hover:shadow-md mb-4">
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>
                    Retour à la liste
                </button>
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
            <button onClick={() => navigate('/clients')} className="anim-in group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-deep-blue/40 hover:text-deep-blue hover:shadow-md mb-4">
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>
                Retour à la liste
            </button>

            <div className="anim-in relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-50/60 p-6 md:p-8 mb-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-sm ${client.type === 'MORALE' ? 'bg-gradient-to-br from-[oklch(0.52_0.21_27.14)] to-[oklch(0.42_0.18_27)]' : 'bg-gradient-to-br from-deep-blue to-deep-blue-dark'}`}>
                        {client.nom_complet?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5">
                            <h1 className="text-2xl font-bold tracking-tight">
                                {(() => {
                                    const parts = (client.nom_complet || '').split(' ');
                                    return (
                                        <>
                                            <span style={{ color: 'oklch(0.52 0.21 27.14)' }}>{parts[0]}</span>
                                            {parts.length > 1 && <>{' '}<span style={{ color: 'oklch(0.39 0.21 263.59)' }}>{parts.slice(1).join(' ')}</span></>}
                                        </>
                                    );
                                })()}
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${client.type === 'MORALE' ? 'bg-[oklch(0.52_0.21_27.14/0.12)] text-[oklch(0.42_0.18_27)] ring-[oklch(0.52_0.21_27.14/0.25)]' : 'bg-deep-blue-soft text-deep-blue ring-deep-blue/20'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${client.type === 'MORALE' ? 'bg-[oklch(0.52_0.21_27.14)]' : 'bg-deep-blue'}`}></span>
                                {client.type === 'MORALE' ? 'Personne morale' : 'Personne physique'}
                            </span>
                        </div>
                        {client.raison_sociale && <p className="text-sm text-slate-500 mt-1">{client.raison_sociale}</p>}
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <div className="anim-in no-scrollbar overflow-x-auto bg-white border border-slate-200 rounded-xl mb-5 shadow-sm">
                <div className="flex items-center gap-1 px-2 border-b border-slate-100">
                {[
                    { key: 'fiche', label: 'Fiche Client' },
                    { key: 'projets', label: 'Projets', n: demandes.length },
                    { key: 'contrats', label: 'Contrats', n: contrats.length },
                    { key: 'factures', label: 'Factures', n: factures.length },
                    { key: 'reglements', label: 'Règlements', n: reglements.length },
                    { key: 'sinistres', label: 'Sinistres', n: sinistres.length },
                    { key: 'taches', label: 'Tâches', n: taches.length },
                    { key: 'documents', label: 'Documents', n: clientDocs.length },
                ].map((t) => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 border-b-2 mb-[-1px] transition-colors text-sm font-medium ${
                            tab === t.key
                                ? 'border-deep-blue text-deep-blue'
                                : 'border-transparent text-slate-500 hover:text-deep-blue hover:border-slate-300'
                        }`}>
                        {t.label}
                        {typeof t.n === 'number' && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full transition-colors ${tab === t.key ? 'bg-deep-blue-soft text-deep-blue' : 'bg-slate-100 text-slate-500'}`}>{t.n}</span>
                        )}
                    </button>
                ))}
                </div>
            </div>

            {tab === 'documents' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {['Documents', 'Édition'].map((titre) => (
                        <div key={titre} className="card-hover relative overflow-hidden bg-white border border-slate-100 rounded-xl p-0 shadow-sm">
                            <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[oklch(0.39_0.21_263.59)] via-[oklch(0.48_0.20_262)] to-[oklch(0.52_0.21_27.14)]" />
                            <div className="px-5 py-3 pt-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-deep-blue">{titre}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-deep-blue-soft text-deep-blue">{clientDocs.length}</span>
                            </div>
                            {clientDocs.length === 0 ? (
                                <p className="px-5 py-8 text-sm text-slate-400 text-center">Aucun document.</p>
                            ) : (
                                <ul className="scroll-blue divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                                    {clientDocs.map((d) => (
                                        <li key={d.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-sm font-medium text-slate-900 truncate">{d.nom_origine}</span>
                                                <span className="block text-xs text-slate-400">{d.type_document}{d.taille ? ` • ${fmtTaille(d.taille)}` : ''}</span>
                                            </span>
                                            <button onClick={() => telechargerDoc(d.id)} title="Télécharger"
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-deep-blue hover:bg-deep-blue-soft transition-colors">
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

                    <div className="card-hover relative overflow-hidden bg-white border border-slate-100 rounded-xl p-0 shadow-sm flex flex-col">
                        <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[oklch(0.39_0.21_263.59)] via-[oklch(0.48_0.20_262)] to-[oklch(0.52_0.21_27.14)]" />
                        <div className="px-5 py-3 pt-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-deep-blue">Action</h3>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <button onClick={openModele}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 btn-primary">
                                + Ajouter modèle
                            </button>
                            <button onClick={ouvrirBibliotheque}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                                Bibliothèque
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'fiche' && (<>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <div className="card-hover relative overflow-hidden bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                        <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[oklch(0.39_0.21_263.59)] via-[oklch(0.48_0.20_262)] to-[oklch(0.52_0.21_27.14)]" />
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-deep-blue-soft text-deep-blue flex items-center justify-center">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.9 0-7 2.7-7 5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1c0-2.3-3.1-5-7-5Z" /></svg>
                            </div>
                            <h3 className="text-sm font-bold text-deep-blue">Identité</h3>
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
                                            <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-deep-blue-soft text-deep-blue">{v}</span>
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

                    <div className="card-hover relative overflow-hidden bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                        <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[oklch(0.39_0.21_263.59)] via-[oklch(0.48_0.20_262)] to-[oklch(0.52_0.21_27.14)]" />
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-deep-blue-soft text-deep-blue flex items-center justify-center">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z" /></svg>
                                </div>
                                <h3 className="text-sm font-bold text-deep-blue">Contact</h3>
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
                                    <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-deep-blue bg-deep-blue-soft border border-deep-blue/20 px-3 py-1.5 rounded-lg hover:bg-deep-blue/10 transition-colors">Envoyer un e-mail</a>
                                )}
                                {client.telephone && (
                                    <a href={`tel:${client.telephone}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-deep-blue bg-deep-blue-soft border border-deep-blue/20 px-3 py-1.5 rounded-lg hover:bg-deep-blue/10 transition-colors">Appeler</a>
                                )}
                            </div>
                        </div>

                        <div className="card-hover relative overflow-hidden bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                            <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[oklch(0.39_0.21_263.59)] via-[oklch(0.48_0.20_262)] to-[oklch(0.52_0.21_27.14)]" />
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-deep-blue-soft text-deep-blue flex items-center justify-center">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /></svg>
                                </div>
                                <h3 className="text-sm font-bold text-deep-blue">Action</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={openEdit} className="inline-flex items-center gap-2 px-4 py-2.5 btn-primary">Modifier</button>
                                <button onClick={remove} disabled={deleting}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors">
                                    {deleting ? 'Suppression...' : 'Supprimer'}
                                </button>
                            </div>
                        </div>
                </div>

                <div className="card-hover relative overflow-hidden bg-white border border-slate-100 rounded-xl p-5 shadow-sm mt-5">
                    <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[oklch(0.39_0.21_263.59)] via-[oklch(0.48_0.20_262)] to-[oklch(0.52_0.21_27.14)]" />
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-deep-blue-soft text-deep-blue flex items-center justify-center">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" /></svg>
                        </div>
                        <h3 className="text-sm font-bold text-deep-blue">Notes</h3>
                    </div>
                    <textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        rows={4}
                        placeholder="Notes sur le client..."
                        className="w-full field-line rounded-lg px-3 py-2 text-sm mb-3"
                    />
                    <div className="flex justify-end">
                        <button onClick={saveNotes} disabled={savingNotes}
                            className="px-4 py-2 btn-primary">
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
                                    <th className="px-5 py-3">Référence</th>
                                    <th className="px-5 py-3">Statut</th>
                                    <th className="px-5 py-3">Branche</th>
                                    <th className="px-5 py-3">Gestionnaire</th>
                                    <th className="px-5 py-3">Soumission</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pager(demandes, pageProjets).items.map((d) => {
                                    const sc = statutConfig[d.statut] || { label: d.statut, cls: 'bg-slate-100 text-slate-600' };
                                    const estOuvert = expandedProjetId === d.id;
                                    return (
                                        <Fragment key={d.id}>
                                            <tr onClick={() => toggleProjet(d.id)}
                                                className={`group border-b border-slate-100 cursor-pointer transition-all duration-150 ${estOuvert ? 'bg-deep-blue-soft/60' : 'hover:bg-slate-100 hover:shadow-sm'}`}>
                                                <td className="px-5 py-3 font-medium text-slate-900">{d.reference}</td>
                                                <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                                <td className="px-5 py-3 text-slate-600">{d.branche || '—'}</td>
                                                <td className="px-5 py-3 text-slate-600">{d.gestionnaire || '—'}</td>
                                                <td className="px-5 py-3 text-slate-600">{fmtDate(d.date_soumission)}</td>
                                                <td className="px-5 py-3 text-right">
                                                    <button type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleProjet(d.id); }}
                                                        title={estOuvert ? 'Masquer' : 'Voir'}
                                                        className={`inline-flex p-2 rounded-lg transition-all duration-200 ${estOuvert ? 'text-deep-blue bg-deep-blue-soft' : 'text-slate-400 hover:text-deep-blue hover:bg-deep-blue-soft'}`}>
                                                        <svg className={`w-5 h-5 transition-transform duration-300 ${estOuvert ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>

                                            <tr>
                                                <td colSpan={6} className="p-0 border-0">
                                                    <div className={`grid transition-all duration-300 ease-in-out ${estOuvert ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                                        <div className="overflow-hidden">
                                                            <div className="w-[80%] mx-auto bg-transparent border-0 p-4 my-3">
                                                                {estOuvert && (
                                                                    projetBusy || !projetData ? (
                                                                        <div className="flex items-center justify-center h-32">
                                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-deep-blue"></div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-4">
                                                                            {/* Identité */}
                                                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                                                <div className="px-4 py-2.5 bg-slate-200 border-b-2 border-slate-400 text-xs font-extrabold uppercase tracking-wide text-slate-800 flex items-center gap-2">
                                                                                    <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                        <circle cx="12" cy="8" r="4" />
                                                                                        <path d="M4 21a8 8 0 0 1 16 0" />
                                                                                    </svg>
                                                                                    Identité
                                                                                </div>
                                                                                <div className="p-4 space-y-2.5 text-sm">
                                                                                    <div>
                                                                                        <div className="text-[11px] uppercase text-slate-400 font-medium">Nom et prénom</div>
                                                                                        {(() => {
                                                                                            const cd = projetData.client_detail;
                                                                                            const nom = cd
                                                                                                ? (cd.type === 'MORALE'
                                                                                                    ? (cd.raison_sociale || '—')
                                                                                                    : `${cd.civilite ? cd.civilite + ' ' : ''}${cd.prenom || ''} ${cd.nom || ''}`.trim() || cd.nom_complet)
                                                                                                : (projetData.client || '—');
                                                                                            return <div className="font-semibold text-slate-900">{nom}</div>;
                                                                                        })()}
                                                                                    </div>
                                                                                    {projetData.client_detail?.date_naissance && (
                                                                                        <div>
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium">Date de naissance</div>
                                                                                            <div className="text-slate-700">{projetData.client_detail.date_naissance}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {projetData.client_detail?.siren && (
                                                                                        <div>
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium">SIREN</div>
                                                                                            <div className="text-slate-700">{projetData.client_detail.siren}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {projetData.client_detail?.adresse && (
                                                                                        <div>
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium">Adresse</div>
                                                                                            <div className="text-slate-700">{projetData.client_detail.adresse}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {(projetData.client_detail?.code_postal || projetData.client_detail?.ville) && (
                                                                                        <div>
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium">Code postal / Ville</div>
                                                                                            <div className="text-slate-700">{[projetData.client_detail.code_postal, projetData.client_detail.ville].filter(Boolean).join(' ') || '—'}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {projetData.client_detail?.telephone && (
                                                                                        <div>
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium">Tél</div>
                                                                                            <div className="text-slate-700">{projetData.client_detail.telephone}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {projetData.client_detail?.email && (
                                                                                        <div>
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium">Email</div>
                                                                                            <div className="text-slate-700 break-all">{projetData.client_detail.email}</div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Projet */}
                                                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                                                <div className="px-4 py-2.5 bg-indigo-100 border-b-2 border-indigo-400 text-xs font-extrabold uppercase tracking-wide text-indigo-800 flex items-center gap-2">
                                                                                    <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                        <path d="M3 21h18" />
                                                                                        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                                                                                        <path d="M9 7h2" />
                                                                                        <path d="M13 7h2" />
                                                                                        <path d="M9 11h2" />
                                                                                        <path d="M13 11h2" />
                                                                                    </svg>
                                                                                    Projet
                                                                                </div>
                                                                                <div className="p-4 space-y-2.5 text-sm">
                                                                                    <div>
                                                                                        <div className="text-[11px] uppercase text-slate-400 font-medium">Nature</div>
                                                                                        <div className="font-medium text-slate-900">{projetData.branche || '—'}</div>
                                                                                    </div>
                                                                                    {projetData.origine && (
                                                                                        <div>
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium">Origine</div>
                                                                                            <div className="text-slate-700">{projetData.origine === 'PARTENAIRE' ? 'Partenaire' : 'Cabinet'}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {projetData.gestionnaire && (
                                                                                        <div>
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium">Gestionnaire</div>
                                                                                            <div className="text-slate-700">{projetData.gestionnaire}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    {projetData.donnees_risque && Object.keys(projetData.donnees_risque).length > 0 && (
                                                                                        <div className="pt-2 border-t border-slate-100">
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium mb-1.5">Données du risque</div>
                                                                                            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                                                                                                {Object.entries(projetData.donnees_risque).map(([k, v]) => {
                                                                                                    if (v === null || v === '' || v === undefined) return null;
                                                                                                    const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
                                                                                                    const label = k.replace(/_/g, ' ');
                                                                                                    return (
                                                                                                        <div key={k} className="flex justify-between gap-2 text-xs">
                                                                                                            <span className="text-slate-500 capitalize">{label}</span>
                                                                                                            <span className="text-slate-800 font-medium text-right break-words">{val}</span>
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Statut */}
                                                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                                                <div className="px-4 py-2.5 bg-amber-100 border-b-2 border-amber-400 text-xs font-extrabold uppercase tracking-wide text-amber-800 flex items-center gap-2">
                                                                                    <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                                        <circle cx="12" cy="12" r="9" />
                                                                                        <path d="M12 7v5l3 2" />
                                                                                    </svg>
                                                                                    Statut
                                                                                </div>
                                                                                <div className="p-4 space-y-2.5 text-sm">
                                                                                    {projetData.client && (
                                                                                        <div>
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium">Client</div>
                                                                                            <div className="font-medium text-slate-900">{projetData.client}</div>
                                                                                        </div>
                                                                                    )}
                                                                                    <div>
                                                                                        <div className="text-[11px] uppercase text-slate-400 font-medium">Mis à jour le</div>
                                                                                        <div className="text-slate-700">{projetData.date_statut ? new Date(projetData.date_statut).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-[11px] uppercase text-slate-400 font-medium">Créé le</div>
                                                                                        <div className="text-slate-700">{projetData.created_at ? new Date(projetData.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-[11px] uppercase text-slate-400 font-medium">Devis</div>
                                                                                        <div className="text-slate-700">{projetData.nb_devis > 0 ? `${projetData.nb_devis} devis` : 'Aucun devis'}</div>
                                                                                    </div>
                                                                                    {projetData.motif && (
                                                                                        <div>
                                                                                            <div className="text-[11px] uppercase text-slate-400 font-medium">Motif</div>
                                                                                            <div className="text-slate-700">{projetData.motif}</div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    <Pagination page={pageProjets} totalPages={Math.max(1, Math.ceil(demandes.length / PER_PAGE))} onChange={setPageProjets} label={`${demandes.length} projet${demandes.length > 1 ? 's' : ''} au total`} />
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
                                    <th className="px-5 py-3">Référence</th>
                                    <th className="px-5 py-3">N° Police</th>
                                    <th className="px-5 py-3">Statut</th>
                                    <th className="px-5 py-3">Produit</th>
                                    <th className="px-5 py-3">Date effet</th>
                                    <th className="px-5 py-3">Échéance</th>
                                    <th className="px-5 py-3 text-right">Prime TTC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pager(contrats, pageContrats).items.map((c) => {
                                    const sc = contratStatutConfig[c.statut] || { label: c.statut, cls: 'bg-slate-100 text-slate-600' };
                                    return (
                                        <tr key={c.id} className="group border-b border-slate-100 hover:bg-slate-100 hover:shadow-sm transition-all duration-150">
                                            <td className="px-5 py-3 font-medium text-slate-900">{c.reference || '—'}</td>
                                            <td className="px-5 py-3 text-slate-600">{c.numero_police || '—'}</td>
                                            <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                            <td className="px-5 py-3 text-slate-600">{c.produit || '—'}</td>
                                            <td className="px-5 py-3 text-slate-600">{fmtDate(c.date_effet)}</td>
                                            <td className="px-5 py-3 text-slate-600">{fmtDate(c.date_echeance_principale)}</td>
                                            <td className="px-5 py-3 text-right font-medium text-slate-900">{c.prime_ttc_cts != null ? `${(c.prime_ttc_cts / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                    <Pagination page={pageContrats} totalPages={Math.max(1, Math.ceil(contrats.length / PER_PAGE))} onChange={setPageContrats} label={`${contrats.length} contrat${contrats.length > 1 ? 's' : ''} au total`} />
                </div>
            )}

            {tab === 'factures' && (
                <div>
                    <div className="flex justify-end mb-3">
                        <button onClick={openFacture}
                            className="px-4 py-2 btn-primary">
                            + Ajouter une facture
                        </button>
                    </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="scroll-blue overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3 w-8">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-deep-blue focus:ring-deep-blue"
                                        checked={factures.length > 0 && selFactures.length === factures.length}
                                        onChange={(e) => setSelFactures(e.target.checked ? factures.map((f) => f.id) : [])}
                                    />
                                </th>
                                <th className="px-5 py-3">Id</th>
                                <th className="px-5 py-3">Numéro</th>
                                <th className="px-5 py-3 text-right">Montant TTC</th>
                                <th className="px-5 py-3">Date Facture</th>
                                <th className="px-5 py-3">Date Échéance</th>
                                <th className="px-5 py-3">Statut</th>
                                <th className="px-5 py-3 text-right">Solde</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {factures.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-6 text-center text-slate-500">Aucune donnée à afficher</td>
                            </tr>
                        ) : (
                            pager(factures, pageFactures).items.map((f) => {
                                const sc = factureStatutConfig[f.statut] || { label: f.statut, cls: 'bg-slate-100 text-slate-600' };
                                const soldeCts = f.statut === 'PAYEE' ? 0 : (f.montant_ttc_cts ?? 0);
                                return (
                                    <tr key={f.id} className="group border-b border-slate-100 hover:bg-slate-100 hover:shadow-sm transition-all duration-150">
                                        <td className="px-5 py-3">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-deep-blue focus:ring-deep-blue"
                                                checked={selFactures.includes(f.id)}
                                                onChange={(e) => setSelFactures(e.target.checked ? [...selFactures, f.id] : selFactures.filter((x) => x !== f.id))}
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-slate-500">{f.id}</td>
                                        <td className="px-5 py-3 font-medium text-slate-900">{f.reference || '—'}</td>
                                        <td className="px-5 py-3 text-right font-medium text-slate-900">{f.montant_ttc_cts != null ? `${(f.montant_ttc_cts / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</td>
                                        <td className="px-5 py-3 text-slate-600">{fmtDate(f.date_facture)}</td>
                                        <td className="px-5 py-3 text-slate-600">{fmtDate(f.date_echeance)}</td>
                                        <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                        <td className="px-5 py-3 text-right font-medium text-slate-900">{soldeCts > 0 ? `${(soldeCts / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <button type="button" onClick={() => supprimerFacture(f)} title="Supprimer"
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                    </div>
                    <Pagination page={pageFactures} totalPages={Math.max(1, Math.ceil(factures.length / PER_PAGE))} onChange={setPageFactures} label={`${selFactures.length} sélectionné${selFactures.length > 1 ? 's' : ''} / ${factures.length} total`} />
                </div>
                </div>
            )}

            {tab === 'reglements' && (
                <div>
                    <div className="flex justify-end mb-3">
                        <button onClick={openReglement}
                            className="px-4 py-2 btn-primary">
                            + Ajouter un règlement
                        </button>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="scroll-blue overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3">Facture</th>
                                        <th className="px-5 py-3">Mode de règlement</th>
                                        <th className="px-5 py-3">Référence du règlement</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3 text-right">Montant</th>
                                        <th className="px-5 py-3">Statut</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reglements.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-6 text-center text-slate-500">Aucune donnée à afficher</td>
                                        </tr>
                                    ) : (
                                        pager(reglements, pageReglements).items.map((r) => {
                                            const sc = reglementStatutConfig[r.statut] || { label: r.statut, cls: 'bg-slate-100 text-slate-600' };
                                            return (
                                                <tr key={r.id} className="group border-b border-slate-100 hover:bg-slate-100 hover:shadow-sm transition-all duration-150">
                                                    <td className="px-5 py-3 font-medium text-slate-900">{r.facture_reference || `#${r.facture_id}`}</td>
                                                    <td className="px-5 py-3 text-slate-600">{r.mode_reglement || '—'}</td>
                                                    <td className="px-5 py-3 text-slate-600">{r.reference || '—'}</td>
                                                    <td className="px-5 py-3 text-slate-600">{fmtDate(r.date_reglement)}</td>
                                                    <td className="px-5 py-3 text-right font-medium text-slate-900">{r.montant_cts != null ? `${(r.montant_cts / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</td>
                                                    <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                                    <td className="px-5 py-3 text-right">
                                                        <button type="button" onClick={() => supprimerReglement(r)} title="Supprimer"
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={pageReglements} totalPages={Math.max(1, Math.ceil(reglements.length / PER_PAGE))} onChange={setPageReglements} label={`${reglements.length} règlement${reglements.length > 1 ? 's' : ''} au total`} />
                    </div>
                </div>
            )}

            {tab === 'sinistres' && (
                <div>
                    <div className="flex justify-end mb-3">
                        <button onClick={openSinistre}
                            className="px-4 py-2 btn-primary">
                            + Ajouter sinistre
                        </button>
                    </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="scroll-blue overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3">Réf interne</th>
                                <th className="px-5 py-3">Réf compagnie</th>
                                <th className="px-5 py-3">Type de contrat</th>
                                <th className="px-5 py-3">Réf contrat</th>
                                <th className="px-5 py-3">Compagnie</th>
                                <th className="px-5 py-3">Gtie applicable</th>
                                <th className="px-5 py-3">Statut</th>
                                <th className="px-5 py-3">État</th>
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {sinistres.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-4 py-6 text-center text-slate-500">Aucune donnée à afficher</td>
                            </tr>
                        ) : (
                            pager(sinistres, pageSinistres).items.map((s) => {
                                const sc = sinistreStatutConfig[s.statut] || { label: s.statut, cls: 'bg-slate-100 text-slate-600' };
                                const ec = sinistreEtatConfig[s.etat] || { label: s.etat, cls: 'bg-slate-100 text-slate-600' };
                                return (
                                    <tr key={s.id} className="group border-b border-slate-100 hover:bg-slate-100 hover:shadow-sm transition-all duration-150">
                                        <td className="px-5 py-3 font-medium text-slate-900">{s.numero || '—'}</td>
                                        <td className="px-5 py-3 text-slate-600">{s.ref_compagnie || '—'}</td>
                                        <td className="px-5 py-3 text-slate-600">{s.type_contrat || '—'}</td>
                                        <td className="px-5 py-3 text-slate-600">{s.contrat_numero_police || s.contrat_reference || '—'}</td>
                                        <td className="px-5 py-3 text-slate-600">{s.compagnie || '—'}</td>
                                        <td className="px-5 py-3 text-slate-600">{s.garantie || '—'}</td>
                                        <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                        <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${ec.cls}`}>{ec.label}</span></td>
                                        <td className="px-5 py-3 text-slate-600">{fmtDate(s.date_survenance)}</td>
                                        <td className="px-5 py-3 text-right text-slate-400 hover:text-deep-blue cursor-pointer">⋯</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                    </div>
                    <Pagination page={pageSinistres} totalPages={Math.max(1, Math.ceil(sinistres.length / PER_PAGE))} onChange={setPageSinistres} label={`${sinistres.length} sinistre${sinistres.length > 1 ? 's' : ''} au total`} />
                </div>
                </div>
            )}

            {tab === 'taches' && (
                <div>
                    <div className="flex justify-end mb-3">
                        <button onClick={openTache}
                            className="px-4 py-2 btn-primary">
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
                                        <th className="px-5 py-3 font-semibold">Réf</th>
                                        <th className="px-5 py-3 font-semibold">Date limite</th>
                                        <th className="px-5 py-3 font-semibold">Type</th>
                                        <th className="px-5 py-3 font-semibold">Objet</th>
                                        <th className="px-5 py-3 font-semibold">Statut</th>
                                        <th className="px-5 py-3 font-semibold">Priorité</th>
                                        <th className="px-5 py-3 font-semibold text-right">Montant en jeu</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pager(taches, pageTaches).items.map((t) => {
                                        const pc = tachePrioriteConfig[t.priorite] || { label: t.priorite, cls: 'bg-slate-100 text-slate-600' };
                                        const sc = tacheStatutConfig[t.statut] || { label: t.statut, cls: 'bg-slate-100 text-slate-600' };
                                        const dl = t.date_echeance || t.date_fin;
                                        return (
                                            <tr key={t.id} className={`group border-b border-slate-100 hover:bg-slate-100 hover:shadow-sm transition-all duration-150 ${t.statut === 'TERMINEE' ? 'opacity-60' : ''}`}>
                                                <td className="px-5 py-3 font-medium text-slate-900">{t.reference || t.id}</td>
                                                <td className="px-5 py-3 text-slate-600">{dl ? fmtDate(dl) : '—'}</td>
                                                <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t.type || 'SINISTRE'}</span></td>
                                                <td className="px-5 py-3">
                                                    <div className="font-medium text-slate-900">{t.objet || t.titre}</div>
                                                    {t.assignee_name && <div className="text-xs text-slate-400">Suivi par : {t.assignee_name}</div>}
                                                </td>
                                                <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                                <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${pc.cls}`}>{pc.label}</span></td>
                                                <td className="px-5 py-3 text-right font-medium text-slate-900">{t.montant != null ? `${Number(t.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}</td>
                                                <td className="px-5 py-3 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => basculerTache(t)}
                                                        title={t.statut === 'TERMINEE' ? 'Réouvrir' : 'Marquer terminée'}
                                                        className="text-slate-400 hover:text-deep-blue text-lg leading-none mr-2">
                                                        {t.statut === 'TERMINEE' ? '↺' : '✓'}
                                                    </button>
                                                    <button onClick={() => supprimerTache(t)} className="text-slate-400 hover:text-red-600 text-lg leading-none">&times;</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <Pagination page={pageTaches} totalPages={Math.max(1, Math.ceil(taches.length / PER_PAGE))} onChange={setPageTaches} label={`${taches.length} tâche${taches.length > 1 ? 's' : ''} au total`} />
                        </div>
                    )}
                </div>
            )}


            {factureOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-4xl my-8">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500"></div>
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-deep-blue">Ajouter une facture</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Étape {factureEtape} sur 2 — {factureEtape === 1 ? 'Informations' : 'Facturation'}</p>
                            </div>
                            <button onClick={() => setFactureOpen(false)} className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-deep-blue-soft hover:text-deep-blue hover:rotate-90 active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">
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
                                        <div className="text-sm font-medium text-blue-800 mb-1">Numéro Facture</div>
                                        <div className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                            La référence sera générée après la création de la facture
                                        </div>
                                    </div>
                                    <Field label="Date de facture *" type="date" value={factureHeader.date_facture} onChange={(e) => setFactureHeader({ ...factureHeader, date_facture: e.target.value })} />
                                    <Field label="Date d'échéance *" type="date" value={factureHeader.date_echeance} onChange={(e) => setFactureHeader({ ...factureHeader, date_echeance: e.target.value })} />
                                    <div className="col-span-2">
                                        <label className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-blue-800">Autoriser les moyens de règlement pour cette facture *</span>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 text-deep-blue focus:ring-deep-blue"
                                                checked={factureHeader.moyens_reglement.length > 0}
                                                onChange={(e) => setFactureHeader({ ...factureHeader, moyens_reglement: e.target.checked ? ['Carte bancaire'] : [] })}
                                            />
                                        </label>
                                        {factureHeader.moyens_reglement.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {['Carte bancaire', 'Virement'].filter((m) => factureHeader.moyens_reglement.includes(m)).map((m) => (
                                                    <span key={m} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-deep-blue-soft text-deep-blue text-sm font-medium">
                                                        {m}
                                                        <button type="button" onClick={() => basculerMoyen(m)} className="text-deep-blue hover:text-deep-blue-dark">&times;</button>
                                                    </span>
                                                ))}
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {['Carte bancaire', 'Virement'].filter((m) => !factureHeader.moyens_reglement.includes(m)).map((m) => (
                                                        <button type="button" key={m} onClick={() => basculerMoyen(m)}
                                                            className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 text-sm text-slate-500 hover:border-deep-blue hover:text-deep-blue">
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
                                    <button type="submit" className="px-5 py-2.5 btn-primary">
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
                                        <button type="button" onClick={ajouterLigne} className="text-sm font-medium text-deep-blue hover:text-deep-blue-dark">+ Ajouter une ligne</button>
                                    </div>
                                    <div className="scroll-blue overflow-x-auto">
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
                                    <button type="submit" disabled={savingFacture} className="px-5 py-2.5 btn-primary disabled:opacity-50">
                                        {savingFacture ? 'Enregistrement...' : 'Créer la facture'}
                                    </button>
                                </div>
                            </form>
                        )}
                        </div>
                    </div>
                </div>
            )}

            {modeleOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-lg my-8">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500"></div>
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-deep-blue">Ajouter un modèle</h2>
                            <button onClick={() => setModeleOpen(false)} className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-deep-blue-soft hover:text-deep-blue hover:rotate-90 active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        <form onSubmit={saveModele}>
                            <div className="space-y-3">
                                <label className="block">
                                    <span className="block text-sm font-medium text-blue-800 mb-1">Catégorie *</span>
                                    <select value={modeleForm.categorie} onChange={(e) => setModeleForm({ ...modeleForm, categorie: e.target.value })}
                                        className="field-line" required>
                                        {CATEGORIES_MODELE.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </label>
                                <Field label="Titre *" value={modeleForm.titre} onChange={(e) => setModeleForm({ ...modeleForm, titre: e.target.value })} required />
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Joindre document *</span>
                                        <input type="file" onChange={(e) => setModeleFile(e.target.files[0] || null)}
                                            className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-deep-blue-soft file:text-deep-blue hover:file:bg-deep-blue/10" required />
                                        {modeleFile && <span className="block mt-1 text-xs text-slate-400">{modeleFile.name}</span>}
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setModeleOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                                <button type="submit" disabled={savingModele} className="px-5 py-2.5 btn-primary disabled:opacity-50">
                                    {savingModele ? 'Enregistrement...' : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {bibliothequeOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-3xl my-8">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500"></div>
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-deep-blue">Bibliothèque</h2>
                            <button onClick={() => setBibliothequeOpen(false)} className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-deep-blue-soft hover:text-deep-blue hover:rotate-90 active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        <div className="space-y-4">
                            {CATEGORIES_MODELE.map((categorie) => {
                                const docs = bibliotheque.filter((d) => d.categorie === categorie);
                                return (
                                    <div key={categorie} className="rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-800">{categorie}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{docs.length}</span>
                                        </div>
                                        {docs.length === 0 ? (
                                            <p className="px-5 py-3 text-sm text-slate-400">Aucun document.</p>
                                        ) : (
                                            <ul className="divide-y divide-slate-100">
                                                {docs.map((d) => (
                                                    <li key={d.id} className="px-5 py-3 flex items-center gap-3">
                                                        <span className="flex-1 min-w-0">
                                                            <span className="block text-sm font-medium text-slate-900 truncate">{d.titre}</span>
                                                            <span className="block text-xs text-slate-400">{d.nom_origine}{d.taille ? ` • ${fmtTaille(d.taille)}` : ''}</span>
                                                        </span>
                                                        <button onClick={() => telechargerModele(d)} title="Télécharger"
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => supprimerModele(d)} title="Supprimer"
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
                                );
                            })}
                        </div>
                        </div>
                    </div>
                </div>
            )}

            {reglementOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-2xl my-8">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500"></div>
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-deep-blue">Ajouter un règlement</h2>
                            <button onClick={() => setReglementOpen(false)} className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-deep-blue-soft hover:text-deep-blue hover:rotate-90 active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        <form onSubmit={saveReglement}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <div className="text-sm font-medium text-blue-800 mb-1">Référence du règlement</div>
                                    <div className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                        La référence sera générée après l'ajout du règlement
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Facture *</span>
                                        <select value={reglementForm.facture_id} onChange={(e) => choisirFactureReglement(e.target.value)}
                                            className="field-line" required>
                                            <option value="">— Sélectionnez une facture —</option>
                                            {factures.map((f) => (
                                                <option key={f.id} value={f.id}>
                                                    {f.reference || `#${f.id}`}{f.montant_ttc_cts != null ? ` — ${(f.montant_ttc_cts / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Mode de règlement *</span>
                                        <select value={reglementForm.mode_reglement} onChange={(e) => setReglementForm({ ...reglementForm, mode_reglement: e.target.value })}
                                            className="field-line" required disabled={!reglementForm.facture_id}>
                                            <option value="">— Sélectionnez un mode —</option>
                                            {modesReglementPourFacture(reglementForm.facture_id).map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <Field label="Montant reçu *" type="number" min="0" step="0.01" value={reglementForm.montant_euros} onChange={(e) => setReglementForm({ ...reglementForm, montant_euros: e.target.value })} required />
                                <div className="col-span-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Détails</span>
                                        <textarea value={reglementForm.details} onChange={(e) => setReglementForm({ ...reglementForm, details: e.target.value })} rows={2}
                                            className="field-line" />
                                    </label>
                                </div>
                                <div className="col-span-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Mention(s)</span>
                                        <textarea value={reglementForm.mentions} onChange={(e) => setReglementForm({ ...reglementForm, mentions: e.target.value })} rows={2}
                                            className="field-line" />
                                    </label>
                                </div>
                                <Field label="Date de règlement *" type="date" value={reglementForm.date_reglement} onChange={(e) => setReglementForm({ ...reglementForm, date_reglement: e.target.value })} required />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setReglementOpen(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                                <button type="submit" disabled={savingReglement} className="px-5 py-2.5 btn-primary disabled:opacity-50">
                                    {savingReglement ? 'Enregistrement...' : 'Ajouter le règlement'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {tacheOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-5xl my-8">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500"></div>
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-deep-blue">Données Générales</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Ajouter une tâche — la référence sera générée après la création</p>
                            </div>
                            <button onClick={() => setTacheOpen(false)} className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-deep-blue-soft hover:text-deep-blue hover:rotate-90 active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        <form onSubmit={saveTache}>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Réf" value="(Généré automatiquement)" disabled />
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Type *</span>
                                        <select value={tacheForm.type} onChange={(e) => setTacheForm({ ...tacheForm, type: e.target.value })}
                                            className="field-line bg-slate-100 text-slate-500 cursor-not-allowed" disabled>
                                            <option value="SINISTRE">SINISTRE</option>
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Suivi par *</span>
                                        <select value={tacheForm.assignee_id} onChange={(e) => setTacheForm({ ...tacheForm, assignee_id: e.target.value })}
                                            className="field-line" required>
                                            <option value="">Choisir...</option>
                                            {tacheSuiveurs.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Objet *</span>
                                        <select value={tacheForm.objet} onChange={(e) => setTacheForm({ ...tacheForm, objet: e.target.value })}
                                            className="field-line" required>
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
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Priorité *</span>
                                        <select value={tacheForm.priorite} onChange={(e) => setTacheForm({ ...tacheForm, priorite: e.target.value })}
                                            className="field-line">
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
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Description *</span>
                                        <textarea value={tacheForm.description} onChange={(e) => setTacheForm({ ...tacheForm, description: e.target.value })} rows={3} required
                                            className="field-line" />
                                    </label>
                                </div>
                                <Field label="Temps passé (h)" type="number" min="0" step="0.5" value={tacheForm.temps_passe_h} onChange={(e) => setTacheForm({ ...tacheForm, temps_passe_h: e.target.value })} />
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Statut *</span>
                                        <select value={tacheForm.statut} onChange={(e) => setTacheForm({ ...tacheForm, statut: e.target.value })}
                                            className="field-line">
                                            <option value="A_FAIRE">À faire</option>
                                            <option value="EN_COURS">En cours</option>
                                            <option value="TERMINEE">Terminée</option>
                                        </select>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-6 mb-3 pb-3 border-b border-slate-200">
                                <h3 className="text-base font-bold text-deep-blue uppercase tracking-wide">Documents à joindre</h3>
                            </div>
                            <label className="cursor-pointer block">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-sm hover:border-deep-blue hover:bg-deep-blue-soft/20 transition-colors">
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
                                <button type="submit" disabled={savingTache} className="px-5 py-2.5 btn-primary disabled:opacity-50">
                                    {savingTache ? 'Enregistrement...' : 'Créer la tâche'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {sinistreOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-5xl my-8">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500"></div>
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-deep-blue">Données Générales</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Ajouter un sinistre — la référence sera générée après la création</p>
                            </div>
                            <button onClick={() => setSinistreOpen(false)} className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-deep-blue-soft hover:text-deep-blue hover:rotate-90 active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        <form onSubmit={saveSinistre}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Contrat *</span>
                                        <select value={sinistreForm.contrat_id} onChange={(e) => setSinistreForm({ ...sinistreForm, contrat_id: e.target.value })}
                                            className="field-line" required>
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
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Suivi par *</span>
                                        <select value={sinistreForm.suivi_par_id} onChange={(e) => setSinistreForm({ ...sinistreForm, suivi_par_id: e.target.value })}
                                            className="field-line" required>
                                            <option value="">Sélectionner...</option>
                                            {sinistreSuiveurs.map((u) => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Statut *</span>
                                        <select value={sinistreForm.statut} onChange={(e) => setSinistreForm({ ...sinistreForm, statut: e.target.value })}
                                            className="field-line" required>
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
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Description des dommages</span>
                                        <textarea value={sinistreForm.description_dommages} onChange={(e) => setSinistreForm({ ...sinistreForm, description_dommages: e.target.value })} rows={3}
                                            className="field-line" />
                                    </label>
                                </div>
                                <Field label="Responsabilité *" value={sinistreForm.responsabilite} onChange={(e) => setSinistreForm({ ...sinistreForm, responsabilite: e.target.value })} required />
                                <Field label="Montant des dommages (€)" type="number" step="0.01" min="0" value={sinistreForm.montant_estime_cts} onChange={(e) => setSinistreForm({ ...sinistreForm, montant_estime_cts: e.target.value })} />
                                <Field label="Bénéficiaire" value={sinistreForm.beneficiaire} onChange={(e) => setSinistreForm({ ...sinistreForm, beneficiaire: e.target.value })} />
                                <Field label="Expertise" value={sinistreForm.expertise} onChange={(e) => setSinistreForm({ ...sinistreForm, expertise: e.target.value })} />
                                <Field label="Recours" value={sinistreForm.recours} onChange={(e) => setSinistreForm({ ...sinistreForm, recours: e.target.value })} />
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">État</span>
                                        <select value={sinistreForm.etat} onChange={(e) => setSinistreForm({ ...sinistreForm, etat: e.target.value })}
                                            className="field-line">
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
                                <h3 className="text-base font-bold text-deep-blue uppercase tracking-wide">Documents à joindre</h3>
                            </div>
                            <label className="cursor-pointer block">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400 text-sm hover:border-deep-blue hover:bg-deep-blue-soft/20 transition-colors">
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
                                <button type="submit" disabled={savingSinistre} className="px-5 py-2.5 btn-primary disabled:opacity-50">
                                    {savingSinistre ? 'Enregistrement...' : 'Créer le sinistre'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {editor && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-4xl my-8">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500"></div>
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-deep-blue">Modifier : {client.nom_complet}</h2>
                            <button onClick={() => { setEditor(false); setError(''); }} className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-deep-blue-soft hover:text-deep-blue hover:rotate-90 active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">
                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        <form onSubmit={save}>
                            <div className="flex gap-3 mb-4">
                                <button type="button" onClick={() => setForm({ ...form, type: 'PHYSIQUE' })}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'PHYSIQUE' ? 'bg-deep-blue border-deep-blue text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>Personne physique</button>
                                <button type="button" onClick={() => setForm({ ...form, type: 'MORALE' })}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'MORALE' ? 'bg-[oklch(0.52_0.21_27.14)] border-[oklch(0.52_0.21_27.14)] text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>Entreprise</button>
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
                                <span className="block text-sm font-medium text-blue-800 mb-2">Préférence de contact</span>
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
                                                    className="w-4 h-4 rounded border-slate-300 text-deep-blue focus:ring-deep-blue" />
                                                {opt}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <span className="block text-sm font-medium text-blue-800 mb-2">Origine</span>
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
                                                    className="w-4 h-4 rounded border-slate-300 text-deep-blue focus:ring-deep-blue" />
                                                {opt}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-slate-200">
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={form.rgpd_consentement} onChange={(e) => setForm({ ...form, rgpd_consentement: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-deep-blue focus:ring-deep-blue" />
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
                                        className="w-4 h-4 rounded border-slate-300 text-deep-blue focus:ring-deep-blue" />
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
                                <button type="submit" disabled={saving} className="px-5 py-2.5 btn-primary disabled:opacity-50">Enregistrer</button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, type = 'text', required, placeholder, disabled, min, max, step }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-blue-800 mb-1">{label}{required && <span className="text-red-500"> *</span>}</span>
            <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled}
                min={min} max={max} step={step}
                className="field-line disabled:bg-slate-50 disabled:text-slate-400" />
        </label>
    );
}

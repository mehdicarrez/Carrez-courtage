import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth, estPartenaire } from '../../auth';
import ModifierDemande from './ModifierDemande';

const statutLabels = {
    BROUILLON: 'Brouillon',
    SOUMISE: 'Soumise',
    EN_ETUDE: 'En étude',
    PIECES_MANQUANTES: 'Pièces manquantes',
    DEVIS_EMIS: 'Devis émis',
    ACCEPTEE: 'Acceptée',
    EN_SOUSCRIPTION: 'En souscription',
    TRANSFORMEE: 'Transformée',
    NON_ELIGIBLE: 'Non éligible',
    SANS_SUITE: 'Clôturé',
    EXPIREE: 'Expirée',
};

const statutConfig = {
    BROUILLON: { label: 'Brouillon', cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    SOUMISE: { label: 'Soumise', cls: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
    EN_ETUDE: { label: 'En étude', cls: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
    PIECES_MANQUANTES: { label: 'Pièces manquantes', cls: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
    DEVIS_EMIS: { label: 'Devis émis', cls: 'bg-purple-50 text-purple-700 ring-purple-200', dot: 'bg-purple-500' },
    ACCEPTEE: { label: 'Acceptée', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    EN_SOUSCRIPTION: { label: 'En souscription', cls: 'bg-teal-50 text-teal-700 ring-teal-200', dot: 'bg-teal-500' },
    TRANSFORMEE: { label: 'Transformée', cls: 'bg-green-50 text-green-700 ring-green-200', dot: 'bg-green-600' },
    NON_ELIGIBLE: { label: 'Non éligible', cls: 'bg-gray-100 text-gray-500 ring-gray-200', dot: 'bg-gray-400' },
    SANS_SUITE: { label: 'Clôturé', cls: 'bg-gray-100 text-gray-500 ring-gray-200', dot: 'bg-gray-400' },
    EXPIREE: { label: 'Expirée', cls: 'bg-gray-100 text-gray-500 ring-gray-200', dot: 'bg-gray-300' },
};

const brancheColor = ['bg-blue-50 text-blue-700', 'bg-violet-50 text-violet-700', 'bg-rose-50 text-rose-700', 'bg-emerald-50 text-emerald-700', 'bg-amber-50 text-amber-700'];

const devisStatutLabels = {
    BROUILLON: 'Brouillon',
    ENVOYE: 'Envoyé',
    ACCEPTE: 'Accepté',
    REFUSE: 'Refusé',
    EXPIRE: 'Expiré',
    TRANSFORME: 'Transformé',
    DEVIS_SIGNE: 'Devis signé',
};

const devisStatutConfig = {
    BROUILLON: { cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    ENVOYE: { cls: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
    ACCEPTE: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    REFUSE: { cls: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
    EXPIRE: { cls: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
    TRANSFORME: { cls: 'bg-green-50 text-green-700 ring-green-200', dot: 'bg-green-600' },
    DEVIS_SIGNE: { cls: 'bg-teal-50 text-teal-700 ring-teal-200', dot: 'bg-teal-600' },
};

const fmtCts = (v) => (v == null ? '—' : (v / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }));

export default function DemandesList() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const estCabinet = user && ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user.role);
    const base = estPartenaire(user) ? '/espace-partenaire' : '';


    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filtres
    const [statut, setStatut] = useState('');
    const [brancheId, setBrancheId] = useState('');
    const [gestionnaireId, setGestionnaireId] = useState('');
    const [sansGestionnaire, setSansGestionnaire] = useState(false);
    const [q, setQ] = useState('');
    const [sort, setSort] = useState('recent');
    const [page, setPage] = useState(1);
    const perPage = 8;

    // Référentiels
    const [branches, setBranches] = useState([]);
    const [gestionnaires, setGestionnaires] = useState([]);

    // Attribution en masse
    const [selected, setSelected] = useState([]);
    const [attributionGestionnaire, setAttributionGestionnaire] = useState('');
    const [attribDropdownOpen, setAttribDropdownOpen] = useState(false);
    const [attributionBusy, setAttributionBusy] = useState(false);

    // Affecter / importer des clients
    const [affectOpen, setAffectOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [clients, setClients] = useState([]);
    const [clientBusy, setClientBusy] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importBusy, setImportBusy] = useState(false);
    const [imported, setImported] = useState([]);
    const [importReport, setImportReport] = useState(null);

    // Suppression
    const [deleteModal, setDeleteModal] = useState(null); // {id, reference}
    const [deleteBusy, setDeleteBusy] = useState(false);

    // Visualisation rapide
    const [voirOpen, setVoirOpen] = useState(false);
    const [voirData, setVoirData] = useState(null);
    const [voirBusy, setVoirBusy] = useState(false);

    // Modification demande depuis le modal
    const [modifierData, setModifierData] = useState(null);
    const [typesDocs, setTypesDocs] = useState([]);
    const [docTypeId, setDocTypeId] = useState('');
    const [docFile, setDocFile] = useState(null);
    const [docUploading, setDocUploading] = useState(false);

    // Clôture de demande (SANS_SUITE)
    const [clotureModal, setClotureModal] = useState(null); // {id, reference}
    const [clotureMotif, setClotureMotif] = useState('');
    const [cloturePrecisions, setCloturePrecisions] = useState('');
    const [clotureBusy, setClotureBusy] = useState(false);

    // Tâche (note interne via conversation)
    const [noteModal, setNoteModal] = useState(null); // {id, reference}
    const [noteBusy, setNoteBusy] = useState(false);
    const [taskRef, setTaskRef] = useState('');
    const [taskSuivi, setTaskSuivi] = useState('');
    const [taskDateDebut, setTaskDateDebut] = useState('');
    const [taskDateFin, setTaskDateFin] = useState('');
    const [taskPriorite, setTaskPriorite] = useState('MOYENNE');
    const [taskAvancement, setTaskAvancement] = useState(0);
    const [taskTemps, setTaskTemps] = useState(0);
    const [taskType, setTaskType] = useState('RELANCE');
    const [taskObjet, setTaskObjet] = useState('');
    const [taskMontant, setTaskMontant] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskStatut, setTaskStatut] = useState('A_FAIRE');
    const [taskFiles, setTaskFiles] = useState([]);

    // Signature électronique
    const [sigModal, setSigModal] = useState(false);
    const [sigEmail, setSigEmail] = useState('');
    const [sigMobile, setSigMobile] = useState('');
    const [sigMessage, setSigMessage] = useState('');
    const [sigSelected, setSigSelected] = useState([]); // ids des documents existants sélectionnés
    const [sigNewFiles, setSigNewFiles] = useState([]); // fichiers à uploader
    const [sigDocTypeId, setSigDocTypeId] = useState(''); // type des fichiers téléversés
    const [sigBusy, setSigBusy] = useState(false);

    useEffect(() => {
        api.get('/branches').then((res) => setBranches(res.data.data)).catch(() => {});
        api.get('/referentiels/actifs')
            .then((res) => setTypesDocs(res.data.types_documents || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (estCabinet) {
            api.get('/demandes/gestionnaires').then((res) => setGestionnaires(res.data.data)).catch(() => {});
        }
    }, [estCabinet]);

    const chercherClients = (q) => {
        setClientSearch(q);
        if (!estCabinet) return;
        if (q.trim() === '') {
            setClients([]);
            return;
        }
        api.get('/clients', { params: { q: q.trim(), per_page: 15 } })
            .then((res) => setClients(res.data.data))
            .catch(() => setClients([]));
    };

    // Rechargement quand les filtres changent
    useEffect(() => {
        setPage(1);
        const params = {};
        if (statut) params.statut = statut;
        if (brancheId) params.branche_id = brancheId;
        if (gestionnaireId) params.gestionnaire_id = gestionnaireId;
        if (sansGestionnaire) params.sans_gestionnaire = 1;
        if (q.trim()) params.q = q.trim();
        params.sort = sort;

        setLoading(true);
        api.get('/demandes', { params })
            .then((res) => setDemandes(res.data.data))
            .catch(() => setError('Erreur de chargement.'))
            .finally(() => setLoading(false));
    }, [statut, brancheId, gestionnaireId, sansGestionnaire, q, sort]);

    const toggleSelect = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const mettreAJourFiltreGestionnaire = (id) => {
        setGestionnaireId(id);
        if (id) setSansGestionnaire(false);
    };

    const attribuerMasse = async () => {
        if (!attributionGestionnaire) return;
        setAttributionBusy(true);
        try {
            await api.post('/demandes/attribution-massive', {
                demande_ids: selected,
                gestionnaire_id: attributionGestionnaire,
            });
            setSelected([]);
            reload();
        } catch {
            setError("Erreur lors de l'attribution en masse.");
        } finally {
            setAttributionBusy(false);
        }
    };

    const ageBadge = (d) => {
        if (d.age_jours === 0) return <span className="text-xs text-emerald-600 font-semibold">aujourd'hui</span>;
        if (d.age_jours > 15) return <span className="text-xs text-red-600 font-medium">{d.age_jours} j</span>;
        return <span className="text-xs text-slate-500">{d.age_jours} j</span>;
    };

    const affecterClient = async (clientId) => {
        if (!clientId || selected.length === 0) return;
        setClientBusy(true);
        try {
            await api.post('/demandes/affectation-clients', {
                demande_ids: selected,
                client_id: clientId,
            });
            setAffectOpen(false);
            setClients([]);
            setClientSearch('');
            setSelected([]);
            reload();
        } catch {
            setError("Erreur lors de l'affectation du client.");
        } finally {
            setClientBusy(false);
        }
    };

    const importerClients = async (e) => {
        e.preventDefault();
        if (!importFile) return;
        setImportBusy(true);
        setImportReport(null);
        setError('');
        const fd = new FormData();
        fd.append('file', importFile);
        try {
            const res = await api.post('/clients/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setImportReport(res.data);
            setImported(res.data.crees > 0 ? [`${res.data.crees} client(s) importé(s) dans le répertoire.`] : []);
            setImportFile(null);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'import.");
        } finally {
            setImportBusy(false);
        }
    };

    const reload = () => {
        const params = {};
        if (statut) params.statut = statut;
        if (brancheId) params.branche_id = brancheId;
        if (gestionnaireId) params.gestionnaire_id = gestionnaireId;
        if (sansGestionnaire) params.sans_gestionnaire = 1;
        if (q.trim()) params.q = q.trim();
        params.sort = sort;
        api.get('/demandes', { params }).then((res) => setDemandes(res.data.data)).catch(() => {});
    };

    const supprimerDemande = async () => {
        if (!deleteModal) return;
        setDeleteBusy(true);
        try {
            await api.delete(`/demandes/${deleteModal.id}`);
            setDeleteModal(null);
            reload();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression.');
        } finally {
            setDeleteBusy(false);
        }
    };

    const ouvrirVoir = async (id) => {
        setVoirOpen(true);
        setVoirData(null);
        setVoirBusy(true);
        setDocTypeId('');
        setDocFile(null);
        setError('');
        try {
            const res = await api.get(`/demandes/${id}`);
            setVoirData(res.data.data);
        } catch {
            setError('Erreur de chargement des détails.');
        } finally {
            setVoirBusy(false);
        }
    };

    const telechargerDocument = async (docId) => {
        try {
            const res = await api.get(`/documents/${docId}/url`);
            window.open(res.data.url, '_blank');
        } catch {
            setError('Erreur de téléchargement du document.');
        }
    };

    const uploaderDocument = async (e) => {
        e.preventDefault();
        if (!docFile || !docTypeId) {
            setError('Sélectionnez un type de document et un fichier.');
            return;
        }
        setDocUploading(true);
        setError('');
        const fd = new FormData();
        fd.append('type_document_id', docTypeId);
        fd.append('objet_type', 'demande');
        fd.append('objet_id', voirData.id);
        fd.append('file', docFile);
        try {
            await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setDocFile(null);
            setDocTypeId('');
            const res = await api.get(`/demandes/${voirData.id}`);
            setVoirData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'upload du document.");
        } finally {
            setDocUploading(false);
        }
    };

    const cloturerDemande = async () => {
        if (!clotureModal) return;
        if (!clotureMotif) {
            setError('Le motif principal est obligatoire.');
            return;
        }
        setClotureBusy(true);
        setError('');
        try {
            const motifFinal = clotureMotif === 'AUTRE'
                ? (cloturePrecisions.trim() || clotureMotif)
                : (cloturePrecisions.trim()
                    ? clotureMotif + ' — ' + cloturePrecisions.trim()
                    : clotureMotif);
            const res = await api.post(`/demandes/${clotureModal.id}/transitions`, {
                action: 'sans_suite',
                motif: motifFinal,
            });
            setClotureModal(null);
            setClotureMotif('');
            setCloturePrecisions('');
            setVoirData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de la clôture de la demande.");
        } finally {
            setClotureBusy(false);
        }
    };

    const supprimerDocument = async (docId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
        setError('');
        try {
            await api.delete(`/documents/${docId}`);
            const res = await api.get(`/demandes/${voirData.id}`);
            setVoirData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de la suppression du document.");
        }
    };

    const ouvrirTache = () => {
        setTaskRef('');
        setTaskSuivi('');
        setTaskDateDebut('');
        setTaskDateFin('');
        setTaskPriorite('MOYENNE');
        setTaskAvancement(0);
        setTaskTemps(0);
        setTaskType('RELANCE');
        setTaskObjet('');
        setTaskMontant('');
        setTaskDescription('');
        setTaskStatut('A_FAIRE');
        setTaskFiles([]);
        setNoteModal({ id: voirData.id, reference: voirData.reference });
        setError('');
    };

    const addTaskFiles = (files) => {
        const arr = Array.from(files);
        if (arr.length === 0) return;
        setTaskFiles((prev) => [...prev, ...arr]);
    };

    const removeTaskFile = (index) => {
        setTaskFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const submitNote = async () => {
        if (!noteModal) return;
        if (!taskSuivi || !taskDateDebut || !taskDateFin || !taskType || !taskObjet || !taskDescription || !taskStatut) {
            setError('Veuillez renseigner tous les champs obligatoires (*).');
            return;
        }
        if (taskDateFin && taskDateDebut && taskDateFin < taskDateDebut) {
            setError('La date de fin doit être postérieure à la date de début.');
            return;
        }
        setNoteBusy(true);
        setError('');
        try {
            const suiviNom = gestionnaires.find((g) => String(g.id) === String(taskSuivi))?.name || taskSuivi;
            const docNoms = taskFiles.map((f) => f.name).join(', ');
            const lignes = [
                `TÂCHE — ${taskRef || noteModal.reference}`,
                `Suivi par: ${suiviNom}`,
                `Type: ${taskType} | Objet: ${taskObjet}`,
                `Priorité: ${taskPriorite} | Statut: ${taskStatut}`,
                `Début: ${taskDateDebut} | Fin: ${taskDateFin}`,
                `Avancement: ${taskAvancement}% | Temps passé: ${taskTemps}h`,
                taskMontant ? `Montant: ${taskMontant}` : null,
                `Description: ${taskDescription}`,
                docNoms ? `Documents: ${docNoms}` : null,
            ].filter(Boolean);
            const conv = await api.get(`/conversations/demande/${noteModal.id}`);
            await api.post(`/conversations/${conv.data.conversation_id}/messages`, {
                contenu: lignes.join('\n'),
                visibilite: 'INTERNE',
            });
            setNoteModal(null);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        } finally {
            setNoteBusy(false);
        }
    };

    const ouvrirSignature = () => {
        setSigEmail(voirData.client_detail?.email || '');
        setSigMobile(voirData.client_detail?.telephone || '');
        setSigMessage('');
        setSigSelected([]);
        setSigNewFiles([]);
        setSigDocTypeId('');
        setSigModal(true);
    };

    const toggleSigDoc = (id) => {
        setSigSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const addSigFiles = (files) => {
        const arr = Array.from(files);
        if (arr.length === 0) return;
        setSigNewFiles((prev) => [...prev, ...arr]);
    };

    const removeSigFile = (index) => {
        setSigNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const submitSignature = async () => {
        if (!sigEmail.trim() || !sigMobile.trim() || !sigMessage.trim()) {
            setError('Les champs Email, Mobile et Message sont obligatoires.');
            return;
        }
        if (sigNewFiles.length > 0 && !sigDocTypeId) {
            setError('Sélectionnez un type de document pour les fichiers téléversés.');
            return;
        }
        const docIds = (voirData.documents || []).filter((d) => sigSelected.includes(d.id)).map((d) => d.id);
        if (sigNewFiles.length === 0 && docIds.length === 0) {
            setError('Sélectionnez ou téléversez au moins un document à signer.');
            return;
        }
        setSigBusy(true);
        setError('');
        try {
            // 1) Upload des nouveaux fichiers (récupération des ids créés)
            for (const file of sigNewFiles) {
                const fd = new FormData();
                fd.append('type_document_id', sigDocTypeId);
                fd.append('objet_type', 'demande');
                fd.append('objet_id', voirData.id);
                fd.append('file', file);
                const res = await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                if (res.data.data?.id) docIds.push(res.data.data.id);
            }

            // 2) Envoi pour signature via Yousign (backend)
            const res = await api.post(`/demandes/${voirData.id}/signature`, {
                email: sigEmail.trim(),
                mobile: sigMobile.trim(),
                message: sigMessage.trim(),
                document_ids: docIds,
            });

            const url = res.data.data?.url;
            setSigModal(false);
            if (url) {
                window.open(url, '_blank');
            }
            window.alert(`Signature envoyée avec succès (Yousign).${url ? '\nOuverture du lien de suivi en cours...' : ''}`);
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data?.message || "Erreur lors de l'envoi pour signature.";
            setError(detail);
        } finally {
            setSigBusy(false);
        }
    };

    const filterCount = (Object.entries({ statut, brancheId, gestionnaireId }).filter(([, v]) => v).length) + (sansGestionnaire ? 1 : 0) + (q.trim() ? 1 : 0);

    const viderFiltres = () => {
        setStatut('');
        setBrancheId('');
        setGestionnaireId('');
        setSansGestionnaire(false);
        setQ('');
        setSort('recent');
    };
    const totalPages = Math.max(1, Math.ceil(demandes.length / perPage));
    const demandesPage = demandes.slice((page - 1) * perPage, page * perPage);

    return (
        <div>
            {/* En-tête */}
            <div className="mb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3">

                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent tracking-tight">
                                {sansGestionnaire ? 'File d\'attribution' : 'Demandes de tarification'}
                            </h1>

                            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Suivi des demandes envoyées par vos partenaires au cabinet.
                            </p>
                        </div>

                    </div>
                </div>

                <div className="flex gap-2">
                    <Link
                        to={`${base}/demandes/nouvelle`}
                        className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm shadow-blue-700/20 transition-all"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>
                        Nouvelle demande
                    </Link>
                </div>
            </div>
        </div>


            {/* Barre de filtres */}
            <div className="bg-gradient-to-b from-slate-50 to-slate-50/60 border border-slate-200 rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center text-sm shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
                <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                </svg>
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher (référence, client)..."
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-600 font-semibold placeholder:text-slate-400 placeholder:font-normal caret-blue-600 selection:bg-blue-100 selection:text-blue-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
            </div>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-600 font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                <option value="" className="text-slate-600">Tous les statuts</option>
                {Object.entries(statutLabels).map(([k, v]) => (
                    <option key={k} value={k} className="text-slate-600">{v}</option>
                ))}
            </select>
            <select value={brancheId} onChange={(e) => setBrancheId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-600 font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                <option value="" className="text-slate-600">Toutes les branches</option>
                {branches.map((b) => (
                    <option key={b.id} value={b.id} className="text-slate-600">{b.nom}</option>
                ))}
            </select>
            {estCabinet && (
                <select value={gestionnaireId} onChange={(e) => mettreAJourFiltreGestionnaire(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-600 font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="" className="text-slate-600">Tous les gestionnaires</option>
                    {gestionnaires.map((g) => (
                        <option key={g.id} value={g.id} className="text-slate-600">{g.name}</option>
                    ))}
                </select>
            )}
            {estCabinet && (
                <button
                    onClick={() => {
                        setSansGestionnaire((v) => !v);
                        if (!sansGestionnaire) setGestionnaireId('');
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold outline-none transition-colors ${
                        sansGestionnaire ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <span className={`w-2 h-2 rounded-full ${sansGestionnaire ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                    File d'attribution
                </button>
            )}
            <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-600 font-semibold outline-none focus:ring-2 focus:ring-blue-500">
                <option value="recent" className="text-slate-600">Plus récentes</option>
                <option value="ancien" className="text-slate-600">Plus anciennes</option>
            </select>
            {filterCount > 0 && (
                <button onClick={viderFiltres}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2">
                    Effacer ({filterCount})
                </button>
            )}
        </div>

            {/* Barre d'action de masse */}
            {estCabinet && selected.length > 0 && (
            <div className="relative bg-white rounded-2xl p-3.5 mb-4 flex flex-wrap items-center gap-3 text-sm shadow-lg shadow-blue-900/10 border border-blue-100 ring-1 ring-blue-700/5">
                <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-700 rounded-l-2xl"></span>

                <span className="inline-flex items-center gap-2 pl-2">
                    <span className="w-2 h-2 rounded-full bg-blue-700 animate-pulse"></span>
                    <span className="font-semibold text-slate-800">
                        {selected.length} demande{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''}
                    </span>
                </span>

                {/* Dropdown custom "Attribuer à..." */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setAttribDropdownOpen((v) => !v)}
                        className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full pl-4 pr-3 py-1.5 text-sm text-slate-700 font-medium transition-colors"
                    >
                        {attributionGestionnaire
                            ? gestionnaires.find((g) => String(g.id) === String(attributionGestionnaire))?.name
                            : 'Attribuer à...'}
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${attribDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {attribDropdownOpen && (
                        <div className="absolute z-20 top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-blue-900/15 border border-slate-100 py-1.5 max-h-64 overflow-y-auto">
                            {gestionnaires.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => { setAttributionGestionnaire(g.id); setAttribDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                                        String(attributionGestionnaire) === String(g.id)
                                            ? 'text-blue-700 font-semibold bg-blue-50/70'
                                            : 'text-slate-700 hover:bg-blue-50/70 hover:text-blue-700'
                                    }`}
                                >
                                    {g.name}
                                    {String(attributionGestionnaire) === String(g.id) && (
                                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={attribuerMasse}
                    disabled={!attributionGestionnaire || attributionBusy}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 rounded-full text-sm font-medium disabled:opacity-40 disabled:hover:bg-blue-700 transition-colors shadow-sm shadow-blue-700/20"
                >
                    {attributionBusy ? 'Attribution...' : 'Attribuer'}
                </button>

                <span className="text-slate-400 text-xs hidden md:inline">À tout moment, via « Affecter » / « Importer ».</span>

                <button
                    onClick={() => setSelected([])}
                    className="text-slate-400 hover:text-red-600 text-sm ml-auto inline-flex items-center gap-1 transition-colors"
                >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                    Annuler
                </button>
            </div>
        )}

            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            {loading && (
                <div className="space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                            <div className="flex gap-4">
                                <div className="h-4 bg-slate-200 rounded w-32"></div>
                                <div className="h-4 bg-slate-200 rounded w-20 ml-auto"></div>
                            </div>
                            <div className="h-4 bg-slate-200 rounded w-2/3 mt-3"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2 mt-2"></div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && demandes.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <p className="text-slate-500 font-medium">Aucune demande pour le moment.</p>
                    <p className="text-sm text-slate-400 mt-1">Ajustez vos filtres ou créez une nouvelle demande.</p>
                </div>
            )}

            {/* Liste des demandes */}
            {!loading && demandes.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-slate-50/60">
                                    {estCabinet && (
                                        <th className="px-4 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                checked={demandes.length > 0 && selected.length === demandes.length}
                                                onChange={(e) => setSelected(e.target.checked ? demandes.map((x) => x.id) : [])}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </th>
                                    )}
                                    <th className="px-4 py-3">ID N° affaire</th>
                                    <th className="px-4 py-3">Date Création</th>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">Nature</th>
                                    <th className="px-4 py-3">Etat</th>
                                    <th className="px-4 py-3">Devis</th>
                                    <th className="px-4 py-3">Date mise à jour</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {demandesPage.map((d) => {
                                    const sc = statutConfig[d.statut] || statutConfig.BROUILLON;
                                    const brancheIdx = (d.branche?.length || d.branche_id?.length || 0) % brancheColor.length;
                                    return (
                                        <tr
                                            key={d.id}
                                                className={`group hover:bg-slate-100 hover:shadow-sm transition-all duration-150 ${selected.includes(d.id) ? 'bg-slate-200/70' : ''}`}
                                        >
                                            {estCabinet && (
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.includes(d.id)}
                                                        onChange={() => toggleSelect(d.id)}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-4 py-3 font-semibold text-blue-700 whitespace-nowrap">
                                                <Link to={`${base}/demandes/${d.id}`}>{d.reference}</Link>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                                                {d.created_at ? new Date(d.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-800 font-medium">
                                                {d.client || 'Client non précisé'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${brancheColor[brancheIdx]}`}>
                                                    {d.branche || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset whitespace-nowrap transition-transform group-hover:scale-105 ${sc.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`}></span>
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {d.nb_devis > 0 ? `${d.nb_devis} devis` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                                {d.date_statut ? new Date(d.date_statut).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center gap-1 justify-end">
                                                    <button
                                                        onClick={() => navigate(`${base}/demandes/${d.id}`)}
                                                        title="Voir les devis"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 hover:scale-110 transition-all duration-150"
                                                    >
                                                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 10.378 2H4.5Zm2.25 8.25a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => ouvrirVoir(d.id)}
                                                        title="Voir"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all duration-150"
                                                    >
                                                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal({ id: d.id, reference: d.reference })}
                                                        title="Supprimer"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 hover:scale-110 transition-all duration-150"
                                                    >
                                                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                            <span className="text-xs text-slate-500">
                                Page <span className="font-semibold text-slate-700">{page}</span> sur{' '}
                                <span className="font-semibold text-slate-700">{totalPages}</span>
                                {' · '}{demandes.length} demande{demandes.length > 1 ? 's' : ''} au total
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all duration-150"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce((acc, p, idx, arr) => {
                                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, i) =>
                                        p === '...' ? (
                                            <span key={`dots-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                                        ) : (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-150 ${
                                                    p === page
                                                        ? 'bg-blue-600 text-white shadow-sm scale-105'
                                                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        )
                                    )}
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all duration-150"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.08-1.04l4.25 4.5a.75.75 0 0 1 0 1.08l-4.25 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal affecter des clients */}
            {affectOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-2xl shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5c2.567 0 4.5 1.933 4.5 4.5s-1.933 4.5-4.5 4.5S5.5 8.567 5.5 6 7.433 1.5 10 1.5Zm0 10.5c2.508 0 6.5 1.25 6.5 3.5v.5c0 .552-.448 1-1 1h-11c-.552 0-1-.448-1-1v-.5c0-2.25 3.992-3.5 6.5-3.5Z" /></svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Affecter un client</h2>
                                <p className="text-sm text-slate-500">
                                    Rattacher un client du répertoire aux {selected.length} demande(s) sélectionnée(s)
                                </p>
                            </div>
                        </div>

                        <input
                            value={clientSearch}
                            onChange={(e) => chercherClients(e.target.value)}
                            placeholder="Rechercher un client (nom, email, siren)..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                            autoFocus
                        />

                        <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                            {clientSearch.trim() === '' ? (
                                <div className="p-4 text-sm text-slate-400 text-center">Saisissez au moins 1 caractère pour chercher</div>
                            ) : clients.length === 0 ? (
                                <div className="p-4 text-sm text-slate-400 text-center">Aucun client trouvé</div>
                            ) : (
                                clients.map((c) => (
                                    <button key={c.id} onClick={() => affecterClient(c.id)}
                                        disabled={clientBusy}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50/60 transition-colors disabled:opacity-50">
                                        <div className="text-sm font-medium text-slate-900">{c.nom_complet}</div>
                                        <div className="text-xs text-slate-500">
                                            {c.type === 'MORALE' ? c.siren : [c.email, c.telephone].filter(Boolean).join(' · ') || '—'}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => { setAffectOpen(false); setClients([]); setClientSearch(''); }}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal importer des clients */}
            {importOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-xl shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path d="M3.5 2.75a2 2 0 0 1 2-2H11a.75.75 0 0 1 .53.22l3.25 3.25a.75.75 0 0 1 .22.53v11a2 2 0 0 1-2 2h-7.5a2 2 0 0 1-2-2v-13Z" /></svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Importer des clients</h2>
                                <p className="text-sm text-slate-500">Import CSV dans le répertoire, puis affectation aux {selected.length} demande(s)</p>
                            </div>
                        </div>

                        <form onSubmit={importerClients}>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center mb-3">
                                <input type="file" accept=".csv,.txt"
                                    onChange={(e) => setImportFile(e.target.files[0] || null)}
                                    className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                            </div>

                            {importReport && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 mb-3">
                                    <span className="font-semibold">{importReport.crees}</span> client(s) importé(s) dans le répertoire.
                                    {importReport.erreurs?.length > 0 && (
                                        <>
                                            <span className="font-semibold text-red-700">, {importReport.erreurs.length} erreur(s)</span>
                                            <ul className="list-disc pl-5 mt-1 text-xs text-red-600 max-h-24 overflow-auto">
                                                {importReport.erreurs.map((er, i) => (
                                                    <li key={i}>Ligne {er.ligne} : {er.cause}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                    <div className="mt-2 text-xs text-slate-600">
                                        Vous pouvez maintenant utiliser « Affecter des clients » pour rattacher les demandes sélectionnées.
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => { setImportOpen(false); setImportReport(null); setImportFile(null); }}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Fermer</button>
                                <button type="submit" disabled={!importFile || importBusy}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition-colors">
                                    {importBusy ? 'Import...' : 'Importer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal visualisation rapide */}
            {voirOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto shadow-2xl">
                        {voirBusy || !voirData ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-5">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-xl font-bold text-slate-900">{voirData.reference}</h2>
                                            {(() => { const sc = statutConfig[voirData.statut] || statutConfig.BROUILLON; return (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${sc.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                                                    {sc.label}
                                                </span>
                                            ); })()}
                                        </div>
                                        <p className="text-sm text-slate-500">{voirData.branche || '—'}</p>
                                    </div>
                                    <button onClick={() => setVoirOpen(false)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Identité */}
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm col-span-1">
                                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">Identité</div>
                                        <div className="p-4 space-y-2.5 text-sm">
                                            <div>
                                                <div className="text-[11px] uppercase text-slate-400 font-medium">Nom et prénom</div>
                                                {(() => {
                                                    const cd = voirData.client_detail;
                                                    const nom = cd
                                                        ? (cd.type === 'MORALE' ? (cd.raison_sociale || '—') : `${cd.civilite ? cd.civilite + ' ' : ''}${cd.prenom || ''} ${cd.nom || ''}`.trim() || cd.nom_complet)
                                                        : (voirData.client || '—');
                                                    return <div className="font-semibold text-slate-900">{nom}</div>;
                                                })()}
                                            </div>
                                            {(voirData.client_detail?.date_naissance) && (
                                                <div>
                                                    <div className="text-[11px] uppercase text-slate-400 font-medium">Date de naissance</div>
                                                    <div className="text-slate-700">{voirData.client_detail.date_naissance}</div>
                                                </div>
                                            )}
                                            {(voirData.client_detail?.siren) && (
                                                <div>
                                                    <div className="text-[11px] uppercase text-slate-400 font-medium">SIREN</div>
                                                    <div className="text-slate-700">{voirData.client_detail.siren}</div>
                                                </div>
                                            )}
                                            {(voirData.client_detail?.adresse) && (
                                                <div>
                                                    <div className="text-[11px] uppercase text-slate-400 font-medium">Adresse</div>
                                                    <div className="text-slate-700">{voirData.client_detail.adresse}</div>
                                                </div>
                                            )}
                                            {(voirData.client_detail?.code_postal || voirData.client_detail?.ville) && (
                                                <div>
                                                    <div className="text-[11px] uppercase text-slate-400 font-medium">Code postal / Ville</div>
                                                    <div className="text-slate-700">{[voirData.client_detail.code_postal, voirData.client_detail.ville].filter(Boolean).join(' ') || '—'}</div>
                                                </div>
                                            )}
                                            {(voirData.client_detail?.telephone) && (
                                                <div>
                                                    <div className="text-[11px] uppercase text-slate-400 font-medium">Tél</div>
                                                    <div className="text-slate-700">{voirData.client_detail.telephone}</div>
                                                </div>
                                            )}
                                            {(voirData.client_detail?.email) && (
                                                <div>
                                                    <div className="text-[11px] uppercase text-slate-400 font-medium">Email</div>
                                                    <div className="text-slate-700 break-all">{voirData.client_detail.email}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Projet / Produit */}
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm col-span-1">
                                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">Projet</div>
                                        <div className="p-4 space-y-2.5 text-sm">
                                            <div>
                                                <div className="text-[11px] uppercase text-slate-400 font-medium">Nature</div>
                                                <div className="font-medium text-slate-900">{voirData.branche || '—'}</div>
                                            </div>
                                            {voirData.origine && (
                                                <div>
                                                    <div className="text-[11px] uppercase text-slate-400 font-medium">Origine</div>
                                                    <div className="text-slate-700">{voirData.origine === 'PARTENAIRE' ? 'Partenaire' : 'Cabinet'}</div>
                                                </div>
                                            )}
                                            {voirData.gestionnaire && (
                                                <div>
                                                    <div className="text-[11px] uppercase text-slate-400 font-medium">Gestionnaire</div>
                                                    <div className="text-slate-700">{voirData.gestionnaire}</div>
                                                </div>
                                            )}
                                            {voirData.donnees_risque && Object.keys(voirData.donnees_risque).length > 0 && (
                                                <>
                                                    <div className="pt-2 border-t border-slate-100">
                                                        <div className="text-[11px] uppercase text-slate-400 font-medium mb-1.5">Données du risque</div>
                                                        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
                                                            {Object.entries(voirData.donnees_risque).map(([k, v]) => {
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
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Statut */}
                                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm col-span-1">
                                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">Statut</div>
                                        <div className="p-4 space-y-2.5 text-sm">
                                            {voirData.client && (
                                                <div>
                                                    <div className="text-[11px] uppercase text-slate-400 font-medium">Client</div>
                                                    <div className="font-medium text-slate-900">{voirData.client}</div>
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-[11px] uppercase text-slate-400 font-medium">Mis à jour le</div>
                                                <div className="text-slate-700">
                                                    {voirData.date_statut ? new Date(voirData.date_statut).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] uppercase text-slate-400 font-medium">Créé le</div>
                                                <div className="text-slate-700">
                                                    {voirData.created_at ? new Date(voirData.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] uppercase text-slate-400 font-medium">Devis</div>
                                                <div className="text-slate-700">{voirData.nb_devis > 0 ? `${voirData.nb_devis} devis` : 'Aucun devis'}</div>
                                            </div>
                                            {voirData.motif && (
                                                <div>
                                                    <div className="text-[11px] uppercase text-slate-400 font-medium">Motif</div>
                                                    <div className="text-slate-700">{voirData.motif}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Devis de la demande */}
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-4">
                                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Devis de la demande ({voirData.devis?.length || 0})
                                    </div>
                                    <div className="p-4">
                                        {!voirData.devis || voirData.devis.length === 0 ? (
                                            <p className="text-sm text-slate-400">Aucun devis créé pour cette demande.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {voirData.devis.map((d) => {
                                                    const dsc = devisStatutConfig[d.statut] || devisStatutConfig.BROUILLON;
                                                    return (
                                                        <div key={d.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                                            {d.propose_par?.logo_url ? (
                                                                <img src={d.propose_par.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover bg-white border border-slate-200 flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
                                                                    {(d.propose_par?.nom || '?').slice(0, 2)}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-sm font-medium text-slate-900 truncate">{d.propose_par?.nom || '—'}</div>
                                                                <div className="text-xs text-slate-500">
                                                                    {d.version ? `V${d.version} · ` : ''}
                                                                    {d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : '—'}
                                                                    {d.date_validite ? ` · valable au ${d.date_validite}` : ''}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm font-semibold text-slate-900 tabular-nums">{fmtCts(d.prime_ttc_cts)}</div>
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${dsc.cls}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${dsc.dot}`}></span>
                                                                {devisStatutLabels[d.statut] || d.statut}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Documents */}
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-4">
                                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Documents ({voirData.documents?.length || 0})
                                    </div>

                                    {/* Formulaire d'ajout de fichier */}
                                    <div className="p-4 border-b border-slate-100">
                                        <form onSubmit={uploaderDocument} className="flex flex-col sm:flex-row gap-2 items-end">
                                            <div className="flex-1 w-full">
                                                <label className="block text-[11px] font-medium text-slate-500 mb-1">Type de document <span className="text-red-500">*</span></label>
                                                <select value={docTypeId} onChange={(e) => setDocTypeId(e.target.value)}
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                                                    <option value="">— Choisir un type —</option>
                                                    {typesDocs.map((t) => (
                                                        <option key={t.id} value={t.id}>{t.libelle}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label className="block text-[11px] font-medium text-slate-500 mb-1">Fichier <span className="text-red-500">*</span></label>
                                                <input type="file" onChange={(e) => setDocFile(e.target.files[0])}
                                                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 file:mr-2" />
                                            </div>
                                            <button type="submit" disabled={docUploading}
                                                className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 transition-colors flex-shrink-0">
                                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                                                {docUploading ? 'Envoi...' : 'Ajouter'}
                                            </button>
                                        </form>
                                    </div>

                                    <div className="p-4">
                                        {!voirData.documents || voirData.documents.length === 0 ? (
                                            <p className="text-sm text-slate-400">Aucun document rattaché.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {voirData.documents.map((doc) => (
                                                    <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V9.621a1.5 1.5 0 0 0-.44-1.06L11.94 3.44A1.5 1.5 0 0 0 10.878 3H4.5Zm2 3.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75ZM7 10.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 10.5Zm0 3a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium text-slate-900 truncate">{doc.nom_origine || doc.type_document || 'Document'}</div>
                                                            <div className="text-xs text-slate-500">
                                                                {doc.type_document || 'Document'}
                                                                {doc.creation ? ` · ${new Date(doc.creation).toLocaleDateString('fr-FR')}` : ''}
                                                            </div>
                                                        </div>
                                                        {doc.statut_validation && (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${doc.statut_validation === 'VALIDE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                {doc.statut_validation}
                                                            </span>
                                                        )}
                                                        <button onClick={() => telechargerDocument(doc.id)} title="Télécharger"
                                                            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0">
                                                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                                                        </button>
                                                        <button onClick={() => supprimerDocument(doc.id)} title="Supprimer"
                                                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0">
                                                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-4">
                                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Actions
                                    </div>
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <button onClick={() => { setVoirOpen(false); setModifierData(voirData); }}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                                            Modifier la demande
                                        </button>
                                        <button onClick={() => { setVoirOpen(false); setDeleteModal({ id: voirData.id, reference: voirData.reference }); }}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                                            <svg className="w-4 h-4 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                                            Supprimer
                                        </button>
                                        <button onClick={() => { setClotureModal({ id: voirData.id, reference: voirData.reference }); setClotureMotif(''); setCloturePrecisions(''); }}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors">
                                            <svg className="w-4 h-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" /></svg>
                                            Clôturer la demande
                                        </button>
                                        <button onClick={ouvrirTache}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                            <svg className="w-4 h-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 5.5A3.5 3.5 0 0 1 9.5 2h1A3.5 3.5 0 0 1 14 5.5v.55c1.7.39 3 1.93 3 3.8v3.4A3.25 3.25 0 0 1 13.75 16H6.25A3.25 3.25 0 0 1 3 12.75v-3.4c0-1.87 1.3-3.41 3-3.8V5.5Zm4 3.5a.75.75 0 0 1 .75.75v2.1l.95.5a.75.75 0 1 1-.75 1.3l-1.5-.8A.75.75 0 0 1 9 12.25v-3A.75.75 0 0 1 9.75 8.5Zm1.75-4.5v.53c.42 0 .83.08 1.2.23A2 2 0 0 0 11.25 4h-.75Z" clipRule="evenodd" /></svg>
                                            Créer une tâche
                                        </button>
                                        {estPartenaire(user) && (
                                            <button onClick={() => { setVoirOpen(false); navigate(`${base}/demandes/${voirData.id}/devis`); }}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors">
                                                <svg className="w-4 h-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 10.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H6.75Zm0 3a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H6.75Zm0-6a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H6.75Z" clipRule="evenodd" /></svg>
                                                Ajouter un devis
                                            </button>
                                        )}
                                        <button onClick={ouvrirSignature}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                            <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="m10.577 1.332 3.811 1.132-.415 1.017-3.393-1.008V10.35L13.68 8.88l-.41-2.05 1.42-.071.716 3.579c.022.112.022.226 0 .338l-.429 2.143c-.08.403-.3.77-.62 1.032l-3.472 2.88a1.75 1.75 0 0 1-2.4 0l-3.472-2.88a1.75 1.75 0 0 1-.62-1.032l-.429-2.143a1.75 1.75 0 0 1 0-.338l.716-3.579 1.42.071-.41 2.05 3.894 1.47V2.473L8.2 3.481l-.415-1.017 3.792-1.132Z" clipRule="evenodd" /></svg>
                                            Signature électronique
                                        </button>
                                    </div>
                                </div>

                                {/* Actions bas */}
                                <div className="flex justify-end gap-2 mt-5">
                                    <button onClick={() => setVoirOpen(false)}
                                        className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Fermer</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal clôture de demande */}
            {clotureModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-xl shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" /></svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Confirmer la clôture d'un projet</h2>
                                <p className="text-sm text-slate-500">
                                    Êtes-vous sûr de vouloir clôturer le projet <span className="font-semibold text-slate-700">N° {clotureModal.reference}</span> ?
                                </p>
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-slate-700 mb-1">Motif principal <span className="text-red-500">*</span></label>
                        <select value={clotureMotif} onChange={(e) => setClotureMotif(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">— Sélectionner un motif —</option>
                            <option value="Projet finalisé">Projet finalisé</option>
                            <option value="Projet abandonné">Projet abandonné</option>
                            <option value="Projet annulé">Projet annulé</option>
                            <option value="Aucune suite à donner">Aucune suite à donner</option>
                            <option value="AUTRE">Autre...</option>
                        </select>

                        <label className="block text-sm font-medium text-slate-700 mb-1">Autres précisions</label>
                        <textarea value={cloturePrecisions} onChange={(e) => setCloturePrecisions(e.target.value)}
                            rows="3" placeholder="Précisions complémentaires (facultatif)..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setClotureModal(null); setClotureMotif(''); setCloturePrecisions(''); }}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                Annuler
                            </button>
                            <button onClick={cloturerDemande} disabled={clotureBusy}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 shadow-sm disabled:opacity-50 transition-colors">
                                {clotureBusy ? 'Clôture...' : 'Clôturer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal créer une tâche */}
            {noteModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-4xl shadow-2xl max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 5.5A3.5 3.5 0 0 1 9.5 2h1A3.5 3.5 0 0 1 14 5.5v.55c1.7.39 3 1.93 3 3.8v3.4A3.25 3.25 0 0 1 13.75 16H6.25A3.25 3.25 0 0 1 3 12.75v-3.4c0-1.87 1.3-3.41 3-3.8V5.5Zm4 3.5a.75.75 0 0 1 .75.75v2.1l.95.5a.75.75 0 1 1-.75 1.3l-1.5-.8A.75.75 0 0 1 9 12.25v-3A.75.75 0 0 1 9.75 8.5Zm1.75-4.5v.53c.42 0 .83.08 1.2.23A2 2 0 0 0 11.25 4h-.75Z" clipRule="evenodd" /></svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Nouvelle tâche</h2>
                                <p className="text-sm text-slate-500">Demande {noteModal.reference}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Réf</label>
                                <input type="text" value={taskRef} onChange={(e) => setTaskRef(e.target.value)}
                                    placeholder="Référence de la tâche"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Suivi par <span className="text-red-500">*</span></label>
                                <select value={taskSuivi} onChange={(e) => setTaskSuivi(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                                    <option value="">— Sélectionner —</option>
                                    {gestionnaires.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date début <span className="text-red-500">*</span></label>
                                <input type="date" value={taskDateDebut} onChange={(e) => setTaskDateDebut(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date fin <span className="text-red-500">*</span></label>
                                <input type="date" value={taskDateFin} onChange={(e) => setTaskDateFin(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Priorité <span className="text-red-500">*</span></label>
                                <select value={taskPriorite} onChange={(e) => setTaskPriorite(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                                    <option value="BASSE">Basse</option>
                                    <option value="MOYENNE">Moyenne</option>
                                    <option value="HAUTE">Haute</option>
                                    <option value="CRITIQUE">Critique</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Avancement (%)</label>
                                <input type="number" min="0" max="100" value={taskAvancement}
                                    onChange={(e) => setTaskAvancement(Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Temps passé (h)</label>
                                <input type="number" min="0" step="0.25" value={taskTemps}
                                    onChange={(e) => setTaskTemps(Number(e.target.value))}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type <span className="text-red-500">*</span></label>
                                <select value={taskType} onChange={(e) => setTaskType(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                                    <option value="TELEPHONE">Téléphone</option>
                                    <option value="EMAIL">Email</option>
                                    <option value="COURRIER">Courrier</option>
                                    <option value="RENDEZ_VOUS">Rendez-vous</option>
                                    <option value="RELANCE">Relance</option>
                                    <option value="AUTRE">Autre</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Objet <span className="text-red-500">*</span></label>
                                <input type="text" value={taskObjet} onChange={(e) => setTaskObjet(e.target.value)}
                                    placeholder="Objet de la tâche"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Montant</label>
                                <input type="number" min="0" step="0.01" value={taskMontant}
                                    onChange={(e) => setTaskMontant(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Statut <span className="text-red-500">*</span></label>
                                <select value={taskStatut} onChange={(e) => setTaskStatut(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                                    <option value="A_FAIRE">À faire</option>
                                    <option value="EN_COURS">En cours</option>
                                    <option value="EN_ATTENTE">En attente</option>
                                    <option value="TERMINEE">Terminée</option>
                                    <option value="ANNULEE">Annulée</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description <span className="text-red-500">*</span></label>
                                <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}
                                    rows="3" placeholder="Décrivez la tâche à réaliser..."
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"></textarea>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Documents à joindre</label>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => { e.preventDefault(); addTaskFiles(e.dataTransfer.files); }}
                                    className="border-2 border-dashed border-slate-300 rounded-lg px-4 py-6 text-center text-sm text-slate-500 hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                                    <p>Déposez vos fichiers ici...</p>
                                    <label className="mt-2 inline-block cursor-pointer text-blue-600 font-medium">
                                        ou parcourir
                                        <input type="file" multiple className="hidden" onChange={(e) => addTaskFiles(e.target.files)} />
                                    </label>
                                    {taskFiles.length > 0 && (
                                        <ul className="mt-3 text-left space-y-1">
                                            {taskFiles.map((f, i) => (
                                                <li key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-2 py-1">
                                                    <span className="truncate">{f.name}</span>
                                                    <button onClick={() => removeTaskFile(i)} className="text-red-500 hover:text-red-700 ml-2">Retirer</button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setNoteModal(null)}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                Annuler
                            </button>
                            <button onClick={submitNote} disabled={noteBusy}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors">
                                {noteBusy ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal signature électronique */}
            {sigModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[75] backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-4xl shadow-2xl max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="m10.577 1.332 3.811 1.132-.415 1.017-3.393-1.008V10.35L13.68 8.88l-.41-2.05 1.42-.071.716 3.579c.022.112.022.226 0 .338l-.429 2.143c-.08.403-.3.77-.62 1.032l-3.472 2.88a1.75 1.75 0 0 1-2.4 0l-3.472-2.88a1.75 1.75 0 0 1-.62-1.032l-.429-2.143a1.75 1.75 0 0 1 0-.338l.716-3.579 1.42.071-.41 2.05 3.894 1.47V2.473L8.2 3.481l-.415-1.017 3.792-1.132Z" clipRule="evenodd" /></svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Signature électronique</h2>
                                <p className="text-sm text-slate-500">Demande {voirData.reference}</p>
                            </div>
                        </div>

                        {/* Email */}
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input type="email" value={sigEmail} onChange={(e) => setSigEmail(e.target.value)}
                            placeholder="client@exemple.fr"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

                        {/* Mobile */}
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mobile <span className="text-red-500">*</span></label>
                        <input type="tel" value={sigMobile} onChange={(e) => setSigMobile(e.target.value)}
                            placeholder="06 12 34 56 78"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

                        {/* Message */}
                        <label className="block text-sm font-medium text-slate-700 mb-1">Message <span className="text-red-500">*</span></label>
                        <textarea value={sigMessage} onChange={(e) => setSigMessage(e.target.value)}
                            rows="3" placeholder="Message accompagnant la demande de signature..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>

                        {/* Documents sélectionnés */}
                        <label className="block text-sm font-medium text-slate-700 mb-1">Documents sélectionnés <span className="text-red-500">*</span></label>

                        {/* Bouton d'upload */}
                        <div className="space-y-2 mb-3">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 mb-1">Type de document (pour les fichiers téléversés) <span className="text-red-500">*</span></label>
                                <select value={sigDocTypeId} onChange={(e) => setSigDocTypeId(e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                                    <option value="">— Choisir un type —</option>
                                    {typesDocs.map((t) => (
                                        <option key={t.id} value={t.id}>{t.libelle}</option>
                                    ))}
                                </select>
                            </div>
                            <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 rounded-xl px-4 py-5 cursor-pointer transition-colors">
                                <svg className="w-6 h-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03l2.955-3.13v8.615Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                                <span className="text-sm font-medium text-blue-700">Téléverser des documents</span>
                                <span className="text-xs text-slate-400">Cliquez pour choisir un ou plusieurs fichiers</span>
                                <input type="file" multiple onChange={(e) => { addSigFiles(e.target.files); e.target.value = ''; }}
                                    className="hidden" />
                            </label>
                        </div>

                        {sigSelected.length === 0 && sigNewFiles.length === 0 ? (
                            <p className="text-sm text-slate-400 mb-4 border border-dashed border-slate-300 rounded-lg px-3 py-3">Aucun document sélectionné.</p>
                        ) : (
                            <div className="space-y-1.5 mb-4">
                                {/* Fichiers téléversés */}
                                {sigNewFiles.map((file, index) => (
                                    <div key={`new-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2">
                                        <span className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                                            <span className="truncate">{file.name}</span>
                                            <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} Ko</span>
                                        </span>
                                        <button type="button" onClick={() => removeSigFile(index)}
                                            className="text-slate-400 hover:text-red-500 flex-shrink-0">
                                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                                        </button>
                                    </div>
                                ))}
                                {/* Documents existants sélectionnés */}
                                {(voirData.documents || []).filter((d) => sigSelected.includes(d.id)).map((d) => (
                                    <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                        <span className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V9.621a1.5 1.5 0 0 0-.44-1.06L11.94 3.44A1.5 1.5 0 0 0 10.878 3H4.5Zm2 3.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75ZM7 10.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 10.5Zm0 3a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
                                            <span className="truncate">{d.nom_origine || d.type_document || 'Document'}</span>
                                        </span>
                                        <button type="button" onClick={() => toggleSigDoc(d.id)}
                                            className="text-slate-400 hover:text-red-500 flex-shrink-0">
                                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Documents (sélection) */}
                        <label className="block text-sm font-medium text-slate-700 mb-1">Documents <span className="text-red-500">*</span></label>
                        {(!voirData.documents || voirData.documents.length === 0) ? (
                            <p className="text-sm text-slate-400 mb-4">Aucun document disponible à joindre.</p>
                        ) : (
                            <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                                {voirData.documents.map((d) => (
                                    <label key={d.id}
                                        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="checkbox" checked={sigSelected.includes(d.id)}
                                            onChange={() => toggleSigDoc(d.id)} className="w-4 h-4 accent-blue-600 flex-shrink-0" />
                                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V9.621a1.5 1.5 0 0 0-.44-1.06L11.94 3.44A1.5 1.5 0 0 0 10.878 3H4.5Zm2 3.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75ZM7 10.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 10.5Zm0 3a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
                                        <span className="text-sm text-slate-700 truncate">{d.nom_origine || d.type_document || 'Document'}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setSigModal(false)}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                Annuler
                            </button>
                            <button onClick={submitSignature} disabled={sigBusy}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition-colors">
                                {sigBusy ? 'Envoi...' : 'Envoyer pour signature'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal suppression */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-xl shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" /></svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Supprimer la demande</h2>
                                <p className="text-sm text-slate-500">
                                    Voulez-vous vraiment supprimer la demande <span className="font-semibold text-slate-700">{deleteModal.reference}</span> ?
                                </p>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
                            Cette action est irréversible. La demande et toutes les données associées seront définitivement supprimées.
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteModal(null)}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                Annuler
                            </button>
                            <button onClick={supprimerDemande} disabled={deleteBusy}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm disabled:opacity-50 transition-colors">
                                {deleteBusy ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal modification demande */}
            {modifierData && (
                <ModifierDemande
                    demande={modifierData}
                    onClose={() => setModifierData(null)}
                    onSaved={async () => {
                        setModifierData(null);
                        reload();
                    }}
                />
            )}
        </div>
    );
}

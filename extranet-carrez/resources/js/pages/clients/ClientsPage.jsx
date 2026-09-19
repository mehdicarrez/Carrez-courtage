import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../auth';

const EMPTY = { type: 'PHYSIQUE', civilite: '', nom: '', prenom: '', date_naissance: '', raison_sociale: '', siren: '', siret: '', email: '', telephone: '', tel2: '', adresse: '', code_postal: '', ville: '', personne_a_contacter: '', email2: '', preference_contact: '', origine: '', rgpd_consentement: false, exclure_marketing: false };

export default function ClientsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');
    const [type, setType] = useState('');
    const [sort, setSort] = useState('recent');
    const [page, setPage] = useState(1);

    // Modals
    const [editor, setEditor] = useState(null); // 'create' | client object for edit
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [importReport, setImportReport] = useState(null);
    const [importBusy, setImportBusy] = useState(false);
    const [importFile, setImportFile] = useState(null);

    // Affectation de clients à des utilisateurs (accès limité)
    const [affectOpen, setAffectOpen] = useState(false);
    const [affectUsers, setAffectUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [pendingIds, setPendingIds] = useState(new Set());
    const [affectBusy, setAffectBusy] = useState(false);
    const [affectMsg, setAffectMsg] = useState('');
    const [affectType, setAffectType] = useState('');

    const load = () => {
        const params = {};
        if (q.trim()) params.q = q.trim();
        if (type) params.type = type;
        params.sort = sort;
        api.get('/clients', { params })
            .then((res) => setClients(res.data.data))
            .catch(() => setError('Erreur de chargement.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [q, type, sort]);

    useEffect(() => { setPage(1); }, [q, type, sort]);

    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(clients.length / perPage));
    const pageClients = clients.slice((page - 1) * perPage, page * perPage);

    const openCreate = () => {
        setForm(EMPTY);
        setError('');
        setEditor('create');
    };

    const openEdit = (c) => {
        setForm({
            type: c.type, civilite: c.civilite || '', nom: c.nom || '', prenom: c.prenom || '',
            date_naissance: c.date_naissance || '', raison_sociale: c.raison_sociale || '',
            siren: c.siren || '', siret: c.siret || '', email: c.email || '', telephone: c.telephone || '',
            adresse: c.adresse || '', code_postal: c.code_postal || '', ville: c.ville || '',
            personne_a_contacter: c.personne_a_contacter || c.complement?.personne_a_contacter || '',
            tel2: c.tel2 || c.complement?.tel2 || '',
            email2: c.email2 || c.complement?.email2 || '',
            preference_contact: c.preference_contact || c.complement?.preference_contact || '',
            origine: c.origine || c.complement?.origine || '',
            rgpd_consentement: c.rgpd_consentement ?? c.complement?.rgpd_consentement ?? false,
            exclure_marketing: c.exclure_marketing ?? c.complement?.exclure_marketing ?? false,
        });
        setError('');
        setEditor(c);
    };

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editor === 'create') {
                await api.post('/clients', form);
            } else {
                await api.put(`/clients/${editor.id}`, form);
            }
            setEditor(null);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'enregistrement.");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (c) => {
        if (!window.confirm(`Supprimer le client « ${c.nom_complet} » ?`)) return;
        setError('');
        try {
            await api.delete(`/clients/${c.id}`);
            load();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de suppression.");
        }
    };

    const onImport = async (e) => {
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
            load();
            setImportFile(null);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'import.");
        } finally {
            setImportBusy(false);
        }
    };

    const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const openAffectation = () => {
        setAffectMsg('');
        setSelectedUser('');
        setPendingIds(new Set());
        setAffectType('');
        api.get('/clients/affectation/utilisateurs')
            .then((res) => {
                setAffectUsers(res.data.data);
                setAffectOpen(true);
            })
            .catch(() => setError("Erreur de chargement des utilisateurs."));
    };

    const closeAffectation = () => {
        setAffectOpen(false);
        setSelectedUser('');
        setPendingIds(new Set());
        setAffectType('');
        setAffectMsg('');
    };

    const currentUser = affectUsers.find((u) => String(u.id) === String(selectedUser));

    const isOriginallyAssigned = (client) =>
        currentUser && (client.utilisateurs || []).some((u) => String(u.id) === String(currentUser.id));

    const isAssignedNg = (client) => {
        const original = isOriginallyAssigned(client);
        const pending = pendingIds.has(client.id);
        return (original && !pending) || (!original && pending);
    };

    const toggleClient = (clientId) => {
        if (!currentUser) return;
        setPendingIds((prev) => {
            const next = new Set(prev);
            if (next.has(clientId)) next.delete(clientId);
            else next.add(clientId);
            return next;
        });
    };

    const saveAffectation = async () => {
        if (!currentUser) {
            setAffectMsg('Sélectionnez un utilisateur.');
            return;
        }
        setAffectBusy(true);
        setAffectMsg('');
        try {
            await api.put(`/clients/affectation/utilisateurs/${currentUser.id}`, {
                client_ids: [...pendingIds],
            });
            setAffectMsg('Affectation enregistrée.');
            setPendingIds(new Set());
            load();
        } catch (err) {
            setAffectMsg(err.response?.data?.message || "Erreur d'enregistrement.");
        } finally {
            setAffectBusy(false);
        }
    };

    return (
        <div>
            <div className="anim-in relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-50/60 p-6 mb-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            <span style={{ color: 'oklch(0.52 0.21 27.14)' }}>Répertoire</span>{' '}
                            <span style={{ color: 'oklch(0.39 0.21 263.59)' }}>des clients</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-deep-blue" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                            </svg>
                            Répertoire de tous vos clients et leurs informations de contact.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setImportOpen(true)}
                            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                            Importer des clients
                        </button>
                        <button onClick={openAffectation}
                            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
                            Affecter des clients
                        </button>
                        <button onClick={openCreate}
                            className="inline-flex items-center gap-2 bg-deep-blue hover:bg-deep-blue-dark text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm shadow-deep-blue/20 hover:shadow-md hover:shadow-deep-blue/25 hover:-translate-y-0.5 transition-all duration-200">
                            + Nouveau client
                        </button>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-gradient-to-b from-slate-50 to-slate-50/60 border border-slate-200 rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center text-sm shadow-sm">
                <input value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher (nom, email, siren, ville)..."
                    className="border border-slate-300 rounded-lg px-3 py-2 w-72 focus:ring-2 focus:ring-deep-blue focus:border-deep-blue outline-none transition-shadow" />
                <select value={type} onChange={(e) => setType(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-deep-blue outline-none">
                    <option value="">Tous les types</option>
                    <option value="PHYSIQUE">Physique</option>
                    <option value="MORALE">Morale</option>
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-deep-blue outline-none">
                    <option value="recent">Plus récents</option>
                    <option value="nom">Ordre alphabétique</option>
                </select>
                <span className="ml-auto text-xs text-slate-400">{clients.length} client(s)</span>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            {importOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-md my-12">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500"></div>
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-deep-blue">Importer des clients</h3>
                                <p className="text-xs text-slate-500">CSV (séparateur ; ou ,)</p>
                            </div>
                            <button
                                onClick={() => { setImportOpen(false); setImportReport(null); setImportFile(null); }}
                                className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-deep-blue-soft hover:text-deep-blue hover:rotate-90 active:scale-90"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">
                        <form onSubmit={onImport}>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center mb-4">
                                <input type="file" accept=".csv,.txt"
                                    onChange={(e) => setImportFile(e.target.files[0] || null)}
                                    className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-deep-blue-soft file:text-deep-blue hover:file:bg-deep-blue-soft" />
                            </div>
                            <p className="text-xs text-slate-400 mb-4">
                                Colonnes acceptées : type, civilite, nom, prenom, date_naissance, raison_sociale, siren, siret, email, telephone, adresse, code_postal, ville.
                            </p>
                            {importReport && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 mb-4">
                                    <span className="font-semibold">{importReport.crees}</span> client(s) importé(s)
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
                                </div>
                            )}
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => { setImportOpen(false); setImportReport(null); setImportFile(null); }}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Fermer</button>
                                <button type="submit" disabled={!importFile || importBusy}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-deep-blue text-white hover:bg-deep-blue-dark shadow-sm disabled:opacity-50 transition-colors">
                                    {importBusy ? 'Import...' : 'Importer'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}

            {affectOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-4xl my-8">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500"></div>
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-deep-blue">Affecter des clients</h2>
                                <p className="text-xs text-slate-500">Affectation et visibilité des données</p>
                            </div>
                            <button onClick={closeAffectation} className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-deep-blue-soft hover:text-deep-blue hover:rotate-90 active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">

                        <div className="bg-deep-blue-soft border border-deep-blue/15 rounded-lg p-4 text-sm text-slate-700 mb-4 space-y-2">
                            <p className="font-semibold text-deep-blue">Affectation et visibilité des données</p>
                            <p>En affectant un client (ou projet) à un utilisateur, vous lui donnez accès à ses informations. Cette fonctionnalité concerne uniquement les utilisateurs dont l'accès est défini sur « Limité aux clients attribués ».</p>
                            <p>Si aucun utilisateur n'apparaît dans la liste, vérifiez que des utilisateurs sont bien configurés avec cet accès dans la page Utilisateurs &amp; Rôles (selon vos droits d'accès).</p>
                            <p>Les utilisateurs avec un accès limité ne verront que les clients qui leur sont affectés. Pensez à gérer les affectations et les paramètres d'accès pour garantir la bonne visibilité des données.</p>
                        </div>

                        {affectUsers.length === 0 ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-4">
                                Aucun utilisateur avec un accès « Limité aux clients attribués » n'a été trouvé. Configurez cet accès dans la page Utilisateurs &amp; Rôles.
                            </div>
                        ) : (
                            <div className="mb-4 flex items-center gap-3">
                                <label className="text-sm font-medium text-slate-700">Type de client :</label>
                                <select
                                    value={affectType}
                                    onChange={(e) => setAffectType(e.target.value)}
                                    className="border border-slate-300 rounded px-2 py-1 text-sm"
                                >
                                    <option value="">Tous</option>
                                    <option value="PHYSIQUE">Physique</option>
                                    <option value="MORALE">Morale</option>
                                </select>
                            </div>
                        )}

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-4">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="px-5 py-3">Nom</th>
                                        <th className="px-5 py-3">CP Ville</th>
                                        <th className="px-5 py-3">Contrats actifs</th>
                                        <th className="px-5 py-3">Primes</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Affecté à</th>
                                        {currentUser && <th className="px-5 py-3 text-right">Sélection</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.filter((c) => !affectType || c.type === affectType).map((c) => (
                                        <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                                            <td className="px-5 py-3 font-medium text-slate-900">{c.nom_complet}</td>
                                            <td className="px-5 py-3 text-xs text-slate-500">{[c.code_postal, c.ville].filter(Boolean).join(' ') || '—'}</td>
                                            <td className="px-5 py-3 text-xs text-slate-600">{c.contrats_actifs ?? 0}</td>
                                            <td className="px-5 py-3 text-xs text-slate-600">{(c.primes_total ?? 0).toLocaleString('fr-FR')} €</td>
                                            <td className="px-5 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === 'MORALE' ? 'bg-purple-50 text-purple-700' : 'bg-deep-blue-soft text-deep-blue'}`}>
                                                    {c.type === 'MORALE' ? 'Personne morale' : 'Personne physique'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                {currentUser ? (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isAssignedNg(c) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {isAssignedNg(c) ? 'Affecté' : 'Non affecté'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-500">
                                                        {(c.utilisateurs || []).map((u) => u.name).join(', ') || 'Non affecté'}
                                                    </span>
                                                )}
                                            </td>
                                            {currentUser && (
                                                <td className="px-5 py-3 text-right">
                                                    <button
                                                        onClick={() => toggleClient(c.id)}
                                                        className={`text-xs font-medium px-3 py-1 rounded-lg border transition-colors ${
                                                            isAssignedNg(c)
                                                                ? 'bg-deep-blue border-deep-blue text-white hover:bg-deep-blue-dark'
                                                                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {isAssignedNg(c) ? 'Affecter' : 'Retirer'}
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {!loading && clients.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                                                Aucun client trouvé.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-slate-700">Affecter à :</label>
                                <select
                                    value={selectedUser}
                                    onChange={(e) => { setSelectedUser(e.target.value); setPendingIds(new Set()); }}
                                    className="border border-slate-300 rounded px-2 py-1.5 text-sm min-w-52"
                                >
                                    <option value="">Choisir un conseiller...</option>
                                    {affectUsers.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            {affectMsg && <span className={`text-xs ${affectMsg.includes('enregistrée') ? 'text-emerald-600' : 'text-red-600'}`}>{affectMsg}</span>}
                            {currentUser && pendingIds.size > 0 && (
                                <span className="text-xs text-slate-500">{pendingIds.size} modification(s)</span>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={closeAffectation}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Fermer</button>
                            <button onClick={saveAffectation} disabled={affectBusy || !currentUser}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-deep-blue text-white hover:bg-deep-blue-dark shadow-sm disabled:opacity-50 transition-colors">
                                {affectBusy ? 'Enregistrement...' : 'Enregistrer l\'affectation'}
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            )}

            {loading && <div className="text-slate-500">Chargement...</div>}

            {!loading && clients.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                    Aucun client. Lancez un import CSV ou créez un client.
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-5 py-3">Client</th>
                            <th className="px-5 py-3">Type</th>
                            <th className="px-5 py-3">Contact</th>
                            <th className="px-5 py-3">Localisation</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageClients.map((c) => (
                            <tr key={c.id} onClick={() => { navigate(`/clients/${c.id}`); setError(''); }}
                                className="group border-b border-slate-100 hover:bg-slate-100 hover:shadow-sm transition-all duration-150 cursor-pointer">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${c.type === 'MORALE' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-deep-blue to-deep-blue-dark'}`}>
                                            {c.nom_complet?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{c.nom_complet}</div>
                                            {c.raison_sociale && <div className="text-xs text-slate-400">{c.raison_sociale}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset whitespace-nowrap transition-transform group-hover:scale-105 ${c.type === 'MORALE' ? 'bg-purple-50 text-purple-700 ring-purple-200' : 'bg-deep-blue-soft text-deep-blue ring-deep-blue/20'}`}>
                                        {c.type === 'MORALE' ? 'Morale' : 'Physique'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-slate-600">
                                    {c.email && <div className="text-xs">{c.email}</div>}
                                    {c.telephone && <div className="text-xs text-slate-400">{c.telephone}</div>}
                                </td>
                                <td className="px-5 py-3 text-xs text-slate-500">
                                    {[c.code_postal, c.ville].filter(Boolean).join(' ') || '—'}
                                </td>
                                <td className="px-5 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => { navigate(`/clients/${c.id}`); setError(''); }}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-deep-blue hover:text-deep-blue-dark transition-all duration-150 group-hover:gap-1.5 cursor-pointer"
                                    >
                                        Voir
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.6 10 7.3 5.7a1 1 0 0 1 0-1.4Z" clipRule="evenodd" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/50">
                        <span className="text-xs text-slate-500">
                            Page <span className="font-semibold text-slate-700">{page}</span> sur{' '}
                            <span className="font-semibold text-slate-700">{totalPages}</span>
                            {' · '}{clients.length} client{clients.length > 1 ? 's' : ''} au total
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg text-slate-500 hover:text-deep-blue hover:bg-deep-blue-soft disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all duration-150"
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
                                                    ? 'bg-deep-blue text-white shadow-sm scale-105'
                                                    : 'text-slate-600 hover:bg-deep-blue-soft hover:text-deep-blue'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg text-slate-500 hover:text-deep-blue hover:bg-deep-blue-soft disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-all duration-150"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.08-1.04l4.25 4.5a.75.75 0 0 1 0 1.08l-4.25 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal create/edit */}
            {editor && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-4xl my-8">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500"></div>
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-deep-blue">{editor === 'create' ? 'Nouveau client' : `Modifier : ${editor.nom_complet}`}</h2>
                            <button onClick={() => { setEditor(null); setError(''); }} className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-deep-blue-soft hover:text-deep-blue hover:rotate-90 active:scale-90">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">

                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                        <form onSubmit={save}>
                            <div className="flex gap-2 mb-4">
                                <button type="button" onClick={() => setForm({ ...form, type: 'PHYSIQUE' })}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'PHYSIQUE' ? 'bg-deep-blue border-deep-blue text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                                    Personne physique
                                </button>
                                <button type="button" onClick={() => setForm({ ...form, type: 'MORALE' })}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'MORALE' ? 'bg-[oklch(0.52_0.21_27.14)] border-[oklch(0.52_0.21_27.14)] text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                                    Personne morale
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {form.type === 'PHYSIQUE' ? (
                                    <>
                                        <Field label="Civilité" value={form.civilite} onChange={setF('civilite')} placeholder="M., Mme" small />
                                        <Field label="Prénom" value={form.prenom} onChange={setF('prenom')} required small />
                                        <Field label="Nom" value={form.nom} onChange={setF('nom')} required small />
                                        <Field label="Date de naissance" type="date" value={form.date_naissance} onChange={setF('date_naissance')} small />
                                    </>
                                ) : (
                                    <>
                                        <div className="col-span-2">
                                            <Field label="Raison sociale" value={form.raison_sociale} onChange={setF('raison_sociale')} required />
                                        </div>
                                        <Field label="SIREN" value={form.siren} onChange={setF('siren')} small />
                                        <Field label="SIRET" value={form.siret} onChange={setF('siret')} small />
                                    </>
                                )}
                                <div className="col-span-2">
                                    <Field label="Personne à contacter" value={form.personne_a_contacter} onChange={setF('personne_a_contacter')} />
                                </div>
                                <div className="col-span-2">
                                    <Field label="Adresse" value={form.adresse} onChange={setF('adresse')} required />
                                </div>
                                <Field label="Code postal" value={form.code_postal} onChange={setF('code_postal')} required small />
                                <Field label="Ville" value={form.ville} onChange={setF('ville')} required small />
                                <Field label="Tél" value={form.telephone} onChange={setF('telephone')} required />
                                <Field label="Tél 2" value={form.tel2} onChange={setF('tel2')} />
                                <Field label="Email" type="email" value={form.email} onChange={setF('email')} />
                                <Field label="Email 2" type="email" value={form.email2} onChange={setF('email2')} />

                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Préférence de contact</span>
                                        <select value={form.preference_contact} onChange={setF('preference_contact')}
                                            className="field-line">
                                            <option value="">Choisir...</option>
                                            <option value="Téléphone">Téléphone</option>
                                            <option value="SMS">SMS</option>
                                            <option value="WhatsApp">WhatsApp</option>
                                            <option value="Email">Email</option>
                                            <option value="Courrier">Courrier</option>
                                        </select>
                                    </label>
                                </div>
                                <div>
                                    <label className="block">
                                        <span className="block text-sm font-medium text-blue-800 mb-1">Origine <span className="text-red-500"> *</span></span>
                                        <select value={form.origine} onChange={setF('origine')} required
                                            className="field-line">
                                            <option value="">Choisir...</option>
                                            <option value="PARRAINAGE">Parrainage</option>
                                            <option value="PROSPECTION">Prospection</option>
                                            <option value="INTERNET">Internet</option>
                                            <option value="PARTENAIRE">Partenaire</option>
                                            <option value="AUTRE">Autre</option>
                                        </select>
                                    </label>
                                </div>

                                <div className="col-span-2 space-y-2 mt-1">
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!!form.rgpd_consentement}
                                            onChange={(e) => setForm({ ...form, rgpd_consentement: e.target.checked })}
                                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-deep-blue focus:ring-deep-blue" />
                                        <span className="text-sm text-slate-700">Consentement RGPD</span>
                                    </label>
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!!form.exclure_marketing}
                                            onChange={(e) => setForm({ ...form, exclure_marketing: e.target.checked })}
                                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-deep-blue focus:ring-deep-blue" />
                                        <span className="text-sm text-slate-700">Exclure des opérations de communication et marketing</span>
                                    </label>
                                </div>
                            </div>

                                <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => { setEditor(null); setError(''); }}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Annuler</button>
                                <button type="submit" disabled={saving}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-deep-blue text-white hover:bg-deep-blue-dark shadow-sm disabled:opacity-50 transition-colors">
                                    {saving ? 'Enregistrement...' : editor === 'create' ? 'Créer le client' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, type = 'text', required, small }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-blue-800 mb-1">{label}{required && <span className="text-red-500"> *</span>}</span>
            <input type={type} value={value} onChange={onChange} required={required}
                className="field-line" />
        </label>
    );
}

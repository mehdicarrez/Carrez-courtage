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
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-slate-900">Répertoire clients</h1>
                <div className="flex gap-2">
                    <button onClick={() => setImportOpen(true)}
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                        Importer des clients
                    </button>
                    <button onClick={openAffectation}
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                        Affecter des clients
                    </button>
                    <button onClick={openCreate}
                        className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors">
                        + Nouveau client
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 flex flex-wrap gap-2 items-center text-sm">
                <input value={q} onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher (nom, email, siren, ville)..."
                    className="border border-slate-300 rounded px-2 py-1 w-72" />
                <select value={type} onChange={(e) => setType(e.target.value)} className="border border-slate-300 rounded px-2 py-1">
                    <option value="">Tous les types</option>
                    <option value="PHYSIQUE">Physique</option>
                    <option value="MORALE">Morale</option>
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-slate-300 rounded px-2 py-1">
                    <option value="recent">Plus récents</option>
                    <option value="nom">Ordre alphabétique</option>
                </select>
                <span className="ml-auto text-xs text-slate-400">{clients.length} client(s)</span>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            {importOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-lg shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path d="M3.5 2.75a2 2 0 0 1 2-2H11a.75.75 0 0 1 .53.22l3.25 3.25a.75.75 0 0 1 .22.53v11a2 2 0 0 1-2 2h-7.5a2 2 0 0 1-2-2v-13Z" /></svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Importer des clients</h2>
                                <p className="text-sm text-slate-500">CSV (séparateur ; ou ,)</p>
                            </div>
                        </div>
                        <form onSubmit={onImport}>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center mb-4">
                                <input type="file" accept=".csv,.txt"
                                    onChange={(e) => setImportFile(e.target.files[0] || null)}
                                    className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
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
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors">
                                    {importBusy ? 'Import...' : 'Importer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {affectOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-4xl shadow-2xl my-4 max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Affecter des clients</h2>
                                <p className="text-xs text-slate-400">Affectation et visibilité des données</p>
                            </div>
                            <button onClick={closeAffectation} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-slate-700 mb-4 space-y-2">
                            <p className="font-semibold text-blue-900">Affectation et visibilité des données</p>
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
                                        <th className="px-4 py-3">Nom</th>
                                        <th className="px-4 py-3">CP Ville</th>
                                        <th className="px-4 py-3">Contrats actifs</th>
                                        <th className="px-4 py-3">Primes</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Affecté à</th>
                                        {currentUser && <th className="px-4 py-3 text-right">Sélection</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.filter((c) => !affectType || c.type === affectType).map((c) => (
                                        <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900">{c.nom_complet}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{[c.code_postal, c.ville].filter(Boolean).join(' ') || '—'}</td>
                                            <td className="px-4 py-3 text-xs text-slate-600">{c.contrats_actifs ?? 0}</td>
                                            <td className="px-4 py-3 text-xs text-slate-600">{(c.primes_total ?? 0).toLocaleString('fr-FR')} €</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === 'MORALE' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {c.type === 'MORALE' ? 'Personne morale' : 'Personne physique'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
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
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => toggleClient(c.id)}
                                                        className={`text-xs font-medium px-3 py-1 rounded-lg border transition-colors ${
                                                            isAssignedNg(c)
                                                                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
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
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors">
                                {affectBusy ? 'Enregistrement...' : 'Enregistrer l\'affectation'}
                            </button>
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
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Localisation</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((c) => (
                            <tr key={c.id} onClick={() => { navigate(`/clients/${c.id}`); setError(''); }}
                                className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${c.type === 'MORALE' ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
                                            {c.nom_complet?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900">{c.nom_complet}</div>
                                            {c.raison_sociale && <div className="text-xs text-slate-400">{c.raison_sociale}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === 'MORALE' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                        {c.type === 'MORALE' ? 'Morale' : 'Physique'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                    {c.email && <div className="text-xs">{c.email}</div>}
                                    {c.telephone && <div className="text-xs text-slate-400">{c.telephone}</div>}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                    {[c.code_postal, c.ville].filter(Boolean).join(' ') || '—'}
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                        Détails
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.6 10 7.3 5.7a1 1 0 0 1 0-1.4Z" clipRule="evenodd" /></svg>
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal create/edit */}
            {editor && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-4xl shadow-2xl my-4 max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">{editor === 'create' ? 'Nouveau client' : `Modifier : ${editor.nom_complet}`}</h2>
                            <button onClick={() => { setEditor(null); setError(''); }} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                        </div>

                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                        <form onSubmit={save}>
                            <div className="flex gap-2 mb-4">
                                <button type="button" onClick={() => setForm({ ...form, type: 'PHYSIQUE' })}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'PHYSIQUE' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                                    Personne physique
                                </button>
                                <button type="button" onClick={() => setForm({ ...form, type: 'MORALE' })}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'MORALE' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
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
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Préférence de contact</span>
                                        <select value={form.preference_contact} onChange={setF('preference_contact')}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Origine <span className="text-red-500"> *</span></span>
                                        <select value={form.origine} onChange={setF('origine')} required
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
                                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-slate-700">Consentement RGPD</span>
                                    </label>
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!!form.exclure_marketing}
                                            onChange={(e) => setForm({ ...form, exclure_marketing: e.target.checked })}
                                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-slate-700">Exclure des opérations de communication et marketing</span>
                                    </label>
                                </div>
                            </div>

                                <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => { setEditor(null); setError(''); }}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Annuler</button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors">
                                    {saving ? 'Enregistrement...' : editor === 'create' ? 'Créer le client' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, type = 'text', required, small }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</span>
            <input type={type} value={value} onChange={onChange} required={required}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </label>
    );
}

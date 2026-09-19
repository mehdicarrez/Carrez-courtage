import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth, estPartenaire } from '../../auth';

const STATUT_LABELS = {
    EN_CONSTITUTION: 'En constitution',
    EN_ATTENTE_SIGNATURE: 'En attente signature',
    SIGNE: 'Signé',
    EN_ATTENTE_EMISSION: 'En attente émission',
    EN_VIGUEUR: 'En vigueur',
    IMPAYE: 'Impayé',
    SUSPENDU: 'Suspendu',
    RESILIE: 'Résilié',
    SANS_EFFET: 'Sans effet',
    EXPIRE: 'Expiré',
    REGLE: 'Réglé',
    NON_REGLE: 'Non réglé',
};

const STATUT_CLS = {
    EN_CONSTITUTION: 'bg-slate-100 text-slate-600',
    EN_ATTENTE_SIGNATURE: 'bg-amber-50 text-amber-700',
    SIGNE: 'bg-blue-50 text-blue-700',
    EN_ATTENTE_EMISSION: 'bg-indigo-50 text-indigo-700',
    EN_VIGUEUR: 'bg-emerald-50 text-emerald-700',
    IMPAYE: 'bg-red-50 text-red-700',
    SUSPENDU: 'bg-orange-50 text-orange-700',
    RESILIE: 'bg-slate-100 text-slate-500',
    SANS_EFFET: 'bg-gray-100 text-gray-500',
    EXPIRE: 'bg-purple-50 text-purple-700',
    REGLE: 'bg-emerald-50 text-emerald-700',
    NON_REGLE: 'bg-rose-50 text-rose-700',
};

const EMPTY = { type: 'PHYSIQUE', civilite: '', nom: '', prenom: '', raison_sociale: '', siren: '', siret: '', forme_juridique: '', personne_a_contacter: '', adresse: '', code_postal: '', ville: '', telephone: '', tel2: '', email: '', email2: '', preference_contact: '', origine: '', rgpd_consentement: false, exclure_marketing: false };

const ORIGINES = ['PARRAINAGE', 'PROSPECTION', 'INTERNET', 'PARTENAIRE', 'AUTRE'];
const PREFERENCES = ['Téléphone', 'SMS', 'WhatsApp', 'Email', 'Courrier'];
const FORMES_JURIDIQUES = ['Coopérative', 'SARL', 'SAS', 'SA', 'EURL', 'SCI', 'Association', 'Auto-entrepreneur', 'Autre'];

export default function ContratsList() {
    const { user } = useAuth();
    const estCabinet = ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user?.role);
    const base = estPartenaire(user) ? '/espace-partenaire' : '';
    const [contrats, setContrats] = useState([]);
    const [enSouscription, setEnSouscription] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editor, setEditor] = useState(false);
    const [etape, setEtape] = useState(1);
    const [clients, setClients] = useState([]);
    const [clientId, setClientId] = useState('');
    const [form, setForm] = useState(EMPTY);
    const [grossistes, setGrossistes] = useState([]);
    const [grossisteId, setGrossisteId] = useState('');
    const [produits, setProduits] = useState([]);
    const [produitId, setProduitId] = useState('');
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(1);

    const charger = (souscription) => {
        setLoading(true);
        setPage(1);
        api.get('/contrats', { params: souscription ? { en_souscription: 1 } : {} })
            .then((res) => setContrats(res.data.data))
            .catch(() => setError('Erreur de chargement.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        charger(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleSouscription = () => {
        const next = !enSouscription;
        setEnSouscription(next);
        charger(next);
    };

    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(contrats.length / perPage));
    const pageContrats = contrats.slice((page - 1) * perPage, page * perPage);

    const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const openCreate = () => {
        setError('');
        setEtape(1);
        setClientId('');
        setForm(EMPTY);
        setGrossisteId('');
        setProduitId('');
        setEditor(true);
        api.get('/clients', { params: { per_page: 100 } })
            .then((res) => setClients(res.data.data))
            .catch(() => {});
        api.get('/grossistes')
            .then((res) => setGrossistes(res.data.data))
            .catch(() => {});
        api.get('/produits')
            .then((res) => setProduits(res.data.data))
            .catch(() => {});
    };

    const onSelectClient = (e) => {
        const id = e.target.value;
        setClientId(id);
        const c = clients.find((x) => String(x.id) === String(id));
        if (c) {
            setForm({
                type: c.type || 'PHYSIQUE',
                civilite: c.civilite || '',
                nom: c.nom || '',
                prenom: c.prenom || '',
                raison_sociale: c.raison_sociale || '',
                siren: c.siren || '',
                siret: c.siret || '',
                forme_juridique: c.forme_juridique || '',
                personne_a_contacter: c.personne_a_contacter || '',
                adresse: c.adresse || '',
                code_postal: c.code_postal || '',
                ville: c.ville || '',
                telephone: c.telephone || '',
                tel2: c.tel2 || '',
                email: c.email || '',
                email2: c.email2 || '',
                preference_contact: c.preference_contact || '',
                origine: c.origine || '',
                rgpd_consentement: !!c.rgpd_consentement,
                exclure_marketing: !!c.exclure_marketing,
            });
        }
    };

    const valider = () => {
        if (!clientId) {
            setError('Sélectionnez un client.');
            return;
        }
        setError('');
        setEtape(2);
    };

    const creer = async (e) => {
        e.preventDefault();
        if (!grossisteId) {
            setError("Sélectionnez l'assurance.");
            return;
        }
        setSaving(true);
        setError('');
        try {
            await api.put(`/clients/${clientId}`, { ...form });
            await api.post('/contrats', { client_id: clientId, grossiste_id: grossisteId, produit_id: produitId || null });
            setEditor(false);
            charger(enSouscription);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de la création du contrat.");
        } finally {
            setSaving(false);
        }
    };

    const fmtMontant = (cts) => (cts != null ? `${(cts / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—');

    return (
        <div>
            <div className="anim-in relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-50/60 p-6 mb-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            <span style={{ color: 'oklch(0.52 0.21 27.14)' }}>Mes</span>{' '}
                            <span style={{ color: 'oklch(0.39 0.21 263.59)' }}>contrats</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-deep-blue" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                            </svg>
                            Suivi de vos contrats et de leurs échéances.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {estCabinet && (
                            <button
                                onClick={toggleSouscription}
                                className={`text-sm px-3 py-1.5 rounded border transition-colors ${
                                    enSouscription
                                        ? 'bg-deep-blue border-deep-blue text-white'
                                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                En souscription
                            </button>
                        )}
                        {estCabinet && (
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg bg-deep-blue hover:bg-deep-blue-dark text-white shadow-sm shadow-deep-blue/20 hover:shadow-md hover:shadow-deep-blue/25 hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Ajouter un contrat
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
            {loading && <div className="text-slate-500">Chargement...</div>}
            {!loading && contrats.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
                    {enSouscription ? 'Aucun contrat en souscription.' : 'Aucun contrat.'}
                </div>
            )}

            {!loading && contrats.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
                                <th className="px-4 py-3 font-semibold">ID</th>
                                <th className="px-4 py-3 font-semibold">Client</th>
                                <th className="px-4 py-3 font-semibold">Origine</th>
                                <th className="px-4 py-3 font-semibold">Produit</th>
                                <th className="px-4 py-3 font-semibold">Fournisseur</th>
                                <th className="px-4 py-3 font-semibold">État contrat</th>
                                <th className="px-4 py-3 font-semibold">N° contrat</th>
                                <th className="px-4 py-3 font-semibold text-right">Prime</th>
                                <th className="px-4 py-3 font-semibold">Échéance</th>
                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageContrats.map((c) => (
                                <tr key={c.id} className="group border-b border-slate-100 hover:bg-slate-100 hover:shadow-sm transition-all duration-150">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-400" title={c.id}>
                                            {c.id?.slice(0, 8)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{c.client || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{c.origine || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{c.produit || '—'}</td>
                                        <td className="px-4 py-3 text-slate-600">{c.fournisseur || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUT_CLS[c.statut] || 'bg-slate-100 text-slate-600'}`}>
                                                {STATUT_LABELS[c.statut] || c.statut}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{c.numero_police || c.reference || '—'}</td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-900">{fmtMontant(c.prime_ttc_cts)}</td>
                                        <td className="px-4 py-3 text-slate-600">{c.date_echeance_principale || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                to={`${base}/contrats/${c.id}`}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-deep-blue bg-deep-blue-soft border border-deep-blue/25 px-2.5 py-1 rounded-lg hover:bg-deep-blue-soft/80"
                                            >
                                                Ouvrir
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                            <span className="text-xs text-slate-500">
                                Page <span className="font-semibold text-slate-700">{page}</span> sur{' '}
                                <span className="font-semibold text-slate-700">{totalPages}</span>
                                {' · '}{contrats.length} contrat{contrats.length > 1 ? 's' : ''} au total
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
            )}

            {editor && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-4xl shadow-2xl my-4 max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Nouveau contrat</h2>
                            <button onClick={() => { setEditor(false); setError(''); }} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                        </div>

                        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                        {etape === 1 && (
                            <div>
                                <div className="mb-4">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Sélectionner un client <span className="text-red-500">*</span></span>
                                        <select value={clientId} onChange={onSelectClient}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue">
                                            <option value="">— Choisir un client —</option>
                                            {clients.map((c) => (
                                                <option key={c.id} value={c.id}>{c.nom_complet}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                {clientId && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="col-span-2">
                                            <Field label="Prospect / client" value={form.type === 'MORALE' ? form.raison_sociale : form.nom}
                                                onChange={(e) => setForm({ ...form, [form.type === 'MORALE' ? 'raison_sociale' : 'nom']: e.target.value })} placeholder="test test" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block">
                                                <span className="block text-sm font-medium text-slate-700 mb-1">Type <span className="text-red-500">*</span></span>
                                                <select value={form.type} onChange={setF('type')}
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue">
                                                    <option value="PHYSIQUE">Personne physique</option>
                                                    <option value="MORALE">Personne morale</option>
                                                </select>
                                            </label>
                                        </div>
                                        {form.type === 'PHYSIQUE' ? (
                                            <>
                                                <Field label="Civilité" value={form.civilite} onChange={setF('civilite')} placeholder="M., Mme" small />
                                                <Field label="Prénom" value={form.prenom} onChange={setF('prenom')} small />
                                            </>
                                        ) : (
                                            <>
                                                <div className="col-span-2">
                                                    <Field label="Raison sociale" value={form.raison_sociale} onChange={setF('raison_sociale')} />
                                                </div>
                                                <Field label="SIREN" value={form.siren} onChange={setF('siren')} small />
                                                <Field label="SIRET" value={form.siret} onChange={setF('siret')} small />
                                                <div className="col-span-2">
                                                    <label className="block">
                                                        <span className="block text-sm font-medium text-slate-700 mb-1">Forme juridique de l'entreprise</span>
                                                        <select value={form.forme_juridique} onChange={setF('forme_juridique')}
                                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue">
                                                            <option value="">Choisir...</option>
                                                            {FORMES_JURIDIQUES.map((f) => <option key={f} value={f}>{f}</option>)}
                                                        </select>
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                        <div className="col-span-2">
                                            <Field label="Personne à contacter" value={form.personne_a_contacter} onChange={setF('personne_a_contacter')} />
                                        </div>
                                        <div className="col-span-2">
                                            <Field label="Adresse" value={form.adresse} onChange={setF('adresse')} />
                                        </div>
                                        <Field label="Code postal" value={form.code_postal} onChange={setF('code_postal')} placeholder="19200" small />
                                        <Field label="Ville" value={form.ville} onChange={setF('ville')} small />
                                        <Field label="Tél" value={form.telephone} onChange={setF('telephone')} />
                                        <Field label="Tél 2" value={form.tel2} onChange={setF('tel2')} />
                                        <Field label="Email" type="email" value={form.email} onChange={setF('email')} />
                                        <Field label="Email 2" type="email" value={form.email2} onChange={setF('email2')} />
                                        <div>
                                            <label className="block">
                                                <span className="block text-sm font-medium text-slate-700 mb-1">Préférence de contact</span>
                                                <select value={form.preference_contact} onChange={setF('preference_contact')}
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue">
                                                    <option value="">Choisir...</option>
                                                    {PREFERENCES.map((p) => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block">
                                                <span className="block text-sm font-medium text-slate-700 mb-1">Origine <span className="text-red-500">*</span></span>
                                                <select value={form.origine} onChange={setF('origine')}
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue">
                                                    <option value="">Choisir...</option>
                                                    {ORIGINES.map((o) => <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>)}
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
                                )}

                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => { setEditor(false); setError(''); }}
                                        className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Annuler</button>
                                    <button type="button" onClick={valider} disabled={!clientId}
                                        className="px-5 py-2.5 rounded-lg text-sm font-medium bg-deep-blue text-white hover:bg-deep-blue-dark shadow-sm disabled:opacity-50 transition-colors">
                                        Valider
                                    </button>
                                </div>
                            </div>
                        )}

                        {etape === 2 && (
                            <div>
                                <div className="mb-4">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Assurance <span className="text-red-500">*</span></span>
                                        <select value={grossisteId} onChange={(e) => setGrossisteId(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue">
                                            <option value="">— Choisir l'assurance —</option>
                                            {grossistes.map((g) => (
                                                <option key={g.id} value={g.id}>{g.nom}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="mb-4">
                                    <label className="block">
                                        <span className="block text-sm font-medium text-slate-700 mb-1">Produit</span>
                                        <select value={produitId} onChange={(e) => setProduitId(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue">
                                            <option value="">— Choisir le produit —</option>
                                            {produits.map((g) => (
                                                <optgroup key={g.categorie} label={g.categorie}>
                                                    {g.produits.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.nom}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="flex justify-between gap-2 mt-4">
                                    <button type="button" onClick={() => { setError(''); setEtape(1); }}
                                        className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Retour</button>
                                    <button type="button" onClick={creer} disabled={saving || !grossisteId}
                                        className="px-5 py-2.5 rounded-lg text-sm font-medium bg-deep-blue text-white hover:bg-deep-blue-dark shadow-sm disabled:opacity-50 transition-colors">
                                        {saving ? 'Création...' : 'Créer le contrat'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, type = 'text', required, small, placeholder, disabled }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</span>
            <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-deep-blue focus:border-deep-blue ${disabled ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-slate-300'}`} />
        </label>
    );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';

function StatCard({ label, value, icon, accent }) {
    const accents = {
        blue: 'from-blue-600 to-blue-700 shadow-blue-600/30',
        red: 'from-red-500 to-red-700 shadow-red-500/30',
        indigo: 'from-indigo-600 to-indigo-700 shadow-indigo-600/30',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
        amber: 'from-amber-500 to-orange-600 shadow-amber-500/30',
        violet: 'from-violet-600 to-purple-700 shadow-violet-600/30',
        slate: 'from-slate-700 to-slate-900 shadow-slate-700/30',
    };
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br p-px shadow-sm">
            <div className={`rounded-2xl bg-gradient-to-br p-5 text-white ${accents[accent] || accents.blue}`}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-white/80">{label}</span>
                    <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/20">{icon}</span>
                </div>
                <div className="mt-3 text-3xl font-extrabold">{value}</div>
            </div>
        </div>
    );
}

function PanelCard({ title, icon, accent, badge, children, footerLink, footerLabel, empty }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <span className={`h-9 w-9 flex items-center justify-center rounded-xl text-white ${accent}`}>{icon}</span>
                    <div>
                        <div className="font-semibold text-slate-900">{title}</div>
                        {badge != null && (
                            <div className="text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                    {badge} élément{badge > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 px-2 py-2">
                {isEmpty(children) && (
                    <div className="px-3 py-8 text-center text-sm text-slate-400">
                        <div className="text-2xl mb-2">{empty || '✓'}</div>
                        Rien à signaler
                    </div>
                )}
                {children}
            </div>
            {footerLink && (
                <div className="px-4 py-3 border-t border-gray-100">
                    <Link to={footerLink} className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                        {footerLabel || 'Voir tout'}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </div>
            )}
        </div>
    );
}

function isEmpty(children) {
    if (Array.isArray(children)) return children.length === 0;
    return !children;
}

function BadgeStatut({ statut }) {
    const map = {
        SOUMISE: 'bg-blue-50 text-blue-700 border-blue-200',
        EN_ETUDE: 'bg-amber-50 text-amber-700 border-amber-200',
        DEVIS_EMIS: 'bg-violet-50 text-violet-700 border-violet-200',
        PIECES_MANQUANTES: 'bg-orange-50 text-orange-700 border-orange-200',
        ACCEPTEE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        TRANSFORMEE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    const cls = map[statut] || 'bg-slate-100 text-slate-600 border-slate-200';
    return <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${cls}`}>{statut}</span>;
}

function LigneRelance({ item }) {
    const typeIcon = {
        CONTRAT_IMPAYE: <span className="text-red-600">◯</span>,
        BORDEREAU_A_VALIDER: <span className="text-amber-600">▤</span>,
        ECHEANCE_PROCHAINE: <span className="text-blue-600">◷</span>,
        PIECES_DEMANDEES: <span className="text-orange-600">✎</span>,
    };
    return (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
            <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 text-base shrink-0">
                {typeIcon[item?.type] || '•'}
            </span>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800 truncate">{item?.client || item?.reference}</div>
                <div className="text-xs text-slate-500 truncate">{item?.detail}</div>
            </div>
            {item?.lien && (
                <Link to={item.lien} className="text-blue-600 hover:text-blue-700 shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                </Link>
            )}
        </div>
    );
}

const icones = {
    file: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
    ),
    retard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    ),
    relance: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
    ),
};

function ModalPersonalisation({ ouvert, produit, criteres, estimation, onClose, onSaved }) {
    const EMPTY = {
        type: 'PHYSIQUE', civilite: '', nom: '', prenom: '', raison_sociale: '', siren: '', siret: '',
        personne_a_contacter: '', forme_juridique: '', adresse: '', code_postal: '', ville: '',
        telephone: '', tel2: '', email: '', email2: '', preference_contact: '',
        horaire_contact: '', origine: '', rgpd_consentement: false, exclure_marketing: false,
    };
    const [clients, setClients] = useState([]);
    const [chargementClients, setChargementClients] = useState(false);
    const [clientId, setClientId] = useState('');
    const [client, setClient] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [erreur, setErreur] = useState('');
    const [document, setDocument] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!ouvert) return;
        setChargementClients(true);
        setErreur('');
        setDocument(null);
        api.get('/clients', { params: { per_page: 500 } })
            .then((res) => setClients(res.data.data))
            .catch(() => setErreur('Impossible de charger les clients.'))
            .finally(() => setChargementClients(false));
    }, [ouvert]);

    const selectClient = (id) => {
        setClientId(id);
        const c = clients.find((x) => String(x.id) === String(id));
        setClient(c || null);
        if (c) {
            setForm({
                type: c.type === 'MORALE' ? 'MORALE' : 'PHYSIQUE',
                civilite: c.civilite || '', nom: c.nom || '', prenom: c.prenom || '',
                raison_sociale: c.raison_sociale || '',
                siren: c.siren || '', siret: c.siret || '',
                personne_a_contacter: c.personne_a_contacter || '',
                forme_juridique: c.forme_juridique || '',
                adresse: c.adresse || '', code_postal: c.code_postal || '',
                ville: c.ville || '', telephone: c.telephone || '', tel2: c.tel2 || '',
                email: c.email || '', email2: c.email2 || '',
                preference_contact: c.preference_contact || '',
                horaire_contact: '',
                origine: c.origine || '',
                rgpd_consentement: !!c.rgpd_consentement,
                exclure_marketing: !!c.exclure_marketing,
            });
        }
    };

    const setF = (k) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm({ ...form, [k]: value });
    };

    const champField = (label, nom, opts = {}) => (
        <div className={opts.span2 ? 'col-span-2' : ''}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label}{opts.required && <span className="text-red-500"> *</span>}
            </label>
            <input
                type={opts.type || 'text'}
                value={form[nom]}
                onChange={setF(nom)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            />
        </div>
    );

    const champSel = (label, nom, options, opts = {}) => (
        <div className={opts.span2 ? 'col-span-2' : ''}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label}{opts.required && <span className="text-red-500"> *</span>}
            </label>
            <select value={form[nom]} onChange={setF(nom)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                <option value="">Choisir...</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );

    const enregistrer = async (e) => {
        e.preventDefault();
        if (!client) return;
        setSaving(true);
        setErreur('');
        try {
            const body = {
                client_id: client.id,
                produit,
                criteres,
                estimation,
                client_data: form,
            };

            if (document) {
                const fd = new FormData();
                Object.entries(body).forEach(([k, v]) => {
                    if (typeof v === 'object' && v !== null) fd.append(k, JSON.stringify(v));
                    else fd.append(k, v);
                });
                fd.append('document', document);
                await api.post('/simulations', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                await api.post('/simulations', body);
            }

            onSaved();
            onClose();
        } catch (err) {
            setErreur(err?.response?.data?.message || "Impossible d'enregistrer la simulation.");
        } finally {
            setSaving(false);
        }
    };

    if (!ouvert) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-slate-900">Editer la simulation</h3>
                    <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">&times;</button>
                </div>

                <div className="p-5 space-y-5">
                    {erreur && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{erreur}</div>}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Prospect/client <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={clientId}
                            onChange={(e) => selectClient(e.target.value)}
                            disabled={chargementClients}
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                        >
                            <option value="">{chargementClients ? 'Chargement des clients...' : 'Sélectionner un client...'}</option>
                            {clients.map((c) => (
                                <option key={c.id} value={c.id}>{c.nom_complet} — {c.email || c.telephone || 'N/A'}</option>
                            ))}
                        </select>
                        {client && <p className="mt-1 text-xs text-emerald-600">Client sélectionné : {client.nom_complet}</p>}
                    </div>

                    {client && (
                        <form onSubmit={enregistrer} className="space-y-4">
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setForm({ ...form, type: 'PHYSIQUE' })}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'PHYSIQUE' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                                    Personne physique
                                </button>
                                <button type="button" onClick={() => setForm({ ...form, type: 'MORALE' })}
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'MORALE' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                                    Personne morale
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {form.type === 'PHYSIQUE' ? (
                                    <>
                                        {champField('Prénom', 'prenom', { required: true })}
                                        {champField('Nom', 'nom', { required: true })}
                                    </>
                                ) : (
                                    <>
                                        {champField('Raison sociale', 'raison_sociale', { required: true, span2: true })}
                                        {champField('SIREN', 'siren')}
                                        {champField('SIRET', 'siret')}
                                    </>
                                )}
                                {champField('Personne à contacter', 'personne_a_contacter', { required: true, span2: true })}
                                {champSel('Forme Juridique de l\'entreprise', 'forme_juridique',
                                    ['SARL', 'SA', 'SAS', 'SASU', 'EURL', 'Coopérative', 'Association', 'Autre'])}
                                {champField('Adresse', 'adresse', { required: true, span2: true })}
                                {champField('Code postal', 'code_postal', { required: true })}
                                {champField('Ville', 'ville', { required: true })}
                                {champField('Tél', 'telephone', { required: true })}
                                {champField('Tél 2', 'tel2')}
                                {champField('Email', 'email', { type: 'email' })}
                                {champField('Email 2', 'email2', { type: 'email' })}
                                {champSel('Préférence de contact', 'preference_contact',
                                    ['Téléphone', 'SMS', 'WhatsApp', 'Email', 'Courrier'])}
                                {champSel('Horaire de contact', 'horaire_contact',
                                    ['8-12h', '12-14h', '14-18h', '18-20h', 'Indifférent'])}
                                {champSel('Origine', 'origine',
                                    ['PARRAINAGE', 'PROSPECTION', 'INTERNET', 'PARTENAIRE', 'AUTRE'], { required: true, span2: true })}

                                <div className="col-span-2 space-y-2">
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!!form.rgpd_consentement} onChange={setF('rgpd_consentement')}
                                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-slate-700">Consentement RGPD</span>
                                    </label>
                                    <label className="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" checked={!!form.exclure_marketing} onChange={setF('exclure_marketing')}
                                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-slate-700">Exclure des opérations de communication et marketing</span>
                                    </label>
                                </div>

                                <div className="col-span-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.jpeg,.jpg,.png,.docx,.xlsx,.csv"
                                        onChange={(e) => setDocument(e.target.files?.[0] || null)}
                                        className="hidden"
                                    />
                                    <button type="button" onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81a1.5 1.5 0 0 0-2.122-2.122m-2.121 2.121 5.303-5.304a1.5 1.5 0 0 1 2.122 2.122l-5.303 5.303a1.5 1.5 0 0 1-2.122-2.122Z" />
                                        </svg>
                                        Ajouter un document
                                    </button>
                                    {document && (
                                        <div className="mt-2 flex items-center gap-2 text-sm">
                                            <span className="text-emerald-700 font-medium">Document sélectionné :</span>
                                            <span className="text-slate-600">{document.name}</span>
                                            <button type="button" onClick={() => { setDocument(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                                className="text-red-600 hover:text-red-700 text-xs font-medium">Retirer</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={onClose}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Enregistrement...' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function SimulationsPanel({ simulations }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-slate-900">Simulations</h2>
            </div>
            {simulations.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-slate-400">Aucune simulation enregistrée.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs uppercase text-slate-500 border-b border-gray-100">
                                <th className="px-4 py-2">Produit</th>
                                <th className="px-4 py-2">Client</th>
                                <th className="px-4 py-2 text-right">Prime/an</th>
                            </tr>
                        </thead>
                        <tbody>
                            {simulations.map((s) => (
                                <tr key={s.id} className="border-b border-gray-50 last:border-0">
                                    <td className="px-4 py-2.5 font-medium">{s.produit}</td>
                                    <td className="px-4 py-2.5 text-slate-600 truncate max-w-[130px]">{s.client_nom || '—'}</td>
                                    <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold whitespace-nowrap">
                                        {Number(s.estimation?.prime_min ?? 0).toFixed(2)} € – {Number(s.estimation?.prime_max ?? 0).toFixed(2)} €
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function MessagerieOnglet() {
    const [messageries, setMessageries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ lien: '', nom: '', descriptif: '' });
    const [logo, setLogo] = useState(null);
    const [champErreur, setChampErreur] = useState({});
    const [modalErreur, setModalErreur] = useState('');

    const charger = () => {
        setLoading(true);
        api.get('/messageries')
            .then((res) => setMessageries(res.data.data))
            .catch(() => setErreur('Erreur de chargement des messageries.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { charger(); }, []);

    const ouvrir = () => {
        setForm({ lien: '', nom: '', descriptif: '' });
        setLogo(null);
        setChampErreur({});
        setModalErreur('');
        setModalOpen(true);
    };

    const validerChamps = () => {
        const err = {};
        if (!form.lien.trim()) err.lien = 'Champ obligatoire.';
        if (!form.nom.trim()) err.nom = 'Champ obligatoire.';
        setChampErreur(err);
        return Object.keys(err).length === 0;
    };

    const enregistrer = async (e) => {
        e.preventDefault();
        if (!validerChamps()) return;
        setSaving(true);
        setModalErreur('');
        try {
            const fd = new FormData();
            fd.append('lien', form.lien);
            fd.append('nom', form.nom);
            fd.append('descriptif', form.descriptif);
            if (logo) fd.append('logo', logo);
            await api.post('/messageries', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setModalOpen(false);
            charger();
        } catch (err) {
            setModalErreur(err?.response?.data?.message || "Impossible d'ajouter la messagerie.");
        } finally {
            setSaving(false);
        }
    };

    const champInput = (label, nom, obligatoire = false) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label}{obligatoire && <span className="text-red-500"> *</span>}
            </label>
            <input
                type="text"
                value={form[nom]}
                onChange={(e) => setForm({ ...form, [nom]: e.target.value })}
                className={`w-full border rounded px-3 py-2 text-sm ${champErreur[nom] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                placeholder={label}
            />
            {champErreur[nom] && <p className="mt-1 text-xs text-red-600">{champErreur[nom]}</p>}
        </div>
    );

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-slate-900">Messagerie</h2>
                    <button
                        onClick={ouvrir}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm whitespace-nowrap"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Ajouter messagerie
                    </button>
                </div>

                <div className="p-3">
                    {erreur && <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-3">{erreur}</div>}

                    {loading ? (
                        <div className="text-slate-500 text-sm p-4">Chargement...</div>
                    ) : messageries.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400">
                            Aucune messagerie. Cliquez sur « Ajouter messagerie ».
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {messageries.map((m) => (
                                <div key={m.id} className="w-[130px] flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
                                    <div className="relative">
                                        {m.logo_url ? (
                                            <img src={m.logo_url} alt={m.nom} className="h-14 w-14 object-contain rounded-lg bg-white border border-gray-200 p-0.5" />
                                        ) : (
                                            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 flex items-center justify-center font-bold text-sm p-0.5">
                                                {m.nom?.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <a
                                            href={m.lien}
                                            target="_blank"
                                            rel="noreferrer"
                                            title={m.lien}
                                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow hover:bg-blue-700"
                                        >
                                            +
                                        </a>
                                    </div>
                                    <span className="text-xs font-medium text-slate-700 text-center truncate w-full">{m.nom}</span>
                                    {m.descriptif && <span className="text-[10px] text-slate-400 text-center line-clamp-2">{m.descriptif}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-12">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-slate-900">Vous souhaitez ajouter une messagerie non référencée</h3>
                            <button onClick={() => setModalOpen(false)} className="text-2xl leading-none text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        <form onSubmit={enregistrer} className="p-5 space-y-4">
                            {modalErreur && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{modalErreur}</div>}
                            {champInput('Lien de Messagerie', 'lien', true)}
                            {champInput('Nom', 'nom', true)}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descriptif</label>
                                <textarea
                                    value={form.descriptif}
                                    maxLength={255}
                                    rows={3}
                                    onChange={(e) => setForm({ ...form, descriptif: e.target.value })}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                                <p className="mt-1 text-right text-xs text-slate-400">{255 - form.descriptif.length} caractères restants</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setLogo(e.target.files?.[0] || null)}
                                    className="w-full text-sm"
                                />
                                {logo && <p className="mt-1 text-xs text-emerald-600">Logo sélectionné : {logo.name}</p>}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Enregistrement...' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReseauSocialOnglet() {
    const [reseaux, setReseaux] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ lien: '', nom: '', descriptif: '' });
    const [logo, setLogo] = useState(null);
    const [champErreur, setChampErreur] = useState({});
    const [modalErreur, setModalErreur] = useState('');

    const charger = () => {
        setLoading(true);
        api.get('/reseaux-sociaux')
            .then((res) => setReseaux(res.data.data))
            .catch(() => setErreur('Erreur de chargement des réseaux sociaux.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { charger(); }, []);

    const ouvrir = () => {
        setForm({ lien: '', nom: '', descriptif: '' });
        setLogo(null);
        setChampErreur({});
        setModalErreur('');
        setModalOpen(true);
    };

    const validerChamps = () => {
        const err = {};
        if (!form.lien.trim()) err.lien = 'Champ obligatoire.';
        if (!form.nom.trim()) err.nom = 'Champ obligatoire.';
        setChampErreur(err);
        return Object.keys(err).length === 0;
    };

    const enregistrer = async (e) => {
        e.preventDefault();
        if (!validerChamps()) return;
        setSaving(true);
        setModalErreur('');
        try {
            const fd = new FormData();
            fd.append('lien', form.lien);
            fd.append('nom', form.nom);
            fd.append('descriptif', form.descriptif);
            if (logo) fd.append('logo', logo);
            await api.post('/reseaux-sociaux', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setModalOpen(false);
            charger();
        } catch (err) {
            setModalErreur(err?.response?.data?.message || "Impossible d'ajouter le réseau social.");
        } finally {
            setSaving(false);
        }
    };

    const champInput = (label, nom, obligatoire = false) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label}{obligatoire && <span className="text-red-500"> *</span>}
            </label>
            <input
                type="text"
                value={form[nom]}
                onChange={(e) => setForm({ ...form, [nom]: e.target.value })}
                className={`w-full border rounded px-3 py-2 text-sm ${champErreur[nom] ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                placeholder={label}
            />
            {champErreur[nom] && <p className="mt-1 text-xs text-red-600">{champErreur[nom]}</p>}
        </div>
    );

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-slate-900">Réseaux sociaux</h2>
                    <button
                        onClick={ouvrir}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm whitespace-nowrap"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Ajouter un réseau social
                    </button>
                </div>

                <div className="p-3">
                    {erreur && <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-3">{erreur}</div>}

                    {loading ? (
                        <div className="text-slate-500 text-sm p-4">Chargement...</div>
                    ) : reseaux.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400">
                            Aucun réseau social. Cliquez sur « Ajouter un réseau social ».
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {reseaux.map((r) => (
                                <div key={r.id} className="w-[130px] flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
                                    <div className="relative">
                                        {r.logo_url ? (
                                            <img src={r.logo_url} alt={r.nom} className="h-14 w-14 object-contain rounded-lg bg-white border border-gray-200 p-0.5" />
                                        ) : (
                                            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 flex items-center justify-center font-bold text-sm p-0.5">
                                                {r.nom?.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <a
                                            href={r.lien}
                                            target="_blank"
                                            rel="noreferrer"
                                            title={r.lien}
                                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow hover:bg-blue-700"
                                        >
                                            +
                                        </a>
                                    </div>
                                    <span className="text-xs font-medium text-slate-700 text-center truncate w-full">{r.nom}</span>
                                    {r.descriptif && <span className="text-[10px] text-slate-400 text-center line-clamp-2">{r.descriptif}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-12">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-slate-900">Vous souhaitez ajouter un réseau social non référencé</h3>
                            <button onClick={() => setModalOpen(false)} className="text-2xl leading-none text-slate-400 hover:text-slate-600">&times;</button>
                        </div>
                        <form onSubmit={enregistrer} className="p-5 space-y-4">
                            {modalErreur && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{modalErreur}</div>}
                            {champInput('Lien du réseau social', 'lien', true)}
                            {champInput('Nom', 'nom', true)}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descriptif</label>
                                <textarea
                                    value={form.descriptif}
                                    maxLength={255}
                                    rows={3}
                                    onChange={(e) => setForm({ ...form, descriptif: e.target.value })}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                                <p className="mt-1 text-right text-xs text-slate-400">{255 - form.descriptif.length} caractères restants</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setLogo(e.target.files?.[0] || null)}
                                    className="w-full text-sm"
                                />
                                {logo && <p className="mt-1 text-xs text-emerald-600">Logo sélectionné : {logo.name}</p>}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                                    {saving ? 'Enregistrement...' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function OutilEstimation({ onSimulationSaved }) {
    const marques = [
        'Peugeot', 'Renault', 'Citroën', 'Volkswagen', 'Toyota',
        'BMW', 'Mercedes-Benz', 'Audi', 'Ford', 'Nissan',
        'Opel', 'Hyundai', 'Kia', 'Fiat', 'Dacia',
    ];
    const produits = ['AUTO', 'Immobilier', 'Moto', 'Travaux'];
    const [form, setForm] = useState({
        produit: 'AUTO', marque: '', puissance: '', age_vehicule: '', usage: '',
        nb_annees_permis: '', nb_sinistres: '', vol_lnc_rc: 'RC100',
        crm: '1', niveau_garantie: 'Basique',
    });
    const [resultat, setResultat] = useState(null);
    const [calculEnCours, setCalculEnCours] = useState(false);
    const [erreurCalc, setErreurCalc] = useState('');
    const [customOpen, setCustomOpen] = useState(false);
    const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const estimer = async (e) => {
        e.preventDefault();
        setCalculEnCours(true);
        setErreurCalc('');
        setResultat(null);
        try {
            const res = await api.post('/simulator/estimate', form);
            setResultat(res.data.data);
        } catch (err) {
            setErreurCalc(err?.response?.data?.message || "Impossible de calculer l'estimation.");
        } finally {
            setCalculEnCours(false);
        }
    };

    const champ = (label, name, type = 'text', extra = null) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input
                type={type}
                value={form[name]}
                onChange={update(name)}
                {...(extra || {})}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );

    const champSelect = (label, name, options, placeholder = true) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <select
                value={form[name]}
                onChange={update(name)}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {placeholder && <option value="">Sélectionner...</option>}
                {options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>
        </div>
    );

    const blocGarantie = (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Niveau de garantie</label>
            <div className="flex gap-3">
                {['Basique', 'Renforcé'].map((g) => (
                    <label key={g} className="flex items-center gap-1.5 text-sm text-slate-700">
                        <input
                            type="radio"
                            name="niveau_garantie"
                            checked={form.niveau_garantie === g}
                            onChange={() => setForm({ ...form, niveau_garantie: g })}
                            className="accent-blue-600"
                        />
                        {g}
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-slate-900">Simulateur de primes</h2>
            </div>
            <form className="p-4 space-y-3" onSubmit={estimer}>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Produit</label>
                    <select
                        value={form.produit}
                        onChange={update('produit')}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {produits.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                {(form.produit === 'AUTO' || form.produit === 'Moto') && (
                    <>
                        {champSelect('Marque', 'marque', marques)}
                        {form.produit === 'AUTO'
                            ? champ('Puissance', 'puissance')
                            : champSelect('Cylindrée', 'cylindree', ['50 cc', '125 cc', '250 cc', '500 cc', 'Plus de 600 cc'])}
                        {champ('Âge du véhicule', 'age_vehicule')}
                    </>
                )}

                {form.produit === 'AUTO' && (
                    <>
                        {champSelect('Usage', 'usage', ['Privé', 'Domicile-travail', 'Professionnel', 'Tous usages'])}
                        {champ('Nb années de permis', 'nb_annees_permis', 'number', { min: 0 })}
                        {champ('Nb de sinistres', 'nb_sinistres', 'number', { min: 0 })}
                        {champSelect('Vol / LNC / RC100', 'vol_lnc_rc', ['Vol', 'LNC', 'RC100'], false)}
                    </>
                )}

                {form.produit === 'Moto' && (
                    <>
                        {champ('Nb années de permis', 'nb_annees_permis', 'number', { min: 0 })}
                        {champ('Nb de sinistres', 'nb_sinistres', 'number', { min: 0 })}
                    </>
                )}

                {form.produit === 'Immobilier' && (
                    <>
                        {champSelect('Type de bien', 'type_bien', ['Maison', 'Appartement'])}
                        {champ('Superficie (m²)', 'superficie', 'number', { min: 0 })}
                        {champ('Année de construction', 'annee_construction', 'number', { min: 1900, max: 2100 })}
                        {champ('Valeur du bien (€)', 'valeur_bien', 'number', { min: 0 })}
                        {champSelect('Assurance prêt', 'assurance_pret', ['Oui', 'Non'], false)}
                    </>
                )}

                {form.produit === 'Travaux' && (
                    <>
                        {champSelect('Type de travaux', 'type_travaux', ['Construction', 'Rénovation', 'Extension', 'Autre'])}
                        {champ('Durée prévue (mois)', 'duree_travaux', 'number', { min: 1 })}
                        {champ('Montant des travaux (€)', 'montant_travaux', 'number', { min: 0 })}
                        {champ("Nombre d'employés", 'nb_employes', 'number', { min: 0 })}
                    </>
                )}

                {champ('CRM (de 0.5 à 3.5)', 'crm', 'number', { min: 0.5, max: 3.5, step: 0.1 })}

                {blocGarantie}

                <button
                    type="submit"
                    disabled={calculEnCours}
                    className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {calculEnCours ? 'Calcul...' : 'Estimer'}
                </button>

                {erreurCalc && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{erreurCalc}</div>}

                {resultat && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                            Estimation indicative {resultat.produit}
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="text-sm text-slate-600">Prime annuelle</span>
                            <span className="text-lg font-extrabold text-emerald-700">
                                {Number(resultat.prime_min).toFixed(2)} € – {Number(resultat.prime_max).toFixed(2)} €
                            </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-slate-600">Prime mensuelle</span>
                            <span className="font-semibold text-slate-700">
                                {Number(resultat.prime_mensuelle_min).toFixed(2)} € – {Number(resultat.prime_mensuelle_max).toFixed(2)} €
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCustomOpen(true)}
                            className="mt-3 w-full py-2 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 transition"
                        >
                            Personnaliser la simulation
                        </button>
                    </div>
                )}
            </form>

            <ModalPersonalisation
                ouvert={customOpen}
                produit={form.produit}
                criteres={form}
                estimation={resultat}
                onClose={() => setCustomOpen(false)}
                onSaved={onSimulationSaved}
            />
        </div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const estCabinet = user?.role && ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user.role);

    const [fournisseurs, setFournisseurs] = useState([]);
    const [typeAssurance, setTypeAssurance] = useState('Tous');
    const [simulations, setSimulations] = useState([]);
    const [ongletDroit, setOngletDroit] = useState('simulateur');
    const [confirmToggle, setConfirmToggle] = useState(null);
    const [toggleEmail, setToggleEmail] = useState('');
    const [togglePasse, setTogglePasse] = useState('');
    const [infosTarget, setInfosTarget] = useState(null);
    const [form2, setForm2] = useState({
        partenaire: '', telephone: '', email: '', contrats: '',
        montant_primes: '', dernier_contrat: '', nom_document: '',
        mot_de_passe: '',
    });
    const [document, setDocument] = useState(null);
    const [savingInfos, setSavingInfos] = useState(false);
    const [msgFour, setMsgFour] = useState('');

    const [showAjoutFour, setShowAjoutFour] = useState(false);
    const [formAjoutFour, setFormAjoutFour] = useState({
        service: '', nom: '', information: '', type_assurance: '', url_assurance: '',
    });
    const [logoFour, setLogoFour] = useState(null);
    const [logoFourPreview, setLogoFourPreview] = useState(null);
    const [savingAjoutFour, setSavingAjoutFour] = useState(false);
    const [errAjoutFour, setErrAjoutFour] = useState('');

    useEffect(() => {
        api.get('/dashboard')
            .then((res) => setData(res.data.data))
            .catch(() => setError('Impossible de charger le tableau de bord.'));
    }, []);

    useEffect(() => {
        if (!estCabinet) return;
        api.get('/fournisseurs')
            .then((res) => setFournisseurs(res.data.data))
            .catch(() => setMsgFour('Impossible de charger les fournisseurs.'));
    }, [estCabinet]);

    const loadSimulations = async () => {
        try {
            const res = await api.get('/simulations');
            setSimulations(res.data.data);
        } catch {
            /* silencieux */
        }
    };

    useEffect(() => {
        loadSimulations();
    }, []);

    const hasPartnerInfo = (f) =>
        !!(f.partenaire?.trim() || f.telephone?.trim() || f.email?.trim());

    const buildUrl = (u) => {
        if (!u) return null;
        const s = u.trim();
        if (!s) return null;
        return /^https?:\/\//i.test(s) ? s : `https://${s}`;
    };

    const reloadFournisseurs = async () => {
        try {
            const res = await api.get('/fournisseurs');
            setFournisseurs(res.data.data);
        } catch {
            setMsgFour('Impossible de recharger les fournisseurs.');
        }
    };

    const ouvrirAjoutFour = () => {
        setFormAjoutFour({ service: '', nom: '', information: '', type_assurance: '', url_assurance: '' });
        setLogoFour(null);
        setLogoFourPreview(null);
        setErrAjoutFour('');
        setShowAjoutFour(true);
    };

    const onLogoFourChange = (e) => {
        const f = e.target.files?.[0] || null;
        setLogoFour(f);
        if (f) {
            const reader = new FileReader();
            reader.onload = () => setLogoFourPreview(reader.result);
            reader.readAsDataURL(f);
        } else {
            setLogoFourPreview(null);
        }
    };

    const creerFournisseur = async () => {
        if (!formAjoutFour.service.trim() || !formAjoutFour.nom.trim()) {
            setErrAjoutFour('Le service et le nom du fournisseur sont obligatoires.');
            return;
        }
        setSavingAjoutFour(true);
        setErrAjoutFour('');
        try {
            const fd = new FormData();
            fd.append('service', formAjoutFour.service);
            fd.append('nom', formAjoutFour.nom);
            fd.append('information', formAjoutFour.information);
            fd.append('type_assurance', formAjoutFour.type_assurance);
            fd.append('url_assurance', formAjoutFour.url_assurance);
            if (logoFour) fd.append('logo', logoFour);
            await api.post('/fournisseurs', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setShowAjoutFour(false);
            await reloadFournisseurs();
        } catch (err) {
            setErrAjoutFour(err?.response?.data?.message || "Impossible d'ajouter le fournisseur.");
        } finally {
            setSavingAjoutFour(false);
        }
    };

    const openPlus = (f) => {
        setMsgFour('');
        if (!f.devenir_partenaire && !hasPartnerInfo(f)) {
            setInfosTarget(f);
            setForm2({
                partenaire: '', telephone: '', email: '', contrats: '',
                montant_primes: '', dernier_contrat: '', nom_document: '',
                mot_de_passe: '',
            });
            setDocument(null);
            return;
        }
        setConfirmToggle(f);
        setToggleEmail(f.email || '');
        setTogglePasse('');
    };

    const confirmerToggle = async () => {
        if (!confirmToggle) return;
        const activation = !confirmToggle.devenir_partenaire;
        if (activation) {
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(toggleEmail.trim())) {
                setMsgFour('Un e-mail valide est obligatoire pour activer le partenaire.');
                return;
            }
            if (!togglePasse || togglePasse.length < 8) {
                setMsgFour('Le mot de passe est obligatoire (minimum 8 caractères).');
                return;
            }
        }
        try {
            await api.post(`/fournisseurs/${confirmToggle.id}/devenir-partenaire`,
                activation ? { email: toggleEmail.trim(), mot_de_passe: togglePasse } : {}
            );
            await reloadFournisseurs();
        } catch (err) {
            setMsgFour(err.response?.data?.message || 'Erreur lors de la modification.');
        } finally {
            setConfirmToggle(null);
            setToggleEmail('');
            setTogglePasse('');
        }
    };

    const enregistrerInfos = async () => {
        if (!infosTarget) return;
        const activation = !infosTarget.devenir_partenaire;
        if (activation) {
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form2.email.trim())) {
                setMsgFour('Un e-mail valide est obligatoire pour activer le partenaire.');
                return;
            }
            if (!form2.mot_de_passe || form2.mot_de_passe.length < 8) {
                setMsgFour('Le mot de passe est obligatoire (minimum 8 caractères).');
                return;
            }
        }
        setSavingInfos(true);
        try {
            const fd = new FormData();
            fd.append('partenaire', form2.partenaire);
            fd.append('telephone', form2.telephone);
            fd.append('email', form2.email);
            fd.append('contrats', form2.contrats || 0);
            fd.append('montant_primes', form2.montant_primes || 0);
            fd.append('dernier_contrat', form2.dernier_contrat || '');
            if (form2.nom_document) fd.append('nom_document', form2.nom_document);
            if (document) fd.append('document', document);

            await api.post(`/fournisseurs/${infosTarget.id}/informations`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (activation) {
                await api.post(`/fournisseurs/${infosTarget.id}/devenir-partenaire`, {
                    email: form2.email.trim(),
                    mot_de_passe: form2.mot_de_passe,
                });
            }

            await reloadFournisseurs();
            setInfosTarget(null);
            setDocument(null);
        } catch (err) {
            setMsgFour(err.response?.data?.message || 'Erreur lors de l\'enregistrement des infos partenaire.');
        } finally {
            setSavingInfos(false);
        }
    };

    const typesAssurance = ['Tous', ...[...new Set(fournisseurs.map((f) => f.type_assurance).filter(Boolean))]];
    const fournisseursFiltres = typeAssurance === 'Tous'
        ? fournisseurs
        : fournisseurs.filter((f) => f.type_assurance === typeAssurance);
    const partenairesAccueil = fournisseursFiltres.filter((f) => f.devenir_partenaire);

    const LogoFournisseur = ({ f }) =>
        f.logo_url ? (
            <img src={f.logo_url} alt={f.nom} className="h-20 w-20 object-contain rounded-lg bg-white border border-gray-200 p-1" />
        ) : (
            <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 flex items-center justify-center font-bold text-sm p-1">
                {f.nom?.slice(0, 2).toUpperCase()}
            </div>
        );

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div>
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-slate-900">Bonjour, {user?.name}</h1>
                <p className="text-sm text-slate-500 capitalize mt-0.5">
                    {today} — {estCabinet ? 'Vue de gestion' : 'Votre portefeuille'}
                </p>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

            {!data && <div className="text-slate-500">Chargement...</div>}

            {data && (
                <>
                    {/* Cartes statistiques */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                        {!estCabinet ? (
                            <>
                                <StatCard label="Demandes en cours" value={data.demandes_en_cours} icon={icones.file} accent="blue" />
                                <StatCard label="Devis en attente" value={data.devis_en_attente} icon={<span>✉</span>} accent="amber" />
                                <StatCard label="Contrats actifs" value={data.contrats_actifs} icon={<span>☑</span>} accent="emerald" />
                                <StatCard label="Échéances (120 j)" value={data.echeances} icon={<span>◷</span>} accent="indigo" />
                                <StatCard label="Commissions du mois" value={`${(data.commissions_mois / 100).toFixed(2)} €`} icon={<span>€</span>} accent="violet" />
                                <StatCard label="Messages non lus" value={data.messages_non_lus} icon={<span>✉</span>} accent="red" />
                            </>
                        ) : (
                            <>
                                <StatCard label="Demandes en attente" value={data.demandes_en_attente} icon={icones.file} accent="blue" />
                                <StatCard label="Dossiers en retard" value={data.dossiers_en_retard} icon={icones.retard} accent="red" />
                                <StatCard label="Contrats en vigueur" value={data.contrats_en_vigueur} icon={<span>☑</span>} accent="emerald" />
                                <StatCard label="Bordereaux à valider" value={data.bordereaux_a_valider} icon={<span>▤</span>} accent="amber" />
                            </>
                        )}
                    </div>

                    {/* Partenaires & fournisseurs (cabinet) */}
                    {estCabinet && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8 items-start">
                            {/* Colonne latérale droite (col-md-4) */}
                            <div className="md:col-span-4 md:order-2 space-y-6">
                                {/* Onglets de la colonne droite */}
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1 flex">
                                    {[
                                        { id: 'simulateur', label: 'Simulateur de primes', icone: (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                                            </svg>
                                        ) },
                                        { id: 'messagerie', label: 'Messagerie', icone: (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                            </svg>
                                        ) },
                                        { id: 'reseaux', label: 'Réseaux sociaux', icone: (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75a2.25 2.25 0 0 1 2.25-2.25h15a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75Zm4.5 1.5h3M7.5 12h4.5m-4.5 4.5h1.5" />
                                            </svg>
                                        ) },
                                    ].map((o) => (
                                        <button
                                            key={o.id}
                                            onClick={() => setOngletDroit(o.id)}
                                            className={`flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                                                ongletDroit === o.id
                                                    ? 'bg-blue-600 text-white shadow'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {o.icone}
                                            {o.label}
                                        </button>
                                    ))}
                                </div>

                                {ongletDroit === 'simulateur' && (
                                    <>
                                        <OutilEstimation onSimulationSaved={loadSimulations} />
                                        <SimulationsPanel simulations={simulations} />
                                    </>
                                )}

                                {ongletDroit === 'messagerie' && (
                                    <MessagerieOnglet />
                                )}

                                {ongletDroit === 'reseaux' && (
                                    <ReseauSocialOnglet />
                                )}
                            </div>

                            {/* Partenaires & fournisseurs (col-md-8) */}
                            <div className="md:col-span-8 space-y-6 md:order-1">
                                {msgFour && <div className="bg-amber-50 text-amber-700 p-3 rounded text-sm">{msgFour}</div>}

                                {/* Filtres par type d'assurance */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {typesAssurance.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTypeAssurance(t)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                                                typeAssurance === t
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100">
                                        <h2 className="font-semibold text-slate-900">Partenaires</h2>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-3 pb-2 px-2">
                                        {partenairesAccueil.map((p) => {
                                            const url = buildUrl(p.url_assurance);
                                            return (
                                                <div key={p.id} className="flex flex-col items-center gap-1.5 p-1.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
                                                    {url ? (
                                                        <a href={url} target="_blank" rel="noreferrer" title={p.url_assurance} className="flex flex-col items-center gap-2 w-full">
                                                            <LogoFournisseur f={p} />
                                                        </a>
                                                    ) : (
                                                        <LogoFournisseur f={p} />
                                                    )}
                                                    <span className="text-xs font-medium text-slate-700 text-center truncate w-full">{p.nom}</span>
                                                </div>
                                            );
                                        })}
                                        {partenairesAccueil.length === 0 && (
                                            <div className="col-span-full text-center text-sm text-slate-400 py-6">Aucun partenaire pour le moment.</div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-4 border-b border-gray-100">
                                        <h2 className="font-semibold text-slate-900">Fournisseurs</h2>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-3 pb-2 px-2">
                                        {fournisseursFiltres.map((f) => {
                                            const url = buildUrl(f.url_assurance);
                                            return (
                                                <div key={f.id} className="relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition">
                                                    <button
                                                        onClick={() => openPlus(f)}
                                                        title={f.devenir_partenaire ? 'Désactiver le partenaire' : 'Devenir partenaire'}
                                                        className={`absolute top-1 right-1 w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                                                            f.devenir_partenaire ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700'
                                                        }`}
                                                    >
                                                        {f.devenir_partenaire ? '✓' : '+'}
                                                    </button>
                                                    {url ? (
                                                        <a href={url} target="_blank" rel="noreferrer" title={f.url_assurance} className="flex flex-col items-center gap-2 w-full">
                                                            <LogoFournisseur f={f} />
                                                        </a>
                                                    ) : (
                                                        <LogoFournisseur f={f} />
                                                    )}
                                                    <span className="text-xs font-medium text-slate-700 text-center truncate w-full">{f.nom}</span>
                                                </div>
                                            );
                                        })}
                                        {fournisseursFiltres.length === 0 && (
                                            <div className="col-span-full text-center text-sm text-slate-400 py-6">Aucun fournisseur.</div>
                                        )}
                                    </div>
                                    <div className="px-3 pb-3 flex justify-end">
                                        <button
                                            onClick={ouvrirAjoutFour}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                            </svg>
                                            Ajouter un fournisseur
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Panneaux de gestion (cabinet) */}
                    {estCabinet ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            {/* File d'attribution */}
                            <PanelCard
                                title="File d'attribution"
                                icon={icones.file}
                                accent="bg-gradient-to-br from-blue-600 to-blue-700"
                                badge={data.file_attribution?.length}
                                footerLink="/demandes"
                            >
                                {data.file_attribution?.map((d) => (
                                    <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-800 truncate">{d.client}</span>
                                                <BadgeStatut statut={d.statut} />
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {d.reference} · {d.branche} · {d.jours_en_attente} j
                                            </div>
                                        </div>
                                        <Link to={`/demandes/${d.id}`} className="text-blue-600 hover:text-blue-700 shrink-0">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                                            </svg>
                                        </Link>
                                    </div>
                                ))}
                            </PanelCard>

                            {/* Dossiers en retard */}
                            <PanelCard
                                title="Dossiers en retard"
                                icon={icones.retard}
                                accent="bg-gradient-to-br from-red-500 to-red-700"
                                badge={data.dossiers_retard_liste?.length}
                                footerLink="/demandes"
                            >
                                {data.dossiers_retard_liste?.map((d) => (
                                    <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-slate-800 truncate">{d.client}</span>
                                                <BadgeStatut statut={d.statut} />
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {d.reference} · {d.branche} · {d.jours_retard} j de retard
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-red-600 shrink-0">{d.gestionnaire || 'Non attribué'}</span>
                                    </div>
                                ))}
                            </PanelCard>

                            {/* Relances à faire */}
                            <PanelCard
                                title="Relances à faire"
                                icon={icones.relance}
                                accent="bg-gradient-to-br from-amber-500 to-orange-600"
                                badge={
                                    (data.relances?.impayes?.length || 0) +
                                    (data.relances?.bordereaux?.length || 0) +
                                    (data.relances?.echeances_proches?.length || 0) +
                                    (data.relances?.pieces_manquantes?.length || 0)
                                }
                                footerLink="/messages"
                                footerLabel="Voir la messagerie"
                            >
                                <div className="text-xs font-semibold text-slate-500 px-3 py-1.5 uppercase tracking-wide">
                                    Contrats impayés
                                </div>
                                {data.relances?.impayes?.map((r) => <LigneRelance key={r.id} item={r} />)}
                                <div className="text-xs font-semibold text-slate-500 px-3 py-1.5 uppercase tracking-wide mt-1">
                                    Pièces manquantes
                                </div>
                                {data.relances?.pieces_manquantes?.map((r) => <LigneRelance key={r.id} item={{ ...r, type: 'PIECES_DEMANDEES', detail: 'Pièces à demander — ' + r.reference }} />)}
                                <div className="text-xs font-semibold text-slate-500 px-3 py-1.5 uppercase tracking-wide mt-1">
                                    Bordereaux à valider
                                </div>
                                {data.relances?.bordereaux?.map((r) => <LigneRelance key={r.id} item={r} />)}
                                <div className="text-xs font-semibold text-slate-500 px-3 py-1.5 uppercase tracking-wide mt-1">
                                    Échéances proches
                                </div>
                                {data.relances?.echeances_proches?.map((r) => <LigneRelance key={r.id} item={r} />)}
                            </PanelCard>
                        </div>
                    ) : (
                        /* Panneaux partenaire */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <PanelCard
                                title="Échéances proches"
                                icon={icones.relance}
                                accent="bg-gradient-to-br from-blue-600 to-blue-700"
                                badge={data.relances?.echeances_proches?.length}
                                footerLink="/echeances"
                            >
                                {data.relances?.echeances_proches?.map((r) => <LigneRelance key={r.id} item={r} />)}
                            </PanelCard>
                            <PanelCard
                                title="Pièces demandées"
                                icon={icones.relance}
                                accent="bg-gradient-to-br from-amber-500 to-orange-600"
                                badge={data.relances?.pieces_demandees?.length}
                                footerLink="/demandes"
                            >
                                {data.relances?.pieces_demandees?.map((r) => <LigneRelance key={r.id} item={r} />)}
                            </PanelCard>
                        </div>
                    )}
                </>
            )}

            {/* Modal de confirmation du toggle partenaire */}
            {estCabinet && confirmToggle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <div className="bg-white rounded-lg p-5 shadow-xl max-w-sm w-full">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Confirmer l&apos;action</h3>
                        {confirmToggle.devenir_partenaire ? (
                            <p className="text-sm text-slate-600 mb-6">
                                Voulez-vous <span className="font-medium">désactiver</span> le partenaire{' '}
                                <span className="font-medium text-slate-900">{confirmToggle.nom}</span> ?
                            </p>
                        ) : (
                            <>
                                <p className="text-sm text-slate-600 mb-4">
                                    Choisissez l&apos;e-mail et le mot de passe avec lesquels le partenaire{' '}
                                    <span className="font-medium text-slate-900">{confirmToggle.nom}</span>
                                    {' '}se connectera à l&apos;espace partenaire.
                                </p>
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            E-mail de connexion <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={toggleEmail}
                                            onChange={(e) => setToggleEmail(e.target.value)}
                                            placeholder="E-mail du partenaire"
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Mot de passe <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={togglePasse}
                                            onChange={(e) => setTogglePasse(e.target.value)}
                                            placeholder="Minimum 8 caractères"
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmToggle(null)}
                                className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmerToggle}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de saisie des infos partenaire (bouton +) */}
            {estCabinet && infosTarget && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg p-5 shadow-xl max-w-lg w-full my-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">
                                Devenir partenaire — <span className="text-slate-600">{infosTarget.nom}</span>
                            </h3>
                            <button
                                onClick={() => setInfosTarget(null)}
                                className="text-sm text-slate-500 hover:text-slate-700"
                            >
                                Fermer
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Partenaire <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={form2.partenaire}
                                    onChange={(e) => setForm2({ ...form2, partenaire: e.target.value })}
                                    placeholder="Nom du partenaire"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                                    <input
                                        value={form2.telephone}
                                        onChange={(e) => setForm2({ ...form2, telephone: e.target.value })}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={form2.email}
                                        onChange={(e) => setForm2({ ...form2, email: e.target.value })}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Mot de passe <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={form2.mot_de_passe}
                                        onChange={(e) => setForm2({ ...form2, mot_de_passe: e.target.value })}
                                        placeholder="Minimum 8 caractères"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contrats</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form2.contrats}
                                        onChange={(e) => setForm2({ ...form2, contrats: e.target.value })}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Montant primes</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form2.montant_primes}
                                        onChange={(e) => setForm2({ ...form2, montant_primes: e.target.value })}
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Dernier contrat</label>
                                <input
                                    type="date"
                                    value={form2.dernier_contrat}
                                    onChange={(e) => setForm2({ ...form2, dernier_contrat: e.target.value })}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Documents</label>
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">
                                        Uploader un document
                                        <input type="file" className="hidden"
                                            onChange={(e) => setDocument(e.target.files?.[0] || null)} />
                                    </label>
                                    {document && <span className="text-xs text-slate-600 truncate max-w-[200px]">{document.name}</span>}
                                </div>
                                <input
                                    value={form2.nom_document}
                                    onChange={(e) => setForm2({ ...form2, nom_document: e.target.value })}
                                    placeholder="Nom du document (optionnel)"
                                    className="mt-2 w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setInfosTarget(null)}
                                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={enregistrerInfos}
                                    disabled={savingInfos}
                                    className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {savingInfos ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal : ajouter un fournisseur */}
            {showAjoutFour && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-lg p-5 w-full max-w-xl my-8 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-900">Ajouter un fournisseur</h3>
                            <button
                                onClick={() => setShowAjoutFour(false)}
                                className="text-sm text-slate-500 hover:text-slate-700"
                            >
                                Fermer
                            </button>
                        </div>

                        {errAjoutFour && <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-4">{errAjoutFour}</div>}

                        <div className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Service du fournisseur <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={formAjoutFour.service}
                                    onChange={(e) => setFormAjoutFour({ ...formAjoutFour, service: e.target.value })}
                                    placeholder="Ex : Compagnie, Mutuelle, Grossiste..."
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nom <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={formAjoutFour.nom}
                                    onChange={(e) => setFormAjoutFour({ ...formAjoutFour, nom: e.target.value })}
                                    placeholder="Nom du fournisseur"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descriptif</label>
                                <textarea
                                    value={formAjoutFour.information}
                                    onChange={(e) => setFormAjoutFour({ ...formAjoutFour, information: e.target.value })}
                                    rows={3}
                                    placeholder="Description du fournisseur"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type d&apos;assurance</label>
                                    <input
                                        value={formAjoutFour.type_assurance}
                                        onChange={(e) => setFormAjoutFour({ ...formAjoutFour, type_assurance: e.target.value })}
                                        placeholder="Ex : Assurances générales, prévoyance, santé..."
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">URL de l&apos;assurance</label>
                                    <input
                                        value={formAjoutFour.url_assurance}
                                        onChange={(e) => setFormAjoutFour({ ...formAjoutFour, url_assurance: e.target.value })}
                                        placeholder="Ex : https://www.axa.com"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">
                                        Upload logo
                                        <input type="file" accept="image/*" className="hidden" onChange={onLogoFourChange} />
                                    </label>
                                    {logoFourPreview ? (
                                        <img src={logoFourPreview} alt="logo" className="w-10 h-10 object-contain rounded border border-slate-200" />
                                    ) : (
                                        <span className="text-xs text-slate-400">Aucun logo sélectionné</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={creerFournisseur}
                                    disabled={savingAjoutFour}
                                    className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {savingAjoutFour ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

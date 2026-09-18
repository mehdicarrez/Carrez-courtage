import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';

function StatCard({ label, value, icon, accent, delay = 0 }) {
    const iconGradients = {
        blue: 'from-blue-500 to-indigo-600 shadow-blue-500/30',
        red: 'from-rose-500 to-red-600 shadow-rose-500/30',
        indigo: 'from-indigo-500 to-violet-600 shadow-indigo-500/30',
        emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
        amber: 'from-amber-500 to-orange-600 shadow-amber-500/30',
        violet: 'from-violet-500 to-purple-600 shadow-violet-500/30',
        slate: 'from-slate-500 to-slate-700 shadow-slate-500/30',
    };
    const lineColors = {
        blue: 'bg-blue-400',
        red: 'bg-rose-400',
        indigo: 'bg-indigo-400',
        emerald: 'bg-emerald-400',
        amber: 'bg-amber-400',
        violet: 'bg-violet-400',
        slate: 'bg-slate-400',
    };
    return (
        <div
            className="anim-in card-sheen group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-slate-200/60"
            style={{ animationDelay: `${delay}s` }}
        >
            <span className={`absolute top-0 left-0 right-0 h-1.5 ${lineColors[accent] || lineColors.blue}`} />
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
                <span className={`h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${iconGradients[accent] || iconGradients.blue}`}>{icon}</span>
            </div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value}</div>
        </div>
    );
}

const PanelCardTones = {
    blue: 'bg-blue-50 text-blue-700 border-slate-200',
    red: 'bg-blue-50 text-rose-700 border-slate-200',
    amber: 'bg-blue-50 text-amber-700 border-slate-200',
};

function PanelCard({ title, icon, accent, tone = 'blue', badge, children, footerLink, footerLabel, empty }) {
    return (
        <div className="bg-white card-sheen rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col transition-shadow duration-300 hover:shadow-md">
            <div className={`flex items-center justify-between px-5 py-4 border-b-2 ${PanelCardTones[tone] || PanelCardTones.blue}`}>
                <div className="flex items-center gap-3">
                    <span className={`h-9 w-9 flex items-center justify-center rounded-xl text-white ${accent}`}>{icon}</span>
                    <div>
                        <div className="font-semibold">{title}</div>
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
    check: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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
            <label className="block text-sm font-medium text-blue-800 mb-1">
                {label}{opts.required && <span className="text-red-500"> *</span>}
            </label>
            <input
                type={opts.type || 'text'}
                value={form[nom]}
                onChange={setF(nom)}
                className="field-line"
            />
        </div>
    );

    const champSel = (label, nom, options, opts = {}) => (
        <div className={opts.span2 ? 'col-span-2' : ''}>
            <label className="block text-sm font-medium text-blue-800 mb-1">
                {label}{opts.required && <span className="text-red-500"> *</span>}
            </label>
            <select value={form[nom]} onChange={setF(nom)}
                className="field-line">
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

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-slate-900">Editer la simulation</h3>
                    <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">&times;</button>
                </div>

                <div className="p-5 space-y-5">
                    {erreur && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{erreur}</div>}

                    <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">
                            Prospect/client <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={clientId}
                            onChange={(e) => selectClient(e.target.value)}
                            disabled={chargementClients}
                            className="field-line"
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
                                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${form.type === 'PHYSIQUE' ? 'bg-blue-700 border-blue-700 text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
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
                                    className="px-5 py-2.5 btn-primary">
                                    {saving ? 'Enregistrement...' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

function SimulationsPanel({ simulations }) {
    return (
        <div className="bg-white card-sheen rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md">
            <div className="px-5 py-4 bg-blue-50 border-b-2 border-slate-200">
                <h2 className="font-semibold text-blue-700">Simulations</h2>
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
            <label className="block text-sm font-medium text-blue-800 mb-1">
                {label}{obligatoire && <span className="text-red-500"> *</span>}
            </label>
            <input
                type="text"
                value={form[nom]}
                onChange={(e) => setForm({ ...form, [nom]: e.target.value })}
                className={`field-line ${champErreur[nom] ? 'field-line-error' : ''}`}
                placeholder={label}
            />
            {champErreur[nom] && <p className="mt-1 text-xs text-red-600">{champErreur[nom]}</p>}
        </div>
    );

    return (
        <div className="space-y-5">
            <div className="bg-white card-sheen rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md">
                <div className="px-5 py-4 bg-blue-50 border-b-2 border-slate-200 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-blue-700">Messagerie</h2>
                    <button
                        onClick={ouvrir}
                        className="inline-flex items-center gap-2 px-3.5 py-2 btn-primary whitespace-nowrap"
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
                                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold shadow hover:bg-blue-800 transition-all duration-300 hover:scale-110 active:scale-90"
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

            {modalOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-md my-12">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500" />
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-blue-800">Vous souhaitez ajouter une messagerie non référencée</h3>
                            <button onClick={() => setModalOpen(false)} aria-label="Fermer"
                                className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-blue-50 hover:text-blue-700 hover:rotate-90 active:scale-90">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={enregistrer} className="p-5 space-y-4">
                            {modalErreur && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{modalErreur}</div>}
                            {champInput('Lien de Messagerie', 'lien', true)}
                            {champInput('Nom', 'nom', true)}
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Descriptif</label>
                                <textarea
                                    value={form.descriptif}
                                    maxLength={255}
                                    rows={3}
                                    onChange={(e) => setForm({ ...form, descriptif: e.target.value })}
                                    className="field-line"
                                />
                                <p className="mt-1 text-right text-xs text-slate-400">{255 - form.descriptif.length} caractères restants</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Logo</label>
                                {logo ? (
                                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50/50 text-sm">
                                        <span className="flex items-center gap-2 min-w-0 truncate text-emerald-900 font-medium">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M2.25 18V6.75A2.25 2.25 0 0 1 4.5 4.5h15A2.25 2.25 0 0 1 21.75 6.75V18a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 18Z" /></svg>
                                            {logo.name}
                                        </span>
                                        <button type="button" onClick={() => setLogo(null)} className="text-red-600 hover:text-red-700 text-xs font-medium shrink-0">Retirer</button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 text-sm text-blue-700 font-medium cursor-pointer hover:border-blue-500 hover:bg-blue-100/70 transition-colors">
                                        <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} className="hidden" />
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                                        Proposer un logo
                                    </label>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2.5 btn-primary">
                                    {saving ? 'Enregistrement...' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
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
            <label className="block text-sm font-medium text-blue-800 mb-1">
                {label}{obligatoire && <span className="text-red-500"> *</span>}
            </label>
            <input
                type="text"
                value={form[nom]}
                onChange={(e) => setForm({ ...form, [nom]: e.target.value })}
                className={`field-line ${champErreur[nom] ? 'field-line-error' : ''}`}
                placeholder={label}
            />
            {champErreur[nom] && <p className="mt-1 text-xs text-red-600">{champErreur[nom]}</p>}
        </div>
    );

    return (
        <div className="space-y-5">
            <div className="bg-white card-sheen rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md">
                <div className="px-5 py-4 bg-blue-50 border-b-2 border-slate-200 flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-blue-700">Réseaux sociaux</h2>
                    <button
                        onClick={ouvrir}
                        className="inline-flex items-center gap-2 px-3.5 py-2 btn-primary whitespace-nowrap"
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
                                <div key={r.id} className="w-[100px] flex items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/70 shadow-sm transition-shadow duration-300 hover:shadow-md">
                                    <div className="relative">
                                        {r.logo_url ? (
                                            <span className="h-16 w-16 rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-100 shadow-md flex items-center justify-center overflow-hidden p-2.5">
                                                <img src={r.logo_url} alt={r.nom} className="h-10 w-10 object-contain" />
                                            </span>
                                        ) : (
                                            <span className="h-16 w-16 rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-100 shadow-md flex items-center justify-center overflow-hidden p-2.5">
                                                <span className="text-slate-400 font-bold text-sm flex items-center justify-center h-10 w-10">
                                                    {r.nom?.slice(0, 2).toUpperCase()}
                                                </span>
                                            </span>
                                        )}
                                        <a
                                            href={r.lien}
                                            target="_blank"
                                            rel="noreferrer"
                                            title={r.lien}
                                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold shadow hover:bg-blue-800 transition-all duration-300 hover:scale-110 active:scale-90"
                                        >
                                            +
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modalOpen && createPortal(
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="anim-pop relative bg-white overflow-hidden rounded-2xl shadow-xl w-full max-w-md my-12">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500" />
                        <div className="flex items-center justify-between px-5 py-4 pl-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-blue-800">Vous souhaitez ajouter un réseau social non référencé</h3>
                            <button onClick={() => setModalOpen(false)} aria-label="Fermer"
                                className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-blue-50 hover:text-blue-700 hover:rotate-90 active:scale-90">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={enregistrer} className="p-5 space-y-4">
                            {modalErreur && <div className="bg-red-50 text-red-700 p-3 rounded text-sm">{modalErreur}</div>}
                            {champInput('Lien du réseau social', 'lien', true)}
                            {champInput('Nom', 'nom', true)}
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Descriptif</label>
                                <textarea
                                    value={form.descriptif}
                                    maxLength={255}
                                    rows={3}
                                    onChange={(e) => setForm({ ...form, descriptif: e.target.value })}
                                    className="field-line"
                                />
                                <p className="mt-1 text-right text-xs text-slate-400">{255 - form.descriptif.length} caractères restants</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Logo</label>
                                {logo ? (
                                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-emerald-300 bg-emerald-50/50 text-sm">
                                        <span className="flex items-center gap-2 min-w-0 truncate text-emerald-900 font-medium">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M2.25 18V6.75A2.25 2.25 0 0 1 4.5 4.5h15A2.25 2.25 0 0 1 21.75 6.75V18a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 18Z" /></svg>
                                            {logo.name}
                                        </span>
                                        <button type="button" onClick={() => setLogo(null)} className="text-red-600 hover:text-red-700 text-xs font-medium shrink-0">Retirer</button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 text-sm text-blue-700 font-medium cursor-pointer hover:border-blue-500 hover:bg-blue-100/70 transition-colors">
                                        <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} className="hidden" />
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                                        Proposer un logo
                                    </label>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                                    Annuler
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-5 py-2.5 btn-primary">
                                    {saving ? 'Enregistrement...' : 'Valider'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
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
            <label className="block text-sm font-medium text-blue-800 mb-1">{label}</label>
            <input
                type={type}
                value={form[name]}
                onChange={update(name)}
                {...(extra || {})}
                className="field-line"
            />
        </div>
    );

    const champSelect = (label, name, options, placeholder = true) => (
        <div>
            <label className="block text-sm font-medium text-blue-800 mb-1">{label}</label>
            <select
                value={form[name]}
                onChange={update(name)}
                className="field-line"
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
            <label className="block text-sm font-medium text-blue-800 mb-1">Niveau de garantie</label>
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
        <div className="bg-white card-sheen rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md">
            <div className="px-5 py-4 bg-blue-50 border-b-2 border-slate-200">
    <h2 className="font-semibold text-blue-700">Simulateur de primes</h2>
</div>
            <form className="p-4" onSubmit={estimer}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">Produit</label>
                        <select
                            value={form.produit}
                            onChange={update('produit')}
                            className="field-line"
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

                    <div className="col-span-2">
                        {champ('CRM (de 0.5 à 3.5)', 'crm', 'number', { min: 0.5, max: 3.5, step: 0.1 })}
                    </div>

                    <div className="col-span-2">{blocGarantie}</div>

                    <div className="col-span-2">
                        <button
                            type="submit"
                            disabled={calculEnCours}
                            className="w-full py-2.5 btn-primary"
                        >
                            {calculEnCours ? 'Calcul...' : 'Estimer'}
                        </button>
                    </div>

                    {erreurCalc && <div className="col-span-2 bg-red-50 text-red-700 p-3 rounded text-sm">{erreurCalc}</div>}

                    {resultat && (
                        <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
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
                </div>
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
            <span className="h-16 w-16 rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-100 shadow-md flex items-center justify-center overflow-hidden p-2.5 transition-shadow duration-300 hover:shadow-lg">
                <img src={f.logo_url} alt={f.nom} className="h-10 w-10 object-contain" />
            </span>
        ) : (
            <span className="h-16 w-16 rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-100 shadow-md flex items-center justify-center overflow-hidden p-2.5 transition-shadow duration-300 hover:shadow-lg">
                <span className="text-slate-400 font-bold text-sm flex items-center justify-center h-10 w-10">
                    {f.nom?.slice(0, 2).toUpperCase()}
                </span>
            </span>
        );

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const ongletThemes = {
        simulateur: {
            actif: 'bg-blue-700 text-white shadow-sm shadow-blue-700/25',
            inactif: 'text-slate-500 hover:bg-slate-100 hover:text-blue-700',
        },
        messagerie: {
            actif: 'bg-blue-700 text-white shadow-sm shadow-blue-700/25',
            inactif: 'text-slate-500 hover:bg-slate-100 hover:text-blue-700',
        },
        reseaux: {
            actif: 'bg-blue-700 text-white shadow-sm shadow-blue-700/25',
            inactif: 'text-slate-500 hover:bg-slate-100 hover:text-blue-700',
        },
    };

    return (
        <div>
            {/* En-tête */}
                <div className="anim-in card-sheen relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-50/60 p-6 md:p-8 mb-8 shadow-sm">
                <div className="relative flex flex-wrap items-center justify-between gap-5">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 border border-blue-100 text-blue-600 text-[11px] font-semibold uppercase tracking-wider mb-3 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 anim-ring" />
                            Extranet partenaires
                        </span>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            <span style={{ color: 'oklch(0.52 0.21 27.14)' }}>Bonjour,</span>{' '}
                            <span style={{ color: 'oklch(0.39 0.21 263.59)' }}>{user?.name}</span>
                        </h1>
                        <p className="text-sm text-slate-500 capitalize mt-2 flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-blue-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            {today} — {estCabinet ? 'Vue de gestion' : 'Votre portefeuille'}
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 rounded-2xl bg-white/70 backdrop-blur border border-slate-200 px-4 py-3 shadow-sm">
                        <span className={`h-9 w-9 flex items-center justify-center rounded-xl text-white text-sm font-bold shadow ${estCabinet ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20' : 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-400/20'}`}>
                            {estCabinet ? '⚙' : '✓'}
                        </span>
                        <div className="leading-tight">
                            <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{estCabinet ? 'Mode' : 'Statut'}</div>
                            <div className="text-sm font-semibold text-slate-700">
                                {estCabinet ? 'Gestion du cabinet' : 'Portefeuille actif'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

            {!data && <div className="text-slate-500">Chargement...</div>}

            {data && (
                <>
                    {/* Cartes statistiques */}
                    <div className="anim-in grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8" style={{ animationDelay: '0.06s' }}>
                        {!estCabinet ? (
                            <>
                                <StatCard label="Demandes en cours" value={data.demandes_en_cours} icon={icones.file} accent="blue" delay={0.08} />
                                <StatCard label="Devis en attente" value={data.devis_en_attente} icon={<span>✉</span>} accent="amber" delay={0.14} />
                                <StatCard label="Contrats actifs" value={data.contrats_actifs} icon={icones.check} accent="emerald" delay={0.20} />
                                <StatCard label="Échéances (120 j)" value={data.echeances} icon={<span>◷</span>} accent="indigo" delay={0.26} />
                                <StatCard label="Commissions du mois" value={`${(data.commissions_mois / 100).toFixed(2)} €`} icon={<span>€</span>} accent="violet" delay={0.32} />
                                <StatCard label="Messages non lus" value={data.messages_non_lus} icon={<span>✉</span>} accent="red" delay={0.38} />
                            </>
                        ) : (
                            <>
                                <StatCard label="Demandes en attente" value={data.demandes_en_attente} icon={icones.file} accent="blue" delay={0.08} />
                                <StatCard label="Dossiers en retard" value={data.dossiers_en_retard} icon={icones.retard} accent="red" delay={0.14} />
                                <StatCard label="Contrats en vigueur" value={data.contrats_en_vigueur} icon={icones.check} accent="emerald" delay={0.20} />
                                <StatCard label="Bordereaux à valider" value={data.bordereaux_a_valider} icon={<span>▤</span>} accent="amber" delay={0.26} />
                            </>
                        )}
                    </div>

                    {/* Partenaires & fournisseurs (cabinet) */}
                    {estCabinet && (
                        <>
                            {/* Barre supérieure : filtres + onglets */}
                            <div className="anim-in bg-gradient-to-b from-slate-50 to-slate-50/60 rounded-2xl border border-slate-200/80 shadow-sm p-3 mb-6 flex flex-wrap items-center justify-between gap-3" style={{ animationDelay: '0.12s' }}>
                                <div className="flex flex-wrap items-center gap-2">
                                    {typesAssurance.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTypeAssurance(t)}
                                            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                                typeAssurance === t
                                                    ? 'bg-blue-700 text-white border-blue-700 shadow-sm shadow-blue-700/20'
                                                    : 'bg-white/70 text-slate-500 border-slate-200 hover:bg-white hover:text-blue-700'
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/70 border border-slate-200/80">
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
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                                ongletDroit === o.id ? ongletThemes[o.id].actif : ongletThemes[o.id].inactif
                                            }`}
                                        >
                                            {o.icone}
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-8 items-stretch">
                                {/* Colonne gauche (col-md-8) : Partenaires & fournisseurs */}
                                <div className="anim-in md:col-span-8 flex flex-col gap-5" style={{ animationDelay: '0.18s' }}>
                                    {msgFour && <div className="bg-amber-50 text-amber-700 p-3 rounded text-sm">{msgFour}</div>}

                                    {/* Partenaires */}
                                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 bg-blue-50 border-b-2 border-slate-200">
    <h2 className="font-semibold text-blue-700">Partenaires</h2>
</div>
                                        <div className="flex flex-wrap gap-3 p-4">
                                            {partenairesAccueil.map((p, i) => {
                                                const url = buildUrl(p.url_assurance);
                                                return (
                                                    <div key={p.id} className="anim-in w-[100px] flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-200/70 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5" style={{ animationDelay: `${0.18 + i * 0.05}s` }}>
                                                        {url ? (
                                                            <a href={url} target="_blank" rel="noreferrer" title={p.url_assurance} className="flex items-center justify-center w-full">
                                                                <LogoFournisseur f={p} />
                                                            </a>
                                                        ) : (
                                                            <LogoFournisseur f={p} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {partenairesAccueil.length === 0 && (
                                                <div className="w-full text-center text-sm text-slate-400 py-6">Aucun partenaire pour le moment.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Fournisseurs */}
                                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex-1 flex flex-col">
                                        <div className="px-5 py-4 bg-blue-50 border-b-2 border-slate-200">
    <h2 className="font-semibold text-blue-700">Fournisseurs</h2>
</div>
                                        <div className="flex flex-wrap gap-3 p-4 flex-1 content-start">
                                            {fournisseursFiltres.map((f, i) => {
                                            const url = buildUrl(f.url_assurance);
                                            return (
                                                <div key={f.id} className="anim-in relative w-[100px] flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-200/70 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5" style={{ animationDelay: `${0.18 + i * 0.05}s` }}>
                                                        <button
                                                            onClick={() => openPlus(f)}
                                                            title={f.devenir_partenaire ? 'Désactiver le partenaire' : 'Devenir partenaire'}
                                                            className="absolute top-1 right-1 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                                                        >
                                                            {f.devenir_partenaire ? (
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                                </svg>
                                                            ) : (
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                        {url ? (
                                                            <a href={url} target="_blank" rel="noreferrer" title={f.url_assurance} className="flex items-center justify-center w-full">
                                                                <LogoFournisseur f={f} />
                                                            </a>
                                                        ) : (
                                                            <LogoFournisseur f={f} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {fournisseursFiltres.length === 0 && (
                                                <div className="col-span-full text-center text-sm text-slate-400 py-6">Aucun fournisseur.</div>
                                            )}
                                        </div>
                                        <div className="px-4 pb-4 pt-1 flex justify-end mt-auto">
                                            <button
                                                onClick={ouvrirAjoutFour}
                                                className="inline-flex items-center gap-2 px-4 py-2 btn-primary"
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                                Ajouter un fournisseur
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Colonne droite (col-md-4) : onglet actif */}
                                <div className="anim-in md:col-span-4 flex flex-col gap-5" style={{ animationDelay: '0.24s' }}>
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
                            </div>
                        </>
                    )}

                    {/* Panneaux de gestion (cabinet) */}
                    {estCabinet ? (
                        <div className="anim-in grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ animationDelay: '0.3s' }}>
                            {/* File d'attribution */}
                            <PanelCard
                                title="File d'attribution"
                                icon={icones.file}
                                accent="bg-gradient-to-br from-blue-500 to-blue-600"
                                tone="blue"
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
                                accent="bg-gradient-to-br from-red-400 to-red-500"
                                tone="red"
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
                                accent="bg-gradient-to-br from-amber-400 to-orange-500"
                                tone="amber"
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
                        <div className="anim-in grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ animationDelay: '0.3s' }}>
                            <PanelCard
                                title="Échéances proches"
                                icon={icones.relance}
                                accent="bg-gradient-to-br from-blue-500 to-blue-600"
                                tone="blue"
                                badge={data.relances?.echeances_proches?.length}
                                footerLink="/echeances"
                            >
                                {data.relances?.echeances_proches?.map((r) => <LigneRelance key={r.id} item={r} />)}
                            </PanelCard>
                            <PanelCard
                                title="Pièces demandées"
                                icon={icones.relance}
                                accent="bg-gradient-to-br from-amber-400 to-orange-500"
                                tone="amber"
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
                    <div className="anim-pop relative bg-white overflow-hidden rounded-lg p-5 shadow-xl max-w-sm w-full">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500" />
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-blue-800">Confirmer l&apos;action</h3>
                            <button
                                onClick={() => setConfirmToggle(null)}
                                aria-label="Fermer"
                                className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-blue-50 hover:text-blue-700 hover:rotate-90 active:scale-90"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
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
                                        <label className="block text-sm font-medium text-blue-800 mb-1">
                                            E-mail de connexion <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={toggleEmail}
                                            onChange={(e) => setToggleEmail(e.target.value)}
                                            placeholder="E-mail du partenaire"
                                            className="field-line"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-blue-800 mb-1">
                                            Mot de passe <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={togglePasse}
                                            onChange={(e) => setTogglePasse(e.target.value)}
                                            placeholder="Minimum 8 caractères"
                                            className="field-line"
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
                                className="px-4 py-2 btn-primary"
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
                    <div className="anim-pop relative bg-white rounded-2xl p-6 shadow-xl max-w-lg w-full my-8 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500" />
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-blue-800">
                                Devenir partenaire — <span className="text-blue-600 font-semibold">{infosTarget.nom}</span>
                            </h3>
                            <button
                                onClick={() => setInfosTarget(null)}
                                aria-label="Fermer"
                                className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-blue-50 hover:text-blue-700 hover:rotate-90 active:scale-90"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">
                                    Partenaire <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={form2.partenaire}
                                    onChange={(e) => setForm2({ ...form2, partenaire: e.target.value })}
                                    placeholder="Nom du partenaire"
                                    className="field-line"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-blue-800 mb-1">Téléphone</label>
                                    <input
                                        value={form2.telephone}
                                        onChange={(e) => setForm2({ ...form2, telephone: e.target.value })}
                                        className="field-line"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-800 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={form2.email}
                                        onChange={(e) => setForm2({ ...form2, email: e.target.value })}
                                        className="field-line"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-800 mb-1">
                                        Mot de passe <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={form2.mot_de_passe}
                                        onChange={(e) => setForm2({ ...form2, mot_de_passe: e.target.value })}
                                        placeholder="Minimum 8 caractères"
                                        className="field-line"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-800 mb-1">Contrats</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form2.contrats}
                                        onChange={(e) => setForm2({ ...form2, contrats: e.target.value })}
                                        className="field-line"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-800 mb-1">Montant primes</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form2.montant_primes}
                                        onChange={(e) => setForm2({ ...form2, montant_primes: e.target.value })}
                                        className="field-line"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Dernier contrat</label>
                                <input
                                    type="date"
                                    value={form2.dernier_contrat}
                                    onChange={(e) => setForm2({ ...form2, dernier_contrat: e.target.value })}
                                    className="field-line"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Documents</label>
                                <div className="flex items-center gap-3">
                                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-700/40 text-sm text-blue-700 hover:bg-blue-50 hover:border-blue-700 transition">
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
                                    className="mt-2 field-line"
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
                                    className="px-5 py-2 btn-primary"
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
                    <div className="anim-pop relative bg-white overflow-hidden rounded-lg p-5 w-full max-w-xl my-8 shadow-xl">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 via-indigo-600 to-red-500" />
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-blue-800">Ajouter un fournisseur</h3>
                            <button
                                onClick={() => setShowAjoutFour(false)}
                                aria-label="Fermer"
                                className="group h-8 w-8 flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:bg-blue-50 hover:text-blue-700 hover:rotate-90 active:scale-90"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {errAjoutFour && <div className="bg-red-50 text-red-700 p-3 rounded text-sm mb-4">{errAjoutFour}</div>}

                        <div className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">
                                    Service du fournisseur <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={formAjoutFour.service}
                                    onChange={(e) => setFormAjoutFour({ ...formAjoutFour, service: e.target.value })}
                                    placeholder="Ex : Compagnie, Mutuelle, Grossiste..."
                                    className="field-line"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">
                                    Nom <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={formAjoutFour.nom}
                                    onChange={(e) => setFormAjoutFour({ ...formAjoutFour, nom: e.target.value })}
                                    placeholder="Nom du fournisseur"
                                    className="field-line"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Descriptif</label>
                                <textarea
                                    value={formAjoutFour.information}
                                    onChange={(e) => setFormAjoutFour({ ...formAjoutFour, information: e.target.value })}
                                    rows={3}
                                    placeholder="Description du fournisseur"
                                    className="field-line"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-blue-800 mb-1">Type d&apos;assurance</label>
                                    <input
                                        value={formAjoutFour.type_assurance}
                                        onChange={(e) => setFormAjoutFour({ ...formAjoutFour, type_assurance: e.target.value })}
                                        placeholder="Ex : Assurances générales, prévoyance, santé..."
                                        className="field-line"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-800 mb-1">URL de l&apos;assurance</label>
                                    <input
                                        value={formAjoutFour.url_assurance}
                                        onChange={(e) => setFormAjoutFour({ ...formAjoutFour, url_assurance: e.target.value })}
                                        placeholder="Ex : https://www.axa.com"
                                        className="field-line"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-800 mb-1">Logo</label>
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
                                    className="px-5 py-2 btn-primary"
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

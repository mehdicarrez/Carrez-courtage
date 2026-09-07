import { useEffect, useMemo, useState } from 'react';
import api from '../../api';
import DynamicForm from '../../components/DynamicForm';

const CLIENT_VIDE = {
    id: null,
    type: 'PHYSIQUE',
    civilite: '',
    nom: '',
    prenom: '',
    email: '',
    email2: '',
    telephone: '',
    tel2: '',
    adresse: '',
    code_postal: '',
    ville: '',
    personne_a_contacter: '',
    forme_juridique: '',
    origine: '',
    preference_contact: '',
    rgpd_consentement: false,
    exclure_marketing: false,
};

const MODES = {
    DISTRIBUTEUR_COURTIER: {
        titre: 'Distributeur / Courtier',
        desc: "Vous accompagnez le client et gérez l'ensemble de la relation commerciale.",
        gradient: 'from-sky-500 to-blue-600',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    APPORTEUR: {
        titre: "Apporteur d'affaires",
        desc: "Vous transmettez un prospect à un partenaire sans gérer le suivi commercial.",
        gradient: 'from-emerald-500 to-teal-600',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3m10-10h-3M5 12H2m17.1-6.1-2.1 2.1M6.9 17.1l-2.1 2.1m0-14.2 2.1 2.1m10.2 10.2 2.1 2.1" strokeLinecap="round" />
            </svg>
        ),
    },
};

export default function ModifierDemande({ demande, onClose, onSaved }) {
    const dr = demande.donnees_risque || {};

    const [groupesProduits, setGroupesProduits] = useState([]);
    const [grossistes, setGrossistes] = useState([]);
    const [categorieActive, setCategorieActive] = useState('');

    const [modeIntervention, setModeIntervention] = useState(dr.mode_intervention || '');
    const [produitId, setProduitId] = useState((dr.produit_ids || [])[0] || '');
    const [fournisseursPlateforme, setFournisseursPlateforme] = useState(dr.fournisseurs_plateforme || []);
    const [mesFournisseurs, setMesFournisseurs] = useState(dr.mes_fournisseurs || []);
    const [nouveauFournisseur, setNouveauFournisseur] = useState('');
    const [client, setClient] = useState(CLIENT_VIDE);

    const [schema, setSchema] = useState(null);
    const [schemaChargement, setSchemaChargement] = useState(false);
    const [values, setValues] = useState(() => {
        const copy = { ...dr };
        delete copy.mode_intervention;
        delete copy.produit_ids;
        delete copy.fournisseurs_plateforme;
        delete copy.mes_fournisseurs;
        return copy;
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/produits').then((res) => setGroupesProduits(res.data.data)).catch(() => {});
        api.get('/grossistes').then((res) => setGrossistes(res.data.data)).catch(() => {});
    }, []);

    useEffect(() => {
        const c = demande.client_detail || {};
        setClient({
            id: c.id || null,
            type: c.type || 'PHYSIQUE',
            civilite: c.civilite || '',
            nom: c.nom || '',
            prenom: c.prenom || '',
            email: c.email || '',
            email2: c.email2 || '',
            telephone: c.telephone || '',
            tel2: c.tel2 || '',
            adresse: c.adresse || '',
            code_postal: c.code_postal || '',
            ville: c.ville || '',
            personne_a_contacter: c.personne_a_contacter || '',
            forme_juridique: c.forme_juridique || '',
            origine: c.origine || '',
            preference_contact: c.preference_contact || '',
            rgpd_consentement: !!c.rgpd_consentement,
            exclure_marketing: !!c.exclure_marketing,
        });
    }, [demande]);

    const produitActuel = useMemo(() => {
        if (!produitId) return null;
        return groupesProduits.flatMap((g) => g.produits).find((p) => p.id === produitId) || null;
    }, [produitId, groupesProduits]);

    useEffect(() => {
        if (!categorieActive && produitActuel) {
            const g = groupesProduits.find((gr) => gr.produits.some((p) => p.id === produitActuel.id));
            if (g) setCategorieActive(g.categorie);
        }
    }, [produitActuel, categorieActive, groupesProduits]);

    useEffect(() => {
        if (!produitActuel?.branche_id) { setSchema(null); return; }
        setSchemaChargement(true);
        api.get(`/branches/${produitActuel.branche_id}/schema`)
            .then((res) => setSchema(res.data.data))
            .catch(() => setSchema(null))
            .finally(() => setSchemaChargement(false));
    }, [produitActuel?.branche_id]);

    const ajouterMesFournisseur = () => {
        const nom = nouveauFournisseur.trim();
        if (!nom) return;
        if (mesFournisseurs.some((n) => n.toLowerCase() === nom.toLowerCase())) {
            setError('Ce fournisseur est déjà ajouté.');
            return;
        }
        setMesFournisseurs((prev) => [...prev, nom]);
        setNouveauFournisseur('');
        setError('');
    };

    const supprimerMesFournisseur = (index) => {
        setMesFournisseurs((prev) => prev.filter((_, i) => i !== index));
    };

    const validerClient = () => {
        if (!client.nom?.trim() && !client.raison_sociale?.trim()) {
            setError('Veuillez renseigner le nom (personne physique) ou la raison sociale (personne morale).');
            return false;
        }
        setError('');
        return true;
    };

    const enregistrer = async () => {
        if (!produitId) {
            setError('Sélectionnez un produit.');
            return;
        }
        if (!validerClient()) return;
        setSubmitting(true);
        setError('');
        try {
            const payloadClient = { ...client };
            if (!payloadClient.id) delete payloadClient.id;
            const payload = {
                branche_id: produitActuel?.branche_id,
                client: payloadClient,
                mode_intervention: modeIntervention,
                produit_ids: produitId ? [produitId] : [],
                fournisseurs_plateforme: fournisseursPlateforme,
                mes_fournisseurs: mesFournisseurs,
                donnees_risque: values,
            };
            await api.patch(`/demandes/${demande.id}`, payload);
            onSaved();
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) setError(Object.values(data.errors).flat().join(' '));
            else setError(data?.message || 'Erreur lors de la modification.');
        } finally {
            setSubmitting(false);
        }
    };

    const setC = (k) => (e) => setClient({ ...client, [k]: e.target.value });
    const label = (t) => <span>{t} <span className="text-red-500">*</span></span>;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl my-6 flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Modifier la demande</h2>
                        <p className="text-sm text-slate-500">{demande.reference} — brouillon</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                </div>

                {error && <div className="mx-6 mt-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm shrink-0">{error}</div>}

                {/* Contenu scrollable */}
                <div className="p-6 overflow-y-auto flex-1 space-y-8">

                    {/* --- Mode d'intervention --- */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Mode d'intervention</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(MODES).map(([cle, m]) => {
                                const actif = modeIntervention === cle;
                                return (
                                    <button key={cle} type="button" onClick={() => { setModeIntervention(cle); setError(''); }}
                                        className={`relative text-left rounded-2xl p-5 border-2 transition-all ${actif ? 'border-blue-600 shadow-lg bg-blue-50/60' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.gradient} text-white flex items-center justify-center shadow-lg mb-3`}>
                                            {m.icon}
                                        </div>
                                        <div className="font-bold text-slate-900 mb-1">{m.titre}</div>
                                        <p className="text-sm text-slate-600">{m.desc}</p>
                                        {actif && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" /></svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* --- Produit --- */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Produit</h3>
                        {!categorieActive ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {groupesProduits.map((g) => (
                                    <button key={g.categorie} type="button"
                                        onClick={() => { setCategorieActive(g.categorie); setError(''); }}
                                        className="group text-left rounded-2xl p-5 border-2 border-slate-200 hover:border-blue-500 bg-white hover:shadow-lg transition-all">
                                        <div className="font-bold text-slate-900">{g.categorie}</div>
                                        <div className="text-sm text-slate-500 mt-1">{g.produits.length} produit(s)</div>
                                        <div className="mt-3 text-sky-600 text-sm font-medium">Choisir →</div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <button type="button" onClick={() => setCategorieActive('')}
                                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.7 16.7a1 1 0 0 0 0-1.4L8.4 11l4.3-4.3a1 1 0 1 0-1.4-1.4l-5 5a1 1 0 0 0 0 1.4l5 5a1 1 0 0 0 1.4 0Z" clipRule="evenodd" /></svg>
                                    Retour aux catégories
                                </button>
                                <h4 className="font-bold text-slate-900 mb-3">{categorieActive}</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {(groupesProduits.find((g) => g.categorie === categorieActive)?.produits || []).map((p) => {
                                        const actif = produitId === p.id;
                                        return (
                                            <button key={p.id} type="button" onClick={() => { setProduitId(p.id); setError(''); }}
                                                className={`relative rounded-xl p-4 text-left border-2 transition-all ${actif ? 'border-blue-600 bg-blue-50/60 shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                                <div className={`text-sm font-semibold leading-snug ${actif ? 'text-blue-800' : 'text-slate-800'}`}>{p.nom}</div>
                                                {actif && (
                                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" /></svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* --- Fournisseurs --- */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Fournisseurs</h3>

                        <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.5 4 5.5v6c0 4.6 3.2 8.7 7.2 10 4-1.3 7.2-5.4 7.2-10v-6l-8-3Zm0 2.1 6 2.25V11.5c-.2-2.8-1.6-5.1-6-6.9Zm0 6.9c-3.5 1.3-5.6 3.8-6 7.4 3.9 0 7.2-.8 6-7.4ZM6.9 7.4l-2.4-.9c.5 3 2.2 5 2.4 5.6v-4.7Zm10.2 0v4.7c.2-.6 1.9-2.6 2.4-5.6l-2.4.9Z" clipRule="evenodd" /></svg>
                                <h4 className="font-bold text-slate-900">Fournisseurs plateforme <span className="text-sky-600">[cocourtage]</span></h4>
                            </div>
                            {grossistes.length === 0 ? (
                                <p className="text-sm text-slate-400">Aucun fournisseur plateforme référencé.</p>
                            ) : (
                                <div className="space-y-2">
                                    {grossistes.map((g) => {
                                        const actif = fournisseursPlateforme.includes(g.id);
                                        return (
                                            <label key={g.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${actif ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                                <input type="checkbox" checked={actif}
                                                    onChange={() => setFournisseursPlateforme((prev) => actif ? prev.filter((x) => x !== g.id) : [...prev, g.id])}
                                                    className="w-4 h-4 accent-sky-600" />
                                                <div>
                                                    <div className="font-semibold text-slate-800">{g.nom}</div>
                                                    {g.orias && <div className="text-xs text-slate-500">ORIAS : {g.orias}</div>}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg p-5">
                            <h4 className="font-bold text-slate-900 mb-2">Mes fournisseurs</h4>
                            <div className="flex gap-2 mb-2">
                                <input value={nouveauFournisseur}
                                    onChange={(e) => setNouveauFournisseur(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterMesFournisseur(); } }}
                                    placeholder="Nom du fournisseur"
                                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                                <button type="button" onClick={ajouterMesFournisseur}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">Ajouter</button>
                            </div>
                            {mesFournisseurs.length > 0 && (
                                <ul className="space-y-1 mt-2">
                                    {mesFournisseurs.map((n, i) => (
                                        <li key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm text-slate-700">
                                            <span>{n}</span>
                                            <button type="button" onClick={() => supprimerMesFournisseur(i)}
                                                className="text-red-500 hover:text-red-700 ml-2">Retirer</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    {/* --- Client --- */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Prospect / client</h3>
                        <div className="bg-white border border-slate-200 rounded-lg p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Type')}</label>
                                    <select value={client.type} onChange={(e) => setClient({ ...client, type: e.target.value })}
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm">
                                        <option value="PHYSIQUE">Personne physique</option>
                                        <option value="MORALE">Personne morale</option>
                                    </select>
                                </div>
                                {client.type === 'PHYSIQUE' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">{label('Nom')}</label>
                                            <input value={client.nom || ''} onChange={setC('nom')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">{label('Prénom')}</label>
                                            <input value={client.prenom || ''} onChange={setC('prenom')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">{label('Raison sociale')}</label>
                                            <input value={client.raison_sociale || ''} onChange={setC('raison_sociale')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">SIREN</label>
                                            <input value={client.siren || ''} onChange={setC('siren')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Forme juridique</label>
                                            <select value={client.forme_juridique || ''} onChange={setC('forme_juridique')}
                                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm">
                                                <option value="">— Sélectionner —</option>
                                                <option value="Coopérative">Coopérative</option>
                                                <option value="SARL">SARL</option>
                                                <option value="EURL">EURL</option>
                                                <option value="SAS">SAS</option>
                                                <option value="SASU">SASU</option>
                                                <option value="SA">SA</option>
                                                <option value="EI">Entreprise individuelle</option>
                                                <option value="Association">Association</option>
                                                <option value="Autre">Autre</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Personne à contacter')}</label>
                                    <input value={client.personne_a_contacter || ''} onChange={setC('personne_a_contacter')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Adresse')}</label>
                                    <input value={client.adresse || ''} onChange={setC('adresse')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Code postal')}</label>
                                    <input value={client.code_postal || ''} onChange={setC('code_postal')} placeholder="19200" className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Ville')}</label>
                                    <input value={client.ville || ''} onChange={setC('ville')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Tél')}</label>
                                    <input value={client.telephone || ''} onChange={setC('telephone')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Tél 2</label>
                                    <input value={client.tel2 || ''} onChange={setC('tel2')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Email</label>
                                    <input type="email" value={client.email || ''} onChange={setC('email')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Email 2</label>
                                    <input type="email" value={client.email2 || ''} onChange={setC('email2')} className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Préférence de contact</label>
                                    <select value={client.preference_contact || ''} onChange={setC('preference_contact')}
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm">
                                        <option value="">— Sélectionner —</option>
                                        <option value="Téléphone">Téléphone</option>
                                        <option value="SMS">SMS</option>
                                        <option value="Whatsapp">Whatsapp</option>
                                        <option value="Email">Email</option>
                                        <option value="Courrier">Courrier</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Origine')}</label>
                                    <input value={client.origine || ''} onChange={setC('origine')} placeholder="Ex : Site web, parrainage, salon..." className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div className="md:col-span-2 flex flex-col gap-2 mt-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input type="checkbox" checked={!!client.rgpd_consentement}
                                            onChange={(e) => setClient({ ...client, rgpd_consentement: e.target.checked })}
                                            className="w-4 h-4 accent-blue-600" />
                                        Consentement RGPD
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                        <input type="checkbox" checked={!!client.exclure_marketing}
                                            onChange={(e) => setClient({ ...client, exclure_marketing: e.target.checked })}
                                            className="w-4 h-4 accent-blue-600" />
                                        Exclure des opérations de comm./marketing
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* --- Données du risque --- */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Données du risque</h3>
                        {schemaChargement ? (
                            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-slate-500">Chargement du formulaire...</p>
                            </div>
                        ) : schema ? (
                            <div className="bg-white border border-slate-200 rounded-lg p-5">
                                <h4 className="font-semibold text-slate-900 mb-3">{schema.branche}</h4>
                                <DynamicForm schema={schema.schema} values={values} onChange={setValues} />
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
                                <p className="text-sm text-slate-400">
                                    {produitId
                                        ? 'Impossible de charger le formulaire pour cette branche.'
                                        : 'Sélectionnez un produit pour afficher les données du risque.'}
                                </p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-slate-200 shrink-0">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700">Annuler</button>
                    <button type="button" onClick={enregistrer} disabled={submitting}
                        className="px-5 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm">
                        {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>
            </div>
        </div>
    );
}

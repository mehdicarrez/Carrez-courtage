import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        points: ["Conseil et intermédiation", "Suivi du dossier client", "Gestion des échanges fournisseur"],
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
        points: ["Mise en relation uniquement", "Aucun suivi client à assurer", "Le partenaire prend le relais"],
        gradient: 'from-emerald-500 to-teal-600',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3m0 14v3m10-10h-3M5 12H2m17.1-6.1-2.1 2.1M6.9 17.1l-2.1 2.1m0-14.2 2.1 2.1m10.2 10.2 2.1 2.1" strokeLinecap="round" />
            </svg>
        ),
    },
};

const CAT_ICONES = {
    'Assurances de dommages': {
        gradient: 'from-rose-500 to-red-600',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.5 4 5.5v6c0 4.6 3.2 8.7 7.2 10 4-1.3 7.2-5.4 7.2-10v-6L12 2.5Zm0 2.2 6 2.4v5.4c0 3.7-2.5 7.2-6 8.3-3.5-1.1-6-4.6-6-8.3V7.1l6-2.4Zm-1 3.8v3.6H10a1 1 0 0 0-.7 1.7l2 2a1 1 0 0 0 1.4 0l2-2a1 1 0 0 0-.7-1.7h-1V8.5a1 1 0 0 0-2 0Z" clipRule="evenodd" /></svg>
        ),
    },
    'Assurances de personnes': {
        gradient: 'from-fuchsia-500 to-purple-600',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm4-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 3.5c-2.6 0-4.5.8-4.5 2.3v.5h9v-.5c0-1.5-1.9-2.3-4.5-2.3Zm-1.6 5.2h3.2c1.9 0 3.1.5 3.1-2.9v-1.6c2.2.9 3.3 2.5 3.3 4.3v.4a3 3 0 0 1-3 3H6.3a3 3 0 0 0 2.4-1.2h.7Zm8.2 4.9H12H4.9A1.5 1.5 0 0 0 3.8 19v.5a1.5 1.5 0 0 1 1.5-1.5h11c.8 0 1.5.5 1.5 1.5v-.5a1.5 1.5 0 0 1 1.8-1.2Z" clipRule="evenodd" /></svg>
        ),
    },
    'Crédit et financement': {
        gradient: 'from-amber-500 to-orange-600',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Zm2 0h14v2H5V8Zm3 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3 0a1 1 0 0 1 0 2h5a1 1 0 0 1 0-2h-5Zm6-2.5a.75.75 0 0 1 .75.75V13H20a.75.75 0 0 1 0 1.5h-.25v.25a.75.75 0 0 1-1.5 0v-.25H17a.75.75 0 0 1 0-1.5h1.25v-.25a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" /></svg>
        ),
    },
    'Énergie': {
        gradient: 'from-yellow-500 to-amber-500',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.2c-.4.5 0 1.3.7 1.3H11l-1 7.5c-.1.9.9 1.4 1.5.7L19 11.3c.5-.7 0-1.7-.8-1.7h-5.3l.1-7.1c0-.9-1-1.4-1.5-.5Z" /></svg>
        ),
    },
    'Travaux': {
        gradient: 'from-orange-500 to-amber-600',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2a3 3 0 0 0-3 3v.3A6 6 0 0 0 6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8a6 6 0 0 0-3-5.7V5a3 3 0 0 0-3-3Zm-1 3a1 1 0 0 1 2 0v.09A6 6 0 0 0 12 5h-.5V5H11Zm-3 7a4 4 0 0 1 .5-2h7a4 4 0 0 1 .5 2v1H8v-1Zm0 3h8v3H8v-3Z" clipRule="evenodd" /></svg>
        ),
    },
    'Réparation': {
        gradient: 'from-slate-500 to-slate-700',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M19.4 4.6a1 1 0 0 1 .3 1.4l-4 5.9-.9 3.1c-.2.1-.4.2-.6.3l-6.6 3.5a1 1 0 1 1-1-1.7l6.4-3.4 3-1 .9-1.4 3.9-5.7a1 1 0 0 1 1.4-.2Zm-6.6 7.9-3.3 1.8-.9 1a4 4 0 0 1-3.6 5.2c1.8-1 2.5-2.2 2.4-3.7l1-1.7 3.2-1.7.9-1.6.6.7h-.3Z" clipRule="evenodd" /></svg>
        ),
    },
    'Immobilier': {
        gradient: 'from-sky-500 to-indigo-600',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2 3 8.8V21h7v-6h4v6h7V8.8L12 2Zm0 3 6 4.3V19h-2v-4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4H6V9.3L12 5Z" clipRule="evenodd" /></svg>
        ),
    },
    'Services aux entreprises': {
        gradient: 'from-teal-500 to-cyan-600',
        icon: (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h10V5H7Zm3 9h4a.5.5 0 0 0 0-1h-4a.5.5 0 0 0 0 1Zm0 2h4a.5.5 0 0 0 0-1h-4a.5.5 0 0 0 0 1ZM9 8.5h6a.5.5 0 0 0 0-1H9a.5.5 0 0 0 0 1Z" clipRule="evenodd" /></svg>
        ),
    },
};

function IconeCategorie({ categorie, petite = false }) {
    const conf = CAT_ICONES[categorie] || { gradient: 'from-slate-400 to-slate-600', icon: null };
    const taille = petite
        ? 'w-11 h-11 rounded-xl ring-2 ring-white/50'
        : 'w-16 h-16 rounded-2xl ring-4 ring-white/40';
    return (
        <div className={`${taille} relative shrink-0 overflow-hidden bg-gradient-to-br ${conf.gradient} text-white flex items-center justify-center shadow-xl`}>
            <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/20" />
            <div className="absolute -bottom-5 -left-3 w-12 h-12 rounded-full bg-black/10" />
            <div className="w-9 h-9 flex items-center justify-center drop-shadow">
                {conf.icon || (
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /></svg>
                )}
            </div>
        </div>
    );
}

export default function NouvelleDemande() {
    const navigate = useNavigate();
    const [etape, setEtape] = useState(1);
    const [modeIntervention, setModeIntervention] = useState('');
    const [groupesProduits, setGroupesProduits] = useState([]);
    const [produitsSelectionnes, setProduitsSelectionnes] = useState([]);
    const [categorieActive, setCategorieActive] = useState('');
    const [grossistes, setGrossistes] = useState([]);
    const [fournisseursPlateforme, setFournisseursPlateforme] = useState([]);
    const [ajouterMesFournisseurs, setAjouterMesFournisseurs] = useState(false);
    const [mesFournisseurs, setMesFournisseurs] = useState([]);
    const [nouveauFournisseur, setNouveauFournisseur] = useState('');
    const [brancheId, setBrancheId] = useState('');
    const [schema, setSchema] = useState(null);
    const [schemaChargement, setSchemaChargement] = useState(false);
    const [values, setValues] = useState({});
    const [clients, setClients] = useState([]);
    const [clientSelection, setClientSelection] = useState('');
    const [client, setClient] = useState(CLIENT_VIDE);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isBrouillon, setIsBrouillon] = useState(false);

    useEffect(() => {
        api.get('/produits').then((res) => setGroupesProduits(res.data.data)).catch(() => {});
        api.get('/grossistes').then((res) => setGrossistes(res.data.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (!schema) return;
        api.get('/clients', { params: { per_page: 100 } })
            .then((res) => setClients(res.data.data))
            .catch(() => {});
    }, [schema]);

    const chargerSchema = async (id) => {
        setSchemaChargement(true);
        setBrancheId(id);
        setSchema(null);
        setValues({});
        try {
            const res = await api.get(`/branches/${id}/schema`);
            setSchema(res.data.data);
        } catch {
            setError('Impossible de charger le formulaire de cette branche.');
            return false;
        } finally {
            setSchemaChargement(false);
        }
        setError('');
        return true;
    };

    const produitSelectionne = (id) => produitsSelectionnes[0] === id;
    const basculerProduit = (id, brancheIdProduit) => {
        setProduitsSelectionnes((prev) => (prev[0] === id ? [] : [id]));
        setBrancheId(brancheIdProduit);
    };

    const allerProduitsVersFournisseurs = () => {
        if (produitsSelectionnes.length === 0) {
            setError('Sélectionnez au moins un produit.');
            return;
        }
        setError('');
        setEtape(3);
    };

    const chargerSchemaSelProduit = async () => {
        const produit = groupesProduits.flatMap((g) => g.produits).find((p) => p.id === produitsSelectionnes[0]);
        if (!produit) {
            setError('Produit introuvable.');
            return false;
        }
        return chargerSchema(produit.branche_id);
    };

    const allerFournisseursVersClient = async () => {
        const ok = await chargerSchemaSelProduit();
        if (ok) setEtape(4);
    };

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
        if (!clientSelection) {
            setError('Sélectionnez un client ou ajoutez un nouveau client.');
            return false;
        }
        if (!client.nom?.trim() && !client.raison_sociale?.trim()) {
            setError('Veuillez renseigner le nom (personne physique) ou la raison sociale (personne morale).');
            return false;
        }
        setError('');
        return true;
    };

    const onSelectClient = (e) => {
        const id = e.target.value;
        setClientSelection(id);
        if (id === '__nouveau__' || !id) {
            setClient(CLIENT_VIDE);
            return;
        }
        const c = clients.find((x) => String(x.id) === String(id));
        if (c) {
            setClient({
                id: c.id,
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
        }
    };

    const envoyer = async (brouillon) => {
        setIsBrouillon(brouillon);
        setSubmitting(true);
        setError('');
        try {
            const payloadClient = { ...client };
            if (!client.id) delete payloadClient.id;
            const res = await api.post('/demandes', {
                branche_id: brancheId,
                mode_intervention: modeIntervention,
                produit_ids: produitsSelectionnes,
                fournisseurs_plateforme: fournisseursPlateforme,
                mes_fournisseurs: mesFournisseurs,
                client: payloadClient,
                donnees_risque: values,
            });
            const id = res.data.data.id;
            if (!brouillon) {
                await api.post(`/demandes/${id}/transitions`, { action: 'soumettre' });
            }
            navigate('/demandes');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setError(Object.values(data.errors).flat().join(' '));
            } else if (data?.pieces_manquantes) {
                setError('Pièces manquantes : ' + data.pieces_manquantes.join(', '));
            } else {
                setError(data?.message || 'Erreur lors de la création.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const label = (t) => <span>{t} <span className="text-red-500">*</span></span>;

    const btnRetour = (vers) => (
        <button type="button" onClick={() => { setError(''); setEtape(vers); }}
            className="px-5 py-2 rounded-lg font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            Retour
        </button>
    );

    const btnSuivant = (labelTxt, onClic, disabled) => (
        <button type="button" onClick={onClic} disabled={disabled}
            className="px-6 py-2.5 rounded-lg font-medium bg-blue-700 text-white hover:bg-blue-800 shadow-sm disabled:opacity-50 transition-colors">
            {labelTxt}
        </button>
    );

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-xl font-bold text-slate-900 mb-4 text-center">Nouvelle demande de tarification</h1>

            {/* Indicateur d'étapes */}
            <div className="flex items-center justify-center gap-2 mb-6 text-xs font-medium text-slate-500">
                {['Intervention', 'Produit', 'Fournisseurs', 'Client', 'Risque'].map((nom, i) => {
                    const num = i + 1;
                    const actif = etape === num;
                    const fait = etape > num;
                    return (
                        <div key={nom} className="flex items-center gap-2">
                            {i > 0 && <div className={`h-0.5 w-6 ${etape > i ? 'bg-blue-600' : 'bg-slate-300'}`} />}
                            <div className="flex items-center gap-1.5">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${actif ? 'bg-blue-700 text-white' : fait ? 'bg-blue-200 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                                    {fait ? '✓' : num}
                                </div>
                                <span className={actif ? 'text-blue-700 font-semibold' : ''}>{nom}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

            {/* Étape 1 : mode d'intervention */}
            {etape === 1 && (
                <div>
                    <h2 className="text-lg font-bold text-slate-900 text-center mb-1">Je choisis mon mode d'intervention sur cette affaire</h2>
                    <p className="text-sm text-slate-500 text-center mb-6">Sélectionnez la façon dont vous intervenez sur cette affaire.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(MODES).map(([cle, m]) => {
                            const actif = modeIntervention === cle;
                            return (
                                <button key={cle} type="button" onClick={() => setModeIntervention(cle)}
                                    className={`relative text-left rounded-2xl p-5 border-2 transition-all ${actif ? 'border-blue-600 shadow-lg bg-blue-50/60' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.gradient} text-white flex items-center justify-center shadow-lg mb-3`}>
                                        {m.icon}
                                    </div>
                                    <div className="font-bold text-slate-900 mb-1">{m.titre}</div>
                                    <p className="text-sm text-slate-600 mb-3">{m.desc}</p>
                                    <ul className="space-y-1">
                                        {m.points.map((p) => (
                                            <li key={p} className="flex items-center gap-2 text-sm text-slate-700">
                                                <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" clipRule="evenodd" /></svg>
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                    {actif && (
                                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" /></svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        {btnSuivant('Suivant', () => { if (!modeIntervention) { setError('Choisissez un mode d\'intervention.'); return; } setError(''); setEtape(2); })}
                    </div>
                </div>
            )}

            {/* Étape 2 : produits */}
            {etape === 2 && (
                <div>
                    <h2 className="text-lg font-bold text-slate-900 text-center mb-1">Je choisis mon produit</h2>
                    <p className="text-sm text-slate-500 text-center mb-6">Sélectionnez d'abord un type, puis votre produit.</p>

                    {!categorieActive ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {groupesProduits.map((g) => (
                                <button key={g.categorie} type="button"
                                    onClick={() => { setCategorieActive(g.categorie); setError(''); }}
                                    className="group text-left rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-500 bg-white hover:shadow-xl transition-all">
                                    <IconeCategorie categorie={g.categorie} />
                                    <div className="mt-4 font-bold text-lg text-slate-900">{g.categorie}</div>
                                    <div className="text-sm text-slate-500 mt-1">{g.produits.length} produit(s)</div>
                                    <div className="mt-4 inline-flex items-center gap-1.5 text-sky-600 text-sm font-semibold">
                                        Voir les produits
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.6 10 7.3 5.7a1 1 0 0 1 0-1.4Z" clipRule="evenodd" /></svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <button type="button" onClick={() => setCategorieActive('')}
                                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.7 16.7a1 1 0 0 0 0-1.4L8.4 11l4.3-4.3a1 1 0 1 0-1.4-1.4l-5 5a1 1 0 0 0 0 1.4l5 5a1 1 0 0 0 1.4 0Z" clipRule="evenodd" /></svg>
                                Retour aux types
                            </button>
                            <div className="flex items-center gap-3 mb-4">
                                <IconeCategorie categorie={categorieActive} />
                                <h3 className="font-bold text-slate-900 text-lg">{categorieActive}</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {(groupesProduits.find((g) => g.categorie === categorieActive)?.produits || []).map((p) => {
                                    const actif = produitSelectionne(p.id);
                                    const conf = CAT_ICONES[categorieActive] || CAT_ICONES['Assurances de dommages'];
                                    return (
                                        <button key={p.id} type="button" onClick={() => basculerProduit(p.id, p.branche_id)}
                                            className={`relative rounded-xl p-4 text-left border-2 transition-all ${actif ? 'border-blue-600 bg-blue-50/60 shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${conf.gradient} text-white flex items-center justify-center shadow mb-2`}>
                                                {conf.icon}
                                            </div>
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
                    <div className="flex justify-between gap-2 mt-6">
                        {btnRetour(1)}
                        {btnSuivant(schemaChargement ? 'Chargement...' : 'Suivant', allerProduitsVersFournisseurs, schemaChargement)}
                    </div>
                </div>
            )}

            {/* Étape 3 : fournisseurs */}
            {etape === 3 && (
                <div>
                    <h2 className="text-lg font-bold text-slate-900 text-center mb-1">Je choisis les fournisseurs</h2>
                    <p className="text-sm text-slate-500 text-center mb-6">Sélectionnez les fournisseurs susceptibles de répondre à votre demande.</p>

                    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.5 4 5.5v6c0 4.6 3.2 8.7 7.2 10 4-1.3 7.2-5.4 7.2-10v-6l-8-3Zm0 2.1 6 2.25V11.5c-.2-2.8-1.6-5.1-6-6.9Zm0 6.9c-3.5 1.3-5.6 3.8-6 7.4 3.9 0 7.2-.8 6-7.4ZM6.9 7.4l-2.4-.9c.5 3 2.2 5 2.4 5.6v-4.7Zm10.2 0v4.7c.2-.6 1.9-2.6 2.4-5.6l-2.4.9Z" clipRule="evenodd" /></svg>
                            <h3 className="font-bold text-slate-900">Fournisseurs plateforme <span className="text-sky-600">[cocourtage]</span></h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            La plateforme vous mettra en relation avec tous les fournisseurs référencés en cocourtage
                            susceptibles de répondre à votre demande. Vous pourrez privilégier et/ou exclure certains
                            fournisseurs/compagnies lors de la validation de votre demande.
                        </p>
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
                        <p className="text-xs text-slate-500 mt-3">
                            Vous pouvez également ajouter vos propres fournisseurs en cochant la case ci-dessous.
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-1">
                            <input type="checkbox" checked={ajouterMesFournisseurs}
                                onChange={(e) => setAjouterMesFournisseurs(e.target.checked)}
                                className="w-4 h-4 accent-emerald-600" />
                            Mes fournisseurs
                        </label>
                        <p className="text-sm text-slate-600 mb-3">
                            En sélectionnant vos fournisseurs directs, vous pourrez :
                        </p>
                        <ul className="text-sm text-slate-700 space-y-1 mb-4">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" clipRule="evenodd" /></svg>
                                Accéder rapidement à l'extranet de votre partenaire depuis la fiche projet
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" clipRule="evenodd" /></svg>
                                Centraliser vos devis Co-Courtages et Fournisseurs sur la même fiche projet
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4Z" clipRule="evenodd" /></svg>
                                Etc.
                            </li>
                        </ul>
                        {ajouterMesFournisseurs && (
                            <div>
                                <div className="flex gap-2 mb-2">
                                    <input value={nouveauFournisseur}
                                        onChange={(e) => setNouveauFournisseur(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ajouterMesFournisseur(); } }}
                                        placeholder="Nom du fournisseur"
                                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                                    <button type="button" onClick={ajouterMesFournisseur}
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700">
                                        Ajouter
                                    </button>
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
                        )}
                    </div>

                    <div className="flex justify-between gap-2 mt-6">
                        {btnRetour(2)}
                        {btnSuivant(schemaChargement ? 'Chargement...' : 'Suivant', allerFournisseursVersClient, schemaChargement)}
                    </div>
                </div>
            )}

            {/* Étape 4 : client */}
            {etape === 4 && (
                <div>
                    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
                        <h2 className="font-semibold text-slate-900 mb-3 text-center">Prospect / client</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
                                {label('Sélectionner un client existant ou ajouter un nouveau')}
                            </label>
                            <select value={clientSelection} onChange={onSelectClient}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                                <option value="">— Choisir un client —</option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nom_complet}</option>
                                ))}
                                <option value="__nouveau__">+ Ajouter un nouveau client</option>
                            </select>
                        </div>

                        {clientSelection && (
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
                                            <input value={client.nom || ''} onChange={(e) => setClient({ ...client, nom: e.target.value })}
                                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">{label('Prénom')}</label>
                                            <input value={client.prenom || ''} onChange={(e) => setClient({ ...client, prenom: e.target.value })}
                                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">{label('Raison sociale')}</label>
                                            <input value={client.raison_sociale || ''} onChange={(e) => setClient({ ...client, raison_sociale: e.target.value })}
                                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">SIREN/SIRET</label>
                                            <input value={client.siren || ''} onChange={(e) => setClient({ ...client, siren: e.target.value })}
                                                placeholder="SIREN" className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700">Forme juridique de l'entreprise</label>
                                            <select value={client.forme_juridique || ''} onChange={(e) => setClient({ ...client, forme_juridique: e.target.value })}
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
                                    <input value={client.personne_a_contacter || ''} onChange={(e) => setClient({ ...client, personne_a_contacter: e.target.value })}
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Adresse')}</label>
                                    <input value={client.adresse || ''} onChange={(e) => setClient({ ...client, adresse: e.target.value })}
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Code postal')}</label>
                                    <input value={client.code_postal || ''} onChange={(e) => setClient({ ...client, code_postal: e.target.value })}
                                        placeholder="19200" className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Ville')}</label>
                                    <input value={client.ville || ''} onChange={(e) => setClient({ ...client, ville: e.target.value })}
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">{label('Tél')}</label>
                                    <input value={client.telephone || ''} onChange={(e) => setClient({ ...client, telephone: e.target.value })}
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Tél 2</label>
                                    <input value={client.tel2 || ''} onChange={(e) => setClient({ ...client, tel2: e.target.value })}
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Email</label>
                                    <input type="email" value={client.email || ''} onChange={(e) => setClient({ ...client, email: e.target.value })}
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Email 2</label>
                                    <input type="email" value={client.email2 || ''} onChange={(e) => setClient({ ...client, email2: e.target.value })}
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Préférence de contact</label>
                                    <select value={client.preference_contact || ''} onChange={(e) => setClient({ ...client, preference_contact: e.target.value })}
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
                                    <input value={client.origine || ''} onChange={(e) => setClient({ ...client, origine: e.target.value })}
                                        placeholder="Ex : Site web, parrainage, salon..."
                                        className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm" />
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
                        )}
                    </div>

                    <div className="flex justify-between gap-2">
                        {btnRetour(3)}
                        {btnSuivant('Suivant', () => { if (validerClient()) setEtape(5); })}
                    </div>
                </div>
            )}

            {/* Étape 5 : risque */}
            {etape === 5 && schema && (
                <div>
                    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-4">
                        <h2 className="font-semibold text-slate-900 mb-3 text-center">{schema.branche}</h2>
                        <DynamicForm schema={schema.schema} values={values} onChange={setValues} />
                    </div>

                    <div className="flex justify-between gap-2 mb-6">
                        {btnRetour(4)}
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button onClick={() => envoyer(false)} disabled={submitting}
                            className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-2 rounded disabled:opacity-50">
                            {submitting ? 'Envoi...' : 'Soumettre la demande'}
                        </button>
                        <button onClick={() => envoyer(true)} disabled={submitting}
                            className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-medium px-5 py-2 rounded disabled:opacity-50">
                            Enregistrer brouillon
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

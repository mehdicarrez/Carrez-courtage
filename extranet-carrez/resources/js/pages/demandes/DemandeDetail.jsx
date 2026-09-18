import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth, estPartenaire } from '../../auth';
import ModifierDemande from './ModifierDemande';
import DevisMessagerie from './DevisMessagerie';
import SignatureDemandeModal from '../../components/SignatureDemandeModal';
import TacheDemandeModal from '../../components/TacheDemandeModal';

const STATUT_CONFIG = {
    BROUILLON: { label: 'Brouillon', color: 'text-slate-500', bg: 'bg-slate-100', dot: 'bg-slate-400', step: 0 },
    SOUMISE: { label: 'Soumise', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-400', step: 1 },
    EN_ETUDE: { label: 'En étude', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500', step: 2 },
    PIECES_MANQUANTES: { label: 'Pièces manquantes', color: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-400', step: 3 },
    DEVIS_EMIS: { label: 'Devis émis', color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500', step: 4 },
    ACCEPTEE: { label: 'Acceptée', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', step: 5 },
    EN_SOUSCRIPTION: { label: 'En souscription', color: 'text-teal-700', bg: 'bg-teal-50', dot: 'bg-teal-500', step: 6 },
    TRANSFORMEE: { label: 'Transformée', color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-600', step: 7 },
    NON_ELIGIBLE: { label: 'Non éligible', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500', step: -1 },
    SANS_SUITE: { label: 'Clôturé', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400', step: -1 },
    EXPIREE: { label: 'Expirée', color: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-300', step: -1 },
};

const fmt = (cts) => ((cts ?? 0) / 100).toFixed(2) + ' €';

const fmtDate = (v) => (v ? String(v).slice(0, 10) : '—');

export default function DemandeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const estCabinet = user && ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user.role);
    const basePath = estPartenaire(user) ? '/espace-partenaire' : '';

    const [demande, setDemande] = useState(null);
    const [devis, setDevis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

const [modal, setModal] = useState(null); // {action, cible, motif_requis}
    const [motif, setMotif] = useState('');

    // Modal modification (brouillon uniquement)
    const [modifierOpen, setModifierOpen] = useState(false);

    // Expansion devis
    const [devisExpanded, setDevisExpanded] = useState(null);

    // Projet Co-Courtage
    const [vueProjet, setVueProjet] = useState(false);

    // Produits (id -> nom) pour affichage
    const [produitsMap, setProduitsMap] = useState({});

    // Détail imprimable (bloc Actions)
    const [detailOpen, setDetailOpen] = useState(false);

    // Précisions libres (colonne motif)
    const [precision, setPrecision] = useState('');
    const [precisionBusy, setPrecisionBusy] = useState(false);

    // Duplication
    const [dupliquerBusy, setDupliquerBusy] = useState(false);

    // Signature électronique + création de tâche
    const [sigOpen, setSigOpen] = useState(false);
    const [sigPre, setSigPre] = useState([]);
    const [sigAdd, setSigAdd] = useState([]);
    const [tacheOpen, setTacheOpen] = useState(false);

    const load = async () => {
        try {
            const [dRes, devisRes] = await Promise.all([
                api.get(`/demandes/${id}`),
                api.get(`/demandes/${id}/devis`),
            ]);
            setDemande(dRes.data.data);
            setDevis(devisRes.data.data);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Demande introuvable.' : 'Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    useEffect(() => {
        api.get('/produits')
            .then((res) => {
                const map = {};
                (res.data.data || []).forEach((g) => (g.produits || []).forEach((p) => { map[p.id] = p.nom; }));
                setProduitsMap(map);
            })
            .catch(() => {});
    }, []);

    useEffect(() => { setPrecision(demande?.motif || ''); }, [demande]);

    const telechargerDocument = async (docId) => {
        try {
            const res = await api.get(`/documents/${docId}/url`);
            window.open(res.data.url, '_blank');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de téléchargement.');
        }
    };

    const executeTransition = async () => {
        if (!modal) return;
        setBusy(true);
        try {
            const body = { action: modal.action };
            if (motif.trim()) body.motif = motif.trim();
            await api.post(`/demandes/${id}/transitions`, body);
            setModal(null);
            setMotif('');
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur de transition.');
        } finally {
            setBusy(false);
        }
    };

    const accepterDevis = async (devisId) => {
        setBusy(true);
        try {
            await api.post(`/devis/${devisId}/transitions`, { action: 'accepter' });
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur.');
        } finally {
            setBusy(false);
        }
    };

    const refuserDevis = async (devisId) => {
        setBusy(true);
        try {
            await api.post(`/devis/${devisId}/transitions`, { action: 'refuser', motif: 'Refusé par le cabinet' });
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur.');
        } finally {
            setBusy(false);
        }
    };

    const sauverPrecision = async () => {
        setPrecisionBusy(true);
        setError('');
        try {
            await api.post(`/demandes/${id}/precision`, { precision });
            await load();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'enregistrement des précisions.");
        } finally {
            setPrecisionBusy(false);
        }
    };

    const dupliquerDemande = async () => {
        if (!window.confirm('Voulez-vous dupliquer cette demande ? Une copie en brouillon sera créée avec une nouvelle référence.')) return;
        setDupliquerBusy(true);
        setError('');
        try {
            const res = await api.post(`/demandes/${id}/dupliquer`);
            navigate(`${basePath}/demandes/${res.data.data.id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la duplication de la demande.');
        } finally {
            setDupliquerBusy(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error && !demande) return <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>;
    if (!demande) return null;

    const sc = STATUT_CONFIG[demande.statut] || STATUT_CONFIG.BROUILLON;

    const nbDevis = devis.length;
    const nbPartenaires = new Set(devis.map((d) => d.propose_par?.organisation_id)).size;

    const refPieces = (() => {
        const r = demande.reference || '';
        const i = r.indexOf('-');
        return i > 0 ? [r.slice(0, i), r.slice(i + 1)] : [r];
    })();

    return (
        <div>
            {/* Back + header */}
            <button onClick={() => navigate(estCabinet ? '/demandes' : '/espace-partenaire/demandes')} className="anim-in flex items-center gap-1 text-sm text-slate-500 hover:text-blue-700 mb-4 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z" clipRule="evenodd" /></svg>
                Retour aux demandes
            </button>

            <div className="anim-in relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-50/60 p-6 md:p-8 mb-6 shadow-sm">
                <div className="flex items-start justify-between gap-5">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-2xl font-bold tracking-tight">
                            <span style={{ color: 'oklch(0.52 0.21 27.14)' }}>{refPieces[0]}</span>
                            {refPieces[1] && <>{' '}<span style={{ color: 'oklch(0.39 0.21 263.59)' }}>{refPieces[1]}</span></>}
                        </h1>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} anim-ring`}></span>
                            {sc.label}
                        </span>
                        {nbDevis > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v8A1.5 1.5 0 0 1 15.5 14h-1l-2.6 2.82a.75.75 0 0 1-1.29-.53V14H4.5A1.5 1.5 0 0 1 3 12.5v-8Z" /></svg>
                                {nbDevis} devis{nbPartenaires > 1 ? ` · ${nbPartenaires} partenaires` : ''}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{demande.branche || '—'}</span>
                        <span>·</span>
                        <span>{demande.client || '—'}</span>
                        {demande.age_jours > 0 && <><span>·</span><span>{demande.age_jours}j</span></>}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                {estCabinet && demande.statut === 'BROUILLON' && (
                    <button onClick={() => { setError(''); setModifierOpen(true); }}
                        className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.6 2.4a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8l-8 8a1 1 0 0 1-.4.24l-3.5 1a1 1 0 0 1-1.24-1.24l1-3.5a1 1 0 0 1 .24-.4l8-8Z" /></svg>
                        Modifier
                    </button>
                )}
                {estPartenaire(user) && (
                    <button onClick={() => navigate(`${basePath}/demandes/${id}/devis`)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                        Saisir un devis
                    </button>
                )}
                </div>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                {error}
            </div>}

            {/* Actions transition */}
            {estCabinet && demande.transitions?.length > 0 && (
                <div className="anim-in bg-white border border-slate-100 rounded-2xl p-4 mb-6 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Actions disponibles</div>
                    <div className="flex flex-wrap gap-2">
                        {demande.transitions.map((t) => (
                            <button key={t.action} onClick={() => setModal(t)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium shadow-sm ${
                                    t.cible === 'NON_ELIGIBLE' ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' :
                                    t.cible === 'SANS_SUITE' ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200' :
                                    t.cible === 'PIECES_MANQUANTES' ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200' :
                                    'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                                }`}>
                                {t.cible === 'EN_ETUDE' && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.25 3A2.25 2.25 0 0 0 3 5.25v9.5A2.25 2.25 0 0 0 5.25 17h9.5A2.25 2.25 0 0 0 17 14.75v-9.5A2.25 2.25 0 0 0 14.75 3h-9.5ZM3.75 5.25a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 .75.75v9.5a.75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75v-9.5Z" /></svg>}
                                {t.cible === 'PIECES_MANQUANTES' && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>}
                                {t.cible === 'NON_ELIGIBLE' && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>}
                                {t.cible === 'SANS_SUITE' && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>}
                                {t.cible === 'EN_SOUSCRIPTION' && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1c3.866 0 7 1.79 7 4s-3.134 4-7 4-7-1.79-7-4 3.134-4 7-4Zm5.694 8.13c.464-.264.91-.583 1.306-.952V10c0 2.21-3.134 4-7 4s-7-1.79-7-4V8.178c.396.37.842.688 1.306.953C5.838 10.006 7.854 10 10 10s4.162.006 5.694.13ZM3 13.179V15c0 2.21 3.134 4 7 4s7-1.79 7-4v-1.822c-.396.37-.842.688-1.306.953-1.532.125-3.548.13-5.694.13s-4.162-.006-5.694-.13C3.842 13.867 3.396 13.548 3 13.179Z" clipRule="evenodd" /></svg>}
                                {t.cible === 'TRANSFORMEE' && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>}
                                {t.cible === 'EXPIREE' && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" /></svg>}
                                {t.cible === 'SOUMISE' && 'Soumettre'}
                                {t.cible === 'EN_ETUDE' && 'Prendre en charge'}
                                {t.cible === 'PIECES_MANQUANTES' && 'Demander pièces'}
                                {t.cible === 'NON_ELIGIBLE' && 'Non éligible'}
                                {t.cible === 'SANS_SUITE' && 'Clôturer'}
                                {t.cible === 'EXPIREE' && 'Expirer'}
                                {t.cible === 'EN_SOUSCRIPTION' && 'Souscrire'}
                                {t.cible === 'TRANSFORMEE' && 'Transformer'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Devis */}
            {devis.length === 0 ? (
                    <div className="anim-in bg-white border border-slate-200 rounded-xl p-12 text-center">
                        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <p className="text-slate-500 text-sm">Aucun devis pour cette demande.</p>
                        {estPartenaire(user) && (
                            <button onClick={() => navigate(`${basePath}/demandes/${id}/devis`)}
                                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">+ Créer un devis</button>
                        )}
                    </div>
                ) : (
                    <div>
                        {/* Barre horizontale de devis */}
                        <div className="anim-in flex gap-2 overflow-x-auto pb-2 border-b border-slate-100 mb-4">
                            {estCabinet && (
                                <button type="button" onClick={() => { setVueProjet(true); setDevisExpanded(null); }}
                                    className={`flex-shrink-0 inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                                        vueProjet
                                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
                                    }`}>
                                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                    Mon projet Co-Courtage
                                </button>
                            )}
                            {devis.map((d) => {
                                const actif = !vueProjet && (devisExpanded || devis[0]?.id) === d.id;
                                return (
                                    <button key={d.id} type="button" onClick={() => { setVueProjet(false); setDevisExpanded(d.id); }}
                                        className={`flex-shrink-0 inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                                            actif
                                                ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
                                        }`}>
                                         {d.propose_par.logo_url ? (
                                                    <img
                                                        src={d.propose_par.logo_url}
                                                        alt=""
                                                        className="w-10 h-10 rounded-lg object-contain border border-slate-200 bg-white flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                        {d.propose_par.nom
                                                            ?.split(' ')
                                                            .map((w) => w[0])
                                                            .slice(0, 2)
                                                            .join('')
                                                            || '??'}
                                                    </div>
                                                )}
                                    </button>
                                );
                            })}
                            {estPartenaire(user) && (
                                <button onClick={() => navigate(`${basePath}/demandes/${id}/devis`)}
                                    className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3.5 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:border-blue-400 transition-colors">
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                                    Nouveau devis
                                </button>
                            )}
                        </div>

                        {/* Projet Co-Courtage */}
                        {vueProjet && (
                            <div className="anim-in relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                                <span className="anim-bar absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[oklch(0.39_0.21_263.59)] via-[oklch(0.48_0.20_262)] to-[oklch(0.52_0.21_27.14)]" />

                                {/* 3 blocs horizontaux */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                                    {/* Bloc 1 — Fournisseur */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 shadow-sm">
                                        <h3 className="text-sm font-semibold text-slate-900 mb-1">Fournisseur</h3>
                                        <div className="text-[10px] uppercase text-slate-500 font-medium mb-3">Tous fournisseurs</div>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            Votre demande de devis en cours de traitement. Vous recevrez une notification par mail à chaque étape d'avancement du dossier (acceptation de l'affaire par un fournisseur, envois d'un devis, demande d'informations complémentaires, ...).
                                        </p>
                                    </div>

                                    {/* Bloc 2 — Détail du demande */}
                                    <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                                        <div className="text-sm font-semibold text-slate-900 mb-4">Détail du demande</div>
                                        <div className="space-y-3">
                                            {[
                                                ['Statut', sc.label],
                                                ['Service', demande.branche || '—'],
                                                ['Produit', ((demande.donnees_risque?.produit_ids) || []).map((pid) => produitsMap[pid]).filter(Boolean).join(', ') || '—'],
                                            ].map(([k, v]) => (
                                                <div key={k} className="bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm">
                                                    <div className="text-[10px] uppercase text-slate-500 font-medium">{k}</div>
                                                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{v || '—'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bloc 3 — Document */}
                                    <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                                        <div className="text-sm font-semibold text-slate-900 mb-4">Document</div>
                                        {!demande.documents || demande.documents.length === 0 ? (
                                            <div className="text-sm text-slate-400 text-center py-4">Aucun document.</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {demande.documents.map((doc) => (
                                                    <div key={doc.id} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-semibold text-slate-900 truncate">
                                                                    {doc.nom_origine}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                                    {doc.type_document || 'Document'}
                                                                    {doc.creation ? ` · ${new Date(doc.creation).toLocaleDateString('fr-FR')}` : ''}
                                                                    {doc.taille ? ` · ${(doc.taille / 1024).toFixed(0)} Ko` : ''}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => telechargerDocument(doc.id)}
                                                                className="text-[10px] font-semibold text-blue-700 hover:text-blue-900 hover:underline flex-shrink-0 mt-0.5"
                                                            >
                                                                <span className="flex items-center gap-1">
                                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                                                                    Télécharger
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bloc 4 — Statut */}
                                    <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                                        <div className="text-sm font-semibold text-slate-900 mb-4">Statut</div>
                                        <div className="space-y-3">
                                            {[
                                                ['Statut du demande', sc.label],
                                                ['Mise à jour', fmtDate(demande.date_statut)],
                                                ['Envoyé le', fmtDate(demande.date_soumission)],
                                                ['Délai', `${demande.age_jours ?? 0} jour(s)`],
                                                ['Prise en charge', fmtDate(demande.date_prise_en_charge)],
                                                ['Devis reçu', `${devis.length} devis`],
                                                ['Devis présélectionné', devis.find((d) => d.statut === 'DEVIS_SIGNE')?.propose_par?.nom || devis.find((d) => d.statut === 'ACCEPTE')?.propose_par?.nom || '—'],
                                            ].map(([k, v]) => (
                                                <div key={k} className="bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm">
                                                    <div className="text-[10px] uppercase text-slate-500 font-medium">{k}</div>
                                                    <div className="text-sm font-semibold text-slate-900 mt-0.5">{v || '—'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bloc 5 — Actions */}
                                    <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                                        <div className="text-sm font-semibold text-slate-900 mb-4">Actions</div>
                                        <div className="space-y-3">
                                            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-lg p-3 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Afficher détail</div>
                                                <p className="text-sm text-slate-600 leading-relaxed mt-1">
                                                    Affiche l'ensemble des détails de la demande avec possibilité d'impression.
                                                </p>
                                                <button onClick={() => setDetailOpen(true)}
                                                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">
                                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" /></svg>
                                                    Afficher détail
                                                </button>
                                            </div>
                                            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-lg p-3 shadow-sm">
                                                <label className="block text-[10px] uppercase text-slate-500 font-medium mb-1" htmlFor="precision">Ajouter précision</label>
                                                <textarea id="precision" value={precision} onChange={(e) => setPrecision(e.target.value)}
                                                    rows="3" placeholder="Précisions complémentaires sur la demande..."
                                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
                                                <button onClick={sauverPrecision} disabled={precisionBusy}
                                                    className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-800 shadow-sm disabled:opacity-50 transition-colors">
                                                    {precisionBusy ? 'Enregistrement...' : 'Enregistrer la précision'}
                                                </button>
                                            </div>
                                            <div className="pt-3 border-t border-slate-100 space-y-2">
                                                <button onClick={dupliquerDemande} disabled={dupliquerBusy}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                                                    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M13.887 3.182c.396.037.79.08 1.183.128C16.194 3.45 17 4.414 17 5.517V16.75A2.25 2.25 0 0 1 14.75 19h-9.5A2.25 2.25 0 0 1 3 16.75V5.517c0-1.103.806-2.068 1.93-2.207.393-.048.787-.09 1.183-.128A3.185 3.185 0 0 1 9.25 1h1.5a3.185 3.185 0 0 1 3.137 2.182ZM4.5 5.517c0-.262.202-.453.344-.475a3.4 3.4 0 0 0 1.422-.492A1.685 1.685 0 0 1 9.25 2.5h1.5c.719 0 1.353.463 1.984 1.05.273.253.586.434.891.561.142.023.344.214.344.406v.109a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-.109Zm8.97 3.783a.75.75 0 0 0-1.06 0l-2.16 2.159-1.07-1.07a.75.75 0 0 0-1.06 1.06l1.6 1.6a.75.75 0 0 0 1.06 0l2.69-2.69a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" /></svg>
                                                    {dupliquerBusy ? 'Duplication...' : 'Dupliquer la demande'}
                                                </button>
                                                <button onClick={() => { setSigPre([]); setSigAdd([]); setSigOpen(true); }}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors">
                                                    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="m10.577 1.332 3.811 1.132-.415 1.017-3.393-1.008V10.35L13.68 8.88l-.41-2.05 1.42-.071.716 3.579c.022.112.022.226 0 .338l-.429 2.143c-.08.403-.3.77-.62 1.032l-3.472 2.88a1.75 1.75 0 0 1-2.4 0l-3.472-2.88a1.75 1.75 0 0 1-.62-1.032l-.429-2.143a1.75 1.75 0 0 1 0-.338l.716-3.579 1.42.071-.41 2.05 3.894 1.47V2.473L8.2 3.481l-.415-1.017 3.792-1.132Z" clipRule="evenodd" /></svg>
                                                    Signature électronique
                                                </button>
                                                <button onClick={() => setTacheOpen(true)}
                                                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors">
                                                    <svg className="w-4 h-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 5.5A3.5 3.5 0 0 1 9.5 2h1A3.5 3.5 0 0 1 14 5.5v.55c1.7.39 3 1.93 3 3.8v3.4A3.25 3.25 0 0 1 13.75 16H6.25A3.25 3.25 0 0 1 3 12.75v-3.4c0-1.87 1.3-3.41 3-3.8V5.5Zm4 3.5a.75.75 0 0 1 .75.75v2.1l.95.5a.75.75 0 1 1-.75 1.3l-1.5-.8A.75.75 0 0 1 9 12.25v-3A.75.75 0 0 1 9.75 8.5Zm1.75-4.5v.53c.42 0 .83.08 1.2.23A2 2 0 0 0 11.25 4h-.75Z" clipRule="evenodd" /></svg>
                                                    Créer une tâche
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Détail du devis sélectionné */}
                        {!vueProjet && (() => {
                            const d = devis.find((x) => x.id === (devisExpanded || devis[0]?.id)) || devis[0];
                            if (!d) return null;
                            return (
                                <div className="anim-in relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                                    <span className="anim-bar absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[oklch(0.39_0.21_263.59)] via-[oklch(0.48_0.20_262)] to-[oklch(0.52_0.21_27.14)]" />

                                {/* ========================================================= */}
                                {/* 3 GRANDS BLOCS HORIZONTAUX                                */}
                                {/* ========================================================= */}

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

                                    {/* ===================================================== */}
                                    {/* GRAND BLOC 1 — PARTENAIRE                             */}
                                    {/* ===================================================== */}

                                    {d.propose_par && (
                                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 shadow-sm">
                                            <h3 className="text-sm font-semibold text-slate-900 mb-4">
                                                Partenaire
                                            </h3>
                                            {/* Logo uniquement */}
                                            <div className="flex items-center gap-3 mb-4">

                                                {d.propose_par.logo_url ? (
                                                    <img
                                                        src={d.propose_par.logo_url}
                                                        alt=""
                                                        className="w-14 h-14 rounded-lg object-contain border border-slate-200 bg-white flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                        {d.propose_par.nom
                                                            ?.split(' ')
                                                            .map((w) => w[0])
                                                            .slice(0, 2)
                                                            .join('')
                                                            || '??'}
                                                    </div>
                                                )}

                                            </div>

                                            {/* Contenu vertical */}
                                            <div className="space-y-3">

                                                <div className="bg-gradient-to-b from-slate-50 to-white rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                    <div className="text-[10px] uppercase text-slate-500 font-medium">
                                                        Raison sociale
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900 mt-1">
                                                        {d.propose_par.nom || '—'}
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-b from-slate-50 to-white rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                    <div className="text-[10px] uppercase text-slate-500 font-medium">
                                                        Type
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900 mt-1">
                                                        {d.propose_par.type || '—'}
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-b from-slate-50 to-white rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                    <div className="text-[10px] uppercase text-slate-500 font-medium">
                                                        Forme juridique
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900 mt-1">
                                                        {d.propose_par.forme_juridique || '—'}
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-b from-slate-50 to-white rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                    <div className="text-[10px] uppercase text-slate-500 font-medium">
                                                        SIREN
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900 mt-1">
                                                        {d.propose_par.siren || '—'}
                                                    </div>
                                                </div>
                                                <div className="bg-gradient-to-b from-slate-50 to-white rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                    <div className="text-[10px] uppercase text-slate-500 font-medium">
                                                        PAYS
                                                    </div>
                                                    <div className="text-sm font-semibold text-slate-900 mt-1">
                                                        {d.propose_par.pays || '—'}
                                                    </div>
                                                </div>

                                            </div>

                                        </div>
                                    )}


                                    {/* ===================================================== */}
                                    {/* GRAND BLOC 2 — DEVIS (finition + infos financières)   */}
                                    {/* ===================================================== */}

                                    <div className="bg-white border border-slate-200 rounded-lg p-4 lg:col-span-2">

                                        {/* Header du devis */}
                                        <div className="flex items-center justify-between gap-3 mb-5">

                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                    {d.version || '1'}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] uppercase text-slate-500 font-medium">Devis</div>
                                                    <h3 className="font-semibold text-slate-900">
                                                        Devis {d.version ? `v${d.version}` : ''}
                                                    </h3>
                                                </div>
                                            </div>

                                            <span
                                                className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                                                    d.statut === 'DEVIS_SIGNE'
                                                        ? 'bg-teal-50 text-teal-700'
                                                        : d.statut === 'ACCEPTE'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : d.statut === 'ENVOYE'
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : d.statut === 'EXPIRE'
                                                        ? 'bg-red-50 text-red-700'
                                                        : d.statut === 'REFUSE'
                                                        ? 'bg-slate-100 text-slate-500'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}
                                            >
                                                {d.statut === 'DEVIS_SIGNE' ? 'Devis signé' : d.statut}
                                            </span>
                                        </div>

                                        {/* Informations financières — grille interne */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                                            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Prime HT</div>
                                                <div className="text-lg font-bold text-slate-900 mt-1">{fmt(d.prime_ht_cts)}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Taxes</div>
                                                <div className="text-sm font-semibold text-slate-900 mt-1">{fmt(d.taxes_cts)}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Prime TTC</div>
                                                <div className="text-lg font-bold text-slate-900 mt-1">{fmt(d.prime_ttc_cts)}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Frais courtage</div>
                                                <div className="text-sm font-semibold text-slate-900 mt-1">{fmt(d.frais_courtage_cts)}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Première échéance</div>
                                                <div className="text-sm font-semibold text-slate-900 mt-1">{fmt(d.premiere_echeance_cts)}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Fractionnement</div>
                                                <div className="text-sm font-semibold text-slate-900 mt-1">{d.fractionnement || '—'}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Effet possible</div>
                                                <div className="text-sm font-semibold text-slate-900 mt-1">{d.date_effet_possible || '—'}</div>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Valide jusqu'au</div>
                                                <div className="text-sm font-semibold text-slate-900 mt-1">{d.date_validite || '—'}</div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {d.statut === 'ENVOYE' && !d.est_expire && estCabinet && (
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                                                <div className="text-[10px] uppercase text-blue-700 font-semibold">Actions</div>
                                                <div className="flex gap-2 flex-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            refuserDevis(d.id);
                                                        }}
                                                        disabled={busy}
                                                        className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-white text-red-600 hover:bg-red-50 border border-red-300 shadow-sm disabled:opacity-50 transition-all hover:shadow"
                                                    >
                                                        <span className="flex items-center justify-center gap-1.5">
                                                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
                                                            Refuser
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            accepterDevis(d.id);
                                                        }}
                                                        disabled={busy}
                                                        className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md disabled:opacity-50 transition-all hover:shadow-lg"
                                                    >
                                                        <span className="flex items-center justify-center gap-1.5">
                                                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                                                            Accepter
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                    </div>


                                    {/* ===================================================== */}
                                    {/* GRAND BLOC 3 — STATUT DU DEVIS                       */}
                                    {/* ===================================================== */}

                                    <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                                        <div className="text-sm font-semibold text-slate-900 mb-4">Statut</div>
                                        <div className="space-y-3">
                                            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Statut du devis</div>
                                                <div className="text-sm font-semibold text-slate-900 mt-0.5">
                                                    {d.statut === 'DEVIS_SIGNE' ? 'Devis signé' : d.statut}
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Devis envoyé le</div>
                                                <div className="text-sm font-semibold text-slate-900 mt-0.5">{fmtDate(d.date_envoye)}</div>
                                            </div>
                                            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm">
                                                <div className="text-[10px] uppercase text-slate-500 font-medium">Mis à jour le</div>
                                                <div className="text-sm font-semibold text-slate-900 mt-0.5">{fmtDate(d.maj_le)}</div>
                                            </div>
                                        </div>
                                    </div>


                                    {/* ===================================================== */}
                                    {/* GRAND BLOC 4 — DOCUMENTS DU DEVIS                   */}
                                    {/* ===================================================== */}

                                    <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-sm font-semibold text-slate-900">Documents</div>
                                            <span className="text-[10px] text-slate-400">{d.documents?.length || 0}</span>
                                        </div>

                                        {!d.documents || d.documents.length === 0 ? (
                                            <div className="text-sm text-slate-400 text-center py-4">
                                                Aucun document joint.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {d.documents.map((doc) => (
                                                    <div key={doc.id} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-semibold text-slate-900 truncate">
                                                                    {doc.nom_origine}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 mt-0.5">
                                                                    {doc.type_document || 'Document'}
                                                                    {doc.creation ? ` · ${new Date(doc.creation).toLocaleDateString('fr-FR')}` : ''}
                                                                    {doc.taille ? ` · ${(doc.taille / 1024).toFixed(0)} Ko` : ''}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                                                <button
                                                                    onClick={() => telechargerDocument(doc.id)}
                                                                    title="Télécharger"
                                                                    className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition-colors"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => { setSigPre([doc.id]); setSigAdd(d.documents || []); setSigOpen(true); }}
                                                                    title="Envoyer pour signature"
                                                                    className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="m10.577 1.332 3.811 1.132-.415 1.017-3.393-1.008V10.35L13.68 8.88l-.41-2.05 1.42-.071.716 3.579c.022.112.022.226 0 .338l-.429 2.143c-.08.403-.3.77-.62 1.032l-3.472 2.88a1.75 1.75 0 0 1-2.4 0l-3.472-2.88a1.75 1.75 0 0 1-.62-1.032l-.429-2.143a1.75 1.75 0 0 1 0-.338l.716-3.579 1.42.071-.41 2.05 3.894 1.47V2.473L8.2 3.481l-.415-1.017 3.792-1.132Z" clipRule="evenodd" /></svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>


                                    {/* ===================================================== */}
                                    {/* GRAND BLOC 5 — INFORMATIONS SUPPLÉMENTAIRES           */}
                                    {/* ===================================================== */}

                                    <div className="bg-white border border-slate-200 rounded-lg p-4 min-h-[120px]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-900">Informations supplémentaires</div>
                                        </div>

                                        {d.garanties && d.garanties.length > 0 ? (
                                            <div>
                                                <div className="text-[10px] uppercase text-slate-500 font-medium mb-2">
                                                    Garanties proposées par le partenaire
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {d.garanties.map((g, i) => (
                                                        <span key={i} className="inline-flex items-center gap-1 text-xs bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                                                            {g.intitule}
                                                            {g.plafond_cts && <span className="text-slate-400">· {fmt(g.plafond_cts)}</span>}
                                                            {g.franchise_cts && <span className="text-slate-400">· fran. {fmt(g.franchise_cts)}</span>}
                                                            <span className={`text-[10px] px-1 rounded ${g.optionnelle ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                {g.optionnelle ? 'opt.' : 'incl.'}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400">Aucune information pour le moment.</div>
                                        )}
                                    </div>

                                </div>

                                {/* ========================================================= */}
                                {/* CONDITIONS PARTICULIÈRES                                 */}
                                {/* ========================================================= */}

                                {d.conditions_particulieres && (
                                    <div className="mb-3">

                                        <div className="text-[10px] uppercase text-slate-500 font-medium mb-1">
                                            Conditions particulières
                                        </div>

                                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                                            {d.conditions_particulieres}
                                        </p>

                                    </div>
                                )}


                                    {/* Messagerie cabinet / partenaire */}
                                    <DevisMessagerie devis={d} onSigne={() => load()} />
                                </div>
                            );
                        })()}
                    </div>
                )
            }

            {/* Modal transition */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-xl shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                modal.cible === 'NON_ELIGIBLE' || modal.cible === 'SANS_SUITE' ? 'bg-red-100' :
                                modal.cible === 'PIECES_MANQUANTES' ? 'bg-orange-100' : 'bg-blue-100'
                            }`}>
                                <svg className={`w-5 h-5 ${
                                    modal.cible === 'NON_ELIGIBLE' || modal.cible === 'SANS_SUITE' ? 'text-red-600' :
                                    modal.cible === 'PIECES_MANQUANTES' ? 'text-orange-600' : 'text-blue-600'
                                }`} viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    {modal.cible === 'EN_ETUDE' && 'Prendre en charge'}
                                    {modal.cible === 'PIECES_MANQUANTES' && 'Demander des pièces'}
                                    {modal.cible === 'NON_ELIGIBLE' && 'Marquer non éligible'}
                                    {modal.cible === 'SANS_SUITE' && 'Clôturer la demande'}
                                    {modal.cible === 'EXPIREE' && 'Marquer expirée'}
                                    {modal.cible === 'EN_SOUSCRIPTION' && 'Lancer la souscription'}
                                    {modal.cible === 'TRANSFORMEE' && 'Transformer la demande'}
                                </h2>
                                <p className="text-sm text-slate-500">Confirmer le passage au statut « {STATUT_CONFIG[modal.cible]?.label || modal.cible} »</p>
                            </div>
                        </div>
                        {modal.motif_requis && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Motif <span className="text-red-500">*</span></label>
                                <textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows={3}
                                    value={motif} onChange={(e) => setMotif(e.target.value)}
                                    placeholder="Motif obligatoire..." autoFocus />
                            </div>
                        )}
                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => { setModal(null); setMotif(''); }}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Annuler</button>
                            <button onClick={executeTransition} disabled={busy || (modal.motif_requis && !motif.trim())}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm disabled:opacity-50 transition-colors ${
                                    modal.cible === 'NON_ELIGIBLE' || modal.cible === 'SANS_SUITE' ? 'bg-red-600 hover:bg-red-700' :
                                    modal.cible === 'PIECES_MANQUANTES' ? 'bg-orange-600 hover:bg-orange-700' :
                                    'bg-blue-600 hover:bg-blue-700'
                                }`}>Confirmer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal détail imprimable */}
            {detailOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[80] backdrop-blur-sm">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            #zone-impression, #zone-impression * { visibility: visible; }
                            #zone-impression { position: absolute; left: 0; top: 0; width: 100%; }
                        }
                    `}</style>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
                        <div id="zone-impression" className="p-6">
                            <div className="flex items-start justify-between gap-3 mb-6">
                                <div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Détail de la demande</div>
                                    <h2 className="text-xl font-bold text-slate-900">{demande.reference}</h2>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                                    {sc.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                {[
                                    ['Service', demande.branche || '—'],
                                    ['Produit', ((demande.donnees_risque?.produit_ids) || []).map((pid) => produitsMap[pid]).filter(Boolean).join(', ') || '—'],
                                    ['Client', demande.client || '—'],
                                    ['Partenaire', demande.partenaire || '—'],
                                    ['Gestionnaire', demande.gestionnaire || '—'],
                                    ['Origine', demande.origine === 'PARTENAIRE' ? 'Partenaire' : 'Cabinet'],
                                    ['Envoyé le', fmtDate(demande.date_soumission)],
                                    ['Mise à jour', fmtDate(demande.date_statut)],
                                    ['Prise en charge', fmtDate(demande.date_prise_en_charge)],
                                    ['Délai', `${demande.age_jours ?? 0} jour(s)`],
                                ].map(([k, v]) => (
                                    <div key={k} className="bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-lg px-3 py-2 shadow-sm">
                                        <div className="text-[10px] uppercase text-slate-500 font-medium">{k}</div>
                                        <div className="text-sm font-semibold text-slate-900 mt-0.5">{v || '—'}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-slate-50 rounded-lg px-3 py-2 mb-4">
                                <div className="text-[10px] uppercase text-slate-500 font-medium">Précisions</div>
                                <div className="text-sm font-semibold text-slate-900 mt-0.5 whitespace-pre-wrap">{demande.motif || '—'}</div>
                            </div>

                            <div className="mb-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Devis reçus ({devis.length})</div>
                                {devis.length === 0 ? (
                                    <p className="text-sm text-slate-400">Aucun devis.</p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {devis.map((d) => (
                                            <div key={d.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                                                <span className="font-medium text-slate-900">{d.propose_par?.nom || '—'} {d.version ? `(v${d.version})` : ''}</span>
                                                <span className="text-slate-500">{d.statut}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Données de risque</div>
                                {Object.entries(demande.donnees_risque || {})
                                    .filter(([k]) => !['produit_ids', 'fournisseurs_plateforme', 'mes_fournisseurs'].includes(k))
                                    .length === 0 ? (
                                    <p className="text-sm text-slate-400">Aucune donnée.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {Object.entries(demande.donnees_risque || {})
                                            .filter(([k]) => !['produit_ids', 'fournisseurs_plateforme', 'mes_fournisseurs'].includes(k))
                                            .map(([k, v]) => (
                                                <div key={k} className="bg-slate-50 rounded-lg px-3 py-2 text-sm">
                                                    <span className="text-[10px] uppercase text-slate-500 font-medium block">{k.replace(/_/g, ' ')}</span>
                                                    <span className="font-semibold text-slate-900">{typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '') || '—'}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Documents ({demande.documents?.length || 0})</div>
                                {!demande.documents || demande.documents.length === 0 ? (
                                    <p className="text-sm text-slate-400">Aucun document.</p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {demande.documents.map((doc) => (
                                            <div key={doc.id} className="bg-slate-50 rounded-lg px-3 py-2 text-sm">
                                                <span className="font-semibold text-slate-900">{doc.nom_origine || doc.type_document || 'Document'}</span>
                                                <span className="text-slate-500"> · {doc.type_document || 'Document'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between gap-2 px-6 pb-6">
                            <button onClick={() => window.print()}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">
                                <span className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3.5 6A1.5 1.5 0 0 0 2 7.5v6A1.5 1.5 0 0 0 3.5 15h.75v-2.5a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 .75.75V15h.75a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 17.5 6H15V3.25a.75.75 0 0 0-.75-.75h-9a.75.75 0 0 0-.75.75V6h-1Zm2.75 3.5h7.5a1 1 0 0 1 1 1v5.25H5.25v-5.25a1 1 0 0 1 1-1Zm5-5h2.5v4.5h-2.5v-4.5Z" /></svg>
                                    Imprimer
                                </span>
                            </button>
                            <button onClick={() => setDetailOpen(false)}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal signature électronique */}
            {sigOpen && (
                <SignatureDemandeModal demande={demande} onClose={() => setSigOpen(false)} documentsPreselectionnes={sigPre} documentsAdditionnels={sigAdd} />
            )}

            {/* Modal création de tâche */}
            {tacheOpen && (
                <TacheDemandeModal demande={demande} onClose={() => setTacheOpen(false)} />
            )}

            {/* Modal modification (brouillon uniquement) */}
            {modifierOpen && (
                <ModifierDemande
                    demande={demande}
                    onClose={() => setModifierOpen(false)}
                    onSaved={async () => {
                        setModifierOpen(false);
                        await load();
                    }}
                />
            )}
        </div>
    );
}

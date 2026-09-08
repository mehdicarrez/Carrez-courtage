import { useEffect, useState } from 'react';
import api from '../../api';

const PAR_PAGE = 10;

function PaginationNav({ page, perPage, total, onChange }) {
    const pages = Math.max(1, Math.ceil(total / perPage));
    if (total === 0) return null;
    return (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500">
                {total} résultat{total > 1 ? 's' : ''} — page {page} sur {pages}
            </span>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-700 hover:bg-white disabled:opacity-40"
                >
                    Précédent
                </button>
                <button
                    onClick={() => onChange(page + 1)}
                    disabled={page >= pages}
                    className="px-3 py-1.5 rounded border border-slate-300 text-xs text-slate-700 hover:bg-white disabled:opacity-40"
                >
                    Suivant
                </button>
            </div>
        </div>
    );
}

export default function FournisseursList() {
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('error');

    const [showForm, setShowForm] = useState(false);
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [target, setTarget] = useState(null);
    const [partnerMode, setPartnerMode] = useState(false);

    const [form1, setForm1] = useState({ service: '', nom: '', information: '', type_assurance: '', url_assurance: '' });
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const [form2, setForm2] = useState({
        partenaire: '', telephone: '', email: '', contrats: '',
        montant_primes: '', dernier_contrat: '', nom_document: '',
        mot_de_passe: '',
    });
    const [document, setDocument] = useState(null);

    const [pagePartenaires, setPagePartenaires] = useState(1);
    const [pageFournisseurs, setPageFournisseurs] = useState(1);
    const [searchPartenaires, setSearchPartenaires] = useState('');
    const [searchFournisseurs, setSearchFournisseurs] = useState('');
    const [confirmToggle, setConfirmToggle] = useState(null);
    const [toggleEmail, setToggleEmail] = useState('');
    const [togglePasse, setTogglePasse] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/fournisseurs');
            setFournisseurs(res.data.data);
        } catch {
            setMsg('Erreur de chargement.');
            setMsgType('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const toDateInput = (d) => {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const j = String(date.getDate()).padStart(2, '0');
        return `${date.getFullYear()}-${m}-${j}`;
    };

    const resetForm1 = () => {
        setForm1({ service: '', nom: '', information: '', type_assurance: '', url_assurance: '' });
        setLogo(null);
        setLogoPreview(null);
    };

    const resetForm2 = () => {
        setForm2({
            partenaire: '', telephone: '', email: '', contrats: '',
            montant_primes: '', dernier_contrat: '', nom_document: '',
            mot_de_passe: '',
        });
        setDocument(null);
    };

    const onLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogo(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const ouvrirAjout = () => {
        setShowForm(true);
        setStep(1);
        setTarget(null);
        setPartnerMode(false);
        resetForm1();
        resetForm2();
    };

    const ouvrirFormPartenaire = (f) => {
        setTarget(f);
        setPartnerMode(true);
        setForm2({
            partenaire: f.partenaire || '',
            telephone: f.telephone || '',
            email: f.email || '',
            contrats: f.contrats ?? '',
            montant_primes: f.montant_primes ?? '',
            dernier_contrat: toDateInput(f.dernier_contrat),
            nom_document: '',
            mot_de_passe: '',
        });
        setDocument(null);
        setStep(2);
        setShowForm(true);
    };

    const creerFournisseur = async () => {
        if (!form1.service.trim() || !form1.nom.trim()) {
            setMsg('Le service et le nom du fournisseur sont obligatoires.');
            setMsgType('error');
            return;
        }
        setMsg('');
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('service', form1.service);
            fd.append('nom', form1.nom);
            fd.append('information', form1.information);
            fd.append('type_assurance', form1.type_assurance);
            fd.append('url_assurance', form1.url_assurance);
            if (logo) fd.append('logo', logo);

            const res = await api.post('/fournisseurs', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setTarget(res.data.data);
            setStep(2);
        } catch (err) {
            setMsg(err.response?.data?.message || 'Erreur lors de la création du fournisseur.');
            setMsgType('error');
        } finally {
            setSaving(false);
        }
    };

    const enregistrerPartenaire = async () => {
        if (!target) return;
        if (partnerMode) {
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form2.email.trim())) {
                setMsg('Un e-mail valide est obligatoire pour activer le partenaire.');
                setMsgType('error');
                return;
            }
            if (!form2.mot_de_passe || form2.mot_de_passe.length < 8) {
                setMsg('Le mot de passe est obligatoire (minimum 8 caractères).');
                setMsgType('error');
                return;
            }
        }
        setSaving(true);
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

            await api.post(`/fournisseurs/${target.id}/informations`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (partnerMode) {
                await api.post(`/fournisseurs/${target.id}/devenir-partenaire`, {
                    email: form2.email.trim(),
                    mot_de_passe: form2.mot_de_passe,
                });
                setMsg('Infos partenaire enregistrées. Fournisseur ajouté au tableau des partenaires.');
            } else {
                setMsg('Fournisseur enregistré avec ses infos partenaire.');
            }
            setMsgType('success');
            setShowForm(false);
            setStep(1);
            setTarget(null);
            setPartnerMode(false);
            resetForm1();
            resetForm2();
            await load();
        } catch (err) {
            setMsg(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
            setMsgType('error');
        } finally {
            setSaving(false);
        }
    };

    const hasPartnerInfo = (f) =>
        !!(f.partenaire?.trim() || f.telephone?.trim() || f.email?.trim());

    const handleTogglePartenaire = async (f) => {
        setMsg('');
        if (!f.devenir_partenaire && !hasPartnerInfo(f)) {
            ouvrirFormPartenaire(f);
            return;
        }
        if (f.devenir_partenaire) {
            setConfirmToggle({ id: f.id, nom: f.nom, action: 'désactiver' });
            return;
        }
        setToggleEmail(f.email || '');
        setTogglePasse('');
        setConfirmToggle({ id: f.id, nom: f.nom, action: 'activer' });
    };

    const confirmerToggle = async () => {
        if (!confirmToggle) return;
        if (confirmToggle.action === 'activer') {
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(toggleEmail.trim())) {
                setMsg('Un e-mail valide est obligatoire pour activer le partenaire.');
                setMsgType('error');
                return;
            }
            if (!togglePasse || togglePasse.length < 8) {
                setMsg('Le mot de passe est obligatoire (minimum 8 caractères).');
                setMsgType('error');
                return;
            }
        }
        try {
            await api.post(`/fournisseurs/${confirmToggle.id}/devenir-partenaire`,
                confirmToggle.action === 'activer'
                    ? { email: toggleEmail.trim(), mot_de_passe: togglePasse }
                    : {}
            );
            setMsg(confirmToggle.action === 'activer'
                ? 'Partenaire activé. Compte créé avec le mot de passe défini.'
                : 'Partenaire désactivé.'
            );
            setMsgType('success');
            await load();
        } catch (err) {
            setMsg(err.response?.data?.message || 'Erreur lors de la modification.');
            setMsgType('error');
        } finally {
            setConfirmToggle(null);
            setToggleEmail('');
            setTogglePasse('');
        }
    };

    const qP = searchPartenaires.trim().toLowerCase();
    const partenairesList = fournisseurs
        .filter((f) => f.devenir_partenaire)
        .filter(
            (f) =>
                !qP ||
                f.nom?.toLowerCase().includes(qP) ||
                f.partenaire?.toLowerCase().includes(qP)
        );

    const pagesPartenaires = Math.max(1, Math.ceil(partenairesList.length / PAR_PAGE));
    const pagePartenairesOk = Math.min(pagePartenaires, pagesPartenaires);
    const partenairesPage = partenairesList.slice(
        (pagePartenairesOk - 1) * PAR_PAGE,
        pagePartenairesOk * PAR_PAGE
    );

    const qF = searchFournisseurs.trim().toLowerCase();
    const fournisseursFiltres = fournisseurs.filter(
        (f) =>
            !qF ||
            f.nom?.toLowerCase().includes(qF) ||
            f.partenaire?.toLowerCase().includes(qF)
    );

    const pagesFournisseurs = Math.max(1, Math.ceil(fournisseursFiltres.length / PAR_PAGE));
    const pageFournisseursOk = Math.min(pageFournisseurs, pagesFournisseurs);
    const fournisseursPage = fournisseursFiltres.slice(
        (pageFournisseursOk - 1) * PAR_PAGE,
        pageFournisseursOk * PAR_PAGE
    );

    const formatMontant = (v) => {
        const n = Number(v || 0);
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
    };

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('fr-FR');
    };

    return (
        <div>
            {/* En-tête */}
            <div className="mb-4">
                <h1 className="text-xl font-bold text-slate-900">Fournisseurs</h1>
                <p className="text-sm text-slate-500 mt-1 max-w-3xl">
                    Veuillez activer les fournisseurs dont vous êtes déjà partenaire ou courtier référencé.
                    <br />
                    Si vous souhaitez effectuer une première demande de partenariat auprès d&apos;un fournisseur, veuillez cliquer sur le bouton &quot;Devenir partenaire&quot;.
                </p>
            </div>

            {msg && (
                <div className={`p-3 rounded mb-4 text-sm ${
                    msgType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                    {msg}
                </div>
            )}

            {/* Modal de confirmation du toggle partenaire */}
            {confirmToggle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <div className="bg-white rounded-lg p-5 shadow-xl max-w-sm w-full">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">
                            Confirmer l&apos;action
                        </h3>
                        {confirmToggle.action === 'activer' ? (
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
                        ) : (
                            <p className="text-sm text-slate-600 mb-6">
                                Voulez-vous <span className="font-medium">désactiver</span> le partenaire{' '}
                                <span className="font-medium text-slate-900">{confirmToggle.nom}</span> ?
                            </p>
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

            {/* Formulaire d'ajout en 2 étapes (modal) */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-lg p-5 w-full max-w-xl my-8 shadow-xl">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 text-sm font-medium ${step === 1 ? 'text-blue-700' : 'text-emerald-600'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    step === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                                }`}>1</span>
                                Fournisseur
                            </div>
                            <div className={`flex items-center gap-2 text-sm font-medium ${step >= 2 ? 'text-blue-700' : 'text-slate-400'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>2</span>
                                Partenaire
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowForm(false); setStep(1); setTarget(null); setPartnerMode(false); resetForm1(); resetForm2(); }}
                            className="text-sm text-slate-500 hover:text-slate-700"
                        >
                            Fermer
                        </button>
                    </div>

                    {step === 1 ? (
                        <div className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Service du fournisseur <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={form1.service}
                                    onChange={(e) => setForm1({ ...form1, service: e.target.value })}
                                    placeholder="Ex : Compagnie, Mutuelle, Grossiste..."
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nom <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={form1.nom}
                                    onChange={(e) => setForm1({ ...form1, nom: e.target.value })}
                                    placeholder="Nom du fournisseur"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descriptif</label>
                                <textarea
                                    value={form1.information}
                                    onChange={(e) => setForm1({ ...form1, information: e.target.value })}
                                    rows={3}
                                    placeholder="Description du fournisseur"
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type d&apos;assurance</label>
                                    <input
                                        value={form1.type_assurance}
                                        onChange={(e) => setForm1({ ...form1, type_assurance: e.target.value })}
                                        placeholder="Ex : Assurances générales, prévoyance, santé..."
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">URL de l&apos;assurance</label>
                                    <input
                                        value={form1.url_assurance}
                                        onChange={(e) => setForm1({ ...form1, url_assurance: e.target.value })}
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
                                        <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
                                    </label>
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="logo" className="w-10 h-10 object-contain rounded border border-slate-200" />
                                    ) : (
                                        <span className="text-xs text-slate-400">Aucun logo sélectionné</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={creerFournisseur}
                                    disabled={saving}
                                    className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Enregistrement...' : 'Suivant'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-lg">
                            {target && (
                                <div className="text-sm text-slate-500">
                                    Saisie des infos partenaire pour <span className="font-medium text-slate-900">{target.nom}</span>
                                </div>
                            )}
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
                                        placeholder="Téléphone"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={form2.email}
                                        onChange={(e) => setForm2({ ...form2, email: e.target.value })}
                                        placeholder="Email"
                                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                {partnerMode && (
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
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contrats</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form2.contrats}
                                        onChange={(e) => setForm2({ ...form2, contrats: e.target.value })}
                                        placeholder="Nombre de contrats"
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
                                        placeholder="Montant des primes"
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
                            <div className="flex justify-between pt-2">
                                <button
                                    onClick={() => {
                                        if (partnerMode) {
                                            setShowForm(false);
                                            setStep(1);
                                            setTarget(null);
                                            setPartnerMode(false);
                                            resetForm2();
                                        } else {
                                            setStep(1);
                                        }
                                    }}
                                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    Retour
                                </button>
                                <button
                                    onClick={enregistrerPartenaire}
                                    disabled={saving}
                                    className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            )}

            {/* Table des partenaires (en haut) */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center justify-between gap-4">
                    <h2 className="font-semibold text-slate-900">Partenaires</h2>
                    <input
                        value={searchPartenaires}
                        onChange={(e) => {
                            setSearchPartenaires(e.target.value);
                            setPagePartenaires(1);
                        }}
                        placeholder="Rechercher partenaire..."
                        className="w-full sm:w-56 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                                <th className="px-4 py-3 font-semibold">Fournisseur</th>
                                <th className="px-4 py-3 font-semibold">Partenaire</th>
                                <th className="px-4 py-3 font-semibold">Téléphone</th>
                                <th className="px-4 py-3 font-semibold">Email</th>
                                <th className="px-4 py-3 font-semibold">Contrats</th>
                                <th className="px-4 py-3 font-semibold">Montant primes</th>
                                <th className="px-4 py-3 font-semibold">Dernier contrat</th>
                                <th className="px-4 py-3 font-semibold">Documents</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partenairesPage.map((p) => (
                                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{p.nom}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{p.partenaire || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{p.telephone || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{p.email || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{p.contrats ?? 0}</td>
                                    <td className="px-4 py-3 text-slate-600">{formatMontant(p.montant_primes)}</td>
                                    <td className="px-4 py-3 text-slate-600">{formatDate(p.dernier_contrat)}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {p.documents?.length
                                            ? p.documents.map((d, i) => (
                                                <a
                                                    key={i}
                                                    href={d.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs bg-slate-100 text-blue-700 rounded px-2 py-0.5 mr-1 hover:bg-blue-50"
                                                    title="Visualiser le document"
                                                >
                                                    <span>{d.nom || d.fichier}</span>
                                                    <span className="text-[10px] text-slate-400">↗</span>
                                                </a>
                                            ))
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                            {partenairesList.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                                        Aucun partenaire pour le moment.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationNav
                    page={pagePartenairesOk}
                    perPage={PAR_PAGE}
                    total={partenairesList.length}
                    onChange={setPagePartenaires}
                />
            </div>

            {loading && <div className="text-slate-500">Chargement...</div>}

            {/* Table des fournisseurs (en bas) */}
            {!loading && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
                        <h2 className="font-semibold text-slate-900">Fournisseurs</h2>
                        <div className="flex items-center gap-3">
                            <input
                                value={searchFournisseurs}
                                onChange={(e) => {
                                    setSearchFournisseurs(e.target.value);
                                    setPageFournisseurs(1);
                                }}
                                placeholder="Rechercher fournisseur..."
                                className="w-full sm:w-56 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={ouvrirAjout}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                            >
                                Ajouter fournisseur
                            </button>
                        </div>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                                <th className="px-4 py-3 font-semibold">Partenaire</th>
                                <th className="px-4 py-3 font-semibold">Logo</th>
                                <th className="px-4 py-3 font-semibold">Nom de fournisseur</th>
                                <th className="px-4 py-3 font-semibold">Information</th>
                                <th className="px-4 py-3 font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fournisseursPage.map((f) => (
                                <tr key={f.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleTogglePartenaire(f)}
                                            title={f.devenir_partenaire ? 'Désactiver le partenaire' : 'Activer le partenaire'}
                                            role="switch"
                                            aria-checked={f.devenir_partenaire}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                                f.devenir_partenaire ? 'bg-emerald-500' : 'bg-slate-300'
                                            }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                                f.devenir_partenaire ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        {f.logo_url ? (
                                            <img
                                                src={f.logo_url}
                                                alt={f.nom}
                                                className="w-10 h-10 object-contain rounded bg-white border border-slate-200"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500 flex items-center justify-center font-bold text-xs">
                                                {f.nom?.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{f.nom}</div>
                                        {f.service && <div className="text-xs text-slate-400">{f.service}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{f.information}</td>
                                    <td className="px-4 py-3">
                                        {f.devenir_partenaire ? (
                                            <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                Partenaire
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-xs px-3 py-1.5 rounded font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                Devenir partenaire
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {fournisseursFiltres.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-slate-500">Aucun fournisseur.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <PaginationNav
                        page={pageFournisseursOk}
                        perPage={PAR_PAGE}
                        total={fournisseursFiltres.length}
                        onChange={setPageFournisseurs}
                    />
                </div>
            )}
        </div>
    );
}
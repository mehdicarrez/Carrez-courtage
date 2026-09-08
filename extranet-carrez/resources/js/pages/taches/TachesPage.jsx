import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const prioriteConfig = {
    FAIBLE: { label: 'Faible', cls: 'bg-slate-100 text-slate-600' },
    BASSE: { label: 'Basse', cls: 'bg-slate-100 text-slate-600' },
    MOYENNE: { label: 'Moyenne', cls: 'bg-blue-50 text-blue-700' },
    HAUTE: { label: 'Haute', cls: 'bg-amber-50 text-amber-700' },
    URGENTE: { label: 'Urgente', cls: 'bg-red-50 text-red-700' },
};

const statutConfig = {
    A_FAIRE: { label: 'À faire', cls: 'bg-slate-100 text-slate-600' },
    EN_COURS: { label: 'En cours', cls: 'bg-blue-50 text-blue-700' },
    TERMINEE: { label: 'Terminée', cls: 'bg-emerald-50 text-emerald-700' },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const emptyForm = {
    client_id: '',
    type: 'SINISTRE',
    objet: 'Ouvrir sinistre',
    description: '',
    priorite: 'MOYENNE',
    statut: 'A_FAIRE',
    date_debut: '',
    date_fin: '',
    date_echeance: '',
    montant: '',
    avancement: 0,
    temps_passe_h: '',
    assignee_id: '',
};

function Field({ label, ...props }) {
    return (
        <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
            <input {...props}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </label>
    );
}

export default function TachesPage() {
    const [taches, setTaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');
    const [filtrePriorite, setFiltrePriorite] = useState('');

    const [tacheOpen, setTacheOpen] = useState(false);
    const [tacheForm, setTacheForm] = useState(emptyForm);
    const [clients, setClients] = useState([]);
    const [suiveurs, setSuiveurs] = useState([]);
    const [savingTache, setSavingTache] = useState(false);

    const openTache = async () => {
        setTacheForm(emptyForm);
        setError('');
        setTacheOpen(true);
        try {
            const [cRes, uRes] = await Promise.all([
                api.get('/clients', { params: { per_page: 500, sort: 'nom' } }),
                api.get('/clients/affectation/utilisateurs'),
            ]);
            setClients(cRes.data.data || []);
            setSuiveurs(uRes.data.data || []);
        } catch (e) { /* silencieux */ }
    };

    const saveTache = async (e) => {
        e.preventDefault();
        if (!tacheForm.client_id) {
            setError('Veuillez sélectionner un client.');
            return;
        }
        setSavingTache(true);
        setError('');
        try {
            await api.post(`/clients/${tacheForm.client_id}/taches`, {
                titre: tacheForm.objet,
                type: tacheForm.type,
                objet: tacheForm.objet,
                description: tacheForm.description,
                priorite: tacheForm.priorite,
                statut: tacheForm.statut,
                date_echeance: tacheForm.date_echeance || null,
                date_debut: tacheForm.date_debut || null,
                date_fin: tacheForm.date_fin || null,
                montant: tacheForm.montant !== '' ? tacheForm.montant : null,
                avancement: tacheForm.avancement ?? 0,
                temps_passe_h: tacheForm.temps_passe_h !== '' ? tacheForm.temps_passe_h : null,
                assignee_id: tacheForm.assignee_id || null,
            });
            setTacheOpen(false);
            charger();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur d'enregistrement.");
        } finally {
            setSavingTache(false);
        }
    };

    const charger = () => {
        setLoading(true);
        api.get('/taches', { params: {
            statut: filtreStatut || undefined,
            priorite: filtrePriorite || undefined,
        }})
            .then((res) => setTaches(res.data.data))
            .catch(() => setError('Erreur de chargement des tâches.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { charger(); }, [filtreStatut, filtrePriorite]);

    const compteur = (statut) =>
        statut ? taches.filter((t) => t.statut === statut).length : taches.length;

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-4">Tâches</h1>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap items-center gap-4 bg-white border border-slate-200 rounded-lg p-4 flex-1">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Statut</label>
                        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}
                            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
                            <option value="">Tous</option>
                            <option value="A_FAIRE">À faire</option>
                            <option value="EN_COURS">En cours</option>
                            <option value="TERMINEE">Terminée</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Priorité</label>
                        <select value={filtrePriorite} onChange={(e) => setFiltrePriorite(e.target.value)}
                            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
                            <option value="">Toutes</option>
                            {Object.keys(prioriteConfig).map((p) => (
                                <option key={p} value={p}>{prioriteConfig[p].label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button onClick={openTache}
                    className="ml-4 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap">
                    + Ajouter une tâche
                </button>
            </div>

            {/* Tableau */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-left">
                        <tr>
                            <th className="px-4 py-2">Réf</th>
                            <th className="px-4 py-2">Client</th>
                            <th className="px-4 py-2">Date limite</th>
                            <th className="px-4 py-2">Objet</th>
                            <th className="px-4 py-2">Statut</th>
                            <th className="px-4 py-2">Priorité</th>
                            <th className="px-4 py-2">Suivi par</th>
                            <th className="px-4 py-2 text-right">Montant en jeu</th>
                        </tr>
                    </thead>
                    <tbody>
                        {taches.map((t) => {
                            const pc = prioriteConfig[t.priorite] || { label: t.priorite, cls: 'bg-slate-100 text-slate-600' };
                            const sc = statutConfig[t.statut] || { label: t.statut, cls: 'bg-slate-100 text-slate-600' };
                            const dl = t.date_echeance || t.date_fin;
                            return (
                                <tr key={t.id} className={`border-t border-slate-100 ${t.statut === 'TERMINEE' ? 'opacity-60' : ''}`}>
                                    <td className="px-4 py-2 font-medium text-slate-900">{t.reference || t.id}</td>
                                    <td className="px-4 py-2">
                                        {t.client_id ? (
                                            <Link to={`/clients/${t.client_id}`} className="text-blue-700 hover:underline">
                                                {t.client_nom || 'Voir le client'}
                                            </Link>
                                        ) : '—'}
                                    </td>
                                    <td className="px-4 py-2">{dl ? fmtDate(dl) : '—'}</td>
                                    <td className="px-4 py-2">
                                        <div className="font-medium text-slate-900">{t.objet || t.titre}</div>
                                        {t.type && <div className="text-xs text-slate-400">{t.type}</div>}
                                    </td>
                                    <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span></td>
                                    <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${pc.cls}`}>{pc.label}</span></td>
                                    <td className="px-4 py-2 text-slate-500">{t.assignee_name || '—'}</td>
                                    <td className="px-4 py-2 text-right font-medium text-slate-900">
                                        {t.montant != null ? `${Number(t.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                        {!loading && taches.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">Aucune tâche.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {!loading && (
                    <div className="border-t border-slate-200 px-4 py-2.5 text-sm text-slate-500 bg-slate-50">
                        {compteur(null)} total — {compteur('A_FAIRE')} à faire, {compteur('EN_COURS')} en cours, {compteur('TERMINEE')} terminée
                    </div>
                )}
            </div>

            {tacheOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl my-6 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                            <div className="flex items-center gap-3">
                                <span className="w-1.5 h-10 bg-white/70 rounded-full"></span>
                                <div>
                                    <h2 className="text-xl font-bold leading-tight">Données Générales</h2>
                                    <p className="text-xs text-blue-100">Ajouter une tâche — la référence sera générée après la création</p>
                                </div>
                            </div>
                            <button onClick={() => setTacheOpen(false)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                            <form onSubmit={saveTache}>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block">
                                            <span className="block text-sm font-medium text-slate-700 mb-1">Client *</span>
                                            <select value={tacheForm.client_id} onChange={(e) => setTacheForm({ ...tacheForm, client_id: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                                                <option value="">Choisir un client...</option>
                                                {clients.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.nom_complet}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    <Field label="Réf" value="(Généré automatiquement)" disabled />
                                    <div>
                                        <label className="block">
                                            <span className="block text-sm font-medium text-slate-700 mb-1">Type *</span>
                                            <select value={tacheForm.type} onChange={(e) => setTacheForm({ ...tacheForm, type: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" disabled>
                                                <option value="SINISTRE">SINISTRE</option>
                                            </select>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block">
                                            <span className="block text-sm font-medium text-slate-700 mb-1">Suivi par *</span>
                                            <select value={tacheForm.assignee_id} onChange={(e) => setTacheForm({ ...tacheForm, assignee_id: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                                                <option value="">Choisir...</option>
                                                {suiveurs.map((u) => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block">
                                            <span className="block text-sm font-medium text-slate-700 mb-1">Objet *</span>
                                            <select value={tacheForm.objet} onChange={(e) => setTacheForm({ ...tacheForm, objet: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                                                <option value="Ouvrir sinistre">Ouvrir sinistre</option>
                                                <option value="Suivi sinistre">Suivi sinistre</option>
                                                <option value="Clôturer sinistre">Clôturer sinistre</option>
                                                <option value="Expertise">Expertise</option>
                                                <option value="Relance">Relance</option>
                                                <option value="Autre">Autre</option>
                                            </select>
                                        </label>
                                    </div>
                                    <Field label="Date début *" type="date" value={tacheForm.date_debut} onChange={(e) => setTacheForm({ ...tacheForm, date_debut: e.target.value })} required />
                                    <Field label="Montant" type="number" min="0" step="0.01" value={tacheForm.montant} onChange={(e) => setTacheForm({ ...tacheForm, montant: e.target.value })} />
                                    <Field label="Date fin *" type="date" value={tacheForm.date_fin} onChange={(e) => setTacheForm({ ...tacheForm, date_fin: e.target.value })} required />
                                    <div>
                                        <label className="block">
                                            <span className="block text-sm font-medium text-slate-700 mb-1">Priorité *</span>
                                            <select value={tacheForm.priorite} onChange={(e) => setTacheForm({ ...tacheForm, priorite: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                <option value="FAIBLE">Faible</option>
                                                <option value="BASSE">Basse</option>
                                                <option value="MOYENNE">Moyenne</option>
                                                <option value="HAUTE">Haute</option>
                                                <option value="URGENTE">Urgente</option>
                                            </select>
                                        </label>
                                    </div>
                                    <Field label="Avancement (%)" type="number" min="0" max="100" value={tacheForm.avancement} onChange={(e) => setTacheForm({ ...tacheForm, avancement: e.target.value })} />
                                    <div className="col-span-2">
                                        <label className="block">
                                            <span className="block text-sm font-medium text-slate-700 mb-1">Description *</span>
                                            <textarea value={tacheForm.description} onChange={(e) => setTacheForm({ ...tacheForm, description: e.target.value })} rows={3} required
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                                        </label>
                                    </div>
                                    <Field label="Temps passé (h)" type="number" min="0" step="0.5" value={tacheForm.temps_passe_h} onChange={(e) => setTacheForm({ ...tacheForm, temps_passe_h: e.target.value })} />
                                    <div>
                                        <label className="block">
                                            <span className="block text-sm font-medium text-slate-700 mb-1">Statut *</span>
                                            <select value={tacheForm.statut} onChange={(e) => setTacheForm({ ...tacheForm, statut: e.target.value })}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                <option value="A_FAIRE">À faire</option>
                                                <option value="EN_COURS">En cours</option>
                                                <option value="TERMINEE">Terminée</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                                    <button type="button" onClick={() => setTacheOpen(false)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">Annuler</button>
                                    <button type="submit" disabled={savingTache}
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                                        {savingTache ? 'Enregistrement...' : 'Enregistrer'}
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
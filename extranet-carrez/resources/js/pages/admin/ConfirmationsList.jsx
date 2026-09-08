import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';

const statutLabels = {
    EN_ATTENTE: 'En attente',
    VALIDEE: 'Validée',
    REFUSEE: 'Refusée',
};

const statutConfig = {
    EN_ATTENTE: { cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    VALIDEE: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    REFUSEE: { cls: 'bg-red-50 text-red-700 ring-red-200' },
};

export default function ConfirmationsList() {
    const { user } = useAuth();
    const estAdmin = user?.role === 'ADMIN';

    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statut, setStatut] = useState('');

    const [confirmer, setConfirmer] = useState(null); // {id, nom}
    const [confirmerBusy, setConfirmerBusy] = useState(false);

    const [refuser, setRefuser] = useState(null); // {id, nom}
    const [motif, setMotif] = useState('');
    const [refuserBusy, setRefuserBusy] = useState(false);

    const [msg, setMsg] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const params = {};
            if (statut) params.statut = statut;
            const res = await api.get('/demandes-inscriptions', { params });
            setDemandes(res.data.data);
        } catch {
            setError('Erreur de chargement des demandes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statut]);

    const approuver = async () => {
        if (!confirmer) return;
        setConfirmerBusy(true);
        setMsg('');
        try {
            await api.post(`/demandes-inscriptions/${confirmer.id}/approuver`);
            setMsg(`Compte de « ${confirmer.nom} » créé : le partenaire peut maintenant se connecter.`);
            setConfirmer(null);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la confirmation.');
        } finally {
            setConfirmerBusy(false);
        }
    };

    const refuserDemande = async () => {
        if (!refuser) return;
        if (!motif.trim()) {
            setError('Le motif du refus est obligatoire.');
            return;
        }
        setRefuserBusy(true);
        setMsg('');
        try {
            await api.post(`/demandes-inscriptions/${refuser.id}/refuser`, { motif: motif.trim() });
            setMsg(`Demande de « ${refuser.nom} » refusée.`);
            setRefuser(null);
            setMotif('');
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du refus.');
        } finally {
            setRefuserBusy(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const enAttente = demandes.filter((d) => d.statut === 'EN_ATTENTE').length;

    return (
        <div>
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-slate-900">Confirmations</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                    Demandes de création de compte partenaire issues de la page de connexion.
                    {enAttente > 0 && <span className="font-medium text-amber-700"> — {enAttente} en attente.</span>}
                </p>
            </div>

            {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2 shadow-sm">
                <select
                    value={statut}
                    onChange={(e) => setStatut(e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Toutes les demandes</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="VALIDEE">Validées</option>
                    <option value="REFUSEE">Refusées</option>
                </select>
            </div>

            {loading && <div className="text-slate-500">Chargement...</div>}

            {!loading && demandes.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
                    <p className="text-slate-500 font-medium">Aucune demande d'inscription.</p>
                </div>
            )}

            {!loading && demandes.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3">Nom</th>
                                    <th className="px-4 py-3">E-mail</th>
                                    <th className="px-4 py-3">Téléphone</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Statut</th>
                                    <th className="px-4 py-3">Traité le</th>
                                    {estAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {demandes.map((d) => {
                                    const sc = statutConfig[d.statut] || statutConfig.EN_ATTENTE;
                                    return (
                                        <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-slate-900">{d.nom}</td>
                                            <td className="px-4 py-3 text-slate-600">{d.email}</td>
                                            <td className="px-4 py-3 text-slate-600">{d.telephone || '—'}</td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(d.date_demande)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${sc.cls}`}>
                                                    {statutLabels[d.statut]}
                                                </span>
                                                {d.statut === 'REFUSEE' && d.motif_refus && (
                                                    <div className="text-xs text-slate-500 mt-1 max-w-[220px] truncate" title={d.motif_refus}>
                                                        {d.motif_refus}
                                                    </div>
                                                )}
                                                {d.statut === 'VALIDEE' && d.traite_par && (
                                                    <div className="text-xs text-slate-400 mt-1">par {d.traite_par}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(d.traite_le)}</td>
                                            {estAdmin && (
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    {d.statut === 'EN_ATTENTE' ? (
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <button
                                                                onClick={() => { setConfirmer({ id: d.id, nom: d.nom }); setError(''); }}
                                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                                                            >
                                                                Approuver
                                                            </button>
                                                            <button
                                                                onClick={() => { setRefuser({ id: d.id, nom: d.nom }); setMotif(''); setError(''); }}
                                                                className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs font-medium hover:bg-red-50"
                                                            >
                                                                Refuser
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {confirmer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <div className="bg-white rounded-lg p-5 shadow-xl max-w-sm w-full">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Confirmer la demande</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Valider l&apos;inscription de <span className="font-medium text-slate-900">{confirmer.nom}</span> ?
                            Un compte partenaire sera créé et il pourra se connecter avec le mot de passe
                            qu&apos;il a choisi.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setConfirmer(null)}
                                className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">
                                Annuler
                            </button>
                            <button onClick={approuver} disabled={confirmerBusy}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                                {confirmerBusy ? 'Validation...' : 'Approuver'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {refuser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
                    <div className="bg-white rounded-lg p-5 shadow-xl max-w-sm w-full">
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Refuser la demande</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Refuser l&apos;inscription de <span className="font-medium text-slate-900">{refuser.nom}</span> ?
                        </p>
                        <textarea
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            rows={3}
                            placeholder="Motif du refus (obligatoire)"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm mb-5"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setRefuser(null)}
                                className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">
                                Annuler
                            </button>
                            <button onClick={refuserDemande} disabled={refuserBusy}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                                {refuserBusy ? 'Refus...' : 'Refuser'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
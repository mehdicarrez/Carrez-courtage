import { useCallback, useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';

export default function EmailsPage() {
    const { user } = useAuth();
    const estCabinet = ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user?.role);

    const [emails, setEmails] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statut, setStatut] = useState('');
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [attach, setAttach] = useState(null); // {email}
    const [cibles, setCibles] = useState({ demande: [], contrat: [] });
    const [attachForm, setAttachForm] = useState({ objet_type: 'demande', objet_id: '', visible_partenaire: false });

    const load = useCallback(async () => {
        setLoading(true);
        setMsg('');
        try {
            const params = { page };
            if (statut) params.statut_rattachement = statut;
            const res = await api.get('/emails', { params });
            setEmails(res.data.data.data || []);
            setTotal(res.data.data.total || 0);
        } catch {
            setMsg('Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    }, [page, statut]);

    useEffect(() => { load(); }, [load]);

    const ouvrirAttachement = async (email) => {
        setAttach(email);
        setAttachForm({ objet_type: 'demande', objet_id: '', visible_partenaire: false });
        try {
            const res = await api.get('/emails/attachements-possibles');
            setCibles(res.data.data);
        } catch {
            setCibles({ demande: [], contrat: [] });
        }
    };

    const rattacher = async () => {
        if (!attachForm.objet_id) return;
        try {
            await api.post(`/emails/${attach.id}/rattacher`, attachForm);
            setAttach(null);
            await load();
        } catch (e) {
            setMsg(e.response?.data?.message || 'Erreur de rattachement.');
        }
    };

    const ciblesList = attachForm.objet_type === 'demande' ? cibles.demande : cibles.contrat;

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">File des e-mails</h1>
            <div className="text-sm text-slate-500 mb-4">{total} e-mail(s) — F-543 : rattachement manuel des e-mails non rattachés.</div>

            {msg && <div className="bg-amber-50 text-amber-700 p-3 rounded mb-4 text-sm">{msg}</div>}

            {/* Filtre */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4">
                <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}
                    className="border border-slate-300 rounded px-2 py-1 text-sm">
                    <option value="">Tous</option>
                    <option value="NON_RATTACHE">Non rattachés</option>
                    <option value="RATTACHE">Rattachés</option>
                    <option value="MANUEL">Rattachement manuel</option>
                </select>
            </div>

            {loading && <div className="text-slate-500">Chargement...</div>}

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-left">
                        <tr>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Sens</th>
                            <th className="px-4 py-2">Expéditeur</th>
                            <th className="px-4 py-2">Destinataires</th>
                            <th className="px-4 py-2">Sujet</th>
                            <th className="px-4 py-2">Rattachement</th>
                            <th className="px-4 py-2">Dossier</th>
                            {estCabinet && <th className="px-4 py-2"></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {emails.map((e) => (
                            <tr key={e.id} className="border-t border-slate-100">
                                <td className="px-4 py-2 whitespace-nowrap">{String(e.created_at || '').slice(0, 16)}</td>
                                <td className="px-4 py-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${e.sens === 'ENTRANT' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {e.sens === 'ENTRANT' ? 'Entrant' : 'Sortant'}
                                    </span>
                                </td>
                                <td className="px-4 py-2">{e.expediteur || '—'}</td>
                                <td className="px-4 py-2 text-slate-500">{(e.destinataires || []).join(', ')}</td>
                                <td className="px-4 py-2 font-medium max-w-xs truncate">{e.sujet}</td>
                                <td className="px-4 py-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                        e.statut_rattachement === 'NON_RATTACHE' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}>{e.statut_rattachement}</span>
                                </td>
                                <td className="px-4 py-2 text-slate-500">{e.objet_type ? `${e.objet_type} #${e.objet_id}` : '—'}</td>
                                {estCabinet && (
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => ouvrirAttachement(e)}
                                            className="text-xs text-blue-700 hover:underline">Rattacher</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {!loading && emails.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">Aucun e-mail.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {total > 25 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                        className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40">Précédent</button>
                    <span className="text-slate-500">Page {page}</span>
                    <button disabled={page * 25 >= total} onClick={() => setPage(page + 1)}
                        className="px-3 py-1 rounded border border-slate-300 disabled:opacity-40">Suivant</button>
                </div>
            )}

            {/* Modal rattachement */}
            {attach && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Rattacher l'e-mail</h2>
                        <p className="text-sm text-slate-500 mb-4 truncate">{attach.sujet}</p>

                        <div className="space-y-3 text-sm">
                            <div>
                                <label className="text-slate-500 text-xs">Type de dossier</label>
                                <select value={attachForm.objet_type}
                                    onChange={(e) => setAttachForm({ ...attachForm, objet_type: e.target.value, objet_id: '' })}
                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1">
                                    <option value="demande">Demande</option>
                                    <option value="contrat">Contrat</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-slate-500 text-xs">Dossier</label>
                                <select value={attachForm.objet_id}
                                    onChange={(e) => setAttachForm({ ...attachForm, objet_id: e.target.value })}
                                    className="block w-full border border-slate-300 rounded px-2 py-1 mt-1">
                                    <option value="">—</option>
                                    {ciblesList.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            </div>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={attachForm.visible_partenaire}
                                    onChange={(e) => setAttachForm({ ...attachForm, visible_partenaire: e.target.checked })} />
                                Visible par le partenaire (RG-56)
                            </label>
                        </div>

                        <div className="flex justify-end gap-2 mt-5">
                            <button onClick={() => setAttach(null)} className="text-sm px-4 py-2 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">Annuler</button>
                            <button onClick={rattacher} disabled={!attachForm.objet_id}
                                className="text-sm px-4 py-2 rounded bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">Rattacher</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

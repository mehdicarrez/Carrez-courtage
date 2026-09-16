import { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';

const EXTENSIONS_ACCEPT = '.pdf,.jpeg,.jpg,.png,.docx,.xlsx,.csv';

export default function DevisMessagerie({ devis, onSigne }) {
    const { user } = useAuth();
    const estCabinet = user && ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user.role);
    const devisId = devis.id;

    const [convId, setConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [contenu, setContenu] = useState('');
    const [visibilite, setVisibilite] = useState('EXTERNE');
    const [fichiers, setFichiers] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [envoi, setEnvoi] = useState(false);
    const [signature, setSignature] = useState(false);
    const [erreur, setErreur] = useState('');
    const fileInput = useRef(null);

    useEffect(() => {
        let annule = false;
        setChargement(true);
        setErreur('');
        setMessages([]);
        setConvId(null);
        setContenu('');
        setFichiers([]);

        api.get(`/conversations/devis/${devisId}`)
            .then((res) => {
                if (annule) return;
                setConvId(res.data.conversation_id);
                setMessages(res.data.messages);
            })
            .catch((err) => {
                if (annule) return;
                setErreur(err.response?.data?.message || 'Erreur de chargement du fil.');
            })
            .finally(() => {
                if (!annule) setChargement(false);
            });

        return () => { annule = true; };
    }, [devisId]);

    const ajouterFichiers = (e) => {
        const liste = Array.from(e.target.files || []);
        setFichiers((prev) => [...prev, ...liste].slice(0, 5));
        e.target.value = '';
    };

    const retirerFichier = (i) => setFichiers((prev) => prev.filter((_, idx) => idx !== i));

    const signerDevis = async () => {
        if (signature) return;
        setSignature(true);
        setErreur('');
        try {
            await api.post(`/devis/${devisId}/contrat`);
            setSignature(false);
            await api.get(`/conversations/devis/${devisId}`)
                .then((res) => {
                    setConvId(res.data.conversation_id);
                    setMessages(res.data.messages);
                });
            if (onSigne) onSigne();
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de la création du contrat.');
            setSignature(false);
        }
    };

    const envoyer = async (e) => {
        e.preventDefault();
        if (envoi || !convId) return;
        if (!contenu.trim() && fichiers.length === 0) return;

        const fd = new FormData();
        fd.append('contenu', contenu);
        fd.append('visibilite', visibilite);
        fichiers.forEach((f) => fd.append('fichiers[]', f));

        setEnvoi(true);
        setErreur('');
        try {
            await api.post(`/conversations/${convId}/messages`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setContenu('');
            setFichiers([]);
            const res = await api.get(`/conversations/devis/${devisId}`);
            setMessages(res.data.messages);
            setConvId(res.data.conversation_id);
        } catch (err) {
            setErreur(err.response?.data?.message || 'Erreur lors de l\'envoi.');
        } finally {
            setEnvoi(false);
        }
    };

    const fmtDate = (d) => {
        const dt = new Date(d);
        return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
            + ' ' + dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.412.993 2.671 2.43 2.902 1.636.266 3.263.37 4.9.387l.81 2.412a.75.75 0 0 0 1.38.028l1.08-2.317c1.919-.25 3.832-.41 5.57-.65 1.384-.267 2.33-1.524 2.33-2.932V5.426c0-1.412-.993-2.671-2.43-2.902A14.983 14.983 0 0 0 10 2Z" clipRule="evenodd" /></svg>
                </div>
                <div>
                    <div className="text-sm font-semibold text-slate-900">Messagerie</div>
                    <div className="text-[10px] text-slate-500">Échanges cabinet / partenaire</div>
                </div>

                {estCabinet && devis.statut === 'ACCEPTE' && !devis.contrat && (
                    <div className="ml-auto">
                        <button
                            type="button"
                            onClick={signerDevis}
                            disabled={signature}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                            {signature ? 'Signature...' : 'Devis signé'}
                        </button>
                    </div>
                )}
            </div>

            {erreur && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">{erreur}</div>}

            {/* Fil de messages */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 max-h-72 overflow-y-auto space-y-3 mb-3">
                {chargement && <div className="text-sm text-slate-400 text-center py-4">Chargement...</div>}
                {!chargement && messages.length === 0 && (
                    <div className="text-sm text-slate-400 text-center py-4">Aucun message. Lancez l'échange.</div>
                )}
                {messages.map((m) => {
                    const moi = user && m.auteur_id === user.id;
                    const interne = m.visibilite === 'INTERNE';
                    return (
                        <div key={m.id} className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm ${
                            moi ? 'bg-blue-600 text-white ml-auto' : 'bg-white border border-slate-200'
                        }`}>
                            <div className={`text-[10px] mb-1 ${moi ? 'text-blue-100' : 'text-slate-500'}`}>
                                {moi ? 'Moi' : (m.auteur || 'Utilisateur')} · {fmtDate(m.created_at)}
                                {interne && <span className={moi ? 'text-blue-100 ml-1.5' : 'text-amber-600 ml-1.5'}>· note interne</span>}
                            </div>
                            {m.contenu && <div className="whitespace-pre-wrap">{m.contenu}</div>}
                            {(m.pieces_jointes || []).length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    {m.pieces_jointes.map((p, i) => (
                                        <a
                                            key={i}
                                            href={p.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium border ${
                                                moi
                                                    ? 'bg-blue-500/30 border-blue-300/40 text-white hover:bg-blue-500/50'
                                                    : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                            }`}
                                        >
                                            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                                            <span className="truncate">{p.nom}</span>
                                            <span className={moi ? 'text-blue-100' : 'text-slate-400'}>{p.taille ? `${(p.taille / 1024).toFixed(0)} Ko` : ''}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Composer */}
            <form onSubmit={envoyer} className="space-y-2">
                <div className="flex gap-2">
                    <input
                        type="file"
                        multiple
                        accept={EXTENSIONS_ACCEPT}
                        className="hidden"
                        ref={fileInput}
                        onChange={ajouterFichiers}
                    />
                    <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 flex-shrink-0"
                        title="Attacher un fichier"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                    </button>
                    <textarea
                        rows={2}
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Votre message..."
                        value={contenu}
                        maxLength={4000}
                        onChange={(e) => setContenu(e.target.value)}
                    />
                    {estCabinet && (
                        <select
                            className="border border-slate-300 rounded-lg px-2 text-sm flex-shrink-0"
                            value={visibilite}
                            onChange={(e) => setVisibilite(e.target.value)}
                        >
                            <option value="EXTERNE">Externe</option>
                            <option value="INTERNE">Interne</option>
                        </select>
                    )}
                </div>

                {(fichiers || []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {fichiers.map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-2.5 py-1">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" /></svg>
                                <span className="max-w-[180px] truncate">{f.name}</span>
                                <button type="button" onClick={() => retirerFichier(i)} className="text-blue-500 hover:text-blue-800 font-bold">×</button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={envoi || (!contenu.trim() && fichiers.length === 0)}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {envoi ? 'Envoi...' : 'Envoyer'}
                    </button>
                </div>
            </form>
        </div>
    );
}
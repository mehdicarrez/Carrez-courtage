import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';

const objets = [
    { type: 'demande', label: 'Demandes', source: '/demandes', mk: (d) => ({ id: d.id, libelle: `${d.reference} — ${d.client || ''}` }) },
    { type: 'contrat', label: 'Contrats', source: '/contrats', mk: (c) => ({ id: c.id, libelle: `${c.reference} — ${c.client || ''}` }) },
];

export default function MessagesPage() {
    const { user } = useAuth();
    const estCabinet = user && ['ADMIN', 'GESTIONNAIRE', 'CONSEILLER', 'COMPTABLE'].includes(user.role);
    const [activeType, setActiveType] = useState('demande');
    const [liste, setListe] = useState([]);
    const [selected, setSelected] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [error, setError] = useState('');
    const [contenu, setContenu] = useState('');
    const [visibilite, setVisibilite] = useState('EXTERNE');

    const ledger = (type) => {
        const o = objets.find((x) => x.type === type);
        setActiveType(type);
        setSelected(null);
        setMessages([]);
        api.get(o.source)
            .then((res) => setListe((res.data.data || []).map(o.mk)))
            .catch(() => setError('Erreur de chargement.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        ledger('demande');
        // eslint-disable-next-line
    }, []);

    const ouvrir = async (obj) => {
        setSelected(obj);
        setLoadingThread(true);
        setError('');
        try {
            const res = await api.get(`/conversations/${activeType}/${obj.id}`);
            setConversation(res.data.conversation_id);
            setMessages(res.data.messages);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Objet introuvable.' : 'Erreur de chargement du fil.');
        } finally {
            setLoadingThread(false);
        }
    };

    const poster = async (e) => {
        e.preventDefault();
        if (!contenu.trim() || !conversation) return;
        try {
            await api.post(`/conversations/${conversation}/messages`, { contenu, visibilite });
            setContenu('');
            const res = await api.get(`/conversations/${activeType}/${selected.id}`);
            setMessages(res.data.messages);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'envoi.');
        }
    };

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-4">Messagerie</h1>
            <div className="flex gap-4">
                <div className="w-80 flex-shrink-0">
                    <div className="flex gap-2 mb-3">
                        {objets.map((o) => (
                            <button
                                key={o.type}
                                onClick={() => ledger(o.type)}
                                className={`px-3 py-1.5 rounded text-sm ${
                                    activeType === o.type
                                        ? 'bg-blue-700 text-white'
                                        : 'bg-white border border-slate-200 text-slate-700'
                                }`}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-[70vh] overflow-y-auto">
                        {loading && <div className="p-4 text-sm text-slate-500">Chargement...</div>}
                        {!loading && liste.length === 0 && (
                            <div className="p-4 text-sm text-slate-500">Aucun objet.</div>
                        )}
                        {liste.map((o) => (
                            <button
                                key={o.id}
                                onClick={() => ouvrir(o)}
                                className={`block w-full text-left px-4 py-3 border-b last:border-0 text-sm hover:bg-slate-50 ${
                                    selected?.id === o.id ? 'bg-blue-50' : ''
                                }`}
                            >
                                {o.libelle}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-white border border-slate-200 rounded-lg flex flex-col min-h-[70vh]">
                    {!selected && (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                            Sélectionnez un objet pour ouvrir sa conversation.
                        </div>
                    )}
                    {selected && (
                        <>
                            <div className="px-4 py-3 border-b border-slate-100 font-medium text-slate-900">
                                {objets.find((o) => o.type === activeType).label} — {selected.libelle}
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto max-h-[52vh] space-y-3">
                                {loadingThread && <div className="text-sm text-slate-500">Chargement...</div>}
                                {messages.length === 0 && !loadingThread && (
                                    <div className="text-sm text-slate-400">Aucun message. Lancez l'échange.</div>
                                )}
                                {messages.map((m) => (
                                    <div key={m.id} className={`max-w-[75%] p-3 rounded text-sm ${m.visibilite === 'INTERNE' ? 'bg-amber-50 border border-amber-200' : 'bg-slate-100'}`}>
                                        <div className="text-xs text-slate-500 mb-1">
                                            {m.auteur || '?·'} — {m.created_at}
                                            {m.visibilite === 'INTERNE' && <span className="ml-2 text-amber-600">(note interne)</span>}
                                        </div>
                                        <div className="whitespace-pre-wrap">{m.contenu}</div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={poster} className="p-4 border-t border-slate-100 flex gap-2">
                                <input
                                    className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
                                    placeholder="Votre message..."
                                    value={contenu}
                                    onChange={(e) => setContenu(e.target.value)}
                                />
                                {estCabinet && (
                                    <select
                                        className="border border-slate-300 rounded px-2 text-sm"
                                        value={visibilite}
                                        onChange={(e) => setVisibilite(e.target.value)}
                                    >
                                        <option value="EXTERNE">Externe</option>
                                        <option value="INTERNE">Interne</option>
                                    </select>
                                )}
                                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white text-sm">
                                    Envoyer
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded mt-4 text-sm">{error}</div>}
        </div>
    );
}
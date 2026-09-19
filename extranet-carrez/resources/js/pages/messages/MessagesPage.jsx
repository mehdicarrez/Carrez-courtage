import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';

const objets = [
    { type: 'demande', label: 'Demandes', source: '/demandes', mk: (d) => ({ id: d.id, libelle: `${d.reference} — ${d.client || ''}` }) },
    { type: 'contrat', label: 'Contrats', source: '/contrats', mk: (c) => ({ id: c.id, libelle: `${c.reference} — ${c.client || ''}` }) },
];

const IconeDoc = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

const fmtDate = (d) => {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d || '';
    return (
        dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) +
        ' · ' +
        dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
};

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
        setError('');
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

    const objetActif = objets.find((o) => o.type === activeType);

    return (
        <div className="max-w-6xl mx-auto">
            {/* ——— Header ——— */}
            <div className="anim-in relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/60 px-6 py-6 md:px-8 mb-6 shadow-sm">
                <div className="anim-blob pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-200/50 blur-2xl" />
                <div className="anim-blob pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-purple-200/50 blur-xl" style={{ animationDelay: '2s' }} />
                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 border border-blue-100 text-blue-600 text-[11px] font-semibold uppercase tracking-wider mb-3 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Messagerie
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent tracking-tight">
                        Échangez avec votre cabinet
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 flex items-start gap-1.5">
                        <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                        </svg>
                        Une conversation par demande ou contrat, directement avec Carrez Co Courtage.
                    </p>
                </div>
            </div>

            {/* ——— Onglets ——— */}
            <div className="anim-in mb-5 inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" style={{ animationDelay: '0.05s' }}>
                {objets.map((o) => (
                    <button
                        key={o.type}
                        onClick={() => ledger(o.type)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            activeType === o.type
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-700'
                        }`}
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d={o.type === 'demande'
                                ? 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z'
                                : 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155'}
                            />
                        </svg>
                        {o.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="anim-pop mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <div>{error}</div>
                </div>
            )}

            {/* ——— Conversation ——— */}
            <div className="anim-in flex flex-col lg:flex-row gap-5" style={{ animationDelay: '0.1s' }}>
                {/* Liste */}
                <aside className="lg:w-80 flex-shrink-0">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Conversations</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">
                                {loading ? '—' : liste.length}
                            </span>
                        </div>
                        <div className="max-h-[60vh] lg:max-h-[62vh] overflow-y-auto">
                            {loading && (
                                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                                    </svg>
                                    Chargement...
                                </div>
                            )}
                            {!loading && liste.length === 0 && (
                                <div className="py-10 text-center">
                                    <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">{IconeDoc}</div>
                                    <p className="text-sm text-slate-400">Aucun objet.</p>
                                </div>
                            )}
                            {liste.map((o) => (
                                <button
                                    key={o.id}
                                    onClick={() => ouvrir(o)}
                                    className={`flex w-full items-start gap-3 border-l-4 px-4 py-3 text-left transition-colors last:border-b-0 ${
                                        selected?.id === o.id
                                            ? 'border-l-blue-600 bg-blue-50/80'
                                            : 'border-l-transparent hover:bg-slate-50'
                                    }`}
                                >
                                    <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                                        selected?.id === o.id ? 'bg-gradient-to-br from-blue-600 to-indigo-600' : 'bg-gradient-to-br from-blue-500/70 to-indigo-500/70'
                                    }`}>
                                        {IconeDoc}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium text-slate-800">{o.libelle}</span>
                                        <span className="block text-xs text-slate-400">{objetActif.label}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Fil */}
                <section className="flex-1 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[65vh]">
                    {!selected ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 text-slate-300">
                            <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 ring-1 ring-slate-100">
                                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                </svg>
                            </span>
                            <div className="text-sm font-medium text-slate-400">Sélectionnez un objet pour ouvrir sa conversation.</div>
                            <div className="text-xs text-slate-300">Choisissez une demande ou un contrat dans la liste.</div>
                        </div>
                    ) : (
                        <>
                            {/* En-tête du fil */}
                            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
                                    {IconeDoc}
                                </span>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-slate-900">{selected.libelle}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        {objetActif.label} · Conversation active
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 px-4 md:px-6 py-5 overflow-y-auto max-h-[46vh] lg:max-h-[48vh] space-y-3.5 bg-[#fbfcfe]">
                                {loadingThread && (
                                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                                        </svg>
                                        Chargement...
                                    </div>
                                )}
                                {!loadingThread && messages.length === 0 && (
                                    <div className="py-12 text-center">
                                        <p className="text-sm text-slate-400">Aucun message pour le moment.</p>
                                        <p className="mt-1 text-xs text-slate-300">Lancez l'échange avec votre cabinet.</p>
                                    </div>
                                )}
                                {messages.map((m) => {
                                    const moi = user && m.auteur_id === user.id;
                                    const interne = m.visibilite === 'INTERNE';
                                    return (
                                        <div
                                            key={m.id}
                                            className={`anim-in max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                                moi
                                                    ? 'ml-auto bg-blue-600 text-white rounded-br-md'
                                                    : interne
                                                        ? 'bg-amber-50 border border-amber-200 text-slate-800 rounded-bl-md'
                                                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                                            }`}
                                        >
                                            <div className={`mb-1 text-[11px] font-medium ${moi ? 'text-blue-100' : interne ? 'text-amber-600' : 'text-slate-400'}`}>
                                                {moi ? 'Moi' : (m.auteur || 'Cabinet')}
                                                {interne && <span className="ml-1.5">· note interne</span>}
                                            </div>
                                            <div className="whitespace-pre-wrap leading-relaxed">{m.contenu}</div>
                                            <div className={`mt-1.5 text-[10px] ${moi ? 'text-blue-100/80' : 'text-slate-300'}`}>{fmtDate(m.created_at)}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Composer */}
                            <form onSubmit={poster} className="border-t border-slate-200 bg-white p-4">
                                <div className="flex items-end gap-2.5">
                                    <input
                                        className="flex-1 rounded-xl border border-slate-300 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                        placeholder="Votre message..."
                                        value={contenu}
                                        onChange={(e) => setContenu(e.target.value)}
                                    />
                                    {estCabinet && (
                                        <select
                                            className="h-[42px] rounded-xl border border-slate-300 bg-white px-2 text-sm text-slate-600 shadow-sm outline-none focus:border-blue-500"
                                            value={visibilite}
                                            onChange={(e) => setVisibilite(e.target.value)}
                                            title="Visibilité du message"
                                        >
                                            <option value="EXTERNE">Externe</option>
                                            <option value="INTERNE">Interne</option>
                                        </select>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={!contenu.trim()}
                                        className="btn-primary !w-auto !rounded-xl !py-2.5 !px-5 !text-sm disabled:opacity-50"
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            Envoyer
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                            </svg>
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
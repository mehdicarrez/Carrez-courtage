import { useEffect, useState } from 'react';
import api from '../api';

export default function SignatureDemandeModal({ demande, onClose, onEnvoye }) {
    const [sigEmail, setSigEmail] = useState('');
    const [sigMobile, setSigMobile] = useState('');
    const [sigMessage, setSigMessage] = useState('');
    const [sigSelected, setSigSelected] = useState([]);
    const [sigNewFiles, setSigNewFiles] = useState([]);
    const [sigDocTypeId, setSigDocTypeId] = useState('');
    const [sigBusy, setSigBusy] = useState(false);
    const [error, setError] = useState('');
    const [typesDocs, setTypesDocs] = useState([]);

    useEffect(() => {
        setSigEmail(demande?.client_detail?.email || '');
        setSigMobile(demande?.client_detail?.telephone || '');
        api.get('/referentiels/actifs')
            .then((res) => setTypesDocs(res.data.types_documents || []))
            .catch(() => {});
    }, [demande]);

    const toggleSigDoc = (id) => {
        setSigSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const addSigFiles = (files) => {
        const arr = Array.from(files);
        if (arr.length === 0) return;
        setSigNewFiles((prev) => [...prev, ...arr]);
    };

    const removeSigFile = (index) => {
        setSigNewFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const submitSignature = async () => {
        if (!sigEmail.trim() || !sigMobile.trim() || !sigMessage.trim()) {
            setError('Les champs Email, Mobile et Message sont obligatoires.');
            return;
        }
        if (sigNewFiles.length > 0 && !sigDocTypeId) {
            setError('Sélectionnez un type de document pour les fichiers téléversés.');
            return;
        }
        const docIds = (demande?.documents || []).filter((d) => sigSelected.includes(d.id)).map((d) => d.id);
        if (sigNewFiles.length === 0 && docIds.length === 0) {
            setError('Sélectionnez ou téléversez au moins un document à signer.');
            return;
        }
        setSigBusy(true);
        setError('');
        try {
            for (const file of sigNewFiles) {
                const fd = new FormData();
                fd.append('type_document_id', sigDocTypeId);
                fd.append('objet_type', 'demande');
                fd.append('objet_id', demande.id);
                fd.append('file', file);
                const res = await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                if (res.data.data?.id) docIds.push(res.data.data.id);
            }

            const res = await api.post(`/demandes/${demande.id}/signature`, {
                email: sigEmail.trim(),
                mobile: sigMobile.trim(),
                message: sigMessage.trim(),
                document_ids: docIds,
            });

            const url = res.data.data?.url;
            onClose();
            if (url) {
                window.open(url, '_blank');
            }
            window.alert(`Signature envoyée avec succès (Yousign).${url ? '\nOuverture du lien de suivi en cours...' : ''}`);
            onEnvoye?.();
        } catch (err) {
            setError(err.response?.data?.detail || err.response?.data?.message || "Erreur lors de l'envoi pour signature.");
        } finally {
            setSigBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[75] backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-5 w-full max-w-4xl shadow-2xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="m10.577 1.332 3.811 1.132-.415 1.017-3.393-1.008V10.35L13.68 8.88l-.41-2.05 1.42-.071.716 3.579c.022.112.022.226 0 .338l-.429 2.143c-.08.403-.3.77-.62 1.032l-3.472 2.88a1.75 1.75 0 0 1-2.4 0l-3.472-2.88a1.75 1.75 0 0 1-.62-1.032l-.429-2.143a1.75 1.75 0 0 1 0-.338l.716-3.579 1.42.071-.41 2.05 3.894 1.47V2.473L8.2 3.481l-.415-1.017 3.792-1.132Z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Signature électronique</h2>
                        <p className="text-sm text-slate-500">Demande {demande?.reference}</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
                )}

                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" value={sigEmail} onChange={(e) => setSigEmail(e.target.value)}
                    placeholder="client@exemple.fr"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile <span className="text-red-500">*</span></label>
                <input type="tel" value={sigMobile} onChange={(e) => setSigMobile(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

                <label className="block text-sm font-medium text-slate-700 mb-1">Message <span className="text-red-500">*</span></label>
                <textarea value={sigMessage} onChange={(e) => setSigMessage(e.target.value)}
                    rows="3" placeholder="Message accompagnant la demande de signature..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>

                <label className="block text-sm font-medium text-slate-700 mb-1">Documents sélectionnés <span className="text-red-500">*</span></label>

                <div className="space-y-2 mb-3">
                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">Type de document (pour les fichiers téléversés) <span className="text-red-500">*</span></label>
                        <select value={sigDocTypeId} onChange={(e) => setSigDocTypeId(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">— Choisir un type —</option>
                            {typesDocs.map((t) => (
                                <option key={t.id} value={t.id}>{t.libelle}</option>
                            ))}
                        </select>
                    </div>
                    <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 rounded-xl px-4 py-5 cursor-pointer transition-colors">
                        <svg className="w-6 h-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03l2.955-3.13v8.615Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>
                        <span className="text-sm font-medium text-blue-700">Téléverser des documents</span>
                        <span className="text-xs text-slate-400">Cliquez pour choisir un ou plusieurs fichiers</span>
                        <input type="file" multiple onChange={(e) => { addSigFiles(e.target.files); e.target.value = ''; }}
                            className="hidden" />
                    </label>
                </div>

                {sigSelected.length === 0 && sigNewFiles.length === 0 ? (
                    <p className="text-sm text-slate-400 mb-4 border border-dashed border-slate-300 rounded-lg px-3 py-3">Aucun document sélectionné.</p>
                ) : (
                    <div className="space-y-1.5 mb-4">
                        {sigNewFiles.map((file, index) => (
                            <div key={`new-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2">
                                <span className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                    <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} Ko</span>
                                </span>
                                <button type="button" onClick={() => removeSigFile(index)}
                                    className="text-slate-400 hover:text-red-500 flex-shrink-0">
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                                </button>
                            </div>
                        ))}
                        {(demande?.documents || []).filter((d) => sigSelected.includes(d.id)).map((d) => (
                            <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                                <span className="flex items-center gap-2 text-sm text-slate-700 min-w-0">
                                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V9.621a1.5 1.5 0 0 0-.44-1.06L11.94 3.44A1.5 1.5 0 0 0 10.878 3H4.5Zm2 3.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75ZM7 10.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 10.5Zm0 3a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
                                    <span className="truncate">{d.nom_origine || d.type_document || 'Document'}</span>
                                </span>
                                <button type="button" onClick={() => toggleSigDoc(d.id)}
                                    className="text-slate-400 hover:text-red-500 flex-shrink-0">
                                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <label className="block text-sm font-medium text-slate-700 mb-1">Documents <span className="text-red-500">*</span></label>
                {(!demande?.documents || demande.documents.length === 0) ? (
                    <p className="text-sm text-slate-400 mb-4">Aucun document disponible à joindre.</p>
                ) : (
                    <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                        {demande.documents.map((d) => (
                            <label key={d.id}
                                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                <input type="checkbox" checked={sigSelected.includes(d.id)}
                                    onChange={() => toggleSigDoc(d.id)} className="w-4 h-4 accent-blue-600 flex-shrink-0" />
                                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V9.621a1.5 1.5 0 0 0-.44-1.06L11.94 3.44A1.5 1.5 0 0 0 10.878 3H4.5Zm2 3.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75ZM7 10.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 7 10.5Zm0 3a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" /></svg>
                                <span className="text-sm text-slate-700 truncate">{d.nom_origine || d.type_document || 'Document'}</span>
                            </label>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <button onClick={onClose}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        Annuler
                    </button>
                    <button onClick={submitSignature} disabled={sigBusy}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition-colors">
                        {sigBusy ? 'Envoi...' : 'Envoyer pour signature'}
                    </button>
                </div>
            </div>
        </div>
    );
}
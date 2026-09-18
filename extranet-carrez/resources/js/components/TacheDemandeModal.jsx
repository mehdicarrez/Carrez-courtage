import { useEffect, useState } from 'react';
import api from '../api';

export default function TacheDemandeModal({ demande, onClose, onCreee }) {
    const [gestionnaires, setGestionnaires] = useState([]);
    const [typesDocs, setTypesDocs] = useState([]);

    const [taskRef, setTaskRef] = useState('');
    const [taskSuivi, setTaskSuivi] = useState('');
    const [taskDateDebut, setTaskDateDebut] = useState('');
    const [taskDateFin, setTaskDateFin] = useState('');
    const [taskPriorite, setTaskPriorite] = useState('MOYENNE');
    const [taskAvancement, setTaskAvancement] = useState(0);
    const [taskTemps, setTaskTemps] = useState(0);
    const [taskType, setTaskType] = useState('RELANCE');
    const [taskObjet, setTaskObjet] = useState('');
    const [taskMontant, setTaskMontant] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskStatut, setTaskStatut] = useState('A_FAIRE');
    const [taskFiles, setTaskFiles] = useState([]);
    const [taskDocTypeId, setTaskDocTypeId] = useState('');
    const [noteBusy, setNoteBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/demandes/gestionnaires')
            .then((res) => setGestionnaires(res.data.data))
            .catch(() => {});
        api.get('/referentiels/actifs')
            .then((res) => {
                const types = res.data.types_documents || [];
                setTypesDocs(types);
                const t = types.find((x) => x.code === 'DOC_SINISTRE') || types[0];
                if (t) setTaskDocTypeId(String(t.id));
            })
            .catch(() => {});
        setTaskRef(demande?.reference || '');
    }, [demande]);

    const addTaskFiles = (files) => {
        const arr = Array.from(files);
        if (arr.length === 0) return;
        setTaskFiles((prev) => [...prev, ...arr]);
    };

    const removeTaskFile = (index) => {
        setTaskFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const submitNote = async () => {
        const clientId = demande?.client_detail?.id;
        if (!taskSuivi || !taskDateDebut || !taskDateFin || !taskType || !taskObjet || !taskDescription || !taskStatut) {
            setError('Veuillez renseigner tous les champs obligatoires (*).');
            return;
        }
        if (!clientId) {
            setError('Aucun client associé à cette demande.');
            return;
        }
        if (taskDateFin && taskDateDebut && taskDateFin < taskDateDebut) {
            setError('La date de fin doit être postérieure à la date de début.');
            return;
        }
        if (taskFiles.length > 0 && !taskDocTypeId) {
            setError('Sélectionnez un type de document pour les fichiers joints.');
            return;
        }
        setNoteBusy(true);
        setError('');
        try {
            const res = await api.post(`/clients/${clientId}/taches`, {
                titre: taskObjet,
                type: taskType,
                objet: taskRef || taskObjet,
                description: taskDescription,
                priorite: taskPriorite,
                statut: taskStatut,
                date_echeance: taskDateFin || null,
                date_debut: taskDateDebut || null,
                date_fin: taskDateFin || null,
                montant: taskMontant !== '' ? taskMontant : null,
                avancement: taskAvancement ?? 0,
                temps_passe_h: taskTemps !== '' ? taskTemps : null,
                assignee_id: taskSuivi || null,
            });

            const tacheId = res.data.data.id;
            for (const file of taskFiles) {
                const fd = new FormData();
                fd.append('type_document_id', taskDocTypeId);
                fd.append('objet_type', 'tache');
                fd.append('objet_id', String(tacheId));
                fd.append('file', file);
                await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            onClose();
            onCreee?.();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'enregistrement.");
        } finally {
            setNoteBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-5 w-full max-w-4xl shadow-2xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 5.5A3.5 3.5 0 0 1 9.5 2h1A3.5 3.5 0 0 1 14 5.5v.55c1.7.39 3 1.93 3 3.8v3.4A3.25 3.25 0 0 1 13.75 16H6.25A3.25 3.25 0 0 1 3 12.75v-3.4c0-1.87 1.3-3.41 3-3.8V5.5Zm4 3.5a.75.75 0 0 1 .75.75v2.1l.95.5a.75.75 0 1 1-.75 1.3l-1.5-.8A.75.75 0 0 1 9 12.25v-3A.75.75 0 0 1 9.75 8.5Zm1.75-4.5v.53c.42 0 .83.08 1.2.23A2 2 0 0 0 11.25 4h-.75Z" clipRule="evenodd" /></svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Nouvelle tâche</h2>
                        <p className="text-sm text-slate-500">Demande {demande?.reference}</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Réf</label>
                        <input type="text" value={taskRef} onChange={(e) => setTaskRef(e.target.value)}
                            placeholder="Référence de la tâche"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Suivi par <span className="text-red-500">*</span></label>
                        <select value={taskSuivi} onChange={(e) => setTaskSuivi(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="">— Sélectionner —</option>
                            {gestionnaires.map((g) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date début <span className="text-red-500">*</span></label>
                        <input type="date" value={taskDateDebut} onChange={(e) => setTaskDateDebut(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date fin <span className="text-red-500">*</span></label>
                        <input type="date" value={taskDateFin} onChange={(e) => setTaskDateFin(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priorité <span className="text-red-500">*</span></label>
                        <select value={taskPriorite} onChange={(e) => setTaskPriorite(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="BASSE">Basse</option>
                            <option value="MOYENNE">Moyenne</option>
                            <option value="HAUTE">Haute</option>
                            <option value="CRITIQUE">Critique</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Avancement (%)</label>
                        <input type="number" min="0" max="100" value={taskAvancement}
                            onChange={(e) => setTaskAvancement(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Temps passé (h)</label>
                        <input type="number" min="0" step="0.25" value={taskTemps}
                            onChange={(e) => setTaskTemps(Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type <span className="text-red-500">*</span></label>
                        <select value={taskType} onChange={(e) => setTaskType(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="TELEPHONE">Téléphone</option>
                            <option value="EMAIL">Email</option>
                            <option value="COURRIER">Courrier</option>
                            <option value="RENDEZ_VOUS">Rendez-vous</option>
                            <option value="RELANCE">Relance</option>
                            <option value="AUTRE">Autre</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Objet <span className="text-red-500">*</span></label>
                        <input type="text" value={taskObjet} onChange={(e) => setTaskObjet(e.target.value)}
                            placeholder="Objet de la tâche"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Montant</label>
                        <input type="number" min="0" step="0.01" value={taskMontant}
                            onChange={(e) => setTaskMontant(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Statut <span className="text-red-500">*</span></label>
                        <select value={taskStatut} onChange={(e) => setTaskStatut(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="A_FAIRE">À faire</option>
                            <option value="EN_COURS">En cours</option>
                            <option value="EN_ATTENTE">En attente</option>
                            <option value="TERMINEE">Terminée</option>
                            <option value="ANNULEE">Annulée</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description <span className="text-red-500">*</span></label>
                        <textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}
                            rows="3" placeholder="Décrivez la tâche à réaliser..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Documents à joindre</label>
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); addTaskFiles(e.dataTransfer.files); }}
                            className="border-2 border-dashed border-slate-300 rounded-lg px-4 py-6 text-center text-sm text-slate-500 hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                            <p>Déposez vos fichiers ici...</p>
                            <label className="mt-2 inline-block cursor-pointer text-blue-600 font-medium">
                                ou parcourir
                                <input type="file" multiple className="hidden" onChange={(e) => addTaskFiles(e.target.files)} />
                            </label>
                            {taskFiles.length > 0 && (
                                <>
                                    <div className="mt-3 text-left">
                                        <select value={taskDocTypeId} onChange={(e) => setTaskDocTypeId(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                                            <option value="">— Type de document —</option>
                                            {typesDocs.map((t) => (
                                                <option key={t.id} value={t.id}>{t.libelle}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <ul className="mt-3 text-left space-y-1">
                                        {taskFiles.map((f, i) => (
                                            <li key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-2 py-1">
                                                <span className="truncate">{f.name}</span>
                                                <button onClick={() => removeTaskFile(i)} className="text-red-500 hover:text-red-700 ml-2">Retirer</button>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                    <button onClick={onClose}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                        Annuler
                    </button>
                    <button onClick={submitNote} disabled={noteBusy}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors">
                        {noteBusy ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
import { useEffect, useState } from 'react';
import api from '../../api';

const CONFIGS = {
    branches: {
        label: 'Branches',
        champs: [
            { key: 'code', label: 'Code', type: 'text' },
            { key: 'nom', label: 'Nom', type: 'text' },
            { key: 'famille', label: 'Famille', type: 'select', options: ['Personnes', 'Dommages-roulant', 'Dommages-habitation', 'Professionnels'] },
        ],
    },
    produits: {
        label: 'Produits',
        champs: [
            { key: 'code', label: 'Code', type: 'text' },
            { key: 'nom', label: 'Nom', type: 'text' },
        ],
        relations: { branche_id: 'branche', porteur_risque_id: 'porteur_risque', grossiste_id: 'grossiste' },
    },
    porteurs: {
        label: 'Porteurs de risque',
        champs: [
            { key: 'nom', label: 'Nom', type: 'text' },
            { key: 'orias', label: 'ORIAS', type: 'text' },
        ],
    },
    grossistes: {
        label: 'Grossistes / MGA',
        champs: [
            { key: 'nom', label: 'Nom', type: 'text' },
            { key: 'orias', label: 'ORIAS', type: 'text' },
        ],
    },
    motifs: {
        label: 'Motifs',
        champs: [
            { key: 'categorie', label: 'Catégorie', type: 'select', options: ['REFUS', 'RESILIATION', 'SANS_SUITE'] },
            { key: 'code', label: 'Code', type: 'text' },
            { key: 'libelle', label: 'Libellé', type: 'text' },
        ],
    },
    types_documents: {
        label: 'Types de documents',
        champs: [
            { key: 'code', label: 'Code', type: 'text' },
            { key: 'libelle', label: 'Libellé', type: 'text' },
            { key: 'retenue_mois', label: 'Durée retenue (mois)', type: 'number' },
        ],
    },
    modeles: {
        label: 'Gabarits de documents (PDF)',
        champs: [
            { key: 'nom', label: 'Nom', type: 'text' },
            { key: 'type', label: 'Type', type: 'select', options: ['POLICE', 'PROPOSITION', 'ATTESTATION'] },
            { key: 'version', label: 'Version', type: 'text' },
            { key: 'chemin_vue', label: 'Chemin vue', type: 'text' },
            { key: 'moteur', label: 'Moteur', type: 'text' },
        ],
    },
};

export default function ReferentielsPage() {
    const [onglet, setOnglet] = useState('branches');
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [form, setForm] = useState(null); // {mode:'create'|'edit', valeurs}

    const load = async () => {
        setLoading(true);
        setMsg('');
        try {
            const res = await api.get('/referentiels');
            setData(res.data);
        } catch {
            setMsg('Erreur de chargement.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const toggle = async (id) => {
        await api.patch(`/referentiels/${onglet}/${id}/toggle`);
        await load();
    };

    const supprimer = async (id) => {
        if (!window.confirm('Supprimer cette entrée ?')) return;
        try {
            await api.delete(`/referentiels/${onglet}/${id}`);
            await load();
        } catch (e) { setMsg(e.response?.data?.message || 'Erreur.'); }
    };

    const enregistrer = async () => {
        try {
            const body = { ...form.valeurs };
            if (onglet === 'produits' || onglet === 'branches' || onglet === 'porteurs' || onglet === 'grossistes') {
                body.actif = body.actif ?? true;
            }
            if (form.mode === 'create') {
                await api.post(`/referentiels/${onglet}`, body);
            } else {
                await api.put(`/referentiels/${onglet}/${form.id}`, body);
            }
            setForm(null);
            await load();
        } catch (e) { setMsg(e.response?.data?.message || 'Erreur.'); }
    };

    const config = CONFIGS[onglet] || { label: onglet, champs: [] };

    const colonnes = () => {
        if (onglet === 'modeles') return ['nom', 'type', 'version', 'statut'];
        return config.champs.map((c) => c.key).concat(['actif']);
    };

    const colonnesFiltrees = colonnes().filter((k) => k !== 'actif');

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-4">Référentiels administrables</h1>

            {msg && <div className="bg-amber-50 text-amber-700 p-3 rounded mb-4 text-sm">{msg}</div>}

            {/* Onglets par référentiel */}
            <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-4">
                {Object.keys(CONFIGS).map((k) => (
                    <button key={k} onClick={() => { setOnglet(k); setForm(null); }}
                        className={`px-3 py-2 text-sm font-medium rounded-t-lg -mb-px ${
                            onglet === k ? 'bg-white border border-slate-200 text-blue-700' : 'text-slate-500 hover:text-slate-700'
                        }`}>{CONFIGS[k].label}</button>
                ))}
            </div>

            <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-500">{config.label} — {data[onglet]?.length ?? 0} entrée(s)</div>
                <button onClick={() => setForm({ mode: 'create', id: null, valeurs: {} })}
                    className="text-sm px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800">+ Ajouter</button>
            </div>

            {/* Formulaire */}
            {form && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 text-sm">
                    <h3 className="font-medium text-slate-900 mb-3">{form.mode === 'create' ? 'Nouvelle entrée' : 'Modifier'}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        {config.champs.map((c) => {
                            const val = form.valeurs[c.key] ?? '';
                            return c.type === 'select' ? (
                                <div key={c.key}>
                                    <label className="text-slate-500 text-xs">{c.label}</label>
                                    <select value={val}
                                        onChange={(e) => setForm({ ...form, valeurs: { ...form.valeurs, [c.key]: e.target.value } })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1">
                                        <option value="">—</option>
                                        {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div key={c.key}>
                                    <label className="text-slate-500 text-xs">{c.label}</label>
                                    <input type={c.type === 'number' ? 'number' : 'text'} value={val}
                                        onChange={(e) => setForm({ ...form, valeurs: { ...form.valeurs, [c.key]: e.target.value } })}
                                        className="block w-full border border-slate-300 rounded px-2 py-1 mt-1" />
                                </div>
                            );
                        })}
                        <label className="flex items-center gap-2 text-sm mt-4">
                            <input type="checkbox" checked={!!form.valeurs.actif}
                                onChange={(e) => setForm({ ...form, valeurs: { ...form.valeurs, actif: e.target.checked } })} />
                            Actif
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={enregistrer} className="px-3 py-1 rounded bg-blue-700 text-white hover:bg-blue-800">Enregistrer</button>
                        <button onClick={() => setForm(null)} className="px-3 py-1 rounded border border-slate-300">Annuler</button>
                    </div>
                </div>
            )}

            {loading && <div className="text-slate-500">Chargement...</div>}

            {/* Tableau */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-left">
                        <tr>
                            {colonnesFiltrees.map((k) => <th key={k} className="px-4 py-2">{k}</th>)}
                            <th className="px-4 py-2">Actif</th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data[onglet] || []).map((r) => (
                            <tr key={r.id} className="border-t border-slate-100">
                                {colonnesFiltrees.map((k) => {
                                    let v = r[k];
                                    if (k === 'branche_id') v = r.branche?.nom;
                                    if (k === 'porteur_risque_id') v = r.porteurRisque?.nom;
                                    if (k === 'grossiste_id') v = r.grossiste?.nom;
                                    if (Array.isArray(v)) v = JSON.stringify(v);
                                    return <td key={k} className="px-4 py-2">{v ?? '—'}</td>;
                                })}
                                <td className="px-4 py-2">
                                    <button onClick={() => toggle(r.id)}
                                        className={`text-xs px-2 py-0.5 rounded ${r.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {r.actif ? 'Actif' : 'Inactif'}
                                    </button>
                                </td>
                                <td className="px-4 py-2 text-right whitespace-nowrap">
                                    <button onClick={() => setForm({ mode: 'edit', id: r.id, valeurs: { ...r } })}
                                        className="text-xs text-blue-700 hover:underline mr-2">Modifier</button>
                                    <button onClick={() => supprimer(r.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                        {(data[onglet] || []).length === 0 && !loading && (
                            <tr><td colSpan={colonnesFiltrees.length + 2} className="px-4 py-6 text-center text-slate-500">Aucune entrée.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

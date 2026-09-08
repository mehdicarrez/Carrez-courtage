import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../auth';

const roles = [
    { value: 'ADMIN', label: 'Admin cabinet' },
    { value: 'GESTIONNAIRE', label: 'Gestionnaire' },
    { value: 'CONSEILLER', label: 'Conseiller' },
    { value: 'COMPTABLE', label: 'Comptable' },
    { value: 'DIRIGEANT_PARTENAIRE', label: 'Dirigeant partenaire' },
    { value: 'COLLABORATEUR_PARTENAIRE', label: 'Collaborateur partenaire' },
    { value: 'LECTEUR_PARTENAIRE', label: 'Lecteur partenaire' },
    { value: 'PARTENAIRE', label: 'Partenaire' },
];

const accessLevels = [
    { value: 'TOUS', label: 'Tous les clients' },
    { value: 'CLIENTS_attribues', label: 'Limité aux clients attribués' },
];

export default function UtilisateursList() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'COLLABORATEUR_PARTENAIRE', access_level: 'TOUS', visible_commissions: true });
    const [saving, setSaving] = useState(false);

    const load = () => {
        api.get('/utilisateurs')
            .then((res) => setUsers(res.data.data))
            .catch(() => setError('Erreur de chargement.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'visible_commissions' ? e.target.checked : e.target.value }));

    const creer = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/utilisateurs', form);
            setShowForm(false);
            setForm({ name: '', email: '', password: '', role: 'COLLABORATEUR_PARTENAIRE', access_level: 'TOUS', visible_commissions: true });
            load();
        } catch (err) {
            const msg = err.response?.data?.errors?.[0] || err.response?.data?.message || 'Erreur lors de la création.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSaving(false);
        }
    };

    const basculerActif = async (u) => {
        try {
            await api.patch(`/utilisateurs/${u.id}`, { actif: !u.actif });
            load();
        } catch {
            setError('Erreur lors de la modification.');
        }
    };

    const changerRole = async (u, role) => {
        try {
            await api.patch(`/utilisateurs/${u.id}`, { role });
            load();
        } catch {
            setError('Erreur lors de la modification.');
        }
    };

    const changerAcces = async (u, access_level) => {
        try {
            await api.patch(`/utilisateurs/${u.id}`, { access_level });
            load();
        } catch {
            setError('Erreur lors de la modification.');
        }
    };

    const peuxGerer = user && (user.role === 'ADMIN' || user.role === 'DIRIGEANT_PARTENAIRE');

    return (
        <div>
            <h1 className="text-xl font-bold text-slate-900 mb-4">Gestion des utilisateurs</h1>
            {!peuxGerer && (
                <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
                    Seul un administrateur cabinet ou un dirigeant partenaire peut gérer les utilisateurs.
                </div>
            )}
            {error && <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
            {loading && <div className="text-slate-500">Chargement...</div>}

            {peuxGerer && (
                <div className="mb-4">
                    <button
                        onClick={() => setShowForm((v) => !v)}
                        className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                    >
                        {showForm ? 'Annuler' : '+ Nouvel utilisateur'}
                    </button>
                </div>
            )}

            {showForm && (
                <form onSubmit={creer} className="bg-white border border-slate-200 rounded-lg p-5 mb-4 space-y-4 max-w-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Nom</label>
                            <input required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={form.name} onChange={set('name')} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Email</label>
                            <input required type="email" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={form.email} onChange={set('email')} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Mot de passe (min. 12 caractères)</label>
                            <input required type="password" minLength={12} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={form.password} onChange={set('password')} />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Rôle</label>
                            <select className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={form.role} onChange={set('role')}>
                                {roles.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Accès aux clients</label>
                            <select className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" value={form.access_level} onChange={set('access_level')}>
                                {accessLevels.map((al) => (
                                    <option key={al.value} value={al.value}>{al.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" checked={form.visible_commissions} onChange={set('visible_commissions')} />
                        Visible commissions rétrocédées
                    </label>
                    <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50">
                        {saving ? 'Création...' : 'Créer'}
                    </button>
                </form>
            )}

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-left">
                        <tr>
                            <th className="px-4 py-2">Nom</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Rôle</th>
                            <th className="px-4 py-2">Accès</th>
                            <th className="px-4 py-2">Statut</th>
                            <th className="px-4 py-2">2FA</th>
                            <th className="px-4 py-2">Dernière connexion</th>
                            {peuxGerer && <th className="px-4 py-2">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} className="border-t border-slate-100">
                                <td className="px-4 py-2 font-medium">{u.name}</td>
                                <td className="px-4 py-2">{u.email}</td>
                                <td className="px-4 py-2">
                                    {peuxGerer ? (
                                        <select
                                            className="border border-slate-300 rounded px-1 py-0.5 text-xs"
                                            value={u.role}
                                            onChange={(e) => changerRole(u, e.target.value)}
                                        >
                                            {roles.map((r) => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        u.role
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    {peuxGerer ? (
                                        <select
                                            className="border border-slate-300 rounded px-1 py-0.5 text-xs"
                                            value={u.access_level || 'TOUS'}
                                            onChange={(e) => changerAcces(u, e.target.value)}
                                        >
                                            {accessLevels.map((al) => (
                                                <option key={al.value} value={al.value}>{al.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        (accessLevels.find((al) => al.value === (u.access_level || 'TOUS'))?.label) || u.access_level
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => (peuxGerer ? basculerActif(u) : null)}
                                        className={`text-xs px-2 py-1 rounded ${
                                            u.actif ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                        }`}
                                    >
                                        {u.actif ? 'Actif' : 'Inactif'}
                                    </button>
                                </td>
                                <td className="px-4 py-2">{u.two_factor_enabled ? 'Oui' : 'Non'}</td>
                                <td className="px-4 py-2">{u.last_login_at || '—'}</td>
                                {peuxGerer && (
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => api.delete(`/utilisateurs/${u.id}`).then(load).catch(() => setError('Erreur.'))}
                                            className="text-red-600 text-xs"
                                        >
                                            Désactiver
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {!loading && users.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                                    Aucun utilisateur.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
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

const roleStyle = {
    ADMIN: 'bg-purple-50 text-purple-700',
    GESTIONNAIRE: 'bg-blue-50 text-blue-700',
    CONSEILLER: 'bg-cyan-50 text-cyan-700',
    COMPTABLE: 'bg-teal-50 text-teal-700',
    DIRIGEANT_PARTENAIRE: 'bg-indigo-50 text-indigo-700',
    COLLABORATEUR_PARTENAIRE: 'bg-sky-50 text-sky-700',
    LECTEUR_PARTENAIRE: 'bg-slate-100 text-slate-600',
    PARTENAIRE: 'bg-emerald-50 text-emerald-700',
};

const inputCls =
    'w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
const labelCls = 'mb-1.5 block text-sm font-semibold text-slate-700';

const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const initials = (name) =>
    (name || '??')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

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

    const stats = [
        { label: 'Utilisateurs', value: users.length, accent: 'from-blue-500 to-indigo-600' },
        { label: 'Actifs', value: users.filter((u) => u.actif).length, accent: 'from-emerald-400 to-emerald-600' },
        { label: '2FA activée', value: users.filter((u) => u.two_factor_enabled).length, accent: 'from-amber-400 to-orange-500' },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            {/* ——— Header ——— */}
            <div className="anim-in relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/60 px-6 py-6 md:px-8 mb-6 shadow-sm">
                <div className="anim-blob pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-200/50 blur-2xl" />
                <div className="anim-blob pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-purple-200/50 blur-xl" style={{ animationDelay: '2s' }} />
                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 border border-blue-100 text-blue-600 text-[11px] font-semibold uppercase tracking-wider mb-3 shadow-sm">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                        Administration
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent tracking-tight">
                        Gestion des utilisateurs
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">
                        Créez et gérez les comptes d'accès à l'espace, leurs rôles et leurs habilitations.
                    </p>
                </div>
            </div>

            {/* ——— Stats ——— */}
            <div className="anim-in grid gap-4 sm:grid-cols-3 mb-6" style={{ animationDelay: '0.05s' }}>
                {stats.map((s) => (
                    <div key={s.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm flex items-center gap-4">
                        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${s.accent} text-white shadow-md`}>
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" />
                            </svg>
                        </span>
                        <div>
                            <div className="text-2xl font-extrabold text-slate-900 leading-none">{s.value}</div>
                            <div className="mt-1 text-xs font-medium text-slate-400">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {!peuxGerer && (
                <div className="anim-pop mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <div>Seul un administrateur cabinet ou un dirigeant partenaire peut gérer les utilisateurs.</div>
                </div>
            )}

            {error && (
                <div className="anim-pop mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <div>{error}</div>
                </div>
            )}

            {peuxGerer && (
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => { setShowForm((v) => !v); setError(''); }}
                        className="btn-primary !rounded-xl !px-5 !py-2.5 !text-sm"
                    >
                        {showForm ? (
                            <span className="inline-flex items-center gap-2">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                                Annuler
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Nouvel utilisateur
                            </span>
                        )}
                    </button>
                </div>
            )}

            {showForm && (
                <form onSubmit={creer} className="anim-in rounded-2xl border border-slate-200 bg-white p-6 mb-8 shadow-sm max-w-3xl">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                            </svg>
                        </span>
                        <div>
                            <div className="text-sm font-bold text-slate-900">Nouveau compte</div>
                            <div className="text-xs text-slate-400">Renseignez les informations d'accès</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Nom</label>
                            <input required className={inputCls} value={form.name} onChange={set('name')} placeholder="Nom de l'utilisateur" />
                        </div>
                        <div>
                            <label className={labelCls}>Email</label>
                            <input required type="email" className={inputCls} value={form.email} onChange={set('email')} placeholder="vous@cabinet.fr" />
                        </div>
                        <div>
                            <label className={labelCls}>Mot de passe</label>
                            <input required type="password" minLength={12} className={inputCls} value={form.password} onChange={set('password')} placeholder="12 caractères min." />
                        </div>
                        <div>
                            <label className={labelCls}>Rôle</label>
                            <select className={inputCls} value={form.role} onChange={set('role')}>
                                {roles.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Accès aux clients</label>
                            <select className={inputCls} value={form.access_level} onChange={set('access_level')}>
                                {accessLevels.map((al) => (
                                    <option key={al.value} value={al.value}>{al.label}</option>
                                ))}
                            </select>
                        </div>
                        <label className="flex items-center gap-2.5 text-sm text-slate-600 self-end pb-1">
                            <input
                                type="checkbox"
                                checked={form.visible_commissions}
                                onChange={set('visible_commissions')}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Visible commissions rétrocédées
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                            Annuler
                        </button>
                        <button type="submit" disabled={saving} className="btn-primary !rounded-xl !px-6 !py-2.5 !text-sm disabled:opacity-50">
                            {saving ? 'Création...' : 'Créer le compte'}
                        </button>
                    </div>
                </form>
            )}

            {/* ——— Tableau ——— */}
            <div className="anim-in rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" style={{ animationDelay: '0.1s' }}>
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Liste des comptes</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">{users.length}</span>
                </div>

                {loading && (
                    <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-400">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                        </svg>
                        Chargement...
                    </div>
                )}

                {!loading && users.length === 0 && (
                    <div className="py-14 text-center">
                        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-400">Aucun utilisateur pour le moment.</p>
                    </div>
                )}

                {!loading && users.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-400">
                                    <th className="px-5 py-3">Utilisateur</th>
                                    <th className="px-5 py-3">Rôle</th>
                                    <th className="px-5 py-3">Accès</th>
                                    <th className="px-5 py-3">Statut</th>
                                    <th className="px-5 py-3">2FA</th>
                                    <th className="px-5 py-3">Dernière connexion</th>
                                    {peuxGerer && <th className="px-5 py-3 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm">
                                                    {initials(u.name)}
                                                </span>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-slate-900 truncate">{u.name}</div>
                                                    <div className="text-xs text-slate-400 truncate">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            {peuxGerer ? (
                                                <select
                                                    className="rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500"
                                                    value={u.role}
                                                    onChange={(e) => changerRole(u, e.target.value)}
                                                >
                                                    {roles.map((r) => (
                                                        <option key={r.value} value={r.value}>{r.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${roleStyle[u.role] || 'bg-slate-100 text-slate-600'}`}>
                                                    {roles.find((r) => r.value === u.role)?.label || u.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            {peuxGerer ? (
                                                <select
                                                    className="rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-1.5 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-500"
                                                    value={u.access_level || 'TOUS'}
                                                    onChange={(e) => changerAcces(u, e.target.value)}
                                                >
                                                    {accessLevels.map((al) => (
                                                        <option key={al.value} value={al.value}>{al.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-xs text-slate-500">
                                                    {(accessLevels.find((al) => al.value === (u.access_level || 'TOUS'))?.label) || u.access_level}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <button
                                                onClick={() => (peuxGerer ? basculerActif(u) : null)}
                                                disabled={!peuxGerer}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                                                    u.actif
                                                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                }`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full ${u.actif ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {u.actif ? 'Actif' : 'Inactif'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                                                u.two_factor_enabled ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {u.two_factor_enabled ? 'Activée' : 'Non'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(u.last_login_at)}</td>
                                        {peuxGerer && (
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => api.delete(`/utilisateurs/${u.id}`).then(load).catch(() => setError('Erreur.'))}
                                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                    Désactiver
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
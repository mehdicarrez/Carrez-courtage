import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, estPartenaire } from '../auth';
import api from '../api';

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [code2fa, setCode2fa] = useState('');
    const [twoFactorRequired, setTwoFactorRequired] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [regNom, setRegNom] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regTel, setRegTel] = useState('');
    const [regMdp, setRegMdp] = useState('');
    const [regLoading, setRegLoading] = useState(false);
    const [regSuccess, setRegSuccess] = useState(false);

    // Effet "cahier" : les panneaux se rabattent (closing) puis la nouvelle page s'ouvre (open)
    const [phase, setPhase] = useState('open'); // 'open' | 'closing'
    const flipTimer = useRef(null);
    useEffect(() => () => clearTimeout(flipTimer.current), []);

    const switchMode = (next) => {
        if (phase === 'closing' || next === mode) return;
        setPhase('closing');
        setError('');
        flipTimer.current = setTimeout(() => {
            setMode(next);
            setPhase('open');
        }, 900);
    };
    const leftLeaf = phase === 'closing' ? 'book-leaf book-leaf-close-left' : 'book-leaf book-leaf-open-left';
    const rightLeaf = phase === 'closing' ? 'book-leaf book-leaf-close-right' : 'book-leaf book-leaf-open-right';

    if (user) {
        navigate(estPartenaire(user) ? '/espace-partenaire' : '/', { replace: true });
        return null;
    }

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await login(email, password, code2fa);
            if (res.two_factor_required) {
                setTwoFactorRequired(true);
            } else {
                navigate(estPartenaire(res.user) ? '/espace-partenaire' : '/');
            }
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data.message === 'string') {
                setError(data.message);
            } else if (data?.errors) {
                setError(Object.values(data.errors).flat().join(' '));
            } else {
                setError('Connexion impossible.');
            }
        } finally {
            setLoading(false);
        }
    };

    const submitRegister = async (e) => {
        e.preventDefault();
        setRegLoading(true);
        setError('');
        setRegSuccess(false);
        try {
            await api.post('/auth/register', {
                nom: regNom,
                email: regEmail,
                telephone: regTel,
                mot_de_passe: regMdp,
            });
            setRegSuccess(true);
            setRegNom('');
            setRegEmail('');
            setRegTel('');
            setRegMdp('');
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data.message === 'string') {
                setError(data.message);
            } else if (data?.errors) {
                setError(Object.values(data.errors).flat().join(' '));
            } else {
                setError("Impossible d'envoyer la demande.");
            }
        } finally {
            setRegLoading(false);
        }
    };

    const inputCls =
        'block w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

    if (mode === 'register') {
        return (
            <div className="min-h-screen flex bg-[#f3f6fc] [perspective:2200px]">
                {/* ——— Formulaire (gauche) ——— */}
                <main className={`relative flex flex-1 items-center justify-center px-6 py-12 ${leftLeaf}`}>
                    <div className="w-full max-w-md">
                        {/* Logo mobile / tablette */}
                        <div className="mb-10 flex flex-col items-center lg:hidden">
                            <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
                                <img src="/images/logo-carrez.png" alt="Carrez Co Courtage" className="h-10 w-10 object-contain" />
                            </span>
                            <div className="mt-3 text-xl font-bold text-slate-900">Carrez Co Courtage</div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest">Extranet partenaires</div>
                        </div>

                        <div className="anim-in">
                            <div className="mb-8">
                                <h2 className="flex items-center gap-3 text-[1.7rem] font-extrabold tracking-tight text-slate-900">
                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                                        </svg>
                                    </span>
                                    Créez votre compte
                                </h2>
                                <p className="mt-1.5 text-sm text-slate-500">
                                    Renseignez vos informations pour faire votre demande d&apos;accès.
                                </p>
                            </div>

                            {error && (
                                <div className="anim-pop mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                    </svg>
                                    <div>{error}</div>
                                </div>
                            )}

                            {regSuccess ? (
                                <div className="anim-pop flex flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-slate-100">
                                    <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900">Demande envoyée</h2>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                                        Votre demande de compte partenaire est en attente de confirmation par le cabinet.
                                        Vous pourrez vous connecter dès qu&apos;elle sera validée.
                                    </p>
                                    <button
                                        onClick={() => setRegSuccess(false)}
                                        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                        Envoyer une nouvelle demande
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={submitRegister} className="space-y-5">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nom</label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                </svg>
                                            </span>
                                            <input
                                                type="text"
                                                value={regNom}
                                                onChange={(e) => setRegNom(e.target.value)}
                                                required
                                                placeholder="Nom de l'entreprise ou du partenaire"
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">E-mail</label>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                                    </svg>
                                                </span>
                                                <input
                                                    type="email"
                                                    value={regEmail}
                                                    onChange={(e) => setRegEmail(e.target.value)}
                                                    required
                                                    placeholder="vous@cabinet.fr"
                                                    className={inputCls}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Téléphone</label>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    type="tel"
                                                    value={regTel}
                                                    onChange={(e) => setRegTel(e.target.value)}
                                                    placeholder="Facultatif"
                                                    className={inputCls}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mot de passe</label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                </svg>
                                            </span>
                                            <input
                                                type="password"
                                                value={regMdp}
                                                onChange={(e) => setRegMdp(e.target.value)}
                                                required
                                                minLength={8}
                                                placeholder="8 caractères minimum"
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>

                                    <div className="rounded-xl bg-blue-50/70 px-4 py-3 text-xs leading-relaxed text-blue-800 ring-1 ring-blue-100">
                                        <span className="font-semibold">Bon à savoir&nbsp;:</span> votre compte sera actif uniquement après validation par le cabinet. Un e-mail vous sera envoyé.
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={regLoading}
                                        className="btn-primary w-full !rounded-xl !py-3 !text-sm !font-semibold disabled:opacity-50"
                                    >
                                        {regLoading ? 'Envoi...' : "S'inscrire"}
                                    </button>
                                </form>
                            )}

                            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                                <button
                                    onClick={() => switchMode('login')}
                                    className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                                >
                                    Déjà un compte&nbsp;? <span className="underline underline-offset-2">Se connecter</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Copyright mobile */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400 lg:hidden">
                        © {new Date().getFullYear()} Carrez Co Courtage
                    </div>
                </main>

                {/* ——— Panneau branding (droite) ——— */}
                <aside className={`relative hidden lg:flex lg:w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a1a3f] via-[#10275c] to-[#1d4ed8] p-12 xl:p-16 text-white ${rightLeaf}`}>
                    {/* Décor */}
                    <div className="pointer-events-none absolute inset-0">
                        <div className="anim-blob absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand-red/30 blur-3xl" />
                        <div className="anim-blob absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-blue-400/25 blur-3xl" style={{ animationDelay: '2s' }} />
                        <div className="anim-blob absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-red-400/20 blur-3xl" style={{ animationDelay: '4s' }} />
                    </div>

                    <div className="relative flex items-center gap-3">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
                            <img src="/images/logo-carrez.png" alt="Carrez Co Courtage" className="h-9 w-9 object-contain" />
                        </span>
                        <div>
                            <div className="text-lg font-bold tracking-tight">Carrez Co Courtage</div>
                            <div className="text-xs text-blue-200/90 uppercase tracking-widest">Extranet partenaires</div>
                        </div>
                    </div>

                    <div className="relative">
                        <h1 className="text-4xl xl:text-[2.75rem] font-extrabold leading-tight tracking-tight">
                            Vos devis, contrats et commissions.
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">Réunis au même endroit.</span>
                        </h1>
                        <p className="mt-5 max-w-md text-blue-100/90 text-[15px] leading-relaxed">
                            L'espace sécurisé qui vous permet de suivre vos demandes, piloter vos commissions et rester en lien avec votre cabinet, en temps réel.
                        </p>

                        <ul className="mt-8 space-y-3.5">
                            {[
                                'Suivi de vos demandes et devis en temps réel',
                                'Contrats et échéances centralisés',
                                'Suivi des commissions simplifié',
                                'Messagerie sécurisée avec le cabinet',
                            ].map((line) => (
                                <li key={line} className="flex items-center gap-3 text-sm text-blue-50/95">
                                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                                        <svg className="h-3.5 w-3.5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                    </span>
                                    {line}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative flex items-end justify-between">
                        <div className="flex gap-10">
                            {[
                                ['100%', 'Digitalisé'],
                                ['24/7', 'Disponible'],
                                ['Sécurisé', 'Données protégées'],
                            ].map(([val, label]) => (
                                <div key={label}>
                                    <div className="text-2xl font-extrabold">{val}</div>
                                    <div className="mt-0.5 text-xs text-blue-200/80">{label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="hidden xl:block text-blue-200/50 text-xs">© {new Date().getFullYear()} Carrez Co Courtage</div>
                    </div>
                </aside>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-[#f3f6fc] [perspective:2200px]">
            {/* ——— Panneau branding (desktop) ——— */}
            <aside className={`relative hidden lg:flex lg:w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a1a3f] via-[#10275c] to-[#1d4ed8] p-12 xl:p-16 text-white ${leftLeaf}`}>
                {/* Décor */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="anim-blob absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand-red/30 blur-3xl" />
                    <div className="anim-blob absolute top-1/3 -right-28 h-96 w-96 rounded-full bg-blue-400/25 blur-3xl" style={{ animationDelay: '2s' }} />
                    <div className="anim-blob absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-red-400/20 blur-3xl" style={{ animationDelay: '4s' }} />
                </div>

                <div className="relative flex items-center gap-3">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
                        <img src="/images/logo-carrez.png" alt="Carrez Co Courtage" className="h-9 w-9 object-contain" />
                    </span>
                    <div>
                        <div className="text-lg font-bold tracking-tight">Carrez Co Courtage</div>
                        <div className="text-xs text-blue-200/90 uppercase tracking-widest">Extranet partenaires</div>
                    </div>
                </div>

                <div className="relative">
                    <h1 className="text-4xl xl:text-[2.75rem] font-extrabold leading-tight tracking-tight">
                        Vos devis, contrats et commissions.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">Réunis au même endroit.</span>
                    </h1>
                    <p className="mt-5 max-w-md text-blue-100/90 text-[15px] leading-relaxed">
                        L'espace sécurisé qui vous permet de suivre vos demandes, piloter vos commissions et rester en lien avec votre cabinet, en temps réel.
                    </p>

                    <ul className="mt-8 space-y-3.5">
                        {[
                            'Suivi de vos demandes et devis en temps réel',
                            'Contrats et échéances centralisés',
                            'Suivi des commissions simplifié',
                            'Messagerie sécurisée avec le cabinet',
                        ].map((line) => (
                            <li key={line} className="flex items-center gap-3 text-sm text-blue-50/95">
                                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                                    <svg className="h-3.5 w-3.5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </span>
                                {line}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative flex items-end justify-between">
                    <div className="flex gap-10">
                        {[
                            ['100%', 'Digitalisé'],
                            ['24/7', 'Disponible'],
                            ['Sécurisé', 'Données protégées'],
                        ].map(([val, label]) => (
                            <div key={label}>
                                <div className="text-2xl font-extrabold">{val}</div>
                                <div className="mt-0.5 text-xs text-blue-200/80">{label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="hidden xl:block text-blue-200/50 text-xs">© {new Date().getFullYear()} Carrez Co Courtage</div>
                </div>
            </aside>

            {/* ——— Formulaires ——— */}
            <main className={`relative flex flex-1 items-center justify-center px-6 py-12 ${rightLeaf}`}>
                <div className="w-full max-w-md">
                    {/* Logo mobile / tablette */}
                    <div className="mb-10 flex flex-col items-center lg:hidden">
                        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
                            <img src="/images/logo-carrez.png" alt="Carrez Co Courtage" className="h-10 w-10 object-contain" />
                        </span>
                        <div className="mt-3 text-xl font-bold text-slate-900">Carrez Co Courtage</div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest">Extranet partenaires</div>
                    </div>

                    <div className="anim-in">
                        <div className="mb-8">
                            <h2 className="flex items-center gap-3 text-[1.7rem] font-extrabold tracking-tight text-slate-900">
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                    </svg>
                                </span>
                                Bienvenue
                            </h2>
                            <p className="mt-1.5 text-sm text-slate-500">
                                Connectez-vous pour accéder à votre espace partenaire.
                            </p>
                        </div>

                        {error && (
                            <div className="anim-pop mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                                <div>{error}</div>
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">E-mail</label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                            </svg>
                                        </span>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="vous@cabinet.fr"
                                            required
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mot de passe</label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                            </svg>
                                        </span>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className={inputCls}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                            title={showPassword ? 'Masquer' : 'Afficher'}
                                        >
                                            {showPassword ? (
                                                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {twoFactorRequired && (
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                            Code d'authentification à deux facteurs
                                        </label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                </svg>
                                            </span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={code2fa}
                                                onChange={(e) => setCode2fa(e.target.value.replace(/\D/g, ''))}
                                                placeholder="6 chiffres"
                                                className={inputCls}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full !rounded-xl !py-3 !text-sm !font-semibold disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span className="inline-flex items-center gap-2.5">
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                                            </svg>
                                            Connexion...
                                        </span>
                                    ) : twoFactorRequired ? (
                                        'Valider'
                                    ) : (
                                        <span className="inline-flex items-center gap-2">
                                            Se connecter
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            </form>

                        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                            <button
                                onClick={() => switchMode('register')}
                                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                            >
                                Pas encore partenaire ? <span className="underline underline-offset-2">Créer un compte</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Copyright mobile */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400 lg:hidden">
                    © {new Date().getFullYear()} Carrez Co Courtage
                </div>
            </main>
        </div>
    );
}
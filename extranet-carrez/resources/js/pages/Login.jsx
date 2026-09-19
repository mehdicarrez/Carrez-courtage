import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, estPartenaire } from '../auth';
import api from '../api';

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState(() => (window.location.pathname === '/register' ? 'register' : 'login'));
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

    return (
        <div className="min-h-screen flex bg-slate-900">
            {/* ===================== COLONNE GAUCHE ===================== */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-[oklch(0.39_0.21_263.59)] text-white flex-col p-12 xl:p-16 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-white/10"></div>

                <a href="/" className="relative flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 shadow-lg w-max mx-auto">
                    <img src="/images/logo-carrez.png" alt="Carrez Co-Courtage" className="h-14 object-contain" />
                </a>

                {/* Contenu centré verticalement */}
                <div className="relative flex-1 flex flex-col justify-center max-w-lg">
                    <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
                        Carrez Co-Courtage
                        <span className="block mt-2 text-2xl xl:text-3xl font-semibold text-blue-200">Assurance</span>
                    </h1>

                    <div className="mt-6 h-px w-20 bg-white/30"></div>

                    <p className="mt-6 text-lg text-blue-100 leading-relaxed">
                        Votre partenaire de confiance pour une protection sur mesure. Accédez à votre espace client en toute sécurité.
                    </p>
                    <ul className="mt-10 space-y-5">
                        <li className="flex items-start gap-3">
                            <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </span>
                            <span className="font-semibold">Données cryptées et sécurisées</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </span>
                            <span className="font-semibold">Accompagnement personnalisé</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-white/15 ring-1 ring-white/20 flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </span>
                            <span className="font-semibold">Accès rapide à vos contrats</span>
                        </li>
                    </ul>
                </div>

                <div className="relative text-sm text-blue-200 border-t border-white/10 pt-4">
                    © {new Date().getFullYear()} Carrez Co-Courtage Assurance. Tous droits réservés.
                </div>
            </div>

            {/* ===================== COLONNE DROITE ===================== */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-white">
            <div className="w-full max-w-md">

                <div className="text-center mb-6 lg:hidden">
                    <a href="/" className="inline-flex items-center justify-center gap-2 mb-3">
                        <img src="/images/logo-carrez.png" alt="Carrez Co Courtage" className="h-10 object-contain" />
                    </a>
                    <div className="text-2xl font-bold text-slate-900">Carrez Co Courtage</div>
                    <div className="text-slate-500 text-sm">Extranet partenaires</div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {mode === 'login' ? 'Connexion à votre espace' : 'Créer un compte partenaire'}
                    </h2>
                    <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-blue-700 to-emerald-500"></div>
                </div>

                {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm p-3 rounded-lg mb-4">
                        <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {mode === 'login' ? (
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0a2.25 2.25 0 0 0-2.25-2.25h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                    </svg>
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm bg-slate-50 focus:bg-white outline-none transition-all duration-150 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm bg-slate-50 focus:bg-white outline-none transition-all duration-150 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {twoFactorRequired && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Code d'authentification à deux facteurs
                                </label>
                                <input
                                    value={code2fa}
                                    onChange={(e) => setCode2fa(e.target.value)}
                                    placeholder="6 chiffres"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white outline-none tracking-widest text-center transition-all duration-150 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm shadow-blue-900/20 transition-all duration-150 hover:shadow-md disabled:opacity-50"
                        >
                            {loading ? 'Connexion...' : twoFactorRequired ? 'Valider' : 'Se connecter'}
                        </button>
                    </form>
                ) : (
                    regSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 ring-4 ring-emerald-50">
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Demande envoyée</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Votre demande de compte partenaire est en attente de confirmation par le cabinet.
                                Vous pourrez vous connecter dès qu'elle sera validée.
                            </p>
                            <button
                                onClick={() => setRegSuccess(false)}
                                className="mt-5 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline underline-offset-4"
                            >
                                Envoyer une nouvelle demande
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submitRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                                <input
                                    type="text"
                                    value={regNom}
                                    onChange={(e) => setRegNom(e.target.value)}
                                    required
                                    placeholder="Nom de l'entreprise ou du partenaire"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white outline-none transition-all duration-150 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                                <input
                                    type="email"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    required
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white outline-none transition-all duration-150 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                                <input
                                    type="tel"
                                    value={regTel}
                                    onChange={(e) => setRegTel(e.target.value)}
                                    placeholder="Facultatif"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white outline-none transition-all duration-150 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={regMdp}
                                    onChange={(e) => setRegMdp(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="8 caractères minimum"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white outline-none transition-all duration-150 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={regLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-sm shadow-emerald-900/20 transition-all duration-150 hover:shadow-md disabled:opacity-50"
                            >
                                {regLoading ? 'Envoi...' : "S'inscrire"}
                            </button>
                        </form>
                    )
                )}

                <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                    {mode === 'login' ? (
                        <button
                            onClick={() => { setMode('register'); setError(''); }}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full transition-colors duration-150"
                        >
                            Pas encore partenaire ?
                            <span className="underline underline-offset-2">Créer un compte</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => { setMode('login'); setError(''); }}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors duration-150"
                        >
                            Déjà un compte ?
                            <span className="underline underline-offset-2">Se connecter</span>
                        </button>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
}

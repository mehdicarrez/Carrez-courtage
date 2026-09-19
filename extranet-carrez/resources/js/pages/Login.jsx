import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, estPartenaire } from '../auth';
import api from '../api';

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [mode, setMode] = useState('login'); // 'login' | 'register'
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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
                <div className="text-center mb-6">
                    <div className="text-2xl font-bold text-slate-900">Carrez Co Courtage</div>
                    <div className="text-slate-500 text-sm">Extranet partenaires</div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 text-sm p-3 rounded mb-4">{error}</div>
                )}

                {mode === 'login' ? (
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {twoFactorRequired && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Code d'authentification à deux facteurs
                                </label>
                                <input
                                    value={code2fa}
                                    onChange={(e) => setCode2fa(e.target.value)}
                                    placeholder="6 chiffres"
                                    className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                        >
                            {loading ? 'Connexion...' : twoFactorRequired ? 'Valider' : 'Se connecter'}
                        </button>
                    </form>
                ) : (
                    regSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
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
                                className="mt-5 text-sm font-medium text-blue-700 hover:text-blue-800"
                            >
                                Envoyer une nouvelle demande
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submitRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Nom</label>
                                <input
                                    type="text"
                                    value={regNom}
                                    onChange={(e) => setRegNom(e.target.value)}
                                    required
                                    placeholder="Nom de l'entreprise ou du partenaire"
                                    className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">E-mail</label>
                                <input
                                    type="email"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    required
                                    className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Téléphone</label>
                                <input
                                    type="tel"
                                    value={regTel}
                                    onChange={(e) => setRegTel(e.target.value)}
                                    placeholder="Facultatif"
                                    className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={regMdp}
                                    onChange={(e) => setRegMdp(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="8 caractères minimum"
                                    className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={regLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
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
                            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                        >
                            Pas encore partenaire ? Créer un compte
                        </button>
                    ) : (
                        <button
                            onClick={() => { setMode('login'); setError(''); }}
                            className="text-sm font-medium text-blue-700 hover:text-blue-800"
                        >
                            Déjà un compte ? Se connecter
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
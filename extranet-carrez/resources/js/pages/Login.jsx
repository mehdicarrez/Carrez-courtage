import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code2fa, setCode2fa] = useState('');
    const [twoFactorRequired, setTwoFactorRequired] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (user) {
        navigate('/', { replace: true });
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
                navigate('/');
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
            </div>
        </div>
    );
}

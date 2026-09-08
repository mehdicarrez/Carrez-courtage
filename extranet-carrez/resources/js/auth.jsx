import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

// Déconnexion automatique stricte après inactivité (minutes)
const INACTIVITY_MINUTES = 120;
const INACTIVITY_MS = INACTIVITY_MINUTES * 60 * 1000;

// Rôles qui relèvent de l'espace partenaire
const ROLES_PARTENAIRE = ['DIRIGEANT_PARTENAIRE', 'COLLABORATEUR_PARTENAIRE', 'LECTEUR_PARTENAIRE', 'PARTENAIRE'];

export function estPartenaire(user) {
    return !!user && ROLES_PARTENAIRE.includes(user.role);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('extranet_user')) || null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('extranet_token');
        if (!token) {
            setLoading(false);
            return;
        }
        api.get('/auth/me')
            .then((res) => {
                const u = res.data.user;
                setUser(u);
                localStorage.setItem('extranet_user', JSON.stringify(u));
            })
            .catch(() => {
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password, code2fa) => {
        const res = await api.post('/auth/login', { email, password, code_2fa: code2fa });
        if (res.data.two_factor_required) {
            return { two_factor_required: true };
        }
        localStorage.setItem('extranet_token', res.data.token);
        setUser(res.data.user);
        localStorage.setItem('extranet_user', JSON.stringify(res.data.user));
        return { ok: true, user: res.data.user };
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('extranet_token');
        localStorage.removeItem('extranet_user');
        setUser(null);
    };

    // Déconnexion automatique stricte après inactivité (souris, clavier, scroll, tactile)
    useEffect(() => {
        if (!user) return;

        let timer = null;

        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                logout();
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }, INACTIVITY_MS);
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'];
        events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

        resetTimer();

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach((ev) => window.removeEventListener(ev, resetTimer));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

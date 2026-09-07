import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

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
        return { ok: true };
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('extranet_token');
        localStorage.removeItem('extranet_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

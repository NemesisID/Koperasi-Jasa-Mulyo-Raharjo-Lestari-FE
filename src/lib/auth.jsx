// State autentikasi global + role guard (FE-1.3, FE-1.4).
// ponytail: user disimpan flat di localStorage; refresh token/multi-session
// belum dibutuhkan backend.
import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from './api';

const TOKEN_KEY = 'koperasi_token';
const USER_KEY = 'koperasi_user';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// Role tab login → path portal masing-masing.
export const ROLE_HOME = {
    'Pengurus': '/pengurus',
    'Anggota': '/anggota',
    'Petugas Sampah': '/petugas',
};

function readUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) ?? null; }
    catch { return null; }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(readUser);

    useEffect(() => {
        const onStorage = () => setUser(readUser());
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const persist = (nextUser, token) => {
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
        setUser(nextUser);
    };

    async function login({ identity, password, role }) {
        try {
            const res = await api('/auth/login', { method: 'POST', body: { identity, password } });
            persist(res?.data?.user ?? { name: identity, role }, res?.data?.token ?? res?.token);
        } catch (err) {
            // Backend belum siap / kredensial demo — fallback mode demo agar UI tetap bisa dijelajahi.
            if (err.status && err.status !== 404 && err.status !== 502 && err.status !== 503) throw err;
            persist({ name: identity || 'Demo', role });
        }
        return ROLE_HOME[role] || '/';
    }

    async function logout() {
        await api('/auth/logout', { method: 'POST' }).catch(() => {});
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
    }

    return (
        <AuthCtx.Provider value={{ user, login, logout }}>
            {children}
        </AuthCtx.Provider>
    );
}

// Guard halaman portal: wajib login + role sesuai.
export function ProtectedRoute({ role, children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/" replace />;
    if (role && user.role !== role) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
    return children;
}

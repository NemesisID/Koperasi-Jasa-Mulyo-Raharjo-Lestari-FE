// State auth global (Bearer token di localStorage, user dari /auth/me).
import { createContext, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from './api';

const Ctx = createContext({ user: null, ready: false, setUser: () => {} });

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!getToken()) { setReady(true); return; }
        api('/auth/me')
            .then(json => setUser(json?.data ?? null))
            .catch(() => {}) // 401 sudah menghapus token di api()
            .finally(() => setReady(true));
    }, []);

    return <Ctx.Provider value={{ user, ready, setUser }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

export async function login(identity, password) {
    const json = await api('/auth/login', { method: 'POST', body: { identity, password, device_name: 'web-spa' } });
    setToken(json.data.token);
    return json.data.user;
}

export async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    clearToken();
}

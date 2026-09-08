// Klien API untuk backend Laravel (Bearer token Sanctum).
// ponytail: tanpa axios — fetch + Authorization header sudah cukup.
import { useCallback, useEffect, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || ''; // dev: kosong → vite proxy /api
const TOKEN_KEY = 'kjmrl_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function api(path, { method = 'GET', body, headers } = {}) {
    const reqHeaders = { Accept: 'application/json', ...headers };
    const token = getToken();
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;
    if (body !== undefined) reqHeaders['Content-Type'] = 'application/json';

    const res = await fetch(`${BASE}/api/v1${path}`, {
        method,
        headers: reqHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.ok) return res.status === 204 ? null : res.json().catch(() => null);

    const err = new Error(`Request gagal (${res.status})`);
    err.status = res.status;
    const payload = await res.json().catch(() => null);
    if (payload) {
        err.message = payload.message || err.message;
        err.errors = payload.errors ?? {};
    }
    if (res.status === 401) clearToken(); // token invalid/expired → paksa login ulang
    throw err;
}

// Hook fetch untuk envelope {success, message, data, meta}.
export function useApi(path, deps = []) {
    const [state, setState] = useState({ data: null, meta: null, loading: Boolean(path), error: null });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!path) return;
        let live = true;
        setState(s => ({ ...s, loading: true, error: null }));
        api(path)
            .then(json => live && setState({ data: json?.data ?? [], meta: json?.meta ?? null, loading: false, error: null }))
            .catch(err => live && setState({ data: null, meta: null, loading: false, error: err }));
        return () => { live = false; };
    }, [path, tick, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

    const reload = useCallback(() => setTick(t => t + 1), []);
    return { ...state, reload };
}

// Format Rupiah / tanggal.
export const rp = (n) => Number(n ?? 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
export const dfmt = (iso) => (iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

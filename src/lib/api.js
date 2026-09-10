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
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !isForm) reqHeaders['Content-Type'] = 'application/json';

    const res = await fetch(`${BASE}/api/v1${path}`, {
        method,
        headers: reqHeaders,
        body: body !== undefined ? (isForm ? body : JSON.stringify(body)) : undefined,
    });

    if (res.ok) return res.status === 204 ? null : res.json().catch(() => null);

    const err = new Error(`Request gagal (${res.status})`);
    err.status = res.status;
    const payload = await res.json().catch(() => null);
    if (payload) {
        err.message = payload.message || err.message;
        err.errors = payload.errors ?? {};
    }
    if (res.status === 401) {
        // Token invalid/expired → paksa login ulang (hard redirect: bersihkan state React).
        clearToken();
        if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    throw err;
}

// Unduh file (blob) dengan token auth — untuk export laporan csv/xlsx/pdf.
export async function download(path, filename) {
    const headers = { Accept: '*/*' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}/api/v1${path}`, { headers });
    if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || `Unduhan gagal (${res.status})`);
    }
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

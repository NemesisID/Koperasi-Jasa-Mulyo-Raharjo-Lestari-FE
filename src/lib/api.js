// Klien API tipis untuk backend Laravel (web service).
// ponytail: tanpa axios — fetch + Bearer token Sanctum sudah cukup.
const TOKEN_KEY = 'koperasi_token';
const BASE = (import.meta.env.VITE_API_URL || '') + '/api/v1';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
    token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

function csrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export async function api(path, { method = 'GET', body, headers } = {}) {
    const isForm = body instanceof FormData;
    const reqHeaders = { Accept: 'application/json', ...headers };
    if (body && !isForm) reqHeaders['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;
    const csrf = csrfToken();
    if (csrf) reqHeaders['X-XSRF-TOKEN'] = csrf;

    let res;
    try {
        res = await fetch(BASE + path, {
            method,
            credentials: 'include',
            headers: reqHeaders,
            body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        // Backend tidak terjangkau — biarkan pemanggil memutuskan (mis. fallback demo).
        const netErr = new Error('Tidak dapat terhubung ke server');
        netErr.status = 0;
        throw netErr;
    }

    if (res.ok) {
        return res.status === 204 || res.headers.get('Content-Length') === '0'
            ? null
            : res.json().catch(() => null);
    }

    const err = new Error(`Request gagal: ${res.status} ${res.statusText}`);
    err.status = res.status;
    if (res.status === 422 || res.status === 401) {
        const payload = await res.json().catch(() => ({}));
        err.errors = payload.errors ?? {};
        err.message = payload.message || err.message;
    }
    throw err;
}

// Klien API tipis untuk backend Laravel (web service).
// ponytail: tanpa axios — fetch + header XSRF Sanctum sudah cukup.
const BASE = import.meta.env.VITE_API_URL || '';

function csrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export async function api(path, { method = 'GET', body, headers } = {}) {
    const isForm = body instanceof FormData;
    const reqHeaders = { Accept: 'application/json', ...headers };
    if (body && !isForm) reqHeaders['Content-Type'] = 'application/json';
    const token = csrfToken();
    if (token) reqHeaders['X-XSRF-TOKEN'] = token;

    const res = await fetch(BASE + path, {
        method,
        credentials: 'include',
        headers: reqHeaders,
        body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.ok) {
        return res.status === 204 || res.headers.get('Content-Length') === '0'
            ? null
            : res.json().catch(() => null);
    }

    const err = new Error(`Request gagal: ${res.status} ${res.statusText}`);
    err.status = res.status;
    if (res.status === 422) {
        err.errors = (await res.json().catch(() => ({}))).errors ?? {};
    }
    throw err;
}

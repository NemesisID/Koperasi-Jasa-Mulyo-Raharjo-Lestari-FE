// Pengganti minimal API @inertiajs/react yang dipakai halaman-halaman hasil
// porting dari monolith Laravel. Hapus bertahap saat halaman berpindah ke
// pemanggilan API langsung.
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { api } from './api';
import { useAuth, logout } from './auth';

const APP_NAME = 'Koperasi Jasa Mulyo Raharjo Lestari';

export function Head({ title }) {
    useEffect(() => {
        document.title = title ? `${title} - ${APP_NAME}` : APP_NAME;
    }, [title]);
    return null;
}

// Link Inertia: href + method opsional. GET → react-router, selain itu → API.
export function Link({ href, method = 'get', as, ...props }) {
    const navigate = useNavigate();
    if (method.toLowerCase() === 'get') {
        return <RouterLink to={href} {...props} />;
    }
    return (
        <button
            type="button"
            onClick={async () => {
                await api(href, { method: method.toUpperCase() }).catch(() => {});
                if (href.includes('logout')) {
                    await logout();
                    navigate('/login');
                }
            }}
            {...props}
        />
    );
}

// ponytail: reload penuh; dipakai halaman Breeze yang belum di-migrate.
export const router = { visit: (url) => { window.location.href = url; } };

// User dari AuthProvider (Bearer token) — menggantikan page.props Inertia.
export function usePage() {
    const { user } = useAuth();
    return { props: { auth: { user } } };
}

export function useForm(initialData = {}) {
    const [data, setDataState] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    const setData = (keyOrPatch, value) =>
        setDataState((prev) =>
            typeof keyOrPatch === 'string'
                ? { ...prev, [keyOrPatch]: value }
                : { ...prev, ...keyOrPatch },
        );

    const reset = (...fields) =>
        setDataState((prev) => {
            const next = { ...prev };
            for (const key of fields.length ? fields : Object.keys(initialData)) {
                next[key] = initialData[key];
            }
            return next;
        });

    async function submit(method, url, options = {}) {
        setProcessing(true);
        setErrors({});
        try {
            await api(url, { method, body: data });
            setRecentlySuccessful(true);
            setTimeout(() => setRecentlySuccessful(false), 2000);
            options.onSuccess?.();
        } catch (err) {
            setErrors(err.errors ?? {});
            options.onError?.(err.errors ?? {});
        } finally {
            setProcessing(false);
            options.onFinish?.();
        }
    }

    return {
        data,
        setData,
        errors,
        processing,
        recentlySuccessful,
        reset,
        clearErrors: () => setErrors({}),
        post: (url, o) => submit('POST', url, o),
        put: (url, o) => submit('PUT', url, o),
        patch: (url, o) => submit('PATCH', url, o),
        delete: (url, o) => submit('DELETE', url, o),
    };
}

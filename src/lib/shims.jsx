// Pengganti minimal API @inertiajs/react yang dipakai halaman-halaman hasil
// porting dari monolith Laravel. Hapus bertahap saat halaman berpindah ke
// pemanggilan API langsung.
import { useEffect } from 'react';

const APP_NAME = 'Koperasi Jasa Mulyo Raharjo Lestari';

export function Head({ title }) {
    useEffect(() => {
        document.title = title ? `${title} - ${APP_NAME}` : APP_NAME;
    }, [title]);
    return null;
}

// ponytail: reload penuh; ganti useNavigate di komponen kalau butuh transisi SPA.
export const router = { visit: (url) => { window.location.href = url; } };

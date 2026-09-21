// #20 — Halaman Log Perubahan Harga Sampah: gabungan riwayat harga lintas
// kategori (harga lama → baru, oleh siapa, kapan). Endpoint global audit log
// belum tersedia di BE → gabung riwayat per kategori (GET /trash-categories
// + GET /trash-categories/{id}/price-history per katalog).
import { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/Components/Koperasi/ManagerUI';
import { api, useApi, rp } from '@/lib/api';

export default function PriceLogPage() {
    const { data: categories, loading: loadingCats, error, reload } = useApi('/trash-categories');
    const [rows, setRows] = useState([]);
    const [logsLoading, setLogsLoading] = useState(true);

    const catalog = categories ?? [];
    const catalogKey = catalog.map(c => c.id).join(',');

    useEffect(() => {
        let live = true;
        // setState hanya di dalam callback async (bukan body effect) — hindari cascading render.
        Promise.resolve().then(() => {
            if (!live) return;
            if (!catalog.length) { setRows([]); setLogsLoading(false); return; }
            setLogsLoading(true);
            Promise.all(
                catalog.map(c =>
                    api(`/trash-categories/${c.id}/price-history`)
                        .then(json => (json?.data ?? []).map(log => ({ ...log, category: c })))
                        .catch(() => []),
                ),
            ).then(grouped => {
                if (!live) return;
                setRows(grouped.flat().sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at)));
                setLogsLoading(false);
            });
        });
        return () => { live = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [catalogKey]);

    const refresh = () => reload();

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Log Perubahan Harga Sampah"
                desc="Jejak audit setiap perubahan harga — harga lama, harga baru, pelaku, dan waktunya."
                action={
                    <button onClick={refresh} disabled={loadingCats}
                        className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50">
                        <RefreshCw size={15} /> <span>Muat Ulang</span>
                    </button>
                }
            />

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="p-5 border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Riwayat Lintas Kategori</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Tanggal</th>
                                <th className="px-6 py-3.5">Kategori</th>
                                <th className="px-6 py-3.5">Harga Jual (lama → baru)</th>
                                <th className="px-6 py-3.5">Oleh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {(loadingCats || logsLoading) && (
                                <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">Memuat riwayat harga…</td></tr>
                            )}
                            {!(loadingCats || logsLoading) && rows.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                                        {error ? 'Gagal memuat data katalog.' : 'Belum ada perubahan harga tercatat.'}
                                    </td>
                                </tr>
                            )}
                            {!(loadingCats || logsLoading) && rows.map((log, i) => (
                                <tr key={i} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                        {new Date(log.changed_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="block font-semibold text-foreground">{log.category?.name ?? '-'}</span>
                                        <span className="text-[11px] capitalize text-muted-foreground">{log.category?.type}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {log.old_price_sell == null && log.new_price_sell == null ? <span className="text-muted-foreground">–</span> : (
                                            <>
                                                <span className="text-xs text-muted-foreground line-through">{log.old_price_sell == null ? '-' : rp(log.old_price_sell)}</span>
                                                <span className="mx-1.5 text-muted-foreground">→</span>
                                                <span className="font-bold text-primary">{log.new_price_sell == null ? '-' : rp(log.new_price_sell)}</span>
                                            </>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{log.changed_by?.name ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>{rows.length} entri riwayat</span>
                    <span className="inline-flex items-center gap-1"><History size={13} /> Terhitung dari {catalog.length} kategori</span>
                </div>
            </section>
        </div>
    );
}

// FE-4.2 — Papan info harga sampah terkini untuk anggota: filter kategori,
// penanda fluktuasi naik/turun, info potongan harga jemput armada.
// Auto-refresh tiap 60 detik agar harga tampil terkini (realtime).
import { useEffect, useState } from 'react';
import { Info, Recycle, TrendingDown, TrendingUp } from 'lucide-react';
import { useApi, rp } from '@/lib/api';

const cn = (...cls) => cls.filter(Boolean).join(' ');

export default function PriceBoardPage() {
    const { data, loading, error, reload } = useApi('/trash-categories/board');
    const [filter, setFilter] = useState('Semua');

    useEffect(() => {
        const timer = setInterval(reload, 60000);
        return () => clearInterval(timer);
    }, [reload]);

    const items = data ?? [];
    const categories = ['Semua', ...new Set(items.map(p => p.type || 'Lainnya'))];
    const filtered = filter === 'Semua' ? items : items.filter(p => (p.type || 'Lainnya') === filter);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">Papan Harga Sampah</h1>
                <p className="mt-1 text-sm text-muted-foreground">Harga terkini dari koperasi — dimuat ulang otomatis setiap menit.</p>
            </div>

            {/* Info potongan jemput */}
            <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-[#eaf1fd] p-4 text-sm text-foreground">
                <Info size={18} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed">
                    Setoran <strong>diantar sendiri ke gudang</strong> mendapat harga penuh. Jika <strong>dijemput armada</strong> di rumah/pasar,
                    harga dipotong Rp300 untuk sampah non-logam dan Rp2.000 untuk logam sebagai biaya layanan angkut.
                </p>
            </div>

            {/* Filter kategori */}
            <div className="flex flex-wrap items-center gap-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={cn(
                            'rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all',
                            filter === cat
                                ? 'bg-primary text-white shadow-xs'
                                : 'border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-primary'
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading && (
                <p className="py-8 text-center text-sm text-muted-foreground">Memuat papan harga sampah…</p>
            )}

            {!loading && filtered.length === 0 && (
                <div className="rounded-2xl border border-border/80 bg-card p-10 text-center text-sm text-muted-foreground">
                    {error ? 'Gagal memuat papan harga.' : 'Belum ada data harga sampah.'}
                </div>
            )}

            {/* Kartu harga */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(item => {
                    const trend = item.trend || 'stabil';
                    return (
                        <article key={item.id || item.name} className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <Recycle size={20} />
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
                                        <p className="text-xs capitalize text-muted-foreground">{item.type} · per {item.unit}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize',
                                    trend === 'naik' ? 'bg-emerald-100 text-emerald-700' : trend === 'turun' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-muted-foreground'
                                )}>
                                    {trend === 'naik' ? <TrendingUp size={11} /> : trend === 'turun' ? <TrendingDown size={11} /> : null}
                                    {trend}
                                </span>
                            </div>
                            {/* 3 nominal: bersih (otomatis 80% harga jual), kotor & jual manual pengurus */}
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="rounded-xl border border-primary/40 bg-[#eaf1fd] p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase text-primary">Harga Bersih</p>
                                    <strong className="mt-0.5 block text-base font-extrabold text-primary">{rp(item.price_member)}</strong>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Harga Kotor</p>
                                    <strong className="mt-0.5 block text-base font-extrabold text-foreground">{rp(item.price_unsorted)}</strong>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Harga Jual</p>
                                    <strong className="mt-0.5 block text-base font-extrabold text-foreground">{rp(item.price_sell)}</strong>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

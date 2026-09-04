// FE-4.2 — Papan info harga sampah terkini untuk anggota: filter kategori,
// penanda fluktuasi naik/turun, info potongan harga jemput armada.
import { useState } from 'react';
import { Info, Recycle, Tag, TrendingDown, TrendingUp } from 'lucide-react';

const cn = (...cls) => cls.filter(Boolean).join(' ');

const rp = (n) => 'Rp ' + n.toLocaleString('id-ID');

// ponytail: mock papan harga sampai endpoint /trash-categories tersedia.
const PRICES = [
    { name: 'Botol PET Bening', category: 'Plastik', unit: 'kg', warehouse: 3500, pickup: 3200, prev: 3400 },
    { name: 'Plastik Kresek / Kantong', category: 'Plastik', unit: 'kg', warehouse: 1500, pickup: 1200, prev: 1600 },
    { name: 'Tutup Galon Aqua', category: 'Plastik', unit: 'biji', warehouse: 300, pickup: 0, prev: 300 },
    { name: 'Kardus / Karton', category: 'Kertas', unit: 'kg', warehouse: 2000, pickup: 1700, prev: 2000 },
    { name: 'Kertas HVS Bekas', category: 'Kertas', unit: 'kg', warehouse: 2500, pickup: 2200, prev: 2400 },
    { name: 'Kaleng Aluminium', category: 'Logam', unit: 'kg', warehouse: 12000, pickup: 10000, prev: 11500 },
    { name: 'Besi / Besi Tua', category: 'Logam', unit: 'kg', warehouse: 4500, pickup: 2500, prev: 4700 },
    { name: 'Kaca / Pecahan Beling', category: 'Kaca', unit: 'kg', warehouse: 1000, pickup: 700, prev: 900 },
];

export default function PriceBoardPage() {
    const [filter, setFilter] = useState('Semua');
    const categories = ['Semua', ...new Set(PRICES.map(p => p.category))];
    const filtered = filter === 'Semua' ? PRICES : PRICES.filter(p => p.category === filter);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">Papan Harga Sampah</h1>
                <p className="mt-1 text-sm text-muted-foreground">Harga terkini per 4 September 2026 — diperbarui harian oleh Bendahara.</p>
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
                            'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                            filter === cat
                                ? 'bg-primary text-white shadow-xs'
                                : 'border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-primary'
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Kartu harga */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(item => {
                    const diff = item.warehouse - item.prev;
                    return (
                        <article key={item.name} className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <Recycle size={20} />
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
                                        <p className="text-xs text-muted-foreground">{item.category} · per {item.unit}</p>
                                    </div>
                                </div>
                                <span className={cn(
                                    'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold',
                                    diff > 0 ? 'bg-emerald-100 text-emerald-700' : diff < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-muted-foreground'
                                )}>
                                    {diff > 0 ? <TrendingUp size={11} /> : diff < 0 ? <TrendingDown size={11} /> : null}
                                    {diff > 0 ? 'Naik' : diff < 0 ? 'Turun' : 'Stabil'}
                                </span>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Gudang</p>
                                    <strong className="mt-0.5 block text-base font-extrabold text-emerald-700">{rp(item.warehouse)}</strong>
                                </div>
                                <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Dijemput</p>
                                    <strong className="mt-0.5 block text-base font-extrabold text-foreground">{rp(item.pickup)}</strong>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

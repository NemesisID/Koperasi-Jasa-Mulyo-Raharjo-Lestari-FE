// FE-2.3 — UI Manajemen Harga Sampah Harian: katalog per kategori,
// input cepat pembaruan harga oleh Bendahara, modal riwayat perubahan.
// Skema harga: gudang vs jemput lapangan (non-logam diskon Rp300, logam Rp2.000).
import { useState } from 'react';
import {
    CheckCircle2, History, Recycle, Save, Tag, TrendingDown, TrendingUp, X,
} from 'lucide-react';
import { PageHeader, StatCard, Pager } from '@/Components/Koperasi/ManagerUI';
import { Modal } from '@/Components/Koperasi/Popups';
import { usePopup } from './Index';

const cn = (...cls) => cls.filter(Boolean).join(' ');

// ponytail: mock katalog sampah anorganik (harga Ponorogo) sampai
// endpoint /api/v1/trash-categories tersedia.
const INITIAL_CATALOG = [
    { id: 1, name: 'Botol PET Bening', category: 'Plastik', unit: 'kg', warehouse: 3500, prevWarehouse: 3400 },
    { id: 2, name: 'Plastik Kresek / Kantong', category: 'Plastik', unit: 'kg', warehouse: 1500, prevWarehouse: 1600 },
    { id: 3, name: 'Kardus / Karton', category: 'Kertas', unit: 'kg', warehouse: 2000, prevWarehouse: 2000 },
    { id: 4, name: 'Kertas HVS Bekas', category: 'Kertas', unit: 'kg', warehouse: 2500, prevWarehouse: 2400 },
    { id: 5, name: 'Kaleng Aluminium', category: 'Logam', unit: 'kg', warehouse: 12000, prevWarehouse: 11500 },
    { id: 6, name: 'Besi / Besi Tua', category: 'Logam', unit: 'kg', warehouse: 4500, prevWarehouse: 4700 },
    { id: 7, name: 'Tutup Galon Aqua', category: 'Plastik', unit: 'biji', warehouse: 300, prevWarehouse: 300 },
    { id: 8, name: 'Kaca / pecahan beling', category: 'Kaca', unit: 'kg', warehouse: 1000, prevWarehouse: 900 },
];

const PRICE_LOGS = [
    { date: '04 Sep 2026', item: 'Botol PET Bening', from: 'Rp 3.400', to: 'Rp 3.500', by: 'Bendahara Siti' },
    { date: '04 Sep 2026', item: 'Kaleng Aluminium', from: 'Rp 11.500', to: 'Rp 12.000', by: 'Bendahara Siti' },
    { date: '03 Sep 2026', item: 'Besi / Besi Tua', from: 'Rp 4.700', to: 'Rp 4.500', by: 'Bendahara Siti' },
    { date: '03 Sep 2026', item: 'Kertas HVS Bekas', from: 'Rp 2.400', to: 'Rp 2.500', by: 'Admin Bambang' },
    { date: '02 Sep 2026', item: 'Plastik Kresek / Kantong', from: 'Rp 1.600', to: 'Rp 1.500', by: 'Bendahara Siti' },
];

const rp = (n) => 'Rp ' + n.toLocaleString('id-ID');

// Harga jemput lapangan: logam dipotong Rp2.000, non-logam Rp300 (per lampiran WBS).
const pickupPrice = (item) => Math.max(0, item.warehouse - (item.category === 'Logam' ? 2000 : 300));

function HistoryModal({ onClose }) {
    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between px-6 py-4 bg-accent/60 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <History size={20} />
                    <span>Riwayat Perubahan Harga</span>
                </h2>
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors">
                    <X size={18} />
                </button>
            </div>
            <div className="overflow-x-auto bg-card">
                <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                        <tr>
                            <th className="px-5 py-3">Tanggal</th>
                            <th className="px-5 py-3">Item</th>
                            <th className="px-5 py-3">Perubahan</th>
                            <th className="px-5 py-3">Oleh</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {PRICE_LOGS.map((log, i) => (
                            <tr key={i} className="hover:bg-secondary/40 transition-colors">
                                <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{log.date}</td>
                                <td className="px-5 py-3.5 font-semibold text-foreground">{log.item}</td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                    <span className="text-xs text-muted-foreground line-through">{log.from}</span>
                                    <span className="ml-1.5 font-bold text-primary">{log.to}</span>
                                </td>
                                <td className="px-5 py-3.5 text-muted-foreground">{log.by}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-card border-t border-border/60">
                <button onClick={onClose}
                    className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90">
                    Tutup
                </button>
            </div>
        </Modal>
    );
}

export default function TrashPricesPage() {
    const { showStatus } = usePopup();
    const [catalog, setCatalog] = useState(INITIAL_CATALOG);
    const [filter, setFilter] = useState('Semua');
    const [historyOpen, setHistoryOpen] = useState(false);

    const categories = ['Semua', ...new Set(catalog.map(c => c.category))];
    const filtered = filter === 'Semua' ? catalog : catalog.filter(c => c.category === filter);

    const setPrice = (id, value) =>
        setCatalog(prev => prev.map(c => c.id === id ? { ...c, warehouse: Math.max(0, Number(value) || 0) } : c));

    const saveAll = () => showStatus('Harga Harian Tersimpan', 'Seluruh pembaruan harga katalog telah dicatat pada log audit.');

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Manajemen Harga Sampah"
                desc="Perbarui harga katalog sampah harian — setiap perubahan tercatat untuk audit transparansi."
                action={
                    <>
                        <button
                            onClick={() => setHistoryOpen(true)}
                            className="flex h-10 items-center gap-2 rounded-xl border border-primary/40 bg-card px-4 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white"
                        >
                            <History size={16} />
                            <span>Riwayat Harga</span>
                        </button>
                        <button
                            onClick={saveAll}
                            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                        >
                            <Save size={16} />
                            <span>Simpan Harga Hari Ini</span>
                        </button>
                    </>
                }
            />

            <div className="grid gap-5 md:grid-cols-3">
                <StatCard icon={Tag} label="Item Katalog Aktif" value={`${catalog.length} Item`} note="4 Kategori" tone="blue" />
                <StatCard icon={TrendingUp} label="Harga Naik Hari Ini" value="3 Item" note="↗ PET, Kaleng, HVS" tone="green" />
                <StatCard icon={TrendingDown} label="Harga Turun Hari Ini" value="2 Item" note="↘ Besi, Kresek" tone="red" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Katalog Harga Sampah Anorganik</h2>
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
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Jenis Sampah</th>
                                <th className="px-6 py-3.5">Satuan</th>
                                <th className="px-6 py-3.5">Harga Gudang</th>
                                <th className="px-6 py-3.5">Harga Jemput</th>
                                <th className="px-6 py-3.5">Fluktuasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {filtered.map(item => {
                                const isMetal = item.category === 'Logam';
                                const diff = item.warehouse - item.prevWarehouse;
                                return (
                                    <tr key={item.id} className="hover:bg-secondary/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-primary">
                                                    <Recycle size={18} />
                                                </span>
                                                <div>
                                                    <span className="block font-semibold text-foreground">{item.name}</span>
                                                    <span className="text-xs text-muted-foreground">{item.category}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">{item.unit}</td>
                                        <td className="px-6 py-4">
                                            <div className="relative w-36">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary">Rp</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.warehouse}
                                                    onChange={e => setPrice(item.id, e.target.value)}
                                                    aria-label={`Harga gudang ${item.name}`}
                                                    className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs font-bold text-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-foreground">
                                                {rp(pickupPrice(item))}
                                            </span>
                                            <span className="ml-2 text-[10px] text-muted-foreground">
                                                {isMetal ? '−Rp2.000' : '−Rp300'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {diff > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                                    <TrendingUp size={14} /> +{rp(diff)}
                                                </span>
                                            ) : diff < 0 ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                                                    <TrendingDown size={14} /> −{rp(Math.abs(diff))}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                                    <CheckCircle2 size={14} /> Stabil
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>Menampilkan {filtered.length} dari {catalog.length} item — harga per 4 September 2026</span>
                    <Pager total={3} />
                </div>
            </section>

            <p className="text-xs text-muted-foreground">
                Harga jemput lapangan dihitung otomatis dari harga gudang: potongan Rp2.000 untuk logam dan Rp300 untuk kategori non-logam.
            </p>

            {historyOpen && <HistoryModal onClose={() => setHistoryOpen(false)} />}
        </div>
    );
}

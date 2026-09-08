// FE-3.2 + FE-3.3 — Form timbang cepat untuk petugas lapangan (mobile-first):
// autocomplete anggota, jenis sampah dinamis, input berat besar, toggle lokasi
// (diantar ke gudang vs dijemput), dan kalkulator preview real-time 20%.
import { useMemo, useState } from 'react';
import {
    CheckCircle2, Home, Package, Plus, Scale, Trash2, Warehouse,
} from 'lucide-react';
import ReceiptSuccessModal from '@/Components/Koperasi/ReceiptSuccessModal';
import { calcWeighing } from '@/lib/weighing';

const cn = (...cls) => cls.filter(Boolean).join(' ');

const rp = (n) => 'Rp ' + n.toLocaleString('id-ID');

// ponytail: mock sampai endpoint /api/v1/members & /trash-categories tersedia.
const MEMBERS = [
    { code: 'MBR-202608-0042', name: 'Bambang Susanto — Jl. Merdeka No. 45' },
    { code: 'MBR-202608-0043', name: 'Siti Aminah — Jl. Kenanga Asri B4' },
    { code: 'MBR-202608-0044', name: 'Ahmad Hidayat — Gang Kelinci No. 8' },
    { code: 'MBR-202607-0040', name: 'Suryono — Jl. Merdeka No. 45' },
    { code: 'MBR-202606-0031', name: 'Lilik Suradi — Griya Hijau B2' },
];

// Katalog: harga gudang & harga jemput (logam −Rp2.000, non-logam −Rp300).
const CATALOG = [
    { name: 'Botol PET Bening', unit: 'kg', warehouse: 3500, pickup: 3200 },
    { name: 'Plastik Kresek', unit: 'kg', warehouse: 1500, pickup: 1200 },
    { name: 'Kardus / Karton', unit: 'kg', warehouse: 2000, pickup: 1700 },
    { name: 'Kaleng Aluminium', unit: 'kg', warehouse: 12000, pickup: 10000 },
    { name: 'Besi Tua', unit: 'kg', warehouse: 4500, pickup: 2500 },
    { name: 'Tutup Galon Aqua', unit: 'biji', warehouse: 300, pickup: 0 },
];

let receiptSeq = 92;
const newReceiptId = () =>
    `NTR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(++receiptSeq).padStart(4, '0')}`;

const emptyRow = () => ({ trash: CATALOG[0].name, weight: '' });

export default function WeighingFormPage() {
    const [member, setMember] = useState('');
    const [location, setLocation] = useState('gudang'); // 'gudang' | 'jemput'
    const [rows, setRows] = useState([emptyRow()]);
    const [receipt, setReceipt] = useState(null);

    const priceOf = (name) => {
        const item = CATALOG.find(c => c.name === name);
        return location === 'gudang' ? item.warehouse : item.pickup;
    };

    // Kalkulator preview real-time (FE-3.3)
    const { gross, fee, net } = useMemo(
        () => calcWeighing(rows.map(r => ({ weight: r.weight, price: priceOf(r.trash) }))),
        [rows, location],
    );

    const setRow = (i, patch) =>
        setRows(prev => prev.map((r, j) => j === i ? { ...r, ...patch } : r));

    const submit = (e) => {
        e.preventDefault();
        const items = rows
            .filter(r => Number(r.weight) > 0)
            .map(r => {
                const cat = CATALOG.find(c => c.name === r.trash);
                const weight = Number(r.weight);
                return { name: r.trash, unit: cat.unit, weight, price: priceOf(r.trash), total: weight * priceOf(r.trash) };
            });
        if (!member.trim() || items.length === 0) return;

        setReceipt({
            id: newReceiptId(),
            member: member.trim(),
            date: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
            location: location === 'gudang' ? 'Diantar ke Gudang' : 'Dijemput di Rumah/Pasar',
            items,
            gross,
            fee,
            net,
        });
        // Reset form untuk penimbangan berikutnya
        setMember('');
        setRows([emptyRow()]);
    };

    const inputCls = 'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15';

    return (
        <div className="mx-auto max-w-5xl flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">Timbang Sampah</h1>
                <p className="mt-1 text-sm text-muted-foreground">Input penimbangan setoran anggota — saldo masuk otomatis setelah disimpan.</p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5">
                {/* Anggota + lokasi */}
                <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                        <Scale size={18} className="text-primary" /> Data Penimbangan
                    </h2>

                    <div className="mt-4 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="member" className="text-xs font-semibold text-foreground/80">Nama / Kode Anggota</label>
                            <input
                                id="member"
                                list="member-list"
                                value={member}
                                onChange={e => setMember(e.target.value)}
                                placeholder="Ketik nama atau kode anggota..."
                                autoComplete="off"
                                className={inputCls}
                            />
                            <datalist id="member-list">
                                {MEMBERS.map(m => <option key={m.code} value={m.name} />)}
                            </datalist>
                        </div>

                        {/* Toggle lokasi */}
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-foreground/80">Lokasi Penimbangan</span>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={location === 'gudang'}
                                    onClick={() => setLocation('gudang')}
                                    className={cn(
                                        'flex items-center justify-center gap-2 rounded-xl border h-11 text-xs font-semibold transition-all',
                                        location === 'gudang'
                                            ? 'border-primary bg-primary text-white shadow-sm'
                                            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary'
                                    )}
                                >
                                    <Warehouse size={16} /> Diantar ke Gudang
                                </button>
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={location === 'jemput'}
                                    onClick={() => setLocation('jemput')}
                                    className={cn(
                                        'flex items-center justify-center gap-2 rounded-xl border h-11 text-xs font-semibold transition-all',
                                        location === 'jemput'
                                            ? 'border-primary bg-primary text-white shadow-sm'
                                            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary'
                                    )}
                                >
                                    <Home size={16} /> Dijemput di Rumah/Pasar
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Harga jemput lebih rendah: logam −Rp2.000/kg, non-logam −Rp300/kg dari harga gudang.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Rincian item */}
                <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                            <Package size={18} className="text-primary" /> Rincian Sampah
                        </h2>
                        <button
                            type="button"
                            onClick={() => setRows(prev => [...prev, emptyRow()])}
                            className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-all"
                        >
                            <Plus size={14} /> Tambah
                        </button>
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                        {rows.map((row, i) => {
                            const cat = CATALOG.find(c => c.name === row.trash);
                            return (
                                <div key={i} className="grid grid-cols-[1fr_120px_44px] items-center gap-3">
                                    <div className="flex flex-col gap-1">
                                        <select
                                            value={row.trash}
                                            onChange={e => setRow(i, { trash: e.target.value })}
                                            aria-label={`Jenis sampah ${i + 1}`}
                                            className={cn(inputCls, 'appearance-none')}
                                        >
                                            {CATALOG.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                        <span className="text-[11px] font-semibold text-emerald-700">
                                            {rp(location === 'gudang' ? cat.warehouse : cat.pickup)} / {cat.unit}
                                        </span>
                                    </div>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.1"
                                        value={row.weight}
                                        onChange={e => setRow(i, { weight: e.target.value })}
                                        placeholder="0.0"
                                        aria-label={`Berat ${i + 1} (${cat.unit})`}
                                        className={cn(inputCls, 'text-center text-lg font-bold')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setRows(prev => prev.length > 1 ? prev.filter((_, j) => j !== i) : prev)}
                                        disabled={rows.length === 1}
                                        aria-label={`Hapus baris ${i + 1}`}
                                        className="flex size-11 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-all disabled:opacity-30"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Kalkulator preview real-time (FE-3.3) */}
                <section className="overflow-hidden rounded-2xl bg-[#0b489a] text-white shadow-md">
                    <div className="flex flex-col gap-3 p-6">
                        <h2 className="flex items-center gap-2 text-base font-bold">
                            <CheckCircle2 size={18} className="text-emerald-300" /> Preview Perhitungan
                        </h2>
                        <div className="flex flex-col gap-2.5 text-sm border-t border-white/15 pt-4">
                            <div className="flex justify-between">
                                <span className="text-blue-100">Nilai Kotor</span>
                                <strong className="font-bold">{rp(gross)}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-100">Potongan Admin Koperasi (20%)</span>
                                <strong className="font-bold text-rose-300">−{rp(fee)}</strong>
                            </div>
                            <div className="flex items-baseline justify-between border-t border-white/15 pt-3">
                                <span className="font-bold text-emerald-300">Diterima Anggota</span>
                                <strong className="text-2xl font-extrabold text-emerald-300 md:text-3xl">{rp(net)}</strong>
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={!member.trim() || gross <= 0}
                        className="flex h-12 w-full items-center justify-center gap-2 bg-white text-sm font-bold text-[#0b489a] transition-all hover:bg-blue-50 disabled:opacity-50"
                    >
                        <CheckCircle2 size={18} />
                        <span>Simpan Timbangan & Terbitkan Nota</span>
                    </button>
                </section>
            </form>

            <ReceiptSuccessModal receipt={receipt} onClose={() => setReceipt(null)} />
        </div>
    );
}

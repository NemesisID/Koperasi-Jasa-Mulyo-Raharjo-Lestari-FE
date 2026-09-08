// FE-3.2 + FE-3.3 — Form timbang cepat untuk petugas lapangan (mobile-first):
// autocomplete anggota, jenis sampah dinamis, input berat besar, toggle lokasi
// (diantar ke gudang vs dijemput), dan kalkulator preview real-time 20%.
import { useMemo, useState } from 'react';
import {
    CheckCircle2, Home, Package, Plus, Scale, Trash2, Warehouse,
} from 'lucide-react';
import ReceiptSuccessModal from '@/Components/Koperasi/ReceiptSuccessModal';
import { calcWeighing } from '@/lib/weighing';
import { api, useApi, rp } from '@/lib/api';

const cn = (...cls) => cls.filter(Boolean).join(' ');

export default function WeighingFormPage() {
    const { data: membersData, loading: loadingMembers } = useApi('/members?status=aktif&per_page=200');
    const { data: categoriesData, loading: loadingCats } = useApi('/trash-categories');

    const members = membersData ?? [];
    const categories = (categoriesData ?? []).filter(c => c.is_active !== false);

    const [memberSearch, setMemberSearch] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [location, setLocation] = useState('gudang'); // 'gudang' | 'jemput_rumah'
    const [isSorted, setIsSorted] = useState(true); // true = bersih/terpilah, false = kotor
    const [rows, setRows] = useState([{ categoryId: '', quantity: '' }]);
    const [receipt, setReceipt] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Default category when loaded
    const defaultCatId = categories[0]?.id ? String(categories[0].id) : '';

    const getPriceOf = (catId) => {
        const cat = categories.find(c => String(c.id) === String(catId));
        if (!cat) return 0;
        const base = isSorted ? Number(cat.price_sorted || 0) : Number(cat.price_unsorted || 0);
        if (location === 'jemput_rumah') {
            const deduction = cat.type === 'logam' ? 2000 : 300;
            return Math.max(0, base - deduction);
        }
        return base;
    };

    // Kalkulator preview real-time (FE-3.3)
    const { gross, fee, net } = useMemo(() => {
        return calcWeighing(
            rows.map(r => ({
                weight: r.quantity,
                price: getPriceOf(r.categoryId || defaultCatId),
            }))
        );
    }, [rows, location, isSorted, categories, defaultCatId]);

    const setRow = (i, patch) =>
        setRows(prev => prev.map((r, j) => j === i ? { ...r, ...patch } : r));

    const addRow = () => {
        setRows(prev => [...prev, { categoryId: defaultCatId, quantity: '' }]);
    };

    // Filtered members for dropdown/datalist
    const matchedMember = members.find(m =>
        String(m.id) === String(selectedMemberId) ||
        m.name.toLowerCase() === memberSearch.trim().toLowerCase() ||
        m.member_code.toLowerCase() === memberSearch.trim().toLowerCase()
    );

    const submit = async (e) => {
        e.preventDefault();
        setError('');

        const targetMember = matchedMember || members.find(m =>
            m.name.toLowerCase().includes(memberSearch.trim().toLowerCase()) ||
            m.member_code.toLowerCase().includes(memberSearch.trim().toLowerCase())
        );

        if (!targetMember) {
            setError('Pilih anggota koperasi yang valid dari daftar.');
            return;
        }

        const validRows = rows
            .map(r => ({
                categoryId: r.categoryId || defaultCatId,
                qty: Number(r.quantity),
            }))
            .filter(r => r.categoryId && r.qty > 0);

        if (validRows.length === 0) {
            setError('Mohon isi minimal satu baris sampah dengan kuantitas lebih dari 0.');
            return;
        }

        setSubmitting(true);

        try {
            // Step 1: Create pickup ticket
            const ticketRes = await api('/pickups', {
                method: 'POST',
                body: {
                    member_id: targetMember.id,
                    location_type: location,
                    is_sorted: isSorted,
                },
            });

            const pickup = ticketRes.data;
            const pickupId = pickup.id;

            // Step 2: Submit weigh items
            const payloadItems = validRows.map(r => {
                const cat = categories.find(c => String(c.id) === String(r.categoryId));
                const isKg = (cat?.unit || 'kg').toLowerCase() === 'kg';
                return {
                    category_id: Number(r.categoryId),
                    weight_kg: isKg ? r.qty : null,
                    unit_count: !isKg ? parseInt(r.qty, 10) : null,
                };
            });

            const weighRes = await api(`/pickups/${pickupId}/weigh-items`, {
                method: 'POST',
                body: { items: payloadItems },
            });

            const receiptItems = validRows.map(r => {
                const cat = categories.find(c => String(c.id) === String(r.categoryId));
                const price = getPriceOf(r.categoryId);
                return {
                    name: cat?.name || 'Sampah',
                    unit: cat?.unit || 'kg',
                    weight: r.qty,
                    price,
                    total: r.qty * price,
                };
            });

            setReceipt({
                id: weighRes.data?.receipt_number || `NOTA-${String(pickupId).padStart(5, '0')}`,
                member: `${targetMember.name} (${targetMember.member_code})`,
                date: new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
                location: location === 'gudang' ? 'Diantar ke Gudang' : 'Dijemput di Rumah/Pasar',
                items: receiptItems,
                gross,
                fee,
                net: weighRes.data?.net_earned ?? net,
            });

            // Reset form
            setMemberSearch('');
            setSelectedMemberId('');
            setRows([{ categoryId: defaultCatId, quantity: '' }]);
        } catch (err) {
            setError(err.message || 'Gagal menyimpan penimbangan sampah.');
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = 'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15';

    return (
        <div className="mx-auto max-w-5xl flex flex-col gap-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">Timbang Sampah</h1>
                <p className="mt-1 text-sm text-muted-foreground">Input penimbangan setoran anggota — saldo masuk otomatis ke dompet anggota setelah disimpan.</p>
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
                                value={memberSearch}
                                onChange={e => {
                                    setMemberSearch(e.target.value);
                                    const match = members.find(m => `${m.member_code} - ${m.name}` === e.target.value || m.name === e.target.value);
                                    if (match) setSelectedMemberId(match.id);
                                }}
                                placeholder={loadingMembers ? 'Memuat data anggota…' : 'Ketik nama atau kode anggota...'}
                                autoComplete="off"
                                required
                                className={inputCls}
                            />
                            <datalist id="member-list">
                                {members.map(m => (
                                    <option key={m.id} value={`${m.member_code} - ${m.name} (${m.address || 'Alamat -'})`} />
                                ))}
                            </datalist>
                            {matchedMember && (
                                <p className="text-xs font-semibold text-emerald-700">
                                    Anggota terverifikasi: {matchedMember.name} · {matchedMember.phone || '-'}
                                </p>
                            )}
                        </div>

                        {/* Toggle lokasi & kebersihan */}
                        <div className="grid gap-4 sm:grid-cols-2">
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
                                        <Warehouse size={16} /> Diantar Gudang
                                    </button>
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={location === 'jemput_rumah'}
                                        onClick={() => setLocation('jemput_rumah')}
                                        className={cn(
                                            'flex items-center justify-center gap-2 rounded-xl border h-11 text-xs font-semibold transition-all',
                                            location === 'jemput_rumah'
                                                ? 'border-primary bg-primary text-white shadow-sm'
                                                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary'
                                        )}
                                    >
                                        <Home size={16} /> Jemput Rumah
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-foreground/80">Kondisi Sampah</span>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={isSorted}
                                        onClick={() => setIsSorted(true)}
                                        className={cn(
                                            'flex items-center justify-center gap-2 rounded-xl border h-11 text-xs font-semibold transition-all',
                                            isSorted
                                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                                : 'border-border bg-card text-muted-foreground hover:border-emerald-400 hover:text-emerald-700'
                                        )}
                                    >
                                        Bersih / Terpilah
                                    </button>
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={!isSorted}
                                        onClick={() => setIsSorted(false)}
                                        className={cn(
                                            'flex items-center justify-center gap-2 rounded-xl border h-11 text-xs font-semibold transition-all',
                                            !isSorted
                                                ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                                                : 'border-border bg-card text-muted-foreground hover:border-amber-400 hover:text-amber-700'
                                        )}
                                    >
                                        Campur / Belum
                                    </button>
                                </div>
                            </div>
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
                            onClick={addRow}
                            className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 transition-all"
                        >
                            <Plus size={14} /> Tambah
                        </button>
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                        {loadingCats && (
                            <p className="py-4 text-center text-sm text-muted-foreground">Memuat daftar kategori sampah…</p>
                        )}
                        {!loadingCats && rows.map((row, i) => {
                            const activeCatId = row.categoryId || defaultCatId;
                            const cat = categories.find(c => String(c.id) === String(activeCatId)) || categories[0];
                            const unitPrice = getPriceOf(activeCatId);

                            return (
                                <div key={i} className="grid grid-cols-[1fr_130px_44px] items-center gap-3">
                                    <div className="flex flex-col gap-1">
                                        <select
                                            value={row.categoryId || defaultCatId}
                                            onChange={e => setRow(i, { categoryId: e.target.value })}
                                            aria-label={`Jenis sampah ${i + 1}`}
                                            className={cn(inputCls, 'appearance-none')}
                                        >
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>
                                            ))}
                                        </select>
                                        <span className="text-[11px] font-semibold text-emerald-700">
                                            Tarif: {rp(unitPrice)} / {cat?.unit || 'kg'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            min="0"
                                            step={cat?.unit === 'kg' ? '0.01' : '1'}
                                            value={row.quantity}
                                            onChange={e => setRow(i, { quantity: e.target.value })}
                                            placeholder={cat?.unit === 'kg' ? '0.00 kg' : '0 buah'}
                                            aria-label={`Berat/Kuantitas ${i + 1}`}
                                            className={cn(inputCls, 'text-center text-base font-bold')}
                                        />
                                    </div>
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

                        {error && (
                            <div className="rounded-xl bg-rose-500/20 border border-rose-300/40 p-3 text-xs text-rose-100 font-medium">
                                {error}
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={submitting || !memberSearch.trim() || gross <= 0}
                        className="flex h-12 w-full items-center justify-center gap-2 bg-white text-sm font-bold text-[#0b489a] transition-all hover:bg-blue-50 disabled:opacity-50"
                    >
                        <CheckCircle2 size={18} />
                        <span>{submitting ? 'Menyimpan ke Sistem…' : 'Simpan Timbangan & Terbitkan Nota'}</span>
                    </button>
                </section>
            </form>

            <ReceiptSuccessModal receipt={receipt} onClose={() => setReceipt(null)} />
        </div>
    );
}

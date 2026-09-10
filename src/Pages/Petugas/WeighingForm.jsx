// FE-3.2 + FE-3.3 — Form timbang cepat untuk petugas lapangan (mobile-first):
// autocomplete anggota, jenis sampah dinamis, input berat besar, toggle lokasi
// (diantar ke gudang vs dijemput), dan kalkulator preview real-time 20%.
import { useEffect, useMemo, useState } from 'react';
import {
    Camera, CheckCircle2, Home, Package, Plus, Scale, Trash2,
} from 'lucide-react';
import ReceiptSuccessModal from '@/Components/Koperasi/ReceiptSuccessModal';
import { calcWeighing } from '@/lib/weighing';
import { api, useApi, rp } from '@/lib/api';

const cn = (...cls) => cls.filter(Boolean).join(' ');

export default function WeighingFormPage({ initialPickup = null, onBack = null }) {
    const { data: membersData, loading: loadingMembers } = useApi('/members?status=aktif&per_page=200');
    const { data: categoriesData, loading: loadingCats } = useApi('/trash-categories');

    const members = membersData ?? [];
    const categories = (categoriesData ?? []).filter(c => c.is_active !== false);

    // Step-2 dari daftar pickup: semua data diambil dari TIKET (member, lokasi,
    // kondisi) — tiket lama yang ditimbang, bukan tiket baru (fix nyangkut).
    const ticketMember = initialPickup?.member ?? null;
    const [memberSearch, setMemberSearch] = useState(ticketMember ? `${ticketMember.member_code} - ${ticketMember.name}` : '');
    const [selectedMemberId, setSelectedMemberId] = useState(ticketMember?.id ?? '');
    const [location, setLocation] = useState(initialPickup?.location_type ?? 'gudang');
    const [isSorted, setIsSorted] = useState(initialPickup ? Boolean(initialPickup.is_sorted) : true); // true = bersih/terpilah, false = kotor
    const [rows, setRows] = useState([{ categoryId: '', quantity: '' }]);
    const [receipt, setReceipt] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Edit timbangan (tiket selesai): prefill rincian item lama agar petugas
    // cukup mengoreksi, bukan mengisi ulang dari nol.
    const { data: ticketDetail } = useApi(initialPickup?.status === 'selesai' ? `/pickups/${initialPickup.id}` : null);
    useEffect(() => {
        const items = ticketDetail?.items;
        if (items?.length) {
            setRows(items.map(it => ({
                categoryId: String(it.category?.id ?? ''),
                quantity: it.weight_kg ? String(it.weight_kg) : String(it.unit_count ?? ''),
            })));
        }
    }, [ticketDetail]);

    // R4 (revisi fase-2): dokumentasi foto timbang — kamera native + geotag + timestamp.
    const [photo, setPhoto] = useState(null);
    const [photoMeta, setPhotoMeta] = useState(null); // { time, lat, lng | null }

    const onPhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) { setPhoto(null); setPhotoMeta(null); return; }
        setPhoto(file);
        setPhotoMeta({ time: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }), lat: null, lng: null });
        // GPS opsional: kalau ditolak/off, foto tetap terunggah tanpa koordinat.
        navigator.geolocation?.getCurrentPosition(
            pos => setPhotoMeta(m => m ? { ...m, lat: pos.coords.latitude, lng: pos.coords.longitude } : m),
            () => {},
        );
    };

    const uploadPhoto = async (pickupId) => {
        const fd = new FormData();
        fd.append('photo', photo);
        if (photoMeta?.lat != null) {
            fd.append('latitude', photoMeta.lat);
            fd.append('longitude', photoMeta.lng);
        }
        await api(`/pickups/${pickupId}/photo`, { method: 'POST', body: fd });
    };

    // Default category when loaded
    const defaultCatId = categories[0]?.id ? String(categories[0].id) : '';

    const getPriceOf = (catId) => {
        const cat = categories.find(c => String(c.id) === String(catId));
        if (!cat) return 0;
        // Sesuai engine BE: sorted = harga jual, unsorted = harga kotor;
        // lokasi jemput (rumah/pasar) dipotong biaya antar (logam 2.000 / lain 300).
        const base = isSorted ? Number(cat.price_sell || 0) : Number(cat.price_unsorted || 0);
        if (String(location).startsWith('jemput')) {
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
    const matchedMember = ticketMember ?? members.find(m =>
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
            // Step 1: tiket. Dari daftar pickup (minta jemput) → timbang TIKET ITU,
            // jangan buat tiket baru (penyebab permintaan anggota nyangkut di menunggu).
            let pickupId;
            if (initialPickup) {
                pickupId = initialPickup.id;
            } else {
                const ticketRes = await api('/pickups', {
                    method: 'POST',
                    body: {
                        member_id: targetMember.id,
                        location_type: location,
                        is_sorted: isSorted,
                    },
                });
                pickupId = ticketRes.data.id;
            }

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

            // R4: upload foto dokumentasi (opsional) — kegagalan tidak membatalkan timbangan yang sudah tersimpan.
            if (photo) {
                try {
                    await uploadPhoto(pickupId);
                } catch (photoErr) {
                    setError(`Timbangan tersimpan, namun gagal mengunggah foto: ${photoErr.message}`);
                }
            }

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
                                location: location === 'gudang' ? 'Diantar ke Gudang' : location === 'jemput_pasar' ? 'Dijemput di Pasar' : 'Dijemput di Rumah',
                items: receiptItems,
                gross,
                fee,
                net: weighRes.data?.net_earned ?? net,
            });

            // Reset form (aliran step-2: kembali ke daftar pickup setelah timbangan tersimpan)
            if (onBack) {
                onBack();
                return;
            }
            setMemberSearch('');
            setSelectedMemberId('');
            setRows([{ categoryId: defaultCatId, quantity: '' }]);
            setPhoto(null);
            setPhotoMeta(null);
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
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                            {initialPickup?.status === 'selesai' ? 'Edit Timbangan' : 'Timbang Sampah'}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {initialPickup?.status === 'selesai'
                                ? 'Koreksi timbangan — rincian lama otomatis diganti setelah disimpan.'
                                : 'Input penimbangan setoran anggota — saldo masuk otomatis ke dompet anggota setelah disimpan.'}
                        </p>
                    </div>
                    {onBack && (
                        <button onClick={onBack}
                            className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-secondary">
                            ← Kembali ke Daftar
                        </button>
                    )}
                </div>

                {/* Info detail anggota (step 2 dari daftar pickup) */}
                {matchedMember && (
                    <section className="rounded-2xl border border-blue-200 bg-[#eaf1fd] p-5">
                        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                            <Scale size={18} className="text-primary" /> Data Anggota
                        </h2>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nama</p>
                                <p className="mt-0.5 text-sm font-bold text-foreground">{matchedMember.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kode Anggota</p>
                                <p className="mt-0.5 font-mono text-sm font-bold text-primary">{matchedMember.member_code}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Alamat</p>
                                <p className="mt-0.5 flex items-start gap-1.5 text-sm font-medium text-foreground">
                                    <Home size={14} className="mt-0.5 shrink-0 text-primary" />{matchedMember.address ?? '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telepon</p>
                                <p className="mt-0.5 text-sm font-medium text-foreground">{matchedMember.phone ?? '-'}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lokasi Penimbangan</p>
                                <p className="mt-0.5 text-sm font-semibold text-foreground">
                                    {location === 'jemput_rumah' ? 'Dijemput di rumah anggota' : location === 'jemput_pasar' ? 'Dijemput di pasar anggota' : 'Diantar ke gudang'}
                                </p>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            <form onSubmit={submit} className="flex flex-col gap-5">
                {/* Anggota + lokasi */}
                <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                        <Scale size={18} className="text-primary" /> Data Penimbangan
                    </h2>

                    <div className="mt-4 flex flex-col gap-4">
                        {/* Toggle kebersihan (lokasi sudah ditentukan: manual = gudang, step-2 = jemput rumah) */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {!ticketMember && (
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-foreground/80">Cari Anggota</span>
                                    <input
                                        list="member-list"
                                        value={memberSearch}
                                        onChange={e => {
                                            setMemberSearch(e.target.value);
                                            const match = members.find(m => `${m.member_code} - ${m.name}` === e.target.value || m.name === e.target.value);
                                            if (match) setSelectedMemberId(match.id);
                                        }}
                                        placeholder={loadingMembers ? 'Memuat data anggota…' : 'Ketik nama atau kode anggota...'}
                                        autoComplete="off"
                                        className={inputCls}
                                    />
                                    <datalist id="member-list">
                                        {members.map(m => (
                                            <option key={m.id} value={`${m.member_code} - ${m.name} (${m.address || 'Alamat -'})`} />
                                        ))}
                                    </datalist>
                                </div>
                            )}

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

                {/* R4: dokumentasi foto timbang — kamera native mobile + timestamp & geotag */}
                <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                        <Camera size={18} className="text-primary" /> Foto Dokumentasi
                    </h2>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="flex h-11 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-primary/40 bg-card px-4 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white">
                            <Camera size={15} />
                            <span>{photo ? 'Ganti Foto' : 'Ambil Foto (Kamera)'}</span>
                            <input type="file" accept="image/*" capture="environment" onChange={onPhotoChange} className="hidden" />
                        </label>
                        {photo && (
                            <img src={URL.createObjectURL(photo)} alt="Preview dokumentasi" className="h-16 w-24 self-start rounded-xl border border-border/60 object-cover" />
                        )}
                        {photoMeta && (
                            <p className="text-[11px] font-medium text-muted-foreground">
                                {photoMeta.time}
                                {photoMeta.lat != null
                                    ? ` · ${photoMeta.lat.toFixed(5)}, ${photoMeta.lng.toFixed(5)}`
                                    : ' · lokasi GPS tidak tersedia'}
                            </p>
                        )}
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

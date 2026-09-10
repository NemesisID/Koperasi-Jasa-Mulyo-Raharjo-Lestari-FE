// FE-2.3 — UI Manajemen Katalog & Harga Sampah (revisi fase-3):
// tiap sampah 3 nominal — Harga Kotor (manual), Harga Jual (manual),
// Harga Bersih (auto 80% harga jual = jual − potongan koperasi 20%).
import { useState } from 'react';
import {
    CheckCircle2, History, Pencil, Plus, Recycle, Save, Search, Tag, TrendingDown, TrendingUp, X,
} from 'lucide-react';
import { PageHeader, StatCard } from '@/Components/Koperasi/ManagerUI';
import { Modal } from '@/Components/Koperasi/Popups';
import { useApi, api, rp } from '@/lib/api';
import { usePopup } from './Index';

const cn = (...cls) => cls.filter(Boolean).join(' ');

const TYPES = ['logam', 'besi', 'kertas', 'plastik', 'elektronik', 'organik', 'campur', 'lainnya'];
const UNITS = ['kg', 'biji', 'unit'];
// Card utama (alur.md): organik, campur, anorganik = sisanya.
const MAIN_GROUPS = [
    { key: 'semua', label: 'Semua', match: () => true },
    { key: 'organik', label: 'Organik', match: c => c.type === 'organik' },
    { key: 'campur', label: 'Sampah Campur', match: c => c.type === 'campur' },
    { key: 'anorganik', label: 'Anorganik', match: c => !['organik', 'campur'].includes(c.type) },
];

const inputCls = 'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-foreground transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15';

function CategoryFormModal({ category, onClose, onSaved }) {
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(() => ({
        name: category?.name ?? '',
        type: category?.type ?? 'plastik',
        unit: category?.unit ?? 'kg',
        price_unsorted: category?.price_unsorted ?? 0,
        price_sell: category?.price_sell ?? 0,
    }));
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    // Harga Bersih = otomatis 20% dari Harga Jual (potongan koperasi).
    const priceMember = Math.round(Number(form.price_sell) * 0.8);

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await api(category ? `/trash-categories/${category.id}` : '/trash-categories', {
                method: category ? 'PUT' : 'POST',
                body: {
                    ...form,
                    price_unsorted: Number(form.price_unsorted),
                    price_sell: Number(form.price_sell),
                },
            });
            onSaved(category ? 'Kategori berhasil diperbarui.' : 'Kategori baru berhasil dibuat.');
        } catch (err) {
            const fieldErrs = err.errors && Object.values(err.errors)[0]?.[0];
            setError(fieldErrs || err.message || 'Gagal menyimpan kategori.');
        } finally { setSaving(false); }
    };

    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between px-6 py-4 bg-accent/60 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <Tag size={20} />
                    <span>{category ? `Edit — ${category.name}` : 'Kategori Sampah Baru'}</span>
                </h2>
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors">
                    <X size={18} />
                </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4 p-6 bg-card">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground/80">Nama</label>
                        <input required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Botol PET Bening" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-foreground/80">Jenis</label>
                            <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls}>
                                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-foreground/80">Satuan</label>
                            <select value={form.unit} onChange={e => set('unit', e.target.value)} className={inputCls}>
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground/80">Harga Kotor (Rp)</label>
                        <input required type="number" min="0" value={form.price_unsorted} onChange={e => set('price_unsorted', e.target.value)} className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-foreground/80">Harga Jual (Rp)</label>
                        <input required type="number" min="0" value={form.price_sell} onChange={e => set('price_sell', e.target.value)} className={inputCls} />
                    </div>
                </div>
                <div className="rounded-xl bg-[#eef3fc] px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">Harga Bersih untuk Anggota (auto 20% dari harga jual)</span>
                    <strong className="text-sm font-bold text-primary">{rp(priceMember)}</strong>
                </div>
                {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose}
                        className="h-11 flex-1 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary transition-all">
                        Batal
                    </button>
                    <button type="submit" disabled={saving}
                        className="h-11 flex-[1.5] rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60">
                        {saving ? 'Menyimpan...' : 'Simpan Kategori'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function HistoryModal({ category, onClose }) {
    const { data, loading } = useApi(`/trash-categories/${category.id}/price-history`);
    const rows = data ?? [];
    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between px-6 py-4 bg-accent/60 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <History size={20} />
                    <span>Riwayat Harga — {category.name}</span>
                </h2>
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors">
                    <X size={18} />
                </button>
            </div>
            <div className="overflow-x-auto bg-card">
                <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                        <tr>
                            <th className="px-5 py-3">Tanggal</th>
                            <th className="px-5 py-3">Harga Kotor (lama → baru)</th>
                            <th className="px-5 py-3">Harga Jual (lama → baru)</th>
                            <th className="px-5 py-3">Oleh</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {loading
                            ? <tr><td colSpan={4} className="px-5 py-4 text-muted-foreground">Memuat…</td></tr>
                            : rows.length === 0
                                ? <tr><td colSpan={4} className="px-5 py-4 text-muted-foreground">Belum ada riwayat perubahan harga.</td></tr>
                                : rows.map((log, i) => (
                                    <tr key={i} className="hover:bg-secondary/40 transition-colors">
                                        <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{new Date(log.changed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <span className="text-xs text-muted-foreground line-through">{rp(log.old_price_unsorted)}</span>
                                            <span className="ml-1.5 font-bold text-primary">{rp(log.new_price_unsorted)}</span>
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            {log.old_price_sell == null && log.new_price_sell == null ? '-'
                                                : <>
                                                    <span className="text-xs text-muted-foreground line-through">{log.old_price_sell == null ? '-' : rp(log.old_price_sell)}</span>
                                                    <span className="ml-1.5 font-bold text-primary">{log.new_price_sell == null ? '-' : rp(log.new_price_sell)}</span>
                                                </>}
                                        </td>
                                        <td className="px-5 py-3.5 text-muted-foreground">{log.changed_by?.name ?? '-'}</td>
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
    const { data, loading, error, reload } = useApi('/trash-categories');
    const [group, setGroup] = useState('semua');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);   // null | {} (baru) | category
    const [historyOf, setHistoryOf] = useState(null);

    const catalog = data ?? [];
    const active = MAIN_GROUPS.find(g => g.key === group) ?? MAIN_GROUPS[0];
    // Filter: grup (organik/campur/anorganik) + pencarian nama/jenis.
    const q = search.trim().toLowerCase();
    const filtered = catalog
        .filter(active.match)
        .filter(c => !q || c.name.toLowerCase().includes(q) || (c.type ?? '').includes(q));
    const [savingId, setSavingId] = useState(null);
    const [drafts, setDrafts] = useState({}); // id → { price_unsorted, price_sell }

    const draftOf = (c) => drafts[c.id] ?? {
        price_unsorted: c.price_unsorted, price_sell: c.price_sell,
    };
    const setDraft = (id, k, v, base) => setDrafts(prev => ({
        ...prev,
        [id]: { ...(prev[id] ?? base), [k]: v },
    }));
    // Baris "berubah": ada draft & nominalnya beda dari tersimpan.
    const isDirty = (c) => {
        const d = drafts[c.id];
        return Boolean(d) && (Number(d.price_unsorted) !== Number(c.price_unsorted) || Number(d.price_sell) !== Number(c.price_sell));
    };
    const dirtyList = catalog.filter(isDirty);

    const savePrice = async (c) => {
        const d = draftOf(c);
        setSavingId(c.id);
        try {
            await api(`/trash-categories/${c.id}/price`, { method: 'PATCH', body: {
                price_unsorted: Number(d.price_unsorted),
                price_sell: Number(d.price_sell),
            } });
            setDrafts(prev => { const { [c.id]: _, ...rest } = prev; return rest; });
            reload();
            showStatus('Harga Tersimpan', `Harga ${c.name} berhasil diperbarui dan tercatat di log audit.`);
        } catch (err) {
            showStatus('Gagal Menyimpan', err.message || 'Gagal menyimpan harga.');
        } finally { setSavingId(null); }
    };

    const saveAll = async () => {
        for (const c of dirtyList) await savePrice(c);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Manajemen Katalog Sampah"
                desc="Kelola kategori & harga sampah — 3 nominal per item: harga kotor, harga jual, dan harga bersih anggota (auto 20% dari harga jual)."
                action={
                    <button
                        onClick={() => setEditing({})}
                        className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                    >
                        <Plus size={16} />
                        <span>Buat Kategori</span>
                    </button>
                }
            />

            <div className="grid gap-5 md:grid-cols-3">
                <StatCard icon={Tag} label="Kategori Katalog" value={`${catalog.length} Item`} note={`${new Set(catalog.map(c => c.type)).size} jenis`} tone="blue" />
                <StatCard icon={TrendingUp} label="Harga Jual Tertinggi" value={rp(Math.max(0, ...catalog.map(c => Number(c.price_sell))))} note="Harga jual ke pengepul" tone="green" />
                <StatCard icon={TrendingDown} label="Harga Bersih Tertinggi" value={rp(Math.max(0, ...catalog.map(c => Number(c.price_member))))} note="Diterima anggota (80% harga jual)" tone="red" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex flex-col justify-between gap-4 p-5 border-b border-border/60 lg:flex-row lg:items-center">
                    <h2 className="text-lg font-bold text-foreground">Katalog Harga Sampah</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {MAIN_GROUPS.map(g => (
                            <button
                                key={g.key}
                                onClick={() => setGroup(g.key)}
                                className={cn(
                                    'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                                    group === g.key
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-primary'
                                )}
                            >
                                {g.label}
                            </button>
                        ))}
                        <div className="relative w-full sm:w-52">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari sampah…"
                                className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs focus:bg-white" />
                        </div>
                        {dirtyList.length > 0 && (
                            <button
                                onClick={saveAll}
                                disabled={savingId !== null}
                                className="flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
                            >
                                <Save size={14} /> Simpan Semua ({dirtyList.length})
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Jenis Sampah</th>
                                <th className="px-6 py-3.5">Harga Kotor</th>
                                <th className="px-6 py-3.5">Harga Jual</th>
                                <th className="px-6 py-3.5">Harga Bersih (auto 20%)</th>
                                <th className="px-6 py-3.5">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading
                                ? <tr><td colSpan={5} className="px-6 py-4 text-muted-foreground">Memuat katalog…</td></tr>
                            : error
                                ? <tr><td colSpan={5} className="px-6 py-4 text-muted-foreground">Gagal memuat katalog.</td></tr>
                            : filtered.length === 0
                                ? <tr><td colSpan={5} className="px-6 py-4 text-muted-foreground">Belum ada kategori di grup ini.</td></tr>
                            : filtered.map(c => {
                                const d = draftOf(c);
                                const dirty = isDirty(c);
                                const priceMember = Math.round(Number(d.price_sell) * 0.8);
                                const cellInputCls = cn(
                                    'h-9 w-32 rounded-xl border bg-slate-50/50 px-3 text-xs font-bold text-foreground focus:bg-white focus:ring-2',
                                    dirty
                                        ? 'border-amber-400 ring-amber-200 focus:border-amber-500 focus:ring-amber-200'
                                        : 'border-border focus:border-primary focus:ring-primary/15'
                                );
                                return (
                                    <tr key={c.id} className={cn('transition-colors', dirty ? 'bg-amber-50/60' : 'hover:bg-secondary/40')}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-primary">
                                                    <Recycle size={18} />
                                                </span>
                                                <div>
                                                    <span className="block font-semibold text-foreground">{c.name}</span>
                                                    <span className="text-xs capitalize text-muted-foreground">{c.type} · per {c.unit}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                min="0"
                                                value={d.price_unsorted}
                                                onChange={e => setDraft(c.id, 'price_unsorted', e.target.value, d)}
                                                onKeyDown={e => e.key === 'Enter' && dirty && savePrice(c)}
                                                aria-label={`Harga kotor ${c.name}`}
                                                className={cellInputCls}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                min="0"
                                                value={d.price_sell}
                                                onChange={e => setDraft(c.id, 'price_sell', e.target.value, d)}
                                                onKeyDown={e => e.key === 'Enter' && dirty && savePrice(c)}
                                                aria-label={`Harga jual ${c.name}`}
                                                className={cellInputCls}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                                {rp(priceMember)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => savePrice(c)}
                                                    disabled={!dirty || savingId === c.id}
                                                    title={dirty ? 'Simpan harga' : 'Tidak ada perubahan'}
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Save size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setEditing(c)}
                                                    title="Edit kategori"
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-foreground/70 hover:border-primary hover:text-primary"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setHistoryOf(c)}
                                                    title="Riwayat harga"
                                                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-foreground/70 hover:border-primary hover:text-primary"
                                                >
                                                    <History size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>Menampilkan {filtered.length} dari {catalog.length} kategori</span>
                    <span className="inline-flex items-center gap-1"><CheckCircle2 size={13} /> Perubahan harga tercatat di log audit</span>
                </div>
            </section>

            <p className="text-xs text-muted-foreground">
                Harga Bersih untuk anggota terisi otomatis oleh sistem (80% dari Harga Jual); Harga Kotor dan Harga Jual diisi manual oleh pengurus.
            </p>

            {editing !== null && (
                <CategoryFormModal
                    category={editing.id ? editing : null}
                    onClose={() => setEditing(null)}
                    onSaved={msg => { setEditing(null); reload(); showStatus('Katalog Tersimpan', msg); }}
                />
            )}
            {historyOf && <HistoryModal category={historyOf} onClose={() => setHistoryOf(null)} />}
        </div>
    );
}

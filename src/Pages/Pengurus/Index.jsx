import { useState, createContext, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Head } from '@/lib/shims';
import { useAuth } from '@/lib/auth';
import {
    CheckCircle2, ChevronLeft, ChevronRight, Clock,
    Filter, Plus, Search, X
} from 'lucide-react';
import { ManagerShell } from '@/Components/Koperasi/ManagerShell';
import { FormPopup, StatusPopup } from '@/Components/Koperasi/Popups';
import { api, useApi, rp, dfmt } from '@/lib/api';
import ComplaintsDeskPage from './ComplaintsDesk';
import UsersPage from './Users';
import WajibOverviewPage from './WajibOverview';
import PickupMonitorPage from './PickupMonitor';

// ─── Popup context ────────────────────────────────────────────
const PopupCtx = createContext({ openForm: () => {}, showStatus: () => {} });
export const usePopup = () => useContext(PopupCtx);

const cn = (...cls) => cls.filter(Boolean).join(' ');

// ─── Reusable Small Components ────────────────────────────────
function PageHeader({ title, desc, action }) {
    return (
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
                {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
            </div>
            {action && <div className="flex flex-wrap items-center gap-3">{action}</div>}
        </div>
    );
}

function StatCard({ label, value, note, tone = 'blue', indicator = 'top' }) {
    const toneStyles = {
        blue: {
            border: indicator === 'top' ? 'border-t-2 border-t-primary' : 'border-l-2 border-l-primary',
            note: 'text-primary',
        },
        green: {
            border: indicator === 'top' ? 'border-t-2 border-t-emerald-600' : 'border-l-2 border-l-emerald-600',
            note: 'text-emerald-700 font-medium',
        },
        red: {
            border: indicator === 'top' ? 'border-t-2 border-t-rose-600' : 'border-l-2 border-l-rose-600',
            note: 'text-rose-600 font-medium',
        },
        gold: {
            border: indicator === 'top' ? 'border-t-2 border-t-amber-600' : 'border-l-2 border-l-amber-600',
            note: 'text-amber-700 font-medium',
        },
    };
    const s = toneStyles[tone] || toneStyles.blue;

    return (
        <article className={cn('flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md', s.border)}>
            <div className="flex items-center justify-between">
                {note && <span className={cn('text-xs font-semibold', s.note)}>{note}</span>}
            </div>
            <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                <strong className="mt-1 block text-2xl font-bold text-foreground md:text-[26px]">{value}</strong>
            </div>
        </article>
    );
}

// ponytail: paginasi dummy statis — ganti dengan meta.total dari API saat endpoint mendukung penuh.
function Pager({ total = 3 }) {
    const [page, setPage] = useState(1);
    return (
        <div className="flex items-center justify-end gap-1.5 p-4 border-t border-border/60">
            <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary disabled:opacity-40"
            >
                <ChevronLeft size={16} />
            </button>
            {Array.from({ length: total }, (_, i) => i + 1).map(x => (
                <button
                    key={x}
                    onClick={() => setPage(x)}
                    className={cn(
                        'flex size-9 items-center justify-center rounded-lg text-xs font-bold transition-all',
                        page === x
                            ? 'bg-primary text-white shadow-xs'
                            : 'border border-border bg-card text-foreground hover:bg-secondary'
                    )}
                >
                    {x}
                </button>
            ))}
            <button
                onClick={() => setPage(Math.min(total, page + 1))}
                disabled={page === total}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary disabled:opacity-40"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

function EmptyState({ label = 'Belum ada data' }) {
    return <p className="px-6 py-10 text-center text-sm text-muted-foreground">{label}</p>;
}

// ─── 1. Dashboard Sub-page ────────────────────────────────────
function DashboardPage({ setPage }) {
    const { data: stats, loading } = useApi('/reports/dashboard-stats');

    return (
        <div className="flex flex-col gap-6">
            <HeroBanner stats={stats} loading={loading} />
            <StatRow stats={stats} />
            <RecentTransactions />
        </div>
    );
}

function HeroBanner({ stats, loading }) {
    return (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#073d8c] via-[#0a56c2] to-[#1466dc] p-7 md:p-9 text-white shadow-lg">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 size-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="relative z-10">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Ringkasan Koperasi</h2>
                <p className="mt-1 text-sm text-blue-100/80">Pantauan menyeluruh aktivitas keanggotaan dan keuangan koperasi.</p>

                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
                    <div className="pt-4 sm:pt-0 sm:pr-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-blue-200/90">Anggota Aktif</p>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <strong className="text-3xl font-extrabold tracking-tight md:text-4xl">{stats?.jumlah_anggota_aktif ?? 0}</strong>
                            <span className="text-sm font-medium text-blue-200">Orang</span>
                        </div>
                    </div>
                    <div className="pt-4 sm:pt-0 sm:px-6">
                        <p className="text-xs font-medium uppercase tracking-wider text-blue-200/90">Tonase Sampah Bulan Ini</p>
                        <div className="mt-1 flex items-baseline gap-1.5">
                            <strong className="text-3xl font-extrabold tracking-tight md:text-4xl">{stats?.tonase_sampah_bulan_ini?.toLocaleString('id-ID') ?? 0}</strong>
                            <span className="text-sm font-medium text-blue-200">kg</span>
                        </div>
                    </div>
                    <div className="pt-4 sm:pt-0 sm:pl-6">
                        <p className="text-xs font-medium uppercase tracking-wider text-blue-200/90">Total Kas</p>
                        <div className="mt-1">
                            <strong className="text-3xl font-extrabold tracking-tight md:text-4xl">{rp(stats?.total_kas)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function StatRow({ stats }) {
    const { data: tx } = useApi('/transactions?type=income&per_page=5');
    const { data: txOut } = useApi('/transactions?type=expense&per_page=5');
    const income = tx && txOut
        ? (tx ?? []).reduce((s, t) => s + Number(t.amount), 0)
        : 0;
    const expense = txOut
        ? (txOut ?? []).reduce((s, t) => s + Number(t.amount), 0)
        : 0;

    return (
        <div className="grid gap-5 md:grid-cols-3">
            <StatCard label="Total Kas" value={rp(stats?.total_kas)} note={`Mengendap: ${rp(stats?.saldo_mengendap)}`} tone="blue" />
            <StatCard label="Pendapatan (5 transaksi terakhir)" value={rp(income)} tone="green" />
            <StatCard label="Pengeluaran (5 transaksi terakhir)" value={rp(expense)} tone="red" />
        </div>
    );
}

function RecentTransactions() {
    const { data, meta, loading } = useApi('/transactions?per_page=10');
    const rows = data ?? [];

    return (
        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
            <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center border-b border-border/60">
                <div className="flex items-center gap-2.5">
                    <Clock size={20} className="text-primary" />
                    <h2 className="text-lg font-bold text-foreground">Ringkasan Transaksi Terbaru</h2>
                </div>
                <button
                    onClick={() => setPage('laporan')}
                    className="rounded-xl border border-primary/40 bg-card px-4 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white"
                >
                    Lihat Semua Laporan
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                        <tr>
                            <th className="px-6 py-3.5">Kode</th>
                            <th className="px-6 py-3.5">Kategori</th>
                            <th className="px-6 py-3.5">Jenis</th>
                            <th className="px-6 py-3.5">Jumlah</th>
                            <th className="px-6 py-3.5">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {loading && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>
                        )}
                        {!loading && rows.length === 0 && (
                            <tr><td colSpan={5}><EmptyState label="Belum ada transaksi" /></td></tr>
                        )}
                        {rows.map(tx => (
                            <tr key={tx.id} className="hover:bg-secondary/40 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{tx.transaction_code}</td>
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-foreground">{tx.category?.name ?? '-'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                                        tx.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                                    )}>
                                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                    </span>
                                </td>
                                <td className={cn('px-6 py-4 font-bold', tx.type === 'income' ? 'text-primary' : 'text-rose-600')}>{rp(tx.amount)}</td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        'inline-flex items-center gap-1.5 text-xs font-semibold',
                                        tx.status === 'berhasil' ? 'text-emerald-600' : 'text-amber-600'
                                    )}>
                                        {tx.status === 'berhasil' ? <CheckCircle2 size={15} /> : <Clock size={15} />} {tx.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 text-center text-xs text-muted-foreground border-t border-border/60 bg-slate-50/50">
                Menampilkan {rows.length} dari {meta?.total ?? 0} transaksi.
            </div>
        </section>
    );
}

// ─── 2. Manajemen Harga Sampah (Card grid, tanpa icon) ────────
const TYPE_LABELS = { logam: 'Logam', besi: 'Besi', kertas: 'Kertas', plastik: 'Plastik', elektronik: 'Elektronik', organik: 'Organik', campur: 'Campuran', lainnya: 'Lainnya' };

function WastePriceCard({ item, onEdit }) {
    return (
        <article className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-foreground">{item.name}</h3>
                        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {TYPE_LABELS[item.type] ?? item.type} · per {item.unit}
                        </p>
                    </div>
                    <span className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    )}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-[#eef3fc] px-3 py-2.5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Harga Bersih</p>
                    <strong className="mt-0.5 block text-sm font-extrabold text-primary">{rp(item.price_sorted)}</strong>
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/70">Harga Kotor</p>
                    <strong className="mt-0.5 block text-sm font-extrabold text-emerald-700">{rp(item.price_unsorted)}</strong>
                </div>
                <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/70">Harga Jual</p>
                    <strong className="mt-0.5 block text-sm font-extrabold text-amber-700">{rp(item.price_sell)}</strong>
                </div>
                <div className="rounded-xl bg-purple-50 px-3 py-2.5 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700/70">Harga Anggota</p>
                    <strong className="mt-0.5 block text-sm font-extrabold text-purple-700">{rp(item.price_member)}</strong>
                </div>
            </div>

            <button
                onClick={() => onEdit(item)}
                className="h-9 w-full rounded-xl border border-primary text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white"
            >
                Ubah Harga
            </button>
        </article>
    );
}

function PriceEditForm({ item, onDone, onCancel }) {
    const [form, setForm] = useState({
        price_sorted: item.price_sorted,
        price_unsorted: item.price_unsorted,
        price_sell: item.price_sell ?? 0,
        notes: '',
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    async function submit(e) {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const res = await api(`/trash-categories/${item.id}/price`, {
                method: 'PATCH',
                body: {
                    price_sorted: Number(form.price_sorted),
                    price_unsorted: Number(form.price_unsorted),
                    price_sell: Number(form.price_sell),
                    notes: form.notes || null,
                },
            });
            onDone(res?.message || 'Harga berhasil diperbarui.');
        } catch (err) {
            setError(err.errors?.price_sorted?.[0] || err.message || 'Gagal menyimpan harga.');
        } finally {
            setSaving(false);
        }
    }

    const inputCls = 'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-foreground transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15';

    const memberPrice = Math.round(Number(form.price_sell || 0) * 0.8);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-xs p-4" onClick={onCancel}>
            <div className="modal-content-anim w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between bg-accent/60 px-6 py-4 border-b border-border/60">
                    <h2 className="text-base font-bold text-foreground">Ubah Harga — {item.name}</h2>
                    <button type="button" onClick={onCancel} className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-4 p-6">
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">
                        Harga Bersih / {item.unit} (Rp)
                        <input type="number" min="0" required value={form.price_sorted}
                            onChange={e => setForm(f => ({ ...f, price_sorted: e.target.value }))} className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">
                        Harga Kotor / {item.unit} (Rp)
                        <input type="number" min="0" required value={form.price_unsorted}
                            onChange={e => setForm(f => ({ ...f, price_unsorted: e.target.value }))} className={inputCls} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">
                        Harga Jual / {item.unit} (Rp) — harga ke pengepul/marketplace
                        <input type="number" min="0" required value={form.price_sell}
                            onChange={e => setForm(f => ({ ...f, price_sell: e.target.value }))} className={inputCls} />
                    </label>
                    <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-purple-700">Harga Anggota (otomatis, jual − 20%)</span>
                        <strong className="text-sm font-extrabold text-purple-700">{rp(memberPrice)}</strong>
                    </div>
                    <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground/80">
                        Catatan (opsional)
                        <input type="text" maxLength={255} value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="Alasan penyesuaian harga…" className={inputCls} />
                    </label>
                    {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onCancel} className="h-11 flex-1 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary transition-all">Batal</button>
                        <button type="submit" disabled={saving} className="h-11 flex-[1.5] rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60">
                            {saving ? 'Menyimpan…' : 'Simpan Harga'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SavingsWastePricePage() {
    const { showStatus } = usePopup();
    const { data, loading, reload } = useApi('/trash-categories');
    const [typeFilter, setTypeFilter] = useState('semua');
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState(null);

    const items = data ?? [];
    const types = ['semua', ...new Set(items.map(i => i.type))];
    const filtered = items.filter(i =>
        (typeFilter === 'semua' || i.type === typeFilter) &&
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Manajemen Harga Sampah"
                desc="Katalog dan papan harga sampah — perbarui harga harian per kategori."
                action={
                    <button
                        onClick={reload}
                        className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                        <Filter size={15} /> Muat Ulang
                    </button>
                }
            />

            {/* Filter bar */}
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-2">
                    {types.map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={cn(
                                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                                typeFilter === t
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-accent text-accent-foreground hover:bg-accent/80'
                            )}
                        >
                            {t === 'semua' ? 'Semua' : TYPE_LABELS[t] ?? t}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari nama sampah…"
                        className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs focus:bg-white"
                    />
                </div>
            </div>

            {loading && <p className="py-8 text-center text-sm text-muted-foreground">Memuat katalog sampah…</p>}
            {!loading && filtered.length === 0 && (
                <div className="rounded-2xl border border-border/80 bg-card p-10 text-center text-sm text-muted-foreground">
                    Tidak ada kategori sampah yang cocok.
                </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filtered.map(item => (
                    <WastePriceCard key={item.id} item={item} onEdit={setEditing} />
                ))}
            </div>

            {editing && (
                <PriceEditForm
                    item={editing}
                    onCancel={() => setEditing(null)}
                    onDone={(msg) => { setEditing(null); reload(); showStatus('Harga Berhasil Diperbarui', msg); }}
                />
            )}
        </div>
    );
}

// ─── 3. Simpanan (per label) Sub-page ─────────────────────────
const LABEL_TITLES = {
    POKOK: ['Manajemen Simpanan Pokok', 'Kelola dana keanggotaan awal untuk kestabilan koperasi kita.'],
    WAJIB: ['Manajemen Simpanan Wajib', 'Setoran wajib bulanan yang diakumulasi untuk modal bersama koperasi.'],
    SUKARELA: ['Manajemen Simpanan Sukarela', 'Kelola dana simpanan sukarela anggota dengan transparansi penuh.'],
};

function SavingsByLabelPage({ label }) {
    const { openForm } = usePopup();
    const { data, meta, loading } = useApi(`/savings?label=${label}&per_page=15`);
    const [search, setSearch] = useState('');
    const rows = (data ?? []).filter(s => (s.user?.name ?? '').toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={LABEL_TITLES[label][0]}
                desc={LABEL_TITLES[label][1]}
                action={
                    <button
                        onClick={() => openForm('voluntary')}
                        className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                    >
                        <Plus size={16} />
                        <span>Catat Simpanan</span>
                    </button>
                }
            />

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Daftar Setoran</h2>
                    <div className="relative w-full sm:w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari nama anggota…"
                            className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs focus:bg-white"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Nama Anggota</th>
                                <th className="px-6 py-3.5">Tanggal</th>
                                <th className="px-6 py-3.5">Jumlah</th>
                                <th className="px-6 py-3.5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={4}><EmptyState label="Belum ada setoran" /></td></tr>}
                            {rows.map(s => (
                                <tr key={s.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-foreground">{s.user?.name ?? '-'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{dfmt(s.created_at)}</td>
                                    <td className="px-6 py-4 font-bold text-primary">{rp(s.jumlah)}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                            s.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                                        )}>
                                            {s.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>Menampilkan {rows.length} dari {meta?.total ?? 0} data</span>
                    <Pager total={Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.per_page ?? 15)))} />
                </div>
            </section>
        </div>
    );
}

// ─── 4. SHU Page ──────────────────────────────────────────────
function ShuPage() {
    const { openForm } = usePopup();
    const { data, loading } = useApi('/shu/periods');
    const rows = data ?? [];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Sisa Hasil Usaha"
                desc="Kelola pembagian SHU anggota secara transparan."
                action={
                    <button
                        onClick={() => openForm('distribution')}
                        className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                    >
                        <Plus size={16} />
                        <span>Distribusi Baru</span>
                    </button>
                }
            />

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="p-5 border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Daftar Pembagian SHU Anggota</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Tahun</th>
                                <th className="px-6 py-3.5">Total SHU</th>
                                <th className="px-6 py-3.5">Cadangan</th>
                                <th className="px-6 py-3.5">Dibagikan</th>
                                <th className="px-6 py-3.5">Penerima</th>
                                <th className="px-6 py-3.5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={6}><EmptyState label="Belum ada distribusi SHU" /></td></tr>}
                            {rows.map(r => (
                                <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 font-bold text-foreground">{r.year}</td>
                                    <td className="px-6 py-4 font-bold text-primary">{rp(r.total_shu)}</td>
                                    <td className="px-6 py-4">{rp(r.reserve_amount)}</td>
                                    <td className="px-6 py-4">{rp(r.distributed_amount)}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{r.recipient_count ?? 0} anggota</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                            r.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                                        )}>
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

// ─── 5. Pendapatan / Pengeluaran Page ─────────────────────────
function TransactionPage({ type, title, desc }) {
    const { openForm } = usePopup();
    const { data, meta, loading } = useApi(`/transactions?type=${type}&per_page=15`);
    const rows = data ?? [];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={title}
                desc={desc}
                action={
                    <button
                        onClick={() => openForm(type === 'income' ? 'income' : 'expense')}
                        className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                    >
                        <Plus size={16} />
                        <span>{type === 'income' ? 'Input Pendapatan Manual' : 'Input Pengeluaran Baru'}</span>
                    </button>
                }
            />

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="p-5 border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Daftar Transaksi {type === 'income' ? 'Pendapatan' : 'Pengeluaran'}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Tanggal</th>
                                <th className="px-6 py-3.5">Kategori</th>
                                <th className="px-6 py-3.5">Keterangan</th>
                                <th className="px-6 py-3.5">Nominal</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5">Petugas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={6}><EmptyState label="Belum ada transaksi" /></td></tr>}
                            {rows.map(r => (
                                <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 text-muted-foreground">{dfmt(r.transaction_date)}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'rounded-md px-2 py-0.5 text-[11px] font-bold',
                                            type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                        )}>
                                            {r.category?.name ?? '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-foreground">{r.description ?? '-'}</td>
                                    <td className={cn('px-6 py-4 font-bold', type === 'income' ? 'text-primary' : 'text-rose-600')}>{rp(r.amount)}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex items-center gap-1 text-xs font-semibold',
                                            r.status === 'berhasil' ? 'text-emerald-600' : 'text-amber-600'
                                        )}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{r.handled_by?.name ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>Menampilkan {rows.length} dari {meta?.total ?? 0} data</span>
                    <Pager total={Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.per_page ?? 15)))} />
                </div>
            </section>
        </div>
    );
}

// ─── 6. Laporan Hub Sub-page ──────────────────────────────────
function ReportHubPage({ setPage }) {
    const now = new Date();
    const start = `${now.getFullYear()}-01-01`;
    const end = now.toISOString().slice(0, 10);
    const { data: fin } = useApi(`/reports/financial?period_start=${start}&period_end=${end}`);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Pusat Laporan Koperasi"
                desc={`Akses data finansial dan operasional koperasi — periode ${dfmt(start)} s.d. ${dfmt(end)}.`}
            />

            {/* Featured Report Cards */}
            <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
                    <div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Laba Rugi (P&L) {now.getFullYear()}</h2>
                                <p className="text-xs text-muted-foreground">Pendapatan vs pengeluaran periode berjalan</p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800">
                                Terupdate Hari Ini
                            </span>
                        </div>
                        <div className="mt-6 flex flex-col gap-2.5 text-sm border-t border-border/60 pt-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Pendapatan</span>
                                <strong className="font-bold text-emerald-700">{rp(fin?.total_income)}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Pengeluaran</span>
                                <strong className="font-bold text-rose-600">({rp(fin?.total_expense)})</strong>
                            </div>
                            <div className="flex justify-between border-t border-border/60 pt-2 text-base">
                                <span className="font-bold text-foreground">Laba Bersih</span>
                                <strong className={cn('font-extrabold', (fin?.net_profit ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-600')}>{rp(fin?.net_profit)}</strong>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setPage('laporan-laba-rugi')}
                        className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-sm hover:bg-primary/90"
                    >
                        Detail Laba Rugi
                    </button>
                </div>

                <div className="flex flex-col justify-between rounded-2xl bg-[#0b489a] p-6 text-white shadow-md">
                    <div>
                        <h2 className="text-base font-bold">Pendapatan per Kategori</h2>
                        <p className="text-xs text-blue-200">Rincian sumber kas masuk {now.getFullYear()}</p>
                        <div className="mt-6 flex flex-col gap-2.5 text-sm">
                            {(fin?.income ?? []).length === 0 && <p className="text-blue-200 text-sm">Belum ada data pendapatan.</p>}
                            {(fin?.income ?? []).map((row, i) => (
                                <div key={i} className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-blue-100">{row.category ?? '-'}</span>
                                    <strong className="font-bold">{rp(row.total)}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => setPage('laporan-pemasukan')}
                        className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-xs font-bold text-primary shadow-sm hover:bg-blue-50"
                    >
                        Lihat Pemasukan
                    </button>
                </div>
            </div>

            {/* Secondary Report Cards */}
            <div className="grid gap-5 md:grid-cols-3">
                <ReportCard title="Laporan Keuangan Anggota" desc="Cari dan lihat riwayat simpanan untuk anggota." onClick={() => setPage('laporan-simpanan-anggota')} btn="Buka Pencarian" />
                <ReportCard title="Laporan Simpanan Anggota" desc="Total dana simpanan seluruh anggota, buka lebih detail untuk informasi ini." onClick={() => setPage('laporan-simpanan-anggota')} btn="Lihat Pemasukan" />
                <ReportCard title="Laporan Pemasukan" desc="Detil sumber pendapatan koperasi dari jurnal kas." onClick={() => setPage('laporan-pemasukan')} btn="Lihat Pemasukan" />
            </div>
        </div>
    );
}

function ReportCard({ title, desc, onClick, btn }) {
    return (
        <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs">
            <div>
                <h2 className="text-base font-bold text-foreground">{title}</h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
            <button onClick={onClick} className="mt-5 h-10 w-full rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary/90">
                {btn}
            </button>
        </div>
    );
}

// ─── 6.1 Detail: Laba Rugi ────────────────────────────────────
function ReportProfitLossDetail({ setPage }) {
    const now = new Date();
    const start = `${now.getFullYear()}-01-01`;
    const end = now.toISOString().slice(0, 10);
    const { data: fin, loading } = useApi(`/reports/financial?period_start=${start}&period_end=${end}`);

    return (
        <div className="flex flex-col gap-6">
            <BackButton setPage={setPage} />
            <PageHeader
                title={`Laporan Laba Rugi (P&L) ${now.getFullYear()}`}
                desc="Ikhtisar pendapatan operasional vs beban pengeluaran berjalan."
            />

            <div className="grid gap-5 md:grid-cols-3">
                <StatCard label="Total Pendapatan" value={rp(fin?.total_income)} tone="green" />
                <StatCard label="Total Beban Operasional" value={rp(fin?.total_expense)} tone="red" />
                <div className="flex flex-col justify-between rounded-2xl bg-[#0b489a] p-5 text-white shadow-md">
                    <p className="text-xs uppercase font-bold tracking-wider text-blue-200">LABA BERSIH (SHU)</p>
                    <strong className={cn('mt-2 block text-3xl font-black md:text-4xl', (fin?.net_profit ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300')}>{rp(fin?.net_profit)}</strong>
                    <p className="mt-3 text-xs font-semibold text-blue-200">
                        Periode {dfmt(start)} – {dfmt(end)}
                    </p>
                </div>
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="p-5 border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Detail Rincian Laporan Laba Rugi</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Kategori Akun</th>
                                <th className="px-6 py-3.5 text-right">Nilai (IDR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={2} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat laporan…</td></tr>}
                            <tr className="bg-emerald-50/70">
                                <td colSpan={2} className="px-6 py-3 text-xs font-black uppercase tracking-wider text-emerald-900">
                                    A. Pendapatan Operasional
                                </td>
                            </tr>
                            {(fin?.income ?? []).map((item, i) => (
                                <tr key={`inc-${i}`} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-foreground">{item.category ?? '-'}</td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-700">{rp(item.total)}</td>
                                </tr>
                            ))}
                            <tr className="bg-rose-50/70">
                                <td colSpan={2} className="px-6 py-3 text-xs font-black uppercase tracking-wider text-rose-900">
                                    B. Beban & Biaya Operasional
                                </td>
                            </tr>
                            {(fin?.expense ?? []).map((item, i) => (
                                <tr key={`cost-${i}`} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-foreground">{item.category ?? '-'}</td>
                                    <td className="px-6 py-4 text-right font-bold text-rose-600">({rp(item.total)})</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-primary bg-[#eef3fc] font-bold">
                            <tr>
                                <td className="px-6 py-4 text-base font-black text-foreground">LABA BERSIH PERIODE BERJALAN</td>
                                <td className={cn('px-6 py-4 text-right text-xl font-black', (fin?.net_profit ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-600')}>
                                    {rp(fin?.net_profit)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>
        </div>
    );
}

// ─── 6.2 Detail: Laporan Simpanan Anggota ─────────────────────
function ReportMemberSavingsDetail({ setPage }) {
    const { data, meta, loading } = useApi('/members?per_page=15');
    const [q, setQ] = useState('');
    const members = (data ?? []).filter(m =>
        (m.name ?? '').toLowerCase().includes(q.toLowerCase()) || (m.member_code ?? '').toLowerCase().includes(q.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6">
            <BackButton setPage={setPage} />
            <PageHeader
                title="Laporan Simpanan Seluruh Anggota"
                desc="Pencarian dan rekap data simpanan per masing-masing anggota koperasi."
            />

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Daftar Rekap Simpanan Anggota</h2>
                    <div className="relative w-full sm:w-72">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Cari ID atau nama anggota…"
                            className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs focus:bg-white"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">ID & Nama</th>
                                <th className="px-6 py-3.5">Kategori</th>
                                <th className="px-6 py-3.5">Alamat</th>
                                <th className="px-6 py-3.5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>}
                            {!loading && members.length === 0 && <tr><td colSpan={4}><EmptyState label="Belum ada anggota" /></td></tr>}
                            {members.map(m => (
                                <tr key={m.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="block font-mono text-[11px] font-bold text-muted-foreground">{m.member_code}</span>
                                        <span className="font-semibold text-foreground">{m.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{m.category?.name ?? '-'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{m.address ?? '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'rounded-full px-2.5 py-0.5 text-xs font-bold',
                                            m.status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        )}>
                                            {m.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>Menampilkan {members.length} dari {meta?.total ?? 0} data</span>
                    <Pager total={Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.per_page ?? 15)))} />
                </div>
            </section>
        </div>
    );
}

// ─── 6.3 Detail: Laporan Pemasukan ────────────────────────────
function ReportIncomeDetail({ setPage }) {
    const now = new Date();
    const start = `${now.getFullYear()}-01-01`;
    const end = now.toISOString().slice(0, 10);
    const { data: fin } = useApi(`/reports/financial?period_start=${start}&period_end=${end}`);
    const { data: txs, loading } = useApi('/transactions?type=income&per_page=15');
    const rows = txs ?? [];

    return (
        <div className="flex flex-col gap-6">
            <BackButton setPage={setPage} />
            <PageHeader
                title="Laporan Pemasukan Koperasi"
                desc={`Detail arus kas masuk dari jurnal kas — periode ${dfmt(start)} s.d. ${dfmt(end)}.`}
            />

            <div className="grid gap-5 md:grid-cols-3">
                <StatCard label="Total Pemasukan Berjalan" value={rp(fin?.total_income)} tone="green" />
                <StatCard label="Rata-rata per Kategori" value={rp((fin?.income ?? []).length ? fin.total_income / fin.income.length : 0)} tone="blue" />
                <StatCard label="Sumber Pendapatan" value={`${(fin?.income ?? []).length} kategori`} tone="gold" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="p-5 border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Histori Arus Kas Masuk</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Tanggal</th>
                                <th className="px-6 py-3.5">Kategori Sumber</th>
                                <th className="px-6 py-3.5">Deskripsi</th>
                                <th className="px-6 py-3.5">Nominal Masuk</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={4}><EmptyState label="Belum ada pemasukan" /></td></tr>}
                            {rows.map(r => (
                                <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 text-muted-foreground">{dfmt(r.transaction_date)}</td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                            {r.category?.name ?? '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-foreground">{r.description ?? '-'}</td>
                                    <td className="px-6 py-4 font-bold text-emerald-700">{rp(r.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function BackButton({ setPage }) {
    return (
        <button
            onClick={() => setPage('laporan')}
            className="group mb-3 inline-flex items-center gap-2 self-start rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground/80 shadow-xs transition-all hover:border-primary hover:bg-secondary hover:text-primary"
        >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Kembali ke Pusat Laporan</span>
        </button>
    );
}

// ─── Router Component ─────────────────────────────────────────
function ManagerPages({ page, setPage }) {
    const { showStatus } = usePopup();
    switch (page) {
        case 'dashboard':
            return <DashboardPage setPage={setPage} />;
        case 'harga-sampah':
            return <SavingsWastePricePage />;
        case 'simpanan-pokok':
            return <SavingsByLabelPage label="POKOK" />;
        case 'simpanan-wajib':
            return <WajibOverviewPage />;
        case 'penjemputan':
            return <PickupMonitorPage />;
        case 'manajemen-user':
            return <UsersPage showStatus={showStatus} />;
        case 'simpanan-sukarela':
            return <SavingsByLabelPage label="SUKARELA" />;
        case 'shu':
            return <ShuPage />;
        case 'pendapatan':
            return <TransactionPage type="income" title="Manajemen Pendapatan" desc="Kelola dan pantau seluruh arus pendapatan koperasi secara real-time." />;
        case 'pengeluaran':
            return <TransactionPage type="expense" title="Manajemen Pengeluaran" desc="Pantau biaya operasional dan pengeluaran unit usaha secara real-time." />;
        case 'pengaduan':
            return <ComplaintsDeskPage onShowStatus={showStatus} />;
        case 'laporan':
            return <ReportHubPage setPage={setPage} />;
        case 'laporan-laba-rugi':
            return <ReportProfitLossDetail setPage={setPage} />;
        case 'laporan-simpanan-anggota':
            return <ReportMemberSavingsDetail setPage={setPage} />;
        case 'laporan-pemasukan':
            return <ReportIncomeDetail setPage={setPage} />;
        default:
            return <DashboardPage setPage={setPage} />;
    }
}

const pageTitles = {
    'dashboard': 'Dashboard Pengurus',
    'harga-sampah': 'Manajemen Harga Sampah',
    'simpanan-pokok': 'Simpanan Pokok',
    'simpanan-wajib': 'Simpanan Wajib',
    'simpanan-sukarela': 'Simpanan Sukarela',
    'shu': 'Sisa Hasil Usaha (SHU)',
    'pendapatan': 'Manajemen Pendapatan',
    'pengeluaran': 'Manajemen Pengeluaran',
    'penjemputan': 'Monitoring Pengambilan Sampah',
    'manajemen-user': 'Manajemen Pengguna',
    'pengaduan': 'Helpdesk Pengaduan',
    'laporan': 'Pusat Laporan',
    'laporan-laba-rugi': 'Laporan Laba Rugi (P&L)',
    'laporan-simpanan-anggota': 'Laporan Simpanan Anggota',
    'laporan-pemasukan': 'Laporan Pemasukan',
};

// ─── Page Entry ───────────────────────────────────────────────
export default function PengurusIndex() {
    const { user, ready } = useAuth();
    const [page, setPage] = useState('dashboard');
    const [form, setForm] = useState(null);
    const [status, setStatus] = useState('');

    if (ready && !user) return <Navigate to="/" replace />;
    if (!ready) return null;

    return (
        <PopupCtx.Provider value={{ openForm: setForm, showStatus: setStatus }}>
            <Head title={pageTitles[page] || 'Dashboard Pengurus'} />
            <ManagerShell currentPage={page} setPage={setPage}>
                <ManagerPages page={page} setPage={setPage} />
            </ManagerShell>
            <FormPopup kind={form} onClose={() => setForm(null)} onSuccess={msg => setStatus(msg)} />
            <StatusPopup open={Boolean(status)} title={status} onClose={() => setStatus('')} />
        </PopupCtx.Provider>
    );
}

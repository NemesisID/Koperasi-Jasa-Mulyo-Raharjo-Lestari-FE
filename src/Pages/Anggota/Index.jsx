import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Head } from '@/lib/shims';
import {
    Banknote, CalendarClock, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, CirclePlus,
    Home, Landmark, Leaf, Plus, Store, TrendingDown, TrendingUp,
    UserRound, WalletCards, X
} from 'lucide-react';
import { MemberShell } from '@/Components/Koperasi/MemberShell';
import ComplaintFormModal from '@/Components/Koperasi/ComplaintFormModal';
import PriceBoardPage from './PriceBoard';
import {
    DataPanel, FilterButton, MetricCard, PageTitle, Status
} from '@/Components/Koperasi/MemberUI';
import { FormPopup, Modal, StatusPopup } from '@/Components/Koperasi/Popups';
import { useApi, api, rp, dfmt } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const cn = (...cls) => cls.filter(Boolean).join(' ');

// ─── Status Tagihan Wajib (GET /savings/billing-status) ───────
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const monthLabel = (period) => {
    const [y, m] = (period ?? '').split('-');
    return `${MONTHS[Number(m) - 1] ?? ''} ${y ?? ''}`.trim() || '-';
};
const BILLING_LABEL = { WAJIB: 'Simpanan Wajib', TIPPING: 'Operasional Penjemputan' };

/**
 * Banner status iuran bulan berjalan — dipakai di Dashboard (dengan CTA) &
 * panel rincian di halaman Simpanan Wajib (variant="panel").
 */
function BillingBanner({ onSeeDetail, variant = 'banner' }) {
    const { data: billing } = useApi('/savings/billing-status');
    if (!billing) return null;

    const belumTagih = (billing.detail ?? []).every(d => d.status === 'BELUM_TAGIH');

    if (belumTagih && variant === 'banner') {
        return (
            <section className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <CalendarClock size={22} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                    <h3 className="text-sm font-bold text-foreground">Tagihan iuran periode {monthLabel(billing.period)} belum diterbitkan</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">Pengurus koperasi belum menerbitkan tagihan rutin bulan ini. Pantau kembali nanti.</p>
                </div>
            </section>
        );
    }

    if (billing.fully_paid) {
        return (
            <section className="flex items-start gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                    <h3 className="text-sm font-bold text-emerald-900">Iuran wajib periode {monthLabel(billing.period)} sudah lunas</h3>
                    <p className="mt-0.5 text-xs text-emerald-800/80">Total {rp(billing.total_monthly)} — terima kasih atas partisipasi aktif Anda.</p>
                </div>
            </section>
        );
    }

    return (
        <section className={cn(
            'rounded-2xl border p-5',
            variant === 'banner' ? 'border-amber-300 bg-amber-50/90' : 'border-amber-300 bg-amber-50/60'
        )}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3.5">
                    <CalendarClock size={22} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                        <h3 className="text-sm font-bold text-amber-950">Tagihan iuran {monthLabel(billing.period)} menunggu pembayaran</h3>
                        <p className="mt-1 text-lg font-extrabold text-amber-900">{rp(billing.total_monthly)}</p>
                        <p className="mt-0.5 text-xs text-amber-900/70">
                            {(billing.detail ?? []).map(d => `${BILLING_LABEL[d.label] ?? d.label} ${rp(d.billed)}`).join(' + ')}
                        </p>
                        <p className="mt-2 text-xs text-amber-900/80">
                            Pembayaran tunai langsung kepada pengurus/bendahara koperasi, atau titipkan lewat petugas saat jadwal penjemputan sampah.
                        </p>
                    </div>
                </div>
                {variant === 'banner' && onSeeDetail && (
                    <button
                        onClick={onSeeDetail}
                        className="h-9 shrink-0 rounded-xl bg-amber-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                    >
                        Lihat Rincian Tagihan
                    </button>
                )}
            </div>
        </section>
    );
}

// ─── Summary Card Component ───────────────────────────────────
function SummaryCard({ title, amount, note }) {
    return (
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-200 bg-[#eaf1fd] p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                    <UserRound size={22} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground">Tabungan simpanan Anda.</p>
                </div>
            </div>
            <div className="flex flex-col sm:items-end">
                <strong className="text-2xl font-extrabold text-primary">{amount}</strong>
                {note && <span className="mt-1 inline-block rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">{note}</span>}
            </div>
        </section>
    );
}

// ─── 1. Dashboard Sub-page ────────────────────────────────────
function DashboardPage({ setPage }) {
    const { user } = useAuth();
    const { data: wallet } = useApi('/wallet/summary');
    const { data: mutations, loading, error } = useApi('/wallet/mutations');
    const member = user?.member;
    const rows = mutations ?? [];

    return (
        <div className="flex flex-col gap-6">
            {/* Status iuran bulan berjalan */}
            <BillingBanner onSeeDetail={() => setPage?.('simpanan-wajib')} />

            {/* Member Profile Card */}
            <section className="flex flex-col justify-between gap-5 rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                    <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary border border-blue-200">
                        <UserRound size={40} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground md:text-2xl">{user?.name || 'Anggota'}</h2>
                        <p className="mt-1 text-xs text-muted-foreground">ID: <span className="font-mono font-semibold text-foreground">{member?.member_code ?? '-'}</span></p>
                        <p className="text-xs text-muted-foreground">{member?.address ?? user?.address ?? '-'}</p>
                    </div>
                </div>
                <div className="self-start sm:self-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
                        <span className="size-2 rounded-full bg-emerald-600" /> Anggota Aktif
                    </span>
                </div>
            </section>

            {/* 3 Metric Cards — saldo dipisah sumber: sampah vs SHU */}
            <div className="grid gap-5 md:grid-cols-3">
                <MetricCard icon={<Leaf size={20} />} label="Saldo dari Sampah" value={rp(wallet?.balance_from_trash)} note="Hasil setoran sampah (net)" tone="green" />
                <MetricCard icon={<Landmark size={20} />} label="Saldo dari SHU" value={rp(wallet?.balance_from_shu)} note="Dividen tahunan koperasi" tone="gold" />
                <MetricCard icon={<WalletCards size={20} />} label="Total Saldo Saat Ini" value={rp(wallet?.current_balance)} note={`Sudah ditarik: ${rp(wallet?.total_withdrawn)} · Pending: ${rp(wallet?.pending_withdrawal)}`} />
            </div>

            {/* Riwayat Aktivitas Keuangan */}
            <DataPanel
                title="Riwayat Aktivitas Keuangan"
                toolbar={
                    <div className="flex items-center gap-2">
                        <select className="h-9 rounded-xl border border-border bg-slate-50/50 px-3 text-xs font-medium text-foreground focus:bg-white">
                            <option>Semua Waktu</option>
                        </select>
                        <FilterButton />
                    </div>
                }
                headers={['Tanggal', 'Deskripsi Transaksi', 'Sumber', 'Jumlah (IDR)']}
                rows={loading
                    ? [[<span key="l" className="text-muted-foreground">Memuat data…</span>, '', '', '']]
                    : rows.length === 0
                        ? [[<span key="e" className="text-muted-foreground">{error ? 'Gagal memuat data.' : 'Belum ada aktivitas.'}</span>, '', '', '']]
                        : rows.map(r => [
                            <span key="date" className="text-muted-foreground">{dfmt(r.date)}</span>,
                            <strong key="desc" className="font-semibold text-foreground">{r.description ?? '-'}</strong>,
                            <span key="src" className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-primary">{r.source ?? r.type}</span>,
                            <strong key="amt" className={cn('font-bold', Number(r.amount) >= 0 ? 'text-emerald-700' : 'text-rose-600')}>
                                {Number(r.amount) >= 0 ? '+ ' : '- '}{rp(Math.abs(Number(r.amount)))}
                            </strong>
                        ])}
                footer={`Menampilkan ${rows.length} mutasi wallet`}
            />
        </div>
    );
}

/**
 * Accordion iuran per kategori — anggota dual-status (rumah + pasar) melihat
 * dua panel terpisah. Nominal per kategori = tagihan member ÷ jumlah kategori.
 */
function CategoryBillingAccordion({ type, address, rows, status }) {
    const Icon = type === 'rumah' ? Home : Store;
    const total = rows.reduce((s, r) => s + r.per, 0);
    const pillCls = status === 'paid'
        ? 'bg-emerald-100 text-emerald-800'
        : status === 'unpaid' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600';
    const pillText = status === 'paid' ? 'Lunas' : status === 'unpaid' ? 'Belum Lunas' : 'Belum Diterbitkan';

    return (
        <details open className="group rounded-2xl border border-border/80 bg-card shadow-xs">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3.5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <Icon size={22} />
                    </span>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Iuran Kategori {type === 'rumah' ? 'Rumah' : 'Pasar'}</h3>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{address || 'Alamat belum diisi'}</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <span className={cn('rounded-full px-3 py-0.5 text-[11px] font-bold', pillCls)}>{pillText}</span>
                    <strong className="text-base font-extrabold text-primary">{rp(total)}</strong>
                    <ChevronDown size={16} className="text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </div>
            </summary>
            <div className="border-t border-border/60 px-5 py-4">
                <div className="flex flex-col divide-y divide-border/60">
                    {rows.map(r => (
                        <div key={r.label} className="flex items-center justify-between gap-4 py-2.5">
                            <div>
                                <p className="text-xs font-semibold text-foreground">{BILLING_LABEL[r.label] ?? r.label}</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {r.label === 'WAJIB' ? 'Menambah simpanan modal Anda' : 'Biaya operasional armada penjemputan'}
                                </p>
                            </div>
                            <strong className="shrink-0 text-sm font-bold text-foreground">{rp(r.per)}</strong>
                        </div>
                    ))}
                </div>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50/80 px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total per Kategori</span>
                    <strong className="text-base font-extrabold text-primary">{rp(total)}</strong>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                    Pembayaran tunai kepada pengurus/bendahara koperasi, atau titipkan lewat petugas saat penjemputan {type}.
                </p>
            </div>
        </details>
    );
}

// ─── 2. Simpanan Wajib Sub-page ───────────────────────────────
function WajibPage() {
    const { user } = useAuth();
    const { data, loading } = useApi('/savings?label=WAJIB');
    const { data: billing } = useApi('/savings/billing-status');
    const rows = data ?? [];
    const total = rows.reduce((s, r) => s + Number(r.jumlah), 0);

    const member = user?.member;
    const cats = member?.categories?.length
        ? member.categories
        : (member?.category?.name ? [member.category.name] : []);
    const multi = cats.length > 1;

    // Nominal per kategori = tagihan member ÷ jumlah kategori (BE menghitung ×kategori).
    const perCatRows = (billing?.detail ?? []).map(d => ({ ...d, per: Math.round(Number(d.billed) / Math.max(1, cats.length)) }));
    const belumTagih = (billing?.detail ?? []).every(d => d.status === 'BELUM_TAGIH');
    const billStatus = !billing || !billing.detail?.length || belumTagih ? 'none' : billing.fully_paid ? 'paid' : 'unpaid';
    const catAddress = t => (t === 'rumah' ? member?.address_rumah : member?.address_pasar) ?? member?.address ?? '';

    return (
        <div className="flex flex-col gap-6">
            <PageTitle
                title="Simpanan Wajib"
                description="Setoran wajib bulanan yang diakumulasi untuk modal bersama koperasi."
            />

            {/* Rincian tagihan: dual-status tampil accordion per kategori, satuan tampil panel biasa */}
            {multi ? (
                <div className="flex flex-col gap-4">
                    {cats.filter(c => c === 'rumah' || c === 'pasar').map(c => (
                        <CategoryBillingAccordion key={c} type={c} address={catAddress(c)} rows={perCatRows} status={billStatus} />
                    ))}
                </div>
            ) : (
                <BillingBanner variant="panel" />
            )}

            <div className="grid gap-5 md:grid-cols-3">
                <MetricCard icon={<Leaf size={20} />} label="Jumlah Setoran Wajib" value={`${rows.length} setoran`} note="Riwayat penuh di tabel" />
                <MetricCard icon={<Banknote size={20} />} label="Total Simpanan Wajib" value={rp(total)} note="Akumulasi setoran" tone="green" />
                <SummaryCard title="Status Simpanan Wajib" amount="Rp 5.000 / bulan / kategori" note="Terverifikasi" />
            </div>

            <DataPanel
                title="Riwayat Setoran Wajib"
                headers={['Tanggal', 'Jenis', 'Jumlah', 'Status', 'Catatan']}
                rows={loading
                    ? [[<span key="l" className="text-muted-foreground">Memuat data…</span>, '', '', '', '']]
                    : rows.length === 0
                        ? [[<span key="e" className="text-muted-foreground">Belum ada setoran wajib.</span>, '', '', '', '']]
                        : rows.map(r => [
                            <span key="d" className="text-muted-foreground">{dfmt(r.created_at)}</span>,
                            <span key="j" className="font-semibold">{r.label}</span>,
                            <strong key="a" className="font-bold text-primary">{rp(r.jumlah)}</strong>,
                            <Status key="s" kind={r.status === 'SELESAI' ? 'success' : 'waiting'}>{r.status}</Status>,
                            <span key="c" className="text-muted-foreground">{r.catatan ?? '-'}</span>
                        ])}
                footer={`Menampilkan ${rows.length} setoran`}
            />
        </div>
    );
}

// ─── 3. Simpanan Sukarela Sub-page ────────────────────────────
function SukarelaPage() {
    const { data, loading } = useApi('/savings?label=SUKARELA');
    const rows = data ?? [];
    const total = rows.reduce((s, r) => s + Number(r.jumlah), 0);

    return (
        <div className="flex flex-col gap-6">
            <PageTitle
                title="Simpanan Sukarela"
                description="Kelola dana simpanan sukarela Anda dengan transparansi penuh."
            />

            <SummaryCard title="Simpanan Sukarela Pribadi" amount={rp(total)} note={`${rows.length} transaksi`} />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4">
                <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-muted-foreground" />
                    <input type="date" className="h-9 rounded-xl border border-border bg-slate-50/50 px-3 text-xs font-medium text-foreground" />
                </div>
                <div className="flex items-center gap-2">
                    <FilterButton />
                </div>
            </div>

            <DataPanel
                title="Riwayat Simpanan"
                headers={['Waktu Transaksi', 'Nominal', 'Catatan', 'Status']}
                rows={loading
                    ? [[<span key="l" className="text-muted-foreground">Memuat data…</span>, '', '', '']]
                    : rows.length === 0
                        ? [[<span key="e" className="text-muted-foreground">Belum ada simpanan sukarela.</span>, '', '', '']]
                        : rows.map(r => [
                            <span key="t" className="text-muted-foreground">{dfmt(r.created_at)}</span>,
                            <strong key="n" className="font-bold text-emerald-700">{rp(r.jumlah)}</strong>,
                            <span key="c" className="text-foreground">{r.catatan ?? '-'}</span>,
                            <Status key="s" kind={r.status === 'SELESAI' ? 'success' : 'waiting'}>{r.status}</Status>
                        ])}
                footer={`Menampilkan ${rows.length} transaksi`}
            />
        </div>
    );
}

// ─── 3. Riwayat Pengambilan Sampah Sub-page ────────────────────
// Anggota melihat pickup miliknya (backend otomatis filter own) + minta
// jemput pada tanggal & jam tertentu. Jadwal rutin TIDAK bisa diatur
// anggota — pakem dari koperasi (kartu info di bawah).
const locLabel = (t) => t === 'jemput_rumah' ? 'Jemput Rumah' : t === 'jemput_pasar' ? 'Jemput Pasar' : 'Antar Gudang';

// Kategori anggota → opsi lokasi jemput (rumah / pasar / keduanya).
function memberLocations(user) {
    const cats = user?.member?.categories?.length
        ? user.member.categories
        : [user?.member?.category?.name ?? 'rumah'];
    return cats.filter(c => c === 'rumah' || c === 'pasar')
        .map(c => (c === 'rumah' ? 'jemput_rumah' : 'jemput_pasar'));
}

// Popup alasan jemput ulang (revisi: prompt JS → popup).
function RequestAgainModal({ user, onClose, onDone }) {
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const reason = fd.get('reason');
        if (!reason?.trim()) { setError('Alasan wajib diisi.'); return; }
        const locations = memberLocations(user);
        setSaving(true);
        try {
            await api('/pickups', {
                method: 'POST',
                body: {
                    member_id: user?.member?.id,
                    location_type: locations.length === 1 ? locations[0] : (fd.get('location_type') || 'jemput_rumah'),
                    notes: `Request jemput ulang hari yang sama — ${reason}`,
                },
            });
            onDone('Permintaan jemput ulang berhasil dikirim ke petugas.');
        } catch (err) {
            const fieldErrs = err.errors && Object.values(err.errors)[0]?.[0];
            setError(fieldErrs || err.message || 'Gagal mengirim permintaan.');
        } finally { setSaving(false); }
    };

    const locations = memberLocations(user);

    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between px-6 py-4 bg-accent/60 border-b border-border/60">
                <h2 className="text-base font-bold text-primary">Minta Jemput Ulang</h2>
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors">
                    <X size={18} />
                </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4 p-6 bg-card">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="reason" className="text-xs font-semibold text-foreground/80">Alasan</label>
                    <textarea
                        required
                        id="reason"
                        name="reason"
                        rows={2}
                        placeholder="Contoh: ada hajatan, sampah menumpuk..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 resize-none"
                    />
                </div>
                {(() => {
                    // Satu kategori → dropdown read-only; dua → anggota pilih.
                    const fixed = locations.length <= 1 ? (locations[0] ?? 'jemput_rumah') : null;
                    return (
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="location_type" className="text-xs font-semibold text-foreground/80">Lokasi Penjemputan</label>
                            <select id="location_type" name="location_type"
                                disabled={Boolean(fixed)}
                                value={fixed ?? undefined}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70">
                                {fixed
                                    ? <option value={fixed}>{fixed === 'jemput_rumah' ? 'Jemput ke Rumah' : 'Jemput ke Pasar'}</option>
                                    : <>
                                        <option value="jemput_rumah">Jemput ke Rumah</option>
                                        <option value="jemput_pasar">Jemput ke Pasar</option>
                                    </>}
                            </select>
                            {fixed && <span className="text-[11px] text-muted-foreground">Sesuai kategori Anda — hanya tersedia lokasi ini.</span>}
                        </div>
                    );
                })()}
                {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose}
                        className="h-11 flex-1 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary transition-all">
                        Batal
                    </button>
                    <button type="submit" disabled={saving}
                        className="h-11 flex-[1.5] rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60">
                        {saving ? 'Mengirim...' : 'Kirim Permintaan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function PickupHistoryPage({ openForm }) {
    const { user } = useAuth();
    const { data, loading, error } = useApi('/pickups?per_page=50');
    const [again, setAgain] = useState(null);
    const [reporting, setReporting] = useState(null);
    const [done, setDone] = useState('');
    const rows = data ?? [];

    const isSameDay = (iso) => {
        if (!iso) return false;
        const d = new Date(iso);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    };

    return (
        <div className="flex flex-col gap-6">
            <PageTitle
                title="Riwayat Pengambilan Sampah"
                description="Riwayat sampah Anda yang diambil petugas. Minta jemput untuk jadwal tertentu."
                action={
                    <div className="flex gap-2">
                        <button
                            onClick={() => openForm('waste')}
                            className="flex h-10 items-center gap-2 rounded-xl border border-primary px-4 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white"
                        >
                            <CirclePlus size={16} />
                            <span>Setor Sampah</span>
                        </button>
                        <button
                            onClick={() => openForm('requestPickup')}
                            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                        >
                            <CalendarClock size={16} />
                            <span>Minta Jemput</span>
                        </button>
                    </div>
                }
            />
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-emerald-700" />
                <p className="text-xs leading-relaxed text-emerald-900">
                    <strong>Jadwal pakem:</strong> jadwal pengambilan sampah ditetapkan tetap oleh koperasi dan tidak dapat diatur sendiri oleh anggota. Untuk kebutuhan di luar jadwal, gunakan tombol <strong>Minta Jemput</strong>.
                </p>
            </div>
            <DataPanel
                title="Riwayat Pengambilan"
                headers={['Tanggal', 'Lokasi', 'Status', 'Anda Terima', 'Aksi']}
                rows={loading
                    ? [[<span key="l" className="text-muted-foreground">Memuat data…</span>, '', '', '', '']]
                    : rows.length === 0
                        ? [[<span key="e" className="text-muted-foreground">{error ? 'Gagal memuat data.' : 'Belum ada pengambilan sampah.'}</span>, '', '', '', '']]
                        : rows.map(p => [
                            <span key="d" className="text-muted-foreground">{dfmt(p.completed_at ?? p.scheduled_at)}</span>,
                            <span key="loc" className="font-semibold">{locLabel(p.location_type)}</span>,
                            <Status key="s" kind={p.status === 'selesai' ? 'success' : p.status === 'batal' ? 'danger' : 'waiting'}>{p.status}</Status>,
                            <strong key="net" className={cn('font-bold', Number(p.total_net) > 0 ? 'text-emerald-700' : 'text-muted-foreground')}>{Number(p.total_net) > 0 ? rp(p.total_net) : '-'}</strong>,
                            <div key="a" className="flex justify-end gap-1.5">
                                {p.status === 'selesai' && isSameDay(p.completed_at ?? p.scheduled_at) && (
                                    <button onClick={() => setAgain(p)}
                                        className="h-8 rounded-xl bg-primary px-3 text-xs font-semibold text-white hover:bg-primary/90">
                                        Jemput Ulang
                                    </button>
                                )}
                                {p.status === 'selesai' && (
                                    <button onClick={() => setReporting(p)}
                                        className="h-8 rounded-xl border border-primary px-3 text-xs font-semibold text-primary hover:bg-primary hover:text-white">
                                        Laporkan
                                    </button>
                                )}
                                {p.status !== 'selesai' && <span className="text-xs text-muted-foreground">-</span>}
                            </div>
                        ])}
                footer={`Menampilkan ${rows.length} pengambilan`}
            />
            {again && (
                <RequestAgainModal
                    user={user}
                    onClose={() => setAgain(null)}
                    onDone={msg => { setAgain(null); setDone(msg); }}
                />
            )}
            {reporting && (
                <ComplaintFormModal
                    receipt={{
                        id: reporting.id,
                        date: dfmt(reporting.completed_at ?? reporting.scheduled_at),
                        itemsSummary: `${locLabel(reporting.location_type)} · petugas: ${reporting.officer?.name ?? '-'}`,
                    }}
                    onClose={() => setReporting(null)}
                    onSuccess={msg => { setReporting(null); setDone(msg || 'Laporan berhasil dikirim ke pengurus.'); }}
                />
            )}
            <StatusPopup open={Boolean(done)} title={done} onClose={() => setDone('')} />
        </div>
    );
}

// ─── 4. Laporan Hub & Sub-pages ───────────────────────────────
function ReportsPage({ setPage }) {
    const reportCards = [
        { title: 'Laporan SHU', desc: 'Riwayat dividen tahunan Anda — jasa modal dan partisipasi usaha.', icon: UserRound, key: 'laporan-shu', bg: 'bg-blue-50 text-primary' },
        { title: 'Laporan Saldo', desc: 'Saldo wallet dari hasil setoran sampah Anda.', icon: WalletCards, key: 'laporan-saldo', bg: 'bg-purple-50 text-purple-700' },
    ];

    return (
        <div className="flex flex-col gap-6">
            <PageTitle title="Pusat Laporan" description="Akses semua data finansial dan operasional pada akun Anda." />
            <div className="grid gap-6 md:grid-cols-2">
                {reportCards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                        <article key={i} className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:shadow-md">
                            <div>
                                <div className={cn('flex size-12 items-center justify-center rounded-xl', c.bg)}>
                                    <Icon size={22} />
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-foreground">{c.title}</h3>
                                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                            </div>
                            <button
                                onClick={() => setPage(c.key)}
                                className="mt-5 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
                            >
                                Buka Laporan →
                            </button>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

function BackButton({ setPage }) {
    return (
        <button
            onClick={() => setPage('laporan')}
            className="group inline-flex items-center gap-2 self-start rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground/80 shadow-xs transition-all hover:border-primary hover:bg-secondary hover:text-primary"
        >
            <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Kembali ke Pusat Laporan</span>
        </button>
    );
}

function ShuReportPage({ setPage }) {
    const { data, loading } = useApi('/shu/my-history');
    const rows = data ?? [];
    const totalShu = rows.reduce((s, r) => s + Number(r.total_shu), 0);

    return (
        <div className="flex flex-col gap-6">
            <BackButton setPage={setPage} />
            <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:flex-row sm:items-center">
                <div>
                    <Landmark className="text-primary" size={22} />
                    <h2 className="mt-2 text-xl font-bold">Total SHU Anda</h2>
                    <p className="text-xs text-muted-foreground">Akumulasi seluruh periode distribusi</p>
                </div>
                <div className="sm:text-right">
                    <strong className="block text-3xl font-extrabold text-primary">{rp(totalShu)}</strong>
                    <p className="mt-1 text-xs text-muted-foreground">{rows.length} periode distribusi</p>
                </div>
            </section>
            <DataPanel
                title="Riwayat SHU Anda"
                headers={['Tahun', 'Jasa Modal (Simpanan)', 'Jasa Partisipasi Usaha', 'Total SHU', 'Status']}
                rows={loading
                    ? [[<span key="l" className="text-muted-foreground">Memuat data…</span>, '', '', '', '']]
                    : rows.length === 0
                        ? [[<span key="e" className="text-muted-foreground">Belum ada riwayat SHU.</span>, '', '', '', '']]
                        : rows.map(r => [
                            <strong key="y">{r.year ?? '-'}</strong>,
                            rp(r.jasa_modal),
                            rp(r.jasa_partisipasi),
                            <strong key="shu" className="font-bold text-primary">{rp(r.total_shu)}</strong>,
                            <Status key="s" kind={r.status === 'published' ? 'success' : 'waiting'}>{r.status ?? '-'}</Status>
                        ])}
                footer={`Menampilkan ${rows.length} dari ${rows.length} data`}
            />
        </div>
    );
}

function SaldoReportPage({ setPage }) {
    const { data: wallet } = useApi('/wallet/summary');
    const { data: mutations, loading } = useApi('/wallet/mutations');
    const rows = mutations ?? [];

    return (
        <div className="flex flex-col gap-6">
            <BackButton setPage={setPage} />
            <div className="grid gap-5 md:grid-cols-2">
                <MetricCard icon={<Leaf size={20} />} label="Total Saldo Wallet" value={rp(wallet?.current_balance)} note="Dari hasil setoran sampah" tone="green" />
                <MetricCard icon={<Banknote size={20} />} label="Saldo Tersedia (Bisa Ditarik)" value={rp(wallet?.available_balance)} note={`Pending penarikan: ${rp(wallet?.pending_withdrawal)}`} />
            </div>
            <DataPanel
                title="Mutasi Wallet Anda"
                headers={['Tanggal', 'Tipe', 'Deskripsi', 'Jumlah (IDR)']}
                rows={loading
                    ? [[<span key="l" className="text-muted-foreground">Memuat data…</span>, '', '', '']]
                    : rows.length === 0
                        ? [[<span key="e" className="text-muted-foreground">Belum ada mutasi wallet.</span>, '', '', '']]
                        : rows.map(r => [
                            <span key="d" className="text-muted-foreground">{dfmt(r.date)}</span>,
                            <span key="t" className="font-semibold">{r.type}</span>,
                            <span key="de" className="text-foreground">{r.description ?? '-'}</span>,
                            <strong key="a" className={cn('font-bold', Number(r.amount) >= 0 ? 'text-emerald-700' : 'text-rose-600')}>{rp(r.amount)}</strong>
                        ])}
                footer={`Menampilkan ${rows.length} mutasi`}
            />
        </div>
    );
}

// ─── Router Component ─────────────────────────────────────────
function MemberPages({ page, setPage, openForm }) {
    switch (page) {
        case 'dashboard':
            return <DashboardPage setPage={setPage} />;
        case 'simpanan-wajib':
            return <WajibPage />;
        case 'simpanan-sukarela':
            return <SukarelaPage />;
        case 'pengambilan-sampah':
            return <PickupHistoryPage openForm={openForm} />;
        case 'harga-sampah':
            return <PriceBoardPage />;
        case 'laporan':
            return <ReportsPage setPage={setPage} />;
        case 'laporan-shu':
            return <ShuReportPage setPage={setPage} />;
        case 'laporan-saldo':
            return <SaldoReportPage setPage={setPage} />;
        default:
            return <DashboardPage />;
    }
}

const memberPageTitles = {
    'dashboard': 'Dashboard Anggota',
    'simpanan-wajib': 'Simpanan Wajib Anggota',
    'simpanan-sukarela': 'Simpanan Sukarela Anggota',
    'pengambilan-sampah': 'Riwayat Pengambilan Sampah',
    'harga-sampah': 'Papan Harga Sampah',
    'laporan': 'Pusat Laporan Anggota',
    'laporan-shu': 'Laporan SHU Anggota',
    'laporan-saldo': 'Laporan Saldo Sampah',
};

export default function AnggotaIndex() {
    const { user, ready } = useAuth();
    const [page, setPage] = useState('dashboard');
    const [form, setForm] = useState(null);
    const [status, setStatus] = useState('');

    if (ready && !user) return <Navigate to="/" replace />;
    if (!ready) return null;

    return (
        <>
            <Head title={memberPageTitles[page] || 'Dashboard Anggota'} />
            <MemberShell currentPage={page} setPage={setPage}>
                <MemberPages page={page} setPage={setPage} openForm={setForm} />
            </MemberShell>
            {/* key={form}: remount tiap form dibuka → state & input uncontrolled selalu reset (issue #4). */}
            <FormPopup key={form || 'none'} kind={form} onClose={() => setForm(null)} onSuccess={msg => setStatus(msg)} />
            <StatusPopup open={Boolean(status)} title={status} onClose={() => setStatus('')} />
        </>
    );
}

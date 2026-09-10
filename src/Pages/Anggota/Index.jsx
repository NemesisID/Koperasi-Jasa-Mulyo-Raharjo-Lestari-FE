import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Head } from '@/lib/shims';
import {
    Banknote, CalendarClock, CalendarDays, ChevronLeft, CirclePlus,
    Landmark, Leaf, Plus, Repeat, TrendingDown, TrendingUp,
    UserRound, WalletCards
} from 'lucide-react';
import { MemberShell } from '@/Components/Koperasi/MemberShell';
import {
    DataPanel, FilterButton, MetricCard, PageTitle, Status
} from '@/Components/Koperasi/MemberUI';
import { FormPopup, StatusPopup } from '@/Components/Koperasi/Popups';
import { useApi, api, rp, dfmt } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const cn = (...cls) => cls.filter(Boolean).join(' ');

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
function DashboardPage() {
    const { user } = useAuth();
    const { data: wallet } = useApi('/wallet/summary');
    const { data: mutations, loading, error } = useApi('/wallet/mutations');
    const member = user?.member;
    const rows = mutations ?? [];

    return (
        <div className="flex flex-col gap-6">
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

// ─── 2. Simpanan Wajib Sub-page ───────────────────────────────
function WajibPage({ openForm }) {
    const { data, loading } = useApi('/savings?label=WAJIB');
    const rows = data ?? [];
    const total = rows.reduce((s, r) => s + Number(r.jumlah), 0);

    return (
        <div className="flex flex-col gap-6">
            <PageTitle
                title="Simpanan Wajib"
                description="Setoran wajib bulanan yang diakumulasi untuk modal bersama koperasi."
                action={
                    <button
                        onClick={() => openForm('waste')}
                        className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                    >
                        <CirclePlus size={16} />
                        <span>Setor Sampah</span>
                    </button>
                }
            />

            <div className="grid gap-5 md:grid-cols-3">
                <MetricCard icon={<Leaf size={20} />} label="Jumlah Setoran Wajib" value={`${rows.length} setoran`} note="Riwayat penuh di tabel" />
                <MetricCard icon={<Banknote size={20} />} label="Total Simpanan Wajib" value={rp(total)} note="Akumulasi setoran" tone="green" />
                <SummaryCard title="Status Simpanan Wajib" amount="Rp 5.000 / bulan" note="Terverifikasi" />
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
// jemput pada tanggal & jam tertentu + atur rutinan harian/mingguan/custom.
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function PickupHistoryPage({ openForm }) {
    const { user } = useAuth();
    const { data, loading, error } = useApi('/pickups?per_page=50');
    const { data: schedules, reload: reloadSchedules } = useApi('/pickup-schedules');
    const [reqState, setReqState] = useState('');
    const rows = data ?? [];

    const isSameDay = (iso) => {
        if (!iso) return false;
        const d = new Date(iso);
        const now = new Date();
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    };

    const requestAgain = async (p) => {
        const reason = prompt('Alasan permintaan jemput ulang (contoh: ada hajatan, sampah menumpuk):');
        if (!reason) return;
        setReqState(p.id);
        try {
            await api('/pickups', {
                method: 'POST',
                body: {
                    member_id: user?.member?.id,
                    location_type: 'jemput_rumah',
                    is_sorted: p.is_sorted,
                    notes: `Request jemput ulang hari yang sama — ${reason}`,
                },
            });
            alert('Permintaan jemput ulang berhasil dikirim ke petugas.');
        } catch (err) {
            alert(err.message || 'Gagal mengirim permintaan.');
        } finally { setReqState(''); }
    };

    const deleteSchedule = async (s) => {
        if (!confirm('Hapus rutinan ini?')) return;
        try {
            await api(`/pickup-schedules/${s.id}`, { method: 'DELETE' });
            reloadSchedules();
        } catch (err) {
            alert(err.message || 'Gagal menghapus rutinan.');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageTitle
                title="Riwayat Pengambilan Sampah"
                description="Riwayat sampah Anda yang diambil petugas. Minta jemput untuk jadwal tertentu, atau atur penjemputan rutin."
                action={
                    <div className="flex gap-2">
                        <button
                            onClick={() => openForm('routine')}
                            className="flex h-10 items-center gap-2 rounded-xl border border-primary/30 bg-accent px-4 text-xs font-semibold text-primary shadow-sm transition-all hover:bg-accent/70"
                        >
                            <Repeat size={16} />
                            <span>Rutin</span>
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
            {(schedules ?? []).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                    <Repeat size={16} className="text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-800">Rutinan aktif:</span>
                    {(schedules ?? []).map(s => (
                        <span key={s.id} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-900 shadow-xs">
                            {(s.days ?? []).map(d => DAY_NAMES[d]).join(', ')} · {(s.slots ?? []).join('/')}
                            <button onClick={() => deleteSchedule(s)} className="text-rose-500 hover:text-rose-700" aria-label={`Hapus rutinan ${(s.slots ?? []).join('/')}`}>✕</button>
                        </span>
                    ))}
                </div>
            )}
            <DataPanel
                title="Riwayat Pengambilan"
                headers={['Tanggal', 'Lokasi', 'Status', 'Anda Terima', 'Aksi']}
                rows={loading
                    ? [[<span key="l" className="text-muted-foreground">Memuat data…</span>, '', '', '', '']]
                    : rows.length === 0
                        ? [[<span key="e" className="text-muted-foreground">{error ? 'Gagal memuat data.' : 'Belum ada pengambilan sampah.'}</span>, '', '', '', '']]
                        : rows.map(p => [
                            <span key="d" className="text-muted-foreground">{dfmt(p.completed_at ?? p.scheduled_at)}</span>,
                            <span key="loc" className="font-semibold">{p.location_type === 'jemput_rumah' ? 'Jemput Rumah' : 'Antar Gudang'}</span>,
                            <Status key="s" kind={p.status === 'selesai' ? 'success' : p.status === 'batal' ? 'danger' : 'waiting'}>{p.status}</Status>,
                            <strong key="net" className={cn('font-bold', Number(p.total_net) > 0 ? 'text-emerald-700' : 'text-muted-foreground')}>{Number(p.total_net) > 0 ? rp(p.total_net) : '-'}</strong>,
                            p.status === 'selesai' && isSameDay(p.completed_at ?? p.scheduled_at)
                                ? <button key="a" onClick={() => requestAgain(p)} disabled={reqState === p.id}
                                    className="h-8 rounded-xl bg-primary px-3 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                                    {reqState === p.id ? 'Mengirim…' : 'Jemput Ulang'}
                                </button>
                                : <span key="a" className="text-xs text-muted-foreground">-</span>
                        ])}
                footer={`Menampilkan ${rows.length} pengambilan`}
            />
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
            return <DashboardPage />;
        case 'simpanan-wajib':
            return <WajibPage openForm={openForm} />;
        case 'simpanan-sukarela':
            return <SukarelaPage />;
        case 'pengambilan-sampah':
            return <PickupHistoryPage openForm={openForm} />;
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
            <FormPopup kind={form} onClose={() => setForm(null)} onSuccess={msg => setStatus(msg)} />
            <StatusPopup open={Boolean(status)} title={status} onClose={() => setStatus('')} />
        </>
    );
}

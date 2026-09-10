import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Head } from '@/lib/shims';
import { useAuth } from '@/lib/auth';
import {
    CalendarDays, Check, ChevronRight, Clock3, MapPin, Pencil, Scale
} from 'lucide-react';
import { OfficerShell } from '@/Components/Koperasi/OfficerShell';
import { StatusPopup } from '@/Components/Koperasi/Popups';
import { useApi, rp, dfmt } from '@/lib/api';
import WeighingFormPage from './WeighingForm';

const cn = (...cls) => cls.filter(Boolean).join(' ');

function Progress({ value, green = false }) {
    return (
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
                className={cn('h-full rounded-full transition-all duration-300', green ? 'bg-emerald-600' : 'bg-primary')}
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

function Stat({ label, value, children, featured = false }) {
    return (
        <article className={cn(
            'flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md',
            featured ? 'border-primary bg-primary text-white' : ''
        )}>
            <p className={cn('text-xs uppercase tracking-wider', featured ? 'text-blue-100' : 'text-muted-foreground')}>
                {label}
            </p>
            <strong className="mt-2 text-2xl font-bold md:text-3xl">{value}</strong>
            <div className="mt-3">{children}</div>
        </article>
    );
}

const STATUS_STYLE = {
    menunggu: 'bg-amber-100 text-amber-800',
    selesai: 'bg-emerald-100 text-emerald-700',
    batal: 'bg-rose-100 text-rose-700',
};

// ─── 1. Dashboard Sub-page ────────────────────────────────────
function DashboardPage() {
    const { data, loading, error } = useApi('/pickups?per_page=10');
    const rows = data ?? [];
    const done = rows.filter(p => p.status === 'selesai').length;
    const gross = rows.reduce((s, p) => s + Number(p.total_gross ?? 0), 0);

    return (
        <div className="mx-auto max-w-5xl flex flex-col gap-6">
            <div className="grid gap-5 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Stat label="TOTAL SAMPAH TERKUMPUL" value={`${Number(gross).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`}>
                        <p className="text-xs font-semibold text-muted-foreground">Dari {rows.length} tiket penjemputan terakhir</p>
                    </Stat>
                </div>
                <Stat label="PENJEMPUAN SELESAI" value={`${done} / ${rows.length}`}>
                    <Progress value={rows.length ? (done / rows.length) * 100 : 0} />
                </Stat>
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="p-5 border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Aktivitas Terbaru</h2>
                </div>
                <div className="divide-y divide-border/60">
                    {loading && (
                        <div className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</div>
                    )}
                    {!loading && rows.length === 0 && (
                        <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                            {error ? 'Gagal memuat data.' : 'Belum ada penjemputan.'}
                        </div>
                    )}
                    {rows.map(p => (
                        <div key={p.id} className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors">
                            <span className={cn(
                                'flex size-10 shrink-0 items-center justify-center rounded-full',
                                p.status === 'selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-muted-foreground'
                            )}>
                                {p.status === 'selesai' ? <Check size={18} /> : <Clock3 size={18} />}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground">{p.member?.name ?? `Tiket #${p.id}`}</p>
                                <p className="text-xs text-muted-foreground">
                                    {p.location_type === 'jemput_rumah' ? 'Jemput ke rumah' : p.location_type === 'jemput_pasar' ? 'Jemput ke pasar' : 'Antar ke gudang'}
                                    {p.notes ? ` — ${p.notes}` : ''}
                                </p>
                            </div>
                            <time className="text-xs font-semibold text-muted-foreground">{dfmt(p.scheduled_at ?? p.created_at ?? null)}</time>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

// ─── 2. Pickup Sub-page ───────────────────────────────────────
function PickupPage() {
    // Default "semua": baris atas = prioritas belum diambil, selesai turun ke bawah.
    const [status, setStatus] = useState('semua');
    const [mineOnly, setMineOnly] = useState(false);
    const { user } = useAuth();
    // 'semua' bukan status di BE — jangan kirim param status (dulu bikin list selalu kosong).
    const statusQ = status === 'semua' ? '' : `status=${status}&`;
    const mineQ = mineOnly && user?.id ? `officer_id=${user.id}&` : '';
    const { data, loading, error, reload } = useApi(`/pickups?${statusQ}${mineQ}per_page=25`);
    // Prioritas: yang BELUM diambil selalu di atas; tiket selesai (sudah
    // ditimbang) otomatis turun ke bawah. Batal paling bawah.
    const priority = { menunggu: 0, proses: 1, selesai: 2, batal: 3 };
    const rows = [...(data ?? [])].sort((a, b) =>
        (priority[a.status] ?? 9) - (priority[b.status] ?? 9));

    // Step 2: klik aksi → buka tampilan timbangan untuk TIKET ini.
    // (Bug "minta jemput nyangkut": dulu kirim p.member → WeighingForm bikin
    // tiket baru dan tiket minta jemput asli tak pernah selesai.)
    const [weighingTicket, setWeighingTicket] = useState(null);

    if (weighingTicket) {
        return <WeighingFormPage initialPickup={weighingTicket} onBack={() => { setWeighingTicket(null); reload(); }} />;
    }

    return (
        <div className="mx-auto max-w-5xl flex flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground md:text-3xl">Daftar Penjemputan</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Tugas penjemputan sampah dari anggota koperasi.</p>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-primary shadow-xs">
                    <CalendarDays size={18} />
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Status Filter</p>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="bg-transparent text-xs font-bold text-foreground outline-none"
                        >
                            <option value="semua">Semua</option>
                            <option value="menunggu">Menunggu</option>
                            <option value="selesai">Selesai</option>
                            <option value="batal">Batal</option>
                        </select>
                    </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground shadow-xs">
                    <input type="checkbox" checked={mineOnly} onChange={e => setMineOnly(e.target.checked)} className="accent-primary" />
                    Hanya tugas saya
                </label>
            </div>

            <div className="flex flex-col gap-4">
                {loading && (
                    <div className="rounded-2xl border border-border/80 bg-card px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</div>
                )}
                {!loading && rows.length === 0 && (
                    <div className="rounded-2xl border border-border/80 bg-card px-6 py-8 text-center text-sm text-muted-foreground">
                        {error ? 'Gagal memuat data.' : 'Tidak ada tiket dengan status ini.'}
                    </div>
                )}
                {rows.map(p => (
                    <article key={p.id} className="flex flex-col justify-between gap-5 rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:flex-row sm:items-center">
                        <div className="flex gap-4">
                            <span className={cn(
                                'flex size-12 shrink-0 items-center justify-center rounded-xl',
                                p.status === 'selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary text-white'
                            )}>
                                <MapPin size={22} />
                            </span>
                            <div>
                                <h3 className="text-base font-bold text-foreground">{p.member?.name ?? `Tiket #${p.id}`}</h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {p.member?.member_code ? `${p.member.member_code} · ` : ''}
                                    Jadwal: {dfmt(p.scheduled_at)}
                                    {p.completed_at ? ` · Selesai: ${dfmt(p.completed_at)}` : ''}
                                </p>
                                {/* Alamat jemput mengikuti lokasi tiket (rumah/pasar). */}
                                {(p.location_type === 'jemput_rumah' || p.location_type === 'jemput_pasar') && (
                                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                                        {p.location_type === 'jemput_pasar' ? p.member?.address_pasar : p.member?.address_rumah}
                                    </p>
                                )}
                                <div className="mt-2.5 flex gap-2">
                                    <span className={cn('rounded-full px-3 py-0.5 text-xs font-semibold', STATUS_STYLE[p.status])}>
                                        {p.status}
                                    </span>
                                    <span className={cn(
                                        'rounded-full px-3 py-0.5 text-xs font-semibold',
                                        p.is_sorted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-primary'
                                    )}>
                                        {p.is_sorted ? 'Sudah Dipilah' : 'Belum Dipilah'}
                                    </span>
                                    {p.location_type && (
                                        <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-muted-foreground">
                                            {p.location_type === 'jemput_rumah' ? 'Jemput Rumah' : p.location_type === 'jemput_pasar' ? 'Jemput Pasar' : 'Gudang'}
                                        </span>
                                    )}
                                    {p.officer?.name && (
                                        <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                                            Petugas: {p.officer.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <div className="rounded-xl border border-border bg-slate-50/70 p-4">
                                <p className="mb-1 text-xs font-semibold text-muted-foreground">Total Timbang</p>
                                <strong className="text-lg font-bold text-primary">{Number(p.total_gross ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg</strong>
                                <p className="text-[11px] text-muted-foreground">Bersih anggota: {rp(p.total_net)}</p>
                            </div>
                            {p.member && p.status !== 'batal' && (
                                p.status === 'menunggu' ? (
                                    <button
                                        onClick={() => setWeighingTicket(p)}
                                        className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                                    >
                                        <Scale size={16} /> Timbang Sekarang
                                    </button>
                                ) : (
                                    // Sudah ditimbang: buka ulang untuk koreksi (jurnal lama otomatis diganti BE).
                                    <button
                                        onClick={() => setWeighingTicket(p)}
                                        className="flex h-11 items-center gap-2 rounded-xl border border-primary px-5 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white"
                                    >
                                        <Pencil size={16} /> Edit Timbangan
                                    </button>
                                )
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

// ─── 3. Report Sub-page ───────────────────────────────────────
// ponytail: petugas tak punya akses /reports — rekap dihitung dari /pickups.
function ReportPage({ showStatus }) {
    const { data, loading, error } = useApi('/pickups?status=selesai&per_page=50');
    const rows = data ?? [];
    const totalKg = rows.reduce((s, p) => s + Number(p.total_gross ?? 0), 0);
    const totalNet = rows.reduce((s, p) => s + Number(p.total_net ?? 0), 0);
    const totalFee = rows.reduce((s, p) => s + Number(p.total_fee ?? 0), 0);

    const download = () => {
        const lines = [
            'Laporan Penjemputan Selesai',
            `Total berat: ${totalKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`,
            `Total bersih anggota: ${rp(totalNet)}`,
            `Total fee koperasi: ${rp(totalFee)}`,
            `Jumlah tiket: ${rows.length}`,
            '',
            ...rows.map(p => `#${p.id} ${p.member?.name ?? '-'} — ${Number(p.total_gross ?? 0)} kg / ${rp(p.total_net)}`),
        ];
        const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
        const a = Object.assign(document.createElement('a'), { href: url, download: 'laporan-penjemputan.txt' });
        a.click();
        URL.revokeObjectURL(url);
        showStatus('Laporan Berhasil Didownload', 'Rekap penjemputan selesai telah tersimpan di unduhan.');
    };

    return (
        <div className="mx-auto max-w-5xl flex flex-col gap-6">
            <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground md:text-3xl">Laporan Penjemputan</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Rekapitulasi penjemputan berstatus selesai (50 terakhir).</p>
                </div>
                <button
                    onClick={download}
                    disabled={loading || rows.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 transition-all disabled:opacity-50"
                >
                    <ChevronRight size={14} /> Unduh Rekap
                </button>
            </section>

            <div className="grid gap-5 md:grid-cols-3">
                <Stat featured label="Total Berat" value={`${totalKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`}>
                    <p className="text-xs text-blue-200">{rows.length} tiket selesai</p>
                </Stat>
                <Stat label="Bersih Anggota" value={rp(totalNet)}>
                    <p className="text-xs font-semibold text-muted-foreground">Total dikreditkan ke wallet anggota</p>
                </Stat>
                <Stat label="Fee Koperasi" value={rp(totalFee)}>
                    <Progress value={totalKg ? Math.min(100, (totalFee / Math.max(1, totalKg)) * 100) : 0} green />
                </Stat>
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="p-5 border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Rincian Penjemputan Selesai</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Tiket</th>
                                <th className="px-6 py-3.5">Anggota</th>
                                <th className="px-6 py-3.5">Selesai</th>
                                <th className="px-6 py-3.5">Berat (kg)</th>
                                <th className="px-6 py-3.5">Bersih Anggota</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>
                            )}
                            {!loading && rows.length === 0 && (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">{error ? 'Gagal memuat data.' : 'Belum ada penjemputan selesai.'}</td></tr>
                            )}
                            {rows.map(p => (
                                <tr key={p.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">#{p.id}</td>
                                    <td className="px-6 py-4 font-semibold text-foreground">{p.member?.name ?? '-'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{dfmt(p.completed_at)}</td>
                                    <td className="px-6 py-4 font-bold text-foreground">{Number(p.total_gross ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })}</td>
                                    <td className="px-6 py-4 font-bold text-primary">{rp(p.total_net)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t-2 border-primary bg-[#eef3fc] px-6 py-4">
                    <strong className="text-sm font-bold text-foreground">Total Keseluruhan</strong>
                    <strong className="text-xl font-extrabold text-primary">{totalKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg</strong>
                </div>
            </section>
        </div>
    );
}

// ─── Router Component ─────────────────────────────────────────
function OfficerPages({ page, showStatus }) {
    if (page === 'jemput-sampah') return <PickupPage />;
    if (page === 'laporan') return <ReportPage showStatus={showStatus} />;
    return <DashboardPage />;
}

const officerPageTitles = {
    'dashboard': 'Dashboard Petugas',
    'jemput-sampah': 'Jemput Sampah',
    'laporan': 'Laporan Penjemputan',
};

export default function PetugasIndex() {
    const { user, ready } = useAuth();
    const [page, setPage] = useState('dashboard');
    const [status, setStatus] = useState('');

    if (ready && !user) return <Navigate to="/" replace />;
    if (!ready) return null;

    return (
        <>
            <Head title={officerPageTitles[page] || 'Dashboard Petugas'} />
            <OfficerShell currentPage={page} setPage={setPage}>
                <OfficerPages page={page} showStatus={setStatus} />
            </OfficerShell>
            <StatusPopup open={Boolean(status)} title={status} onClose={() => setStatus('')} />
        </>
    );
}

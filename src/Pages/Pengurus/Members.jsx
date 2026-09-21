// UI Manajemen Anggota — terhubung API /members (sprint: wiring #7/#8/#18 +
// soft delete #3). Ploting petugas per baris anggota/alamat: anggota dengan
// 2 tempat muncul 2 baris dengan officer masing-masing (kontrak MemberResource).
import { useState } from 'react';
import {
    ArchiveRestore, Banknote, CheckCircle2, Eye, MapPin, Phone, Search,
    Trash2, UserPlus, UserRound, Users, X,
} from 'lucide-react';
import { PageHeader, StatCard } from '@/Components/Koperasi/ManagerUI';
import { ConfirmPopup, Modal } from '@/Components/Koperasi/Popups';
import { api, useApi, rp, dfmt } from '@/lib/api';
import { usePopup } from './Index';

const cn = (...cls) => cls.filter(Boolean).join(' ');

const STATUS_BADGE = {
    aktif: 'bg-emerald-100 text-emerald-700',
    nonaktif: 'bg-rose-100 text-rose-700',
    suspend: 'bg-amber-100 text-amber-800',
};

const initialOf = (name = '?') =>
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

// ─── Modal detail profil anggota ─────────────────────────────
function MemberDetailModal({ member, onClose }) {
    if (!member) return null;
    return (
        <Modal open onClose={onClose} size="lg">
            <div className="flex items-center justify-between px-6 py-4 bg-accent/60 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <UserRound size={20} />
                    <span>Detail Anggota</span>
                </h2>
                <button type="button" onClick={onClose}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors">
                    <X size={18} />
                </button>
            </div>
            <div className="flex flex-col gap-5 p-6 bg-card">
                <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-primary">
                        {initialOf(member.name)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">{member.name}</h3>
                        <p className="font-mono text-xs font-semibold text-muted-foreground">{member.member_code}</p>
                    </div>
                    <span className={cn('ml-auto rounded-full px-3 py-0.5 text-xs font-semibold', STATUS_BADGE[member.status] ?? 'bg-slate-100 text-slate-600')}>
                        ● {member.status}
                    </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Alamat</p>
                        <p className="mt-1 flex items-start gap-1.5 text-xs font-medium text-foreground"><MapPin size={13} className="mt-0.5 shrink-0 text-primary" />{member.address ?? '-'}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">No. Telepon</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-foreground"><Phone size={13} className="text-primary" />{member.phone ?? '-'}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tanggal Bergabung</p>
                        <p className="mt-1 text-xs font-medium text-foreground">{dfmt(member.join_date)}</p>
                    </div>
                    {/* #18: hasil auto-plot petugas saat anggota dibuat */}
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ploting Petugas</p>
                        <p className="mt-1 text-xs font-bold text-primary">
                            {member.officer?.name ?? 'Belum ditugaskan'}
                        </p>
                    </div>
                    {(member.categories?.length > 0) && (
                        <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5 sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kategori Anggota</p>
                            <div className="mt-1.5 flex gap-2">
                                {member.categories.map((c, i) => (
                                    <span key={i} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-primary">
                                        {typeof c === 'string' ? c : c?.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={onClose}
                    className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90">
                    Tutup
                </button>
            </div>
        </Modal>
    );
}

export default function MembersPage() {
    const { openForm, showStatus } = usePopup();
    const [tab, setTab] = useState('aktif');            // aktif | terhapus (#3)
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('semua');
    const [officerId, setOfficerId] = useState('');     // filter ploting per petugas (#7)
    const [page, setPage] = useState(1);
    const [detail, setDetail] = useState(null);
    const [confirmDel, setConfirmDel] = useState(null); // member yang menunggu konfirmasi hapus
    const [confirmRestore, setConfirmRestore] = useState(null);
    const [confirmPay, setConfirmPay] = useState(null); // #15: bayar manual paket rutin

    const trashedQ = tab === 'terhapus' ? '&trashed=1' : '';
    const statusQ = status === 'semua' ? '' : `&status=${status}`;
    const officerQ = officerId ? `&officer_id=${officerId}` : '';
    const { data, meta, loading, error, reload } = useApi(`/members?page=${page}&per_page=15${trashedQ}${statusQ}${officerQ}`);

    // Stat kartu dari agregat meta.total per status (bukan hardcode lagi).
    const { meta: mTotal } = useApi('/members?per_page=1');
    const { meta: mAktif } = useApi('/members?status=aktif&per_page=1');
    const { meta: mNonaktif } = useApi('/members?status=nonaktif&per_page=1');
    // Daftar petugas untuk filter ploting (#7: dropdown /users?role=petugas).
    const { data: officers } = useApi('/users?role=petugas&per_page=100');

    const resetPage = () => setPage(1);

    const rows = (data ?? []).filter(m =>
        (m.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (m.member_code ?? '').toLowerCase().includes(search.toLowerCase())
    );

    // #3: soft delete — arsipkan anggota (DELETE 200 + ConfirmPopup), bukan hapus permanen.
    const archiveMember = async () => {
        if (!confirmDel) return;
        try {
            const res = await api(`/members/${confirmDel.id}`, { method: 'DELETE' });
            setConfirmDel(null);
            showStatus(res?.message || 'Anggota Diarsipkan — lihat tab Terhapus');
            reload();
        } catch (err) {
            setConfirmDel(null);
            showStatus(`Gagal Mengarsipkan: ${err.message || 'coba lagi'}`);
        }
    };

    const restoreMember = async () => {
        if (!confirmRestore) return;
        try {
            const res = await api(`/members/${confirmRestore.id}/restore`, { method: 'PATCH' });
            setConfirmRestore(null);
            showStatus(res?.message || 'Anggota Dipulihkan — kembali ke daftar utama');
            reload();
        } catch (err) {
            setConfirmRestore(null);
            showStatus(`Gagal Memulihkan: ${err.message || 'coba lagi'}`);
        }
    };

    // #15: bayar manual paket rutin Rp50.000/kategori — satu-satunya pembayaran yang
    // diterima saat anggota nonaktif, sekaligus mengaktifkan kembali akunnya.
    // Ditolak backend jika bulan ini sudah lunas (pesan ditampilkan apa adanya).
    const payManual = async () => {
        if (!confirmPay) return;
        try {
            const n = Math.max(1, confirmPay.categories?.length ?? 1);
            const res = await api('/savings/pay', {
                method: 'POST',
                body: {
                    member_id: confirmPay.id,
                    label: 'WAJIB',
                    jumlah: 50000 * n,
                    metode: 'tunai',
                },
            });
            setConfirmPay(null);
            showStatus(res?.message || `Pembayaran manual ${confirmPay.name} tercatat — akun aktif kembali`);
            reload();
        } catch (err) {
            setConfirmPay(null);
            const msg = err.errors ? Object.values(err.errors)[0]?.[0] : (err.message || 'pembayaran gagal');
            showStatus(`Gagal Bayar Manual: ${msg}`);
        }
    };

    const lastPage = meta?.last_page ?? 1;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Manajemen Anggota"
                desc="Kelola data keanggotaan koperasi: pendaftaran, status, ploting petugas, dan arsip."
                action={
                    <button
                        onClick={() => openForm('member')}
                        className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                    >
                        <UserPlus size={16} />
                        <span>Daftarkan Anggota</span>
                    </button>
                }
            />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={Users} label="Total Anggota" value={`${mTotal?.total ?? '—'} Orang`} note="Semua status" tone="blue" />
                <StatCard icon={CheckCircle2} label="Anggota Aktif" value={`${mAktif?.total ?? '—'} Orang`} note="Dapat menyetor sampah" tone="green" />
                <StatCard icon={UserRound} label="Non-aktif" value={`${mNonaktif?.total ?? '—'} Orang`} note="Tunggakan hold 3 bulan" tone="red" />
                <StatCard icon={ArchiveRestore} label="Terarsip" value={tab === 'terhapus' ? `${meta?.total ?? 0} Orang` : 'Lihat tab'} note="Soft delete — dapat dipulihkan" tone="blue" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex flex-col justify-between gap-4 p-5 border-b border-border/60 lg:flex-row lg:items-center">
                    {/* #3: tab Aktif / Terhapus */}
                    <div className="flex items-center gap-2">
                        <h2 className="mr-2 text-lg font-bold text-foreground">Daftar Anggota</h2>
                        {['aktif', 'terhapus'].map(t => (
                            <button
                                key={t}
                                onClick={() => { setTab(t); resetPage(); }}
                                className={cn(
                                    'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all',
                                    tab === t ? 'bg-primary text-white shadow-sm' : 'bg-secondary text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {t === 'aktif' ? 'Aktif' : 'Terhapus'}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 sm:w-56">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari nama / kode anggota..."
                                className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs focus:bg-white"
                            />
                        </div>
                        {tab === 'aktif' && (
                            <>
                                <select
                                    value={status}
                                    onChange={e => { setStatus(e.target.value); resetPage(); }}
                                    aria-label="Filter status"
                                    className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground focus:bg-white"
                                >
                                    <option value="semua">Semua Status</option>
                                    <option value="aktif">Aktif</option>
                                    <option value="nonaktif">Non-aktif</option>
                                    <option value="suspend">Suspend</option>
                                </select>
                                {/* #7/#8: filter ploting per petugas */}
                                <select
                                    value={officerId}
                                    onChange={e => { setOfficerId(e.target.value); resetPage(); }}
                                    aria-label="Filter petugas plotting"
                                    className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground focus:bg-white"
                                >
                                    <option value="">Semua Petugas</option>
                                    {(officers ?? []).map(o => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Kode & Nama</th>
                                <th className="px-6 py-3.5">Alamat</th>
                                <th className="px-6 py-3.5">Bergabung</th>
                                <th className="px-6 py-3.5">Ploting Petugas</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">Memuat data…</td></tr>
                            )}
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                                        {error ? 'Gagal memuat data.' : tab === 'terhapus' ? 'Tidak ada anggota terarsip.' : 'Tidak ada anggota yang cocok dengan pencarian.'}
                                    </td>
                                </tr>
                            )}
                            {rows.map(m => (
                                <tr key={m.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-primary">
                                                {initialOf(m.name)}
                                            </div>
                                            <div>
                                                <span className="block font-semibold text-foreground">{m.name}</span>
                                                <span className="block font-mono text-[11px] font-bold text-muted-foreground">{m.member_code}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground max-w-[220px] truncate" title={m.address}>{m.address ?? '-'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{dfmt(m.join_date)}</td>
                                    <td className="px-6 py-4">
                                        {/* #18: auto-plot saat pendaftaran; null = belum ditugaskan */}
                                        {m.officer?.name
                                            ? <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">{m.officer.name}</span>
                                            : <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-muted-foreground">Belum ditugaskan</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_BADGE[m.status] ?? 'bg-slate-100 text-slate-600')}>
                                            ● {m.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setDetail(m)}
                                                aria-label={`Detail ${m.name}`}
                                                className="text-muted-foreground hover:text-primary p-1"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {/* #15: anggota nonaktif — satu-satunya jalan pulih adalah
                                                bayar manual paket rutin (POST /savings/pay role pengurus) */}
                                            {m.status === 'nonaktif' && tab === 'aktif' && (
                                                <button
                                                    onClick={() => setConfirmPay(m)}
                                                    title="Bayar tagihan manual Rp50.000/kategori — mengaktifkan kembali"
                                                    className="flex h-8 items-center gap-1.5 rounded-xl bg-emerald-700 px-2.5 text-[11px] font-semibold text-white hover:bg-emerald-800"
                                                >
                                                    <Banknote size={14} /> Bayar Manual
                                                </button>
                                            )}
                                            {tab === 'aktif' ? (
                                                <button
                                                    onClick={() => setConfirmDel(m)}
                                                    aria-label={`Arsipkan ${m.name}`}
                                                    title="Arsipkan (soft delete)"
                                                    className="text-muted-foreground hover:text-destructive p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmRestore(m)}
                                                    aria-label={`Pulihkan ${m.name}`}
                                                    title="Pulihkan anggota"
                                                    className="text-muted-foreground hover:text-emerald-600 p-1"
                                                >
                                                    <ArchiveRestore size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>
                        Menampilkan {rows.length} dari {meta?.total ?? 0} data
                        {tab === 'terhapus' ? ' (terarsip)' : ''}
                    </span>
                    {/* Paginasi fungsional (dulu dummy statis) */}
                    <div className="mt-2 flex items-center gap-2 sm:mt-0">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={(meta?.current_page ?? 1) <= 1}
                            className="h-8 rounded-lg border border-border bg-card px-3 font-semibold text-foreground hover:bg-secondary disabled:opacity-40"
                        >
                            ← Sebelumnya
                        </button>
                        <span className="font-semibold">Hal. {meta?.current_page ?? 1} / {lastPage}</span>
                        <button
                            onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                            disabled={(meta?.current_page ?? 1) >= lastPage}
                            className="h-8 rounded-lg border border-border bg-card px-3 font-semibold text-foreground hover:bg-secondary disabled:opacity-40"
                        >
                            Berikutnya →
                        </button>
                    </div>
                </div>
            </section>

            <MemberDetailModal member={detail} onClose={() => setDetail(null)} />

            <ConfirmPopup
                open={Boolean(confirmDel)}
                title="Arsipkan Anggota?"
                description={`${confirmDel?.name} (${confirmDel?.member_code}) dipindahkan ke tab Terhapus — riwayat transaksinya tetap aman dan bisa dipulihkan.`}
                actionLabel="Ya, Arsipkan"
                tone="destructive"
                onCancel={() => setConfirmDel(null)}
                onConfirm={archiveMember}
            />
            <ConfirmPopup
                open={Boolean(confirmRestore)}
                title="Pulihkan Anggota?"
                description={`${confirmRestore?.name} (${confirmRestore?.member_code}) dikembalikan ke daftar anggota utama dengan status sebelumnya.`}
                actionLabel="Ya, Pulihkan"
                onCancel={() => setConfirmRestore(null)}
                onConfirm={restoreMember}
            />
            <ConfirmPopup
                open={Boolean(confirmPay)}
                title="Bayar Tagihan Manual?"
                description={`${confirmPay?.name} — paket rutin ${rp(50000 * Math.max(1, confirmPay?.categories?.length ?? 1))} (${Math.max(1, confirmPay?.categories?.length ?? 1)} kategori), tunai. Pembayaran ini mengaktifkan kembali anggota non-aktif dan ditolak jika bulan ini sudah lunas.`}
                actionLabel="Ya, Catat Pembayaran"
                onCancel={() => setConfirmPay(null)}
                onConfirm={payManual}
            />
        </div>
    );
}

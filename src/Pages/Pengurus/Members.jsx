// FE-2.2 — UI Manajemen Anggota (CRUD): filter status, live search,
// pagination, modal detail. Gaya mengikuti halaman Pengurus existing.
import { useState } from 'react';
import {
    CheckCircle2, Eye, Filter, MapPin, Phone,
    Search, UserPlus, UserRound, Users, X,
} from 'lucide-react';
import { PageHeader, StatCard, Pager } from '@/Components/Koperasi/ManagerUI';
import { Modal } from '@/Components/Koperasi/Popups';
import { usePopup } from './Index';

const cn = (...cls) => cls.filter(Boolean).join(' ');

// ponytail: mock data lokal sampai endpoint /api/v1/members tersedia.
const MEMBERS = [
    { code: 'MBR-202608-0042', name: 'Bambang Susanto', initial: 'BS', address: 'Dusun Makmur RT 04/RW 02, Kel. Melati', phone: '0812-3456-7890', join: '12 Agu 2026', status: 'aktif', savings: 'Rp 6.800.000' },
    { code: 'MBR-202608-0043', name: 'Siti Aminah', initial: 'SA', address: 'Jl. Kenanga Asri Blok B No. 4, Kel. Melati', phone: '0813-2211-9087', join: '11 Agu 2026', status: 'aktif', savings: 'Rp 3.200.000' },
    { code: 'MBR-202608-0044', name: 'Ahmad Hidayat', initial: 'AH', address: 'Gang Kelinci No. 8, RT 01/RW 02, Kel. Melati', phone: '0857-8899-1020', join: '10 Agu 2026', status: 'aktif', savings: 'Rp 9.850.000' },
    { code: 'MBR-202607-0039', name: 'Ratna Permata', initial: 'RP', address: 'Jl. Mawar Merah No. 12, RT 03/RW 01', phone: '0821-4455-6677', join: '28 Jul 2026', status: 'suspend', savings: 'Rp 1.190.000' },
    { code: 'MBR-202607-0040', name: 'Suryono', initial: 'SY', address: 'Jl. Merdeka No. 45', phone: '0812-9988-7766', join: '30 Jul 2026', status: 'aktif', savings: 'Rp 2.070.000' },
    { code: 'MBR-202606-0031', name: 'Lilik Suradi', initial: 'LS', address: 'Komp. Griya Hijau Blok B2', phone: '0856-1122-3344', join: '15 Jun 2026', status: 'aktif', savings: 'Rp 4.500.000' },
];

// ─── Modal detail profil anggota ─────────────────────────────
function MemberDetailModal({ member, onClose }) {
    if (!member) return null;
    return (
        // Grid 2 kolom kartu profil → lg.
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
                        {member.initial}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">{member.name}</h3>
                        <p className="font-mono text-xs font-semibold text-muted-foreground">{member.code}</p>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Alamat</p>
                        <p className="mt-1 flex items-start gap-1.5 text-xs font-medium text-foreground"><MapPin size={13} className="mt-0.5 shrink-0 text-primary" />{member.address}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">No. Telepon</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-foreground"><Phone size={13} className="text-primary" />{member.phone}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tanggal Bergabung</p>
                        <p className="mt-1 text-xs font-medium text-foreground">{member.join}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Simpanan</p>
                        <p className="mt-1 text-sm font-bold text-primary">{member.savings}</p>
                    </div>
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
    const { openForm } = usePopup();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('semua');
    const [detail, setDetail] = useState(null);

    const filtered = MEMBERS.filter(m =>
        (status === 'semua' || m.status === status) &&
        (m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase()))
    );

    const statusBadge = (s) => cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        s === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
    );

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Manajemen Anggota"
                desc="Kelola data keanggotaan koperasi: pendaftaran, status, dan profil anggota."
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

            <div className="grid gap-5 md:grid-cols-3">
                <StatCard icon={Users} label="Total Anggota" value="1,284 Orang" note="↗ +18 bulan ini" tone="blue" />
                <StatCard icon={CheckCircle2} label="Anggota Aktif" value="1,240 Orang" note="96.6% dari total" tone="green" />
                <StatCard icon={UserRound} label="Anggota Suspend" value="44 Orang" note="⚠ Perlu peninjauan" tone="red" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Daftar Anggota Koperasi</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Cari nama / kode anggota..."
                                className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs focus:bg-white"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            aria-label="Filter status"
                            className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground focus:bg-white"
                        >
                            <option value="semua">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="suspend">Suspend</option>
                        </select>
                        <button className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-secondary">
                            <Filter size={15} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Kode & Nama</th>
                                <th className="px-6 py-3.5">Alamat</th>
                                <th className="px-6 py-3.5">Bergabung</th>
                                <th className="px-6 py-3.5">Total Simpanan</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {filtered.map((m, i) => (
                                <tr key={m.code} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-primary">
                                                {m.initial}
                                            </div>
                                            <div>
                                                <span className="block font-semibold text-foreground">{m.name}</span>
                                                <span className="block font-mono text-[11px] font-bold text-muted-foreground">{m.code}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground max-w-[220px] truncate">{m.address}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{m.join}</td>
                                    <td className="px-6 py-4 font-bold text-primary">{m.savings}</td>
                                    <td className="px-6 py-4">
                                        <span className={statusBadge(m.status)}>
                                            ● {m.status === 'aktif' ? 'Aktif' : 'Suspend'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setDetail(m)}
                                            aria-label={`Detail ${m.name}`}
                                            className="text-muted-foreground hover:text-primary p-1"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                                        Tidak ada anggota yang cocok dengan pencarian.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>Menampilkan {filtered.length} dari {MEMBERS.length} data</span>
                    <Pager total={3} />
                </div>
            </section>

            <MemberDetailModal member={detail} onClose={() => setDetail(null)} />
        </div>
    );
}

// Monitoring pengambilan sampah oleh pengurus: status pickup per anggota
// + riwayat transaksi sampah yang diambil petugas dan nilai yang diterima anggota.
import { useState } from 'react';
import { CheckCircle2, Clock3, MapPin, Search, Truck, X } from 'lucide-react';
import { PageHeader, StatCard, Pager } from '@/Components/Koperasi/ManagerUI';
import { Modal } from '@/Components/Koperasi/Popups';
import { api, useApi, rp, dfmt } from '@/lib/api';

const cn = (...cls) => cls.filter(Boolean).join(' ');

const STATUS_STYLE = {
    menunggu: 'bg-amber-100 text-amber-800',
    selesai: 'bg-emerald-100 text-emerald-700',
    batal: 'bg-rose-100 text-rose-700',
};

function HistoryModal({ member, onClose }) {
    const { data, loading } = useApi(member ? `/pickups?member_id=${member.id}&status=selesai&per_page=50` : null);
    const rows = data ?? [];
    const totalNet = rows.reduce((s, p) => s + Number(p.total_net ?? 0), 0);

    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between bg-accent/60 px-6 py-4 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <Truck size={20} />
                    <span>Riwayat Ambil Sampah — {member.name}</span>
                </h2>
                <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-6 bg-card">
                <div className="mb-4 rounded-xl bg-[#eef3fc] px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Diterima Anggota (bersih)</span>
                    <strong className="text-lg font-extrabold text-primary">{rp(totalNet)}</strong>
                </div>
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar">
                    <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">Lokasi</th>
                                <th className="px-4 py-3">Petugas</th>
                                <th className="px-4 py-3">Kotor</th>
                                <th className="px-4 py-3">Diterima</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat riwayat…</td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada pengambilan selesai.</td></tr>}
                            {rows.map(p => (
                                <tr key={p.id} className="hover:bg-secondary/40">
                                    <td className="px-4 py-3 text-muted-foreground">{dfmt(p.completed_at ?? p.scheduled_at)}</td>
                                    <td className="px-4 py-3">{p.location_type === 'jemput_rumah' ? 'Jemput rumah' : 'Gudang'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{p.officer?.name ?? '-'}</td>
                                    <td className="px-4 py-3 font-semibold">{rp(p.total_gross)}</td>
                                    <td className="px-4 py-3 font-bold text-primary">{rp(p.total_net)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button onClick={onClose} className="mt-5 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white shadow-sm hover:bg-primary/90">Tutup</button>
            </div>
        </Modal>
    );
}

export default function PickupMonitorPage() {
    const [status, setStatus] = useState('menunggu');
    const [search, setSearch] = useState('');
    const { data, meta, loading, error, reload } = useApi(`/pickups?status=${status}&per_page=25`);
    const [detail, setDetail] = useState(null);

    const rows = (data ?? []).filter(p =>
        (p.member?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.member?.member_code ?? '').toLowerCase().includes(search.toLowerCase())
    );
    const doneCount = rows.filter(p => p.status === 'selesai').length;
    const pendingCount = rows.filter(p => p.status === 'menunggu').length;
    const totalNet = rows.reduce((s, p) => s + Number(p.total_net ?? 0), 0);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Monitoring Pengambilan Sampah"
                desc="Pantau pickup per anggota (sudah/belum dijemput) dan riwayat transaksi sampah yang diambil petugas."
                action={
                    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-primary shadow-xs">
                        <select value={status} onChange={e => { setStatus(e.target.value); }} aria-label="Filter status"
                            className="bg-transparent text-xs font-bold text-foreground outline-none">
                            <option value="menunggu">Menunggu</option>
                            <option value="selesai">Selesai</option>
                            <option value="batal">Batal</option>
                        </select>
                    </div>
                }
            />

            <div className="grid gap-5 md:grid-cols-3">
                <StatCard icon={Clock3} label="Menunggu Pickup" value={`${pendingCount} tiket`} note="Belum dijemput petugas" tone="red" />
                <StatCard icon={CheckCircle2} label="Sudah Selesai" value={`${doneCount} tiket`} note="Halaman aktif" tone="green" />
                <StatCard icon={Truck} label="Diterima Anggota (bersih)" value={rp(totalNet)} note="Dari tiket tampil" tone="blue" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Daftar Tiket Penjemputan</h2>
                    <div className="relative w-full sm:w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama / kode anggota…"
                            className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs focus:bg-white" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Anggota</th>
                                <th className="px-6 py-3.5">Alamat</th>
                                <th className="px-6 py-3.5">Jadwal</th>
                                <th className="px-6 py-3.5">Lokasi</th>
                                <th className="px-6 py-3.5">Petugas</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-muted-foreground">{error ? 'Gagal memuat data.' : 'Tidak ada tiket dengan status ini.'}</td></tr>}
                            {rows.map(p => (
                                <tr key={p.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="block font-semibold text-foreground">{p.member?.name ?? `Tiket #${p.id}`}</span>
                                        <span className="block font-mono text-[11px] font-bold text-muted-foreground">{p.member?.member_code}</span>
                                    </td>
                                    <td className="px-6 py-4 max-w-[220px] truncate text-muted-foreground" title={p.member?.address}>
                                        <span className="inline-flex items-center gap-1"><MapPin size={13} className="shrink-0 text-primary" />{p.member?.address ?? '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{dfmt(p.scheduled_at)}</td>
                                    <td className="px-6 py-4">{p.location_type === 'jemput_rumah' ? 'Jemput Rumah' : 'Gudang'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{p.officer?.name ?? '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn('rounded-full px-3 py-0.5 text-xs font-semibold', STATUS_STYLE[p.status])}>{p.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setDetail(p.member)} disabled={!p.member}
                                            className="h-9 rounded-xl border border-primary px-4 text-xs font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-40">
                                            Riwayat Anggota
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>Menampilkan {rows.length} dari {meta?.total ?? 0} tiket</span>
                    <Pager total={Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.per_page ?? 25)))} />
                </div>
            </section>

            {detail && <HistoryModal member={detail} onClose={() => { setDetail(null); reload(); }} />}
        </div>
    );
}

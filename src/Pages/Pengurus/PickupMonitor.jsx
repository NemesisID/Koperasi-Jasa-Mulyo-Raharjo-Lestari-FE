// Monitoring pengambilan sampah oleh pengurus: status pickup per anggota
// + riwayat transaksi sampah yang diambil petugas dan nilai yang diterima anggota.
import { useState } from 'react';
import { CheckCircle2, Clock3, MapPin, Search, Truck, X, Camera, Package } from 'lucide-react';
import Co2Badge from '@/Components/Koperasi/Co2Badge';
import { PageHeader, StatCard, Pager } from '@/Components/Koperasi/ManagerUI';
import { Modal, ConfirmPopup } from '@/Components/Koperasi/Popups';
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
        // Tabel 5 kolom (min-w 520px) + padding → butuh lg (672px).
        <Modal open onClose={onClose} size="lg">
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
                                <th className="px-4 py-3">Nilai Setoran</th>
                                <th className="px-4 py-3">Diterima</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat riwayat…</td></tr>}
                            {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada pengambilan selesai.</td></tr>}
                            {rows.map(p => (
                                <tr key={p.id} className="hover:bg-secondary/40">
                                    <td className="px-4 py-3 text-muted-foreground">{dfmt(p.completed_at ?? p.scheduled_at)}</td>
                                    <td className="px-4 py-3">{p.location_type === 'jemput_rumah' ? 'Jemput rumah' : p.location_type === 'jemput_pasar' ? 'Jemput pasar' : 'Gudang'}</td>
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

// #11 — Modal detail satu tiket: rincian jenis sampah, berat, dan gambar bukti petugas.
function PickupDetailModal({ pickupId, onClose }) {
    const { data, loading, error } = useApi(pickupId ? `/pickups/${pickupId}` : null);
    const p = data;
    const items = p?.items ?? [];
    const totalKg = items.reduce((s, it) => s + Number(it.weight_kg ?? 0), 0);

    return (
        <Modal open onClose={onClose} size="lg">
            <div className="flex items-center justify-between bg-accent/60 px-6 py-4 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <Package size={20} />
                    <span>Detail Pengambilan Sampah — Tiket #{pickupId}</span>
                </h2>
                <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-5 p-6 bg-card">
                {loading && <p className="py-8 text-center text-sm text-muted-foreground">Memuat detail…</p>}
                {!loading && error && <p className="py-8 text-center text-sm text-destructive">Gagal memuat detail tiket.</p>}
                {!loading && p && (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Anggota</p>
                                <p className="mt-1 text-sm font-bold text-foreground">{p.member?.name ?? '-'}</p>
                                <p className="font-mono text-[11px] font-semibold text-muted-foreground">{p.member?.member_code}</p>
                            </div>
                            <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Petugas</p>
                                <p className="mt-1 text-sm font-bold text-foreground">{p.officer?.name ?? 'Belum ditugaskan'}</p>
                                <p className="text-[11px] font-semibold text-muted-foreground">
                                    Selesai: {p.completed_at ? dfmt(p.completed_at) : '—'} · Status: {p.status}
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-border/60">
                            <table className="w-full min-w-[420px] text-left text-sm">
                                <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                                    <tr>
                                        <th className="px-4 py-2.5">Jenis Sampah</th>
                                        <th className="px-4 py-2.5 text-right">Berat / Jumlah</th>
                                        <th className="px-4 py-2.5 text-right">Nilai</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {items.length === 0 && (
                                        <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">Belum ada rincian timbangan (tiket belum ditimbang).</td></tr>
                                    )}
                                    {items.map(it => (
                                        <tr key={it.id}>
                                            <td className="px-4 py-2.5 font-semibold text-foreground">{it.category?.name ?? '-'}</td>
                                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                                                {it.weight_kg != null ? `${it.weight_kg} kg` : it.unit_count != null ? `${it.unit_count} ${it.category?.unit ?? 'unit'}` : '-'}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-bold text-primary">{rp(it.total_value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                {items.length > 0 && (
                                    <tfoot className="bg-slate-50/70">
                                        <tr>
                                            <td className="px-4 py-2.5 text-xs font-bold uppercase text-muted-foreground">Total ({totalKg.toLocaleString('id-ID')} kg)</td>
                                            <td />
                                            <td className="px-4 py-2.5 text-right font-extrabold text-primary">{rp(p.total_gross)}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        <div className="flex items-start gap-4">
                            {p.photo_url ? (
                                <a href={p.photo_url} target="_blank" rel="noopener noreferrer" className="group relative shrink-0">
                                    <img src={p.photo_url} alt="Bukti foto penjemputan" className="h-28 w-40 rounded-xl border border-border/60 object-cover" />
                                    <span className="absolute bottom-1.5 right-1.5 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">Perbesar</span>
                                </a>
                            ) : (
                                <div className="flex h-28 w-40 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground">
                                    <Camera size={22} />
                                    <span className="text-[10px] font-semibold">Tidak ada foto bukti</span>
                                </div>
                            )}
                            <div className="min-w-0 text-xs">
                                <p className="font-bold uppercase tracking-wider text-muted-foreground">Foto Bukti Petugas</p>
                                <p className="mt-1 font-medium text-foreground">
                                    {p.location_type === 'jemput_rumah' ? 'Dijemput di rumah' : p.location_type === 'jemput_pasar' ? 'Dijemput di pasar' : 'Diantar ke gudang'}
                                    {' · '}{p.is_sorted ? 'Sampah terpilah' : 'Belum terpilah'}
                                </p>
                                {p.latitude != null && (
                                    <p className="mt-1 text-muted-foreground">Geotag: {Number(p.latitude).toFixed(5)}, {Number(p.longitude).toFixed(5)}</p>
                                )}
                                {p.notes && <p className="mt-1 text-muted-foreground">Catatan: {p.notes}</p>}
                                <p className="mt-1 font-semibold text-primary">Diterima anggota: {rp(p.total_net)}</p>
                                {/* #21: badge tier CO2 dari total berat sampah tiket ini */}
                                {totalKg > 0 && <div className="mt-2"><Co2Badge totalKg={totalKg} /></div>}
                            </div>
                        </div>
                    </>
                )}
                <button onClick={onClose} className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white shadow-sm hover:bg-primary/90">Tutup</button>
            </div>
        </Modal>
    );
}

export default function PickupMonitorPage() {
    const [status, setStatus] = useState('menunggu');
    const [search, setSearch] = useState('');
    const { data, meta, loading, error, reload } = useApi(`/pickups?status=${status}&per_page=25`);
    // #16: statistik dari endpoint agregat — satu sumber kebenaran yang sama dengan
    // dashboard petugas. Hitung client-side dari baris terfilter membuat "Sudah Selesai"
    // selalu 0 saat filter aktif (akar bug sinkronisasi pengurus ↔ petugas).
    const { data: stats } = useApi('/pickups/stats');
    // Daftar petugas untuk plotting penugasan per tiket.
    const { data: officers } = useApi('/users?role=petugas&per_page=100');
    const [detail, setDetail] = useState(null);
    const [detailId, setDetailId] = useState(null); // #11: tiket yang dibuka di modal detail
    const [assigning, setAssigning] = useState(null); // id tiket yang sedang di-save
    const [assignErr, setAssignErr] = useState(''); // #19: pengganti alert() mentah
    const [confirmAssign, setConfirmAssign] = useState(null); // #19: { id, name, officer } menunggu konfirmasi

    // #19: perubahan dropdown → konfirmasi dulu; batal = reload agar dropdown kembali.
    const askAssign = (pickupId, officerId, officerName, memberName) => {
        setConfirmAssign({ id: pickupId, officerId, officerName, memberName });
    };

    const assignOfficer = async (pickupId, officerId) => {
        setAssigning(pickupId);
        setAssignErr('');
        try {
            await api(`/pickups/${pickupId}/assign`, { method: 'PATCH', body: { officer_id: officerId || null } });
            reload();
        } catch (err) {
            setAssignErr(err.message || 'Gagal menugaskan petugas.');
        } finally { setAssigning(null); }
    };

    const rows = (data ?? []).filter(p =>
        (p.member?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.member?.member_code ?? '').toLowerCase().includes(search.toLowerCase())
    );

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
                <StatCard icon={Clock3} label="Menunggu Pickup" value={`${stats?.menunggu ?? '—'} tiket`} note="Seluruh tiket, semua filter" tone="red" />
                <StatCard icon={CheckCircle2} label="Sudah Selesai" value={`${stats?.selesai ?? '—'} tiket`} note="Seluruh tiket, semua filter" tone="green" />
                <StatCard icon={Truck} label="Diterima Anggota (bersih)" value={stats ? rp(stats.total_net_selesai) : '—'} note="Total tiket selesai" tone="blue" />
            </div>

            {assignErr && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                    <span>{assignErr}</span>
                    <button type="button" onClick={() => setAssignErr('')} aria-label="Tutup" className="text-rose-500 hover:text-rose-700">✕</button>
                </div>
            )}

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
                                <th className="px-6 py-3.5">Plotting Petugas</th>
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
                                    <td className="px-6 py-4 max-w-[220px] truncate text-muted-foreground" title={p.location_type === 'jemput_pasar' ? p.member?.address_pasar : p.member?.address_rumah}>
                                        <span className="inline-flex items-center gap-1"><MapPin size={13} className="shrink-0 text-primary" />{(p.location_type === 'jemput_pasar' ? p.member?.address_pasar : p.member?.address_rumah) ?? p.member?.address ?? '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">{dfmt(p.scheduled_at)}</td>
                                    <td className="px-6 py-4">{p.location_type === 'jemput_rumah' ? 'Jemput Rumah' : p.location_type === 'jemput_pasar' ? 'Jemput Pasar' : 'Gudang'}</td>
                                    <td className="px-6 py-4">
                                        {/* Plotting petugas ke tiket ini */}
                                        <select
                                            value={p.officer?.id ?? ''}
                                            onChange={e => {
                                                const off = (officers ?? []).find(o => String(o.id) === String(e.target.value));
                                                askAssign(p.id, e.target.value, off?.name, p.member?.name ?? `tiket #${p.id}`);
                                            }}
                                            disabled={assigning === p.id}
                                            aria-label={`Tugaskan petugas untuk ${p.member?.name ?? `tiket #${p.id}`}`}
                                            className="h-9 rounded-xl border border-border bg-card px-2.5 text-xs font-medium text-foreground focus:bg-white disabled:opacity-50"
                                        >
                                            <option value="">Belum ditugaskan</option>
                                            {(officers ?? []).map(o => (
                                                <option key={o.id} value={o.id}>{o.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn('rounded-full px-3 py-0.5 text-xs font-semibold', STATUS_STYLE[p.status])}>{p.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setDetailId(p.id)}
                                                className="h-9 rounded-xl border border-border px-3 text-xs font-semibold text-foreground hover:border-primary hover:text-primary">
                                                Detail
                                            </button>
                                            <button onClick={() => setDetail(p.member)} disabled={!p.member}
                                                className="h-9 rounded-xl border border-primary px-4 text-xs font-semibold text-primary hover:bg-primary hover:text-white disabled:opacity-40">
                                                Riwayat Anggota
                                            </button>
                                        </div>
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
            {detailId && <PickupDetailModal pickupId={detailId} onClose={() => { setDetailId(null); reload(); }} />}

            {/* #19: penugasan petugas ke tiket wajib konfirmasi */}
            <ConfirmPopup
                open={Boolean(confirmAssign)}
                title="Tugaskan Petugas?"
                description={confirmAssign?.officerId
                    ? `Tiket penjemputan ${confirmAssign.memberName} akan ditugaskan ke ${confirmAssign.officerName}.`
                    : `Penugasan tiket ${confirmAssign?.memberName} akan dikosongkan (belum ditugaskan).`}
                actionLabel="Ya, Tugaskan"
                onCancel={() => { setConfirmAssign(null); reload(); }}
                onConfirm={() => { const c = confirmAssign; setConfirmAssign(null); assignOfficer(c.id, c.officerId); }}
            />
        </div>
    );
}

// Halaman Simpanan Wajib: list seluruh anggota + tagihan operasional/simpanan, status BLM BAYAR,
// dan aksi konfirmasi pembayaran Rp50.000 (auto-split 45.000 operasional + 5.000 simpanan).
import { useState } from 'react';
import { CheckCircle2, Search, WalletCards } from 'lucide-react';
import { PageHeader, StatCard, Pager } from '@/Components/Koperasi/ManagerUI';
import { api, useApi, rp } from '@/lib/api';
import { usePopup } from './Index';

const cn = (...cls) => cls.filter(Boolean).join(' ');

export default function WajibOverviewPage() {
    const { showStatus } = usePopup();
    const { data, loading, error, reload } = useApi('/savings/wajib-overview');
    const [search, setSearch] = useState('');
    const [paying, setPaying] = useState(null); // member id

    const rows = (data?.members ?? []).filter(m =>
        (m.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (m.member_code ?? '').toLowerCase().includes(search.toLowerCase())
    );

    const confirmPay = async (m) => {
        if (!confirm(`Konfirmasi pembayaran setoran wajib ${m.name} sebesar Rp50.000?\n(otomatis: Rp45.000 operasional + Rp5.000 simpanan)`)) return;
        setPaying(m.member_id);
        try {
            const res = await api('/savings/pay', {
                method: 'POST',
                body: { member_id: m.member_id, label: 'WAJIB', jumlah: 50000, metode: 'tunai' },
            });
            showStatus('Pembayaran Tercatat', res?.message || `Setoran wajib ${m.name} lunas: Rp45.000 operasional + Rp5.000 simpanan.`);
            reload();
        } catch (err) {
            showStatus('Gagal Mencatat', err.errors ? Object.values(err.errors)[0]?.[0] : err.message);
        } finally { setPaying(null); }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Simpanan Wajib Bulanan"
                desc={`Status setoran wajib seluruh anggota — periode ${data?.period ?? '-'}. Setoran Rp50.000/bulan dipecah otomatis: Rp45.000 operasional + Rp5.000 simpanan.`}
            />

            <div className="grid gap-5 md:grid-cols-3">
                <StatCard icon={WalletCards} label="Tagihan per Anggota" value={rp(data?.tagihan_total)} note={`Operasional ${rp(data?.tagihan_operasional)} · Simpanan ${rp(data?.tagihan_simpanan)}`} tone="blue" />
                <StatCard icon={CheckCircle2} label="Sudah Lunas" value={`${data?.lunas ?? 0} anggota`} tone="green" />
                <StatCard icon={WalletCards} label="Belum Bayar" value={`${data?.belum_bayar ?? 0} anggota`} tone="red" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Daftar Tagihan Anggota</h2>
                    <div className="relative w-full sm:w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama / kode anggota…"
                            className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs focus:bg-white" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">Anggota</th>
                                <th className="px-6 py-3.5">Tagihan Operasional</th>
                                <th className="px-6 py-3.5">Tagihan Simpanan</th>
                                <th className="px-6 py-3.5">Total Tagihan</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>}
                            {!loading && rows.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">{error ? 'Gagal memuat data.' : 'Tidak ada anggota yang cocok.'}</td></tr>
                            )}
                            {rows.map(m => (
                                <tr key={m.member_id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="block font-semibold text-foreground">{m.name}</span>
                                        <span className="block font-mono text-[11px] font-bold text-muted-foreground">{m.member_code}</span>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-foreground">{rp(m.tagihan_operasional)}</td>
                                    <td className="px-6 py-4 font-semibold text-foreground">{rp(m.tagihan_simpanan)}</td>
                                    <td className="px-6 py-4 font-bold text-primary">{rp(m.tagihan_total)}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold',
                                            m.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                                        )}>
                                            <span className={cn('size-2 rounded-full', m.status === 'LUNAS' ? 'bg-emerald-600' : 'bg-amber-500')} />
                                            {m.status === 'LUNAS' ? 'Lunas' : 'Blm Bayar'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {m.status === 'LUNAS' ? (
                                            <span className="text-xs font-semibold text-emerald-600">Sudah dibayar</span>
                                        ) : (
                                            <button onClick={() => confirmPay(m)} disabled={paying === m.member_id}
                                                className="h-9 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 disabled:opacity-60">
                                                {paying === m.member_id ? 'Menyimpan…' : 'Konfirmasi Bayar'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    <span>Menampilkan {rows.length} dari {(data?.members ?? []).length} anggota</span>
                    <Pager total={Math.max(1, Math.ceil((data?.members ?? []).length / 25))} />
                </div>
            </section>
        </div>
    );
}

// FE-4.3 — Riwayat setoran & nota digital anggota: card nota interaktif
// (kategori, berat, potongan 20%, saldo diterima) + tombol ajukan komplain.
import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquareWarning, Recycle, Wallet } from 'lucide-react';
import ComplaintFormModal from '@/Components/Koperasi/ComplaintFormModal';
import { StatusPopup } from '@/Components/Koperasi/Popups';
import { useApi, rp, dfmt } from '@/lib/api';

const cn = (...cls) => cls.filter(Boolean).join(' ');

export default function ReceiptsPage() {
    const [expanded, setExpanded] = useState(null);
    const [complainFor, setComplainFor] = useState(null);
    const [status, setStatus] = useState('');

    const { data: pickups, loading, reload: reloadPickups } = useApi('/pickups?per_page=30');
    const { data: complaints, reload: reloadComplaints } = useApi('/complaints');

    const complaintMap = new Map((complaints ?? []).map(c => [c.pickup?.id, c]));

    const receipts = (pickups ?? []).map(p => {
        const rawItems = p.items ?? [];
        const items = rawItems.map(i => ({
            name: i.category?.name || 'Sampah',
            weight: i.weight_kg ?? i.unit_count ?? 0,
            unit: i.category?.unit || 'kg',
            total: Number(i.total_value || 0),
        }));

        return {
            id: p.id,
            code: `NTR-${String(p.id).padStart(6, '0')}`,
            date: p.completed_at ? dfmt(p.completed_at) : (p.scheduled_at ? dfmt(p.scheduled_at) : '-'),
            location: p.location_type === 'jemput_rumah' ? 'Dijemput di Rumah' : 'Diantar ke Gudang',
            status: p.status,
            items,
            gross: Number(p.total_gross || 0),
            fee: Number(p.total_fee || 0),
            net: Number(p.total_net || 0),
            complaint: complaintMap.get(p.id),
        };
    });

    const itemsSummary = (r) =>
        r.items.length > 0
            ? r.items.map(i => `${i.name} ${i.weight} ${i.unit}`).join(', ')
            : (r.status === 'menunggu_timbang' ? 'Menunggu Penimbangan Petugas' : 'Tanpa Rincian');

    const reloadAll = () => {
        reloadPickups();
        reloadComplaints();
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">Riwayat Setor & Nota Digital</h1>
                <p className="mt-1 text-sm text-muted-foreground">Semua transaksi setor sampah Anda beserta rincian nota resmi koperasi.</p>
            </div>

            {loading && (
                <div className="rounded-2xl border border-border/80 bg-card p-10 text-center text-sm text-muted-foreground">
                    Memuat riwayat nota setoran…
                </div>
            )}

            {!loading && receipts.length === 0 && (
                <div className="rounded-2xl border border-border/80 bg-card p-10 text-center text-sm text-muted-foreground">
                    Belum ada riwayat setoran sampah. Anda dapat menyetor sampah ke gudang atau mengajukan penjemputan.
                </div>
            )}

            <div className="flex flex-col gap-4">
                {receipts.map(receipt => {
                    const open = expanded === receipt.id;
                    return (
                        <article key={receipt.id} className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs transition-all hover:shadow-md">
                            {/* Ringkasan nota */}
                            <button
                                type="button"
                                onClick={() => setExpanded(open ? null : receipt.id)}
                                aria-expanded={open}
                                className="flex w-full items-center gap-4 p-5 text-left"
                            >
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Recycle size={22} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-mono text-xs font-bold text-primary">{receipt.code}</p>
                                    <p className="truncate text-sm font-semibold text-foreground">{itemsSummary(receipt)}</p>
                                    <p className="text-xs text-muted-foreground">{receipt.date} · {receipt.location}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <Wallet size={11} /> Saldo Diterima
                                    </p>
                                    <strong className="text-lg font-extrabold text-emerald-700">{rp(receipt.net)}</strong>
                                </div>
                                <span className="text-muted-foreground">
                                    {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </span>
                            </button>

                            {/* Rincian expansible */}
                            {open && (
                                <div className="border-t border-border/60 bg-slate-50/50 p-5">
                                    {receipt.items.length > 0 ? (
                                        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-[#eef3fc] text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                                    <tr>
                                                        <th className="px-4 py-2.5">Jenis Sampah</th>
                                                        <th className="px-4 py-2.5 text-right">Berat / Jumlah</th>
                                                        <th className="px-4 py-2.5 text-right">Nilai</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/60">
                                                    {receipt.items.map((item, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-2.5 font-semibold text-foreground">{item.name}</td>
                                                            <td className="px-4 py-2.5 text-right text-muted-foreground">{item.weight} {item.unit}</td>
                                                            <td className="px-4 py-2.5 text-right font-bold text-foreground">{rp(item.total)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic mb-3">
                                            Status: {receipt.status === 'menunggu_timbang' ? 'Menunggu penimbangan oleh petugas' : receipt.status}
                                        </p>
                                    )}

                                    <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between gap-6 text-xs text-muted-foreground">
                                                <span>Nilai kotor {rp(receipt.gross)}</span>
                                                <span className="text-rose-600">Potongan 20% −{rp(receipt.fee)}</span>
                                            </div>
                                            <div className="flex justify-between gap-6 text-sm">
                                                <strong className="text-foreground">Saldo masuk</strong>
                                                <strong className="text-emerald-700">{rp(receipt.net)}</strong>
                                            </div>
                                        </div>
                                        {receipt.complaint ? (
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 self-start rounded-full px-3.5 py-1.5 text-xs font-bold sm:self-auto',
                                                receipt.complaint.status === 'diterima'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : receipt.complaint.status === 'ditolak'
                                                    ? 'bg-rose-100 text-rose-800'
                                                    : 'bg-amber-100 text-amber-800'
                                            )}>
                                                <MessageSquareWarning size={13} />
                                                Komplain #{receipt.complaint.id} ({receipt.complaint.status})
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setComplainFor(receipt)}
                                                className="flex h-10 items-center gap-2 self-start rounded-xl border border-primary/40 bg-card px-4 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white sm:self-auto"
                                            >
                                                <MessageSquareWarning size={15} />
                                                <span>Ajukan Komplain</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>

            <ComplaintFormModal
                receipt={complainFor && { ...complainFor, itemsSummary: itemsSummary(complainFor) }}
                onClose={() => setComplainFor(null)}
                onSuccess={() => {
                    setComplainFor(null);
                    setStatus('Komplain Berhasil Dikirim');
                    reloadAll();
                }}
            />

            <StatusPopup
                open={Boolean(status)}
                title={status}
                description="Pengurus akan meninjau pengaduan Anda dan mengoreksi saldo bila disetujui."
                onClose={() => setStatus('')}
            />
        </div>
    );
}

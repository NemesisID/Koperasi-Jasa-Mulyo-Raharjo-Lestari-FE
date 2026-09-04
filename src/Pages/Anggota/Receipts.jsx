// FE-4.3 — Riwayat setoran & nota digital anggota: card nota interaktif
// (kategori, berat, potongan 20%, saldo diterima) + tombol ajukan komplain.
import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquareWarning, Recycle, Wallet } from 'lucide-react';
import ComplaintFormModal from '@/Components/Koperasi/ComplaintFormModal';
import { StatusPopup } from '@/Components/Koperasi/Popups';

const cn = (...cls) => cls.filter(Boolean).join(' ');

const rp = (n) => 'Rp ' + n.toLocaleString('id-ID');

// ponytail: mock nota sampai endpoint /pickups (riwayat anggota) tersedia.
const RECEIPTS = [
    {
        id: 'NTR-20260903-0091', date: '03 Sep 2026, 09:15 WIB', location: 'Dijemput di Rumah',
        items: [{ name: 'Botol PET Bening', weight: '8.5', unit: 'kg', total: 27200 }],
        gross: 27200, fee: 5440, net: 21760, complaint: false,
    },
    {
        id: 'NTR-20260901-0084', date: '01 Sep 2026, 15:40 WIB', location: 'Diantar ke Gudang',
        items: [
            { name: 'Kardus / Karton', weight: '12.0', unit: 'kg', total: 24000 },
            { name: 'Kaleng Aluminium', weight: '1.5', unit: 'kg', total: 18000 },
        ],
        gross: 42000, fee: 8400, net: 33600, complaint: false,
    },
    {
        id: 'NTR-20260828-0079', date: '28 Agu 2026, 10:05 WIB', location: 'Dijemput di Rumah',
        items: [{ name: 'Plastik Kresek', weight: '6.2', unit: 'kg', total: 7440 }],
        gross: 7440, fee: 1488, net: 5952, complaint: 'KMP-2026-0118',
    },
];

export default function ReceiptsPage() {
    const [expanded, setExpanded] = useState(null);
    const [complainFor, setComplainFor] = useState(null);
    const [status, setStatus] = useState('');

    const itemsSummary = (r) =>
        r.items.map(i => `${i.name} ${i.weight}${i.unit}`).join(', ');

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">Riwayat Setor & Nota Digital</h1>
                <p className="mt-1 text-sm text-muted-foreground">Semua transaksi setor sampah Anda beserta rincian nota resmi koperasi.</p>
            </div>

            <div className="flex flex-col gap-4">
                {RECEIPTS.map(receipt => {
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
                                    <p className="font-mono text-xs font-bold text-primary">{receipt.id}</p>
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
                                    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-[#eef3fc] text-[10px] font-bold uppercase tracking-wider text-slate-700">
                                                <tr>
                                                    <th className="px-4 py-2.5">Jenis Sampah</th>
                                                    <th className="px-4 py-2.5 text-right">Berat</th>
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
                                            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-bold text-amber-800 sm:self-auto">
                                                <MessageSquareWarning size={13} /> Komplain {receipt.complaint} diproses
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

// FE-3.4 — Layar sukses input timbangan: nota digital + QR verifikasi
// + kirim via WhatsApp. Dipakai WeighingForm setelah submit.
import QRCode from 'react-qr-code';
import { CheckCircle2, MessageCircle, Printer, X } from 'lucide-react';
import { Modal } from './Popups';

const rp = (n) => 'Rp ' + n.toLocaleString('id-ID');

export default function ReceiptSuccessModal({ receipt, onClose }) {
    if (!receipt) return null;

    const verifyUrl = `${window.location.origin}/verify/${receipt.id}`;
    const waText = encodeURIComponent(
        `NOTA DIGITAL ${receipt.id}\n` +
        `${receipt.member}\n${receipt.date}\n\n` +
        receipt.items.map(i => `${i.name}: ${i.weight} ${i.unit} × ${rp(i.price)} = ${rp(i.total)}`).join('\n') +
        `\n\nNilai Kotor: ${rp(receipt.gross)}\nPotongan Admin 20%: -${rp(receipt.fee)}\nSaldo Masuk: ${rp(receipt.net)}\n\nVerifikasi: ${verifyUrl}`
    );

    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between px-6 py-4 bg-[#6bf1c2] border-b border-emerald-300">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-emerald-900">
                    <CheckCircle2 size={20} />
                    <span>Timbangan Tersimpan</span>
                </h2>
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="rounded-lg p-1 text-emerald-900/70 hover:bg-black/5 hover:text-emerald-900 transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex flex-col gap-5 p-6 bg-card">
                {/* Nota header */}
                <div className="text-center border-b border-dashed border-border pb-4">
                    <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Nota Digital</p>
                    <p className="mt-1 font-mono text-sm font-bold text-primary">{receipt.id}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{receipt.date}</p>
                </div>

                {/* Identitas */}
                <div className="flex items-center justify-between text-sm">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Anggota</p>
                        <p className="font-semibold text-foreground">{receipt.member}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lokasi</p>
                        <p className="font-semibold text-foreground">{receipt.location}</p>
                    </div>
                </div>

                {/* Rincian item */}
                <div className="overflow-hidden rounded-xl border border-border/60">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#eef3fc] text-[10px] font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-4 py-2.5">Jenis</th>
                                <th className="px-4 py-2.5 text-right">Berat</th>
                                <th className="px-4 py-2.5 text-right">Total</th>
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

                {/* Ringkasan nilai */}
                <div className="flex flex-col gap-2 rounded-xl bg-slate-50/70 border border-border/60 p-4 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Nilai Kotor</span>
                        <strong className="font-semibold text-foreground">{rp(receipt.gross)}</strong>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Potongan Admin Koperasi (20%)</span>
                        <strong className="font-semibold text-rose-600">−{rp(receipt.fee)}</strong>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                        <span className="font-bold text-foreground">Saldo Masuk Anggota</span>
                        <strong className="text-lg font-extrabold text-emerald-700">{rp(receipt.net)}</strong>
                    </div>
                </div>

                {/* QR verifikasi */}
                <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-slate-50/70 p-4">
                    <div className="rounded-xl bg-white p-2 border border-border shadow-xs">
                        <QRCode value={verifyUrl} size={84} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                        <p className="font-bold text-foreground">Verifikasi Nota</p>
                        <p className="mt-1 leading-relaxed">Warga dapat memindai QR di samping untuk melihat nota ini secara langsung di tempat.</p>
                    </div>
                </div>

                {/* Aksi */}
                <div className="grid grid-cols-2 gap-3">
                    <a
                        href={`https://wa.me/?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
                    >
                        <MessageCircle size={17} /> Kirim WhatsApp
                    </a>
                    <button
                        onClick={() => window.print()}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary transition-all"
                    >
                        <Printer size={17} /> Cetak Nota
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
                >
                    Timbang Berikutnya
                </button>
            </div>
        </Modal>
    );
}

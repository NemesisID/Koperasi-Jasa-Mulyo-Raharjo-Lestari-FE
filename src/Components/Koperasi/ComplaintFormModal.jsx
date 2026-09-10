// FE-4.4 — Formulir pengajuan komplain nota: pilihan alasan
// (berat salah / kategori salah), input angka koreksi, unggah foto bukti.
import { useState } from 'react';
import { ImageUp, MessageSquareWarning, Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Modal } from './Popups';

const cn = (...cls) => cls.filter(Boolean).join(' ');

export default function ComplaintFormModal({ receipt, onClose, onSuccess }) {
    const [reason, setReason] = useState('Berat salah');
    const [correction, setCorrection] = useState('');
    const [photo, setPhoto] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!receipt) return null;

    const inputCls = 'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15';

    const submit = async (e) => {
        e.preventDefault();
        if (!correction.trim()) { setError('Isi detail sesuai pengaduan Anda.'); return; }
        setError('');
        setSubmitting(true);

        try {
            const pickupId = Number(receipt.pickup_id || receipt.id);
            const issueType = reason === 'Berat salah' ? 'berat_salah'
                : reason === 'Kategori salah' ? 'kategori_salah'
                : 'lainnya'; // Keluhan petugas → 'lainnya' (tidak ada tipe khusus di BE)
            const description = reason === 'Keluhan Petugas'
                ? `Keluhan petugas: ${correction}`
                : `${reason}: ${correction}`;

            let res;
            if (photoFile) {
                const fd = new FormData();
                fd.append('pickup_id', String(pickupId));
                fd.append('issue_type', issueType);
                fd.append('description', description);
                fd.append('proof_image', photoFile);
                res = await api('/complaints', { method: 'POST', body: fd });
            } else {
                res = await api('/complaints', {
                    method: 'POST',
                    body: { pickup_id: pickupId, issue_type: issueType, description },
                });
            }

            onSuccess?.(res?.message || 'Komplain berhasil diajukan');
            setReason('Berat salah');
            setCorrection('');
            setPhoto(null);
            setPhotoFile(null);
        } catch (err) {
            setError(err.errors?.description?.[0] || err.message || 'Gagal mengirim komplain.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between px-6 py-4 bg-accent/60 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <MessageSquareWarning size={20} />
                    <span>Laporkan Masalah Pengambilan</span>
                </h2>
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors">
                    <X size={18} />
                </button>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4 p-6 bg-card">
                <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5 text-xs">
                    <p className="font-bold uppercase tracking-wider text-muted-foreground">Nota Terkait</p>
                    <p className="mt-1 font-mono font-bold text-primary">#{receipt.id} {receipt.transaction_code ? `(${receipt.transaction_code})` : ''}</p>
                    <p className="text-muted-foreground">{receipt.date || receipt.scheduled_at} {receipt.itemsSummary ? `— ${receipt.itemsSummary}` : ''}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-foreground/80">Alasan Komplain</span>
                    <div className="grid grid-cols-3 gap-3">
                        {['Berat salah', 'Kategori salah', 'Keluhan Petugas'].map(r => (
                            <button
                                key={r}
                                type="button"
                                role="radio"
                                aria-checked={reason === r}
                                onClick={() => { setReason(r); setCorrection(''); }}
                                className={cn(
                                    'h-10 rounded-xl border px-2 text-xs font-semibold transition-all',
                                    reason === r
                                        ? 'border-primary bg-primary text-white shadow-sm'
                                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary'
                                )}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    {reason === 'Keluhan Petugas' ? (
                        <>
                            <label htmlFor="correction" className="text-xs font-semibold text-foreground/80">Ceritakan Keluhan Anda</label>
                            <textarea
                                id="correction"
                                rows={3}
                                value={correction}
                                onChange={e => setCorrection(e.target.value)}
                                placeholder="Contoh: petugas datang tidak sesuai jadwal, timbangan tidak akurat..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 resize-none"
                            />
                            <span className="text-[11px] text-muted-foreground">Aduan diteruskan ke pengurus koperasi untuk ditindaklanjuti.</span>
                        </>
                    ) : (
                        <>
                            <label htmlFor="correction" className="text-xs font-semibold text-foreground/80">
                                {reason === 'Berat salah' ? 'Berat Seharusnya (kg)' : 'Kategori Seharusnya'}
                            </label>
                            {reason === 'Berat salah' ? (
                                <input
                                    id="correction"
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    step="0.1"
                                    value={correction}
                                    onChange={e => setCorrection(e.target.value)}
                                    placeholder="Contoh: 12.5"
                                    className={inputCls}
                                />
                            ) : (
                                <select
                                    id="correction"
                                    value={correction}
                                    onChange={e => setCorrection(e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="">Pilih kategori...</option>
                                    <option>Botol PET Bening</option>
                                    <option>Plastik Kresek</option>
                                    <option>Kardus / Karton</option>
                                    <option>Kaleng Aluminium</option>
                                    <option>Besi Tua</option>
                                </select>
                            )}
                        </>
                    )}
                </div>

                {/* Unggah foto bukti timbangan */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-foreground/80">Foto Bukti Timbangan (opsional)</span>
                    {photo ? (
                        <div className="relative">
                            <img src={photo} alt="Bukti timbangan" className="h-36 w-full rounded-xl border border-border object-cover" />
                            <button
                                type="button"
                                onClick={() => { setPhoto(null); setPhotoFile(null); }}
                                aria-label="Hapus foto"
                                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg bg-destructive text-white shadow-sm hover:bg-destructive/90"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ) : (
                        <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-muted-foreground transition-all hover:border-primary hover:text-primary">
                            <ImageUp size={20} />
                            <span className="text-xs font-medium">Ketuk untuk unggah foto</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setPhotoFile(file);
                                        setPhoto(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </label>
                    )}
                </div>

                {error && <p className="text-xs font-medium text-destructive">{error}</p>}

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 flex-1 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary transition-all"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="h-11 flex-[1.5] rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
                    >
                        {submitting ? 'Mengirim…' : 'Kirim Komplain'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

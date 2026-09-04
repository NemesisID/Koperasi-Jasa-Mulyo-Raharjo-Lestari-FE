// FE-2.5 — UI Helpdesk Pengaduan/Komplain: daftar komplain nota warga,
// detail selisih berat/kategori, aksi setujui revisi saldo / tolak dengan alasan.
import { useState } from 'react';
import {
    CheckCircle2, Clock, MessageSquareWarning, Scale, X,
} from 'lucide-react';
import { PageHeader, StatCard } from '@/Components/Koperasi/ManagerUI';
import { Modal } from '@/Components/Koperasi/Popups';
import { usePopup } from './Index';

const cn = (...cls) => cls.filter(Boolean).join(' ');

// ponytail: mock komplain sampai endpoint /api/v1/complaints tersedia.
const INITIAL_COMPLAINTS = [
    {
        id: 'KMP-2026-0118', member: 'Siti Aminah', code: 'MBR-202608-0043', receipt: 'NTR-20260903-0091',
        reason: 'Berat salah', claimed: '12.5 kg', recorded: '10.2 kg', diffValue: 'Rp 11.500',
        note: 'Sampah ditimbang dua kali, timbangan kedua menunjukkan 12.5 kg.',
        date: '03 Sep 2026, 14:20 WIB', status: 'menunggu',
    },
    {
        id: 'KMP-2026-0117', member: 'Ahmad Hidayat', code: 'MBR-202608-0044', receipt: 'NTR-20260903-0087',
        reason: 'Kategori salah', claimed: 'Botol PET Bening (Rp 3.500)', recorded: 'Plastik Campur (Rp 1.500)', diffValue: 'Rp 24.000',
        note: 'Sudah dipilah bening semua, tidak campur.',
        date: '03 Sep 2026, 11:05 WIB', status: 'menunggu',
    },
    {
        id: 'KMP-2026-0115', member: 'Bambang Susanto', code: 'MBR-202608-0042', receipt: 'NTR-20260902-0076',
        reason: 'Berat salah', claimed: '8.0 kg', recorded: '7.6 kg', diffValue: 'Rp 1.400',
        note: 'Selisih kecil, mungkin pembulatan.',
        date: '02 Sep 2026, 16:40 WIB', status: 'selesai',
    },
];

// ─── Dialog aksi: setujui revisi saldo atau tolak dengan alasan ──
function ActionModal({ complaint, onClose, onDone }) {
    const [mode, setMode] = useState(null); // 'approve' | 'reject' | null
    const [reason, setReason] = useState('');
    if (!complaint) return null;

    const submit = () => {
        if (mode === 'reject' && !reason.trim()) return;
        onDone(complaint.id, mode === 'approve');
        setMode(null);
        setReason('');
    };

    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between px-6 py-4 bg-accent/60 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <MessageSquareWarning size={20} />
                    <span>Detail Komplain {complaint.id}</span>
                </h2>
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex flex-col gap-4 p-6 bg-card">
                {/* Identitas & nota */}
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Anggota</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{complaint.member}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{complaint.code}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nota Terkait</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-primary">{complaint.receipt}</p>
                        <p className="text-[11px] text-muted-foreground">{complaint.date}</p>
                    </div>
                </div>

                {/* Rincian selisih */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Rincian Selisih — {complaint.reason}</p>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Klaim Anggota</p>
                            <strong className="mt-1 block text-sm font-bold text-foreground">{complaint.claimed}</strong>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Tercatat Petugas</p>
                            <strong className="mt-1 block text-sm font-bold text-foreground">{complaint.recorded}</strong>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Selisih Nilai</p>
                            <strong className="mt-1 block text-sm font-bold text-amber-700">{complaint.diffValue}</strong>
                        </div>
                    </div>
                    <p className="mt-3 text-xs italic text-amber-900/80">"{complaint.note}"</p>
                </div>

                {/* Aksi */}
                {complaint.status === 'selesai' ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 size={18} /> Komplain sudah diselesaikan
                    </div>
                ) : !mode ? (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setMode('approve')}
                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800"
                        >
                            <CheckCircle2 size={17} /> Setujui Revisi Saldo
                        </button>
                        <button
                            onClick={() => setMode('reject')}
                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-destructive text-sm font-semibold text-white shadow-sm transition-all hover:bg-destructive/90"
                        >
                            <X size={17} /> Tolak Komplain
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {mode === 'approve' ? (
                            <p className="rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                                Saldo anggota akan dikoreksi bertambah <strong>{complaint.diffValue}</strong> sesuai selisih timbangan.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="reject-reason" className="text-xs font-semibold text-foreground/80">Alasan Penolakan</label>
                                <textarea
                                    id="reject-reason"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="Jelaskan alasan komplain ditolak..."
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 resize-none"
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setMode(null); setReason(''); }}
                                className="h-11 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary transition-all"
                            >
                                Kembali
                            </button>
                            <button
                                onClick={submit}
                                disabled={mode === 'reject' && !reason.trim()}
                                className={cn(
                                    'h-11 rounded-xl text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50',
                                    mode === 'approve' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-destructive hover:bg-destructive/90'
                                )}
                            >
                                {mode === 'approve' ? 'Konfirmasi Revisi' : 'Tolak dengan Alasan'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default function ComplaintsDeskPage() {
    const { showStatus } = usePopup();
    const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
    const [detail, setDetail] = useState(null);

    const onDone = (id, approved) => {
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'selesai' } : c));
        setDetail(null);
        showStatus(
            approved ? 'Revisi Saldo Disetujui' : 'Komplain Ditolak',
            approved
                ? 'Saldo anggota telah dikoreksi otomatis sesuai selisih timbangan.'
                : 'Komplain ditandai selesai dengan alasan penolakan yang tercatat.'
        );
    };

    const waiting = complaints.filter(c => c.status === 'menunggu').length;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Helpdesk Pengaduan"
                desc="Tinjau komplain selisih timbangan nota dari warga dan putuskan koreksi saldo."
            />

            <div className="grid gap-5 md:grid-cols-3">
                <StatCard icon={MessageSquareWarning} label="Total Komplain" value={`${complaints.length} Kasus`} note="7 hari terakhir" tone="blue" />
                <StatCard icon={Clock} label="Menunggu Tindakan" value={`${waiting} Kasus`} note="⚠ Perlu keputusan" tone="gold" />
                <StatCard icon={CheckCircle2} label="Selesai" value={`${complaints.length - waiting} Kasus`} note="✓ Tertangani" tone="green" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="p-5 border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Daftar Komplain Nota</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">ID Komplain</th>
                                <th className="px-6 py-3.5">Anggota</th>
                                <th className="px-6 py-3.5">Alasan</th>
                                <th className="px-6 py-3.5">Selisih Nilai</th>
                                <th className="px-6 py-3.5">Tanggal</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {complaints.map(c => (
                                <tr key={c.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">{c.id}</td>
                                    <td className="px-6 py-4">
                                        <span className="block font-semibold text-foreground">{c.member}</span>
                                        <span className="font-mono text-[11px] text-muted-foreground">{c.code}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                            <Scale size={13} /> {c.reason}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-amber-700">{c.diffValue}</td>
                                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{c.date.split(',')[0]}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                            c.status === 'selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                                        )}>
                                            ● {c.status === 'selesai' ? 'Selesai' : 'Menunggu'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setDetail(c)}
                                            className="text-xs font-bold text-primary hover:underline"
                                        >
                                            Tinjau
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 text-center text-xs text-muted-foreground border-t border-border/60 bg-slate-50/50">
                    Menampilkan {complaints.length} dari 27 komplain bulan ini.
                </div>
            </section>

            <ActionModal complaint={detail} onClose={() => setDetail(null)} onDone={onDone} />
        </div>
    );
}

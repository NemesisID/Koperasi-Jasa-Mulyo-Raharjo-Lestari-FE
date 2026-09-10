// FE-2.5 — UI Helpdesk Pengaduan/Komplain: daftar komplain nota warga,
// detail selisih berat/kategori, aksi setujui revisi saldo / tolak dengan alasan.
import { useState } from 'react';
import {
    CheckCircle2, Clock, MessageSquareWarning, Scale, X,
} from 'lucide-react';
import { PageHeader, StatCard } from '@/Components/Koperasi/ManagerUI';
import { Modal } from '@/Components/Koperasi/Popups';
import { api, useApi, rp, dfmt } from '@/lib/api';
import { complaintStatus } from '@/lib/complaint';

const cn = (...cls) => cls.filter(Boolean).join(' ');

// ─── Dialog aksi: setujui revisi saldo atau tolak dengan alasan ──
function ActionModal({ complaint, onClose, onDone }) {
    const [mode, setMode] = useState(null); // 'approve' | 'reject' | null
    const [reason, setReason] = useState('');
    const [adjustment, setAdjustment] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    if (!complaint) return null;

    const submit = async () => {
        if (mode === 'reject' && !reason.trim()) return;
        setSaving(true);
        setError('');
        try {
            const isApprove = mode === 'approve';
            await api(`/complaints/${complaint.id}/resolve`, {
                method: 'PATCH',
                body: {
                    status: isApprove ? 'diterima' : 'ditolak',
                    adjustment_amount: isApprove ? Number(String(adjustment).replace(/[^\d]/g, '')) || 0 : null,
                    resolution_note: isApprove ? (reason.trim() || 'Revisi timbangan disetujui') : reason.trim(),
                },
            });
            onDone(complaint.id, isApprove);
            setMode(null);
            setReason('');
            setAdjustment('');
        } catch (err) {
            setError(err.message || 'Gagal menyelesaikan komplain.');
        } finally {
            setSaving(false);
        }
    };

    const isResolved = complaint.status === 'diterima' || complaint.status === 'ditolak';

    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between px-6 py-4 bg-accent/60 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <MessageSquareWarning size={20} />
                    <span>Detail Komplain #{complaint.id}</span>
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
                        <p className="mt-1 text-sm font-semibold text-foreground">{complaint.member?.name || 'Anggota'}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{complaint.member?.member_code || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tiket Penjemputan</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-primary">Pickup #{complaint.pickup?.id || complaint.pickup_id}</p>
                        <p className="text-[11px] text-muted-foreground">{dfmt(complaint.created_at)}</p>
                    </div>
                </div>

                {/* Rincian keluhan */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        Jenis Masalah: {complaint.issue_type?.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="mt-2 text-sm text-foreground">{complaint.description}</p>
                    {complaint.proof_image && (
                        <div className="mt-3">
                            <a href={complaint.proof_image} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary underline">
                                Lihat Foto Bukti
                            </a>
                        </div>
                    )}
                </div>

                {error && <p className="text-xs font-medium text-destructive">{error}</p>}

                {/* Aksi */}
                {isResolved ? (
                    <div className="flex flex-col gap-1 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
                        <span className="flex items-center gap-1.5"><CheckCircle2 size={16} /> Status: {complaintStatus(complaint.status).label.toUpperCase()}</span>
                        {complaint.resolution_note && <p className="text-muted-foreground font-normal mt-1">Catatan: {complaint.resolution_note}</p>}
                        {complaint.adjustment_amount > 0 && <p className="text-emerald-700">Penyesuaian saldo: +{rp(complaint.adjustment_amount)}</p>}
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
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-foreground/80">
                                    Nominal Penyesuaian Saldo (Rp)
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={adjustment}
                                        onChange={e => setAdjustment(e.target.value)}
                                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm"
                                    />
                                </label>
                                <label className="text-xs font-semibold text-foreground/80">
                                    Catatan Persetujuan
                                    <input
                                        type="text"
                                        placeholder="Alasan persetujuan koreksi…"
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm"
                                    />
                                </label>
                            </div>
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
                                onClick={() => { setMode(null); setReason(''); setError(''); }}
                                className="h-11 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary transition-all"
                            >
                                Kembali
                            </button>
                            <button
                                onClick={submit}
                                disabled={saving || (mode === 'reject' && !reason.trim())}
                                className={cn(
                                    'h-11 rounded-xl text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50',
                                    mode === 'approve' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-destructive hover:bg-destructive/90'
                                )}
                            >
                                {saving ? 'Memproses…' : mode === 'approve' ? 'Konfirmasi Revisi' : 'Tolak dengan Alasan'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default function ComplaintsDeskPage({ onShowStatus }) {
    const { data, loading, error, reload } = useApi('/complaints');
    const [detail, setDetail] = useState(null);

    const complaints = data ?? [];

    const onDone = (id, approved) => {
        setDetail(null);
        reload();
        onShowStatus?.(
            approved ? 'Revisi Saldo Disetujui' : 'Komplain Ditolak',
            approved
                ? 'Saldo anggota telah dikoreksi otomatis sesuai nominal penyesuaian.'
                : 'Komplain ditandai ditolak dengan alasan yang tercatat.'
        );
    };

    const waiting = complaints.filter(c => c.status === 'diajukan' || c.status === 'proses').length;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Helpdesk Pengaduan"
                desc="Tinjau komplain selisih timbangan nota dari warga dan putuskan koreksi saldo."
            />

            <div className="grid gap-5 md:grid-cols-3">
                <StatCard icon={MessageSquareWarning} label="Total Komplain" value={`${complaints.length} Kasus`} note="Semua laporan" tone="blue" />
                <StatCard icon={Clock} label="Menunggu Tindakan" value={`${waiting} Kasus`} note="⚠ Perlu keputusan" tone="gold" />
                <StatCard icon={CheckCircle2} label="Selesai Ditangani" value={`${complaints.length - waiting} Kasus`} note="✓ Tertangani" tone="green" />
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="p-5 border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Daftar Komplain Nota</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">ID</th>
                                <th className="px-6 py-3.5">Anggota</th>
                                <th className="px-6 py-3.5">Jenis Masalah</th>
                                <th className="px-6 py-3.5">Deskripsi</th>
                                <th className="px-6 py-3.5">Tanggal</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data komplain…</td></tr>}
                            {!loading && complaints.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">{error ? 'Gagal memuat data.' : 'Belum ada pengaduan komplain.'}</td></tr>
                            )}
                            {complaints.map(c => (
                                <tr key={c.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-foreground">#{c.id}</td>
                                    <td className="px-6 py-4">
                                        <span className="block font-semibold text-foreground">{c.member?.name ?? '-'}</span>
                                        <span className="font-mono text-[11px] text-muted-foreground">{c.member?.member_code ?? '-'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                                            <Scale size={13} /> {c.issue_type?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-foreground max-w-xs truncate">{c.description}</td>
                                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{dfmt(c.created_at)}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                            complaintStatus(c.status).cls
                                        )}>
                                            ● {complaintStatus(c.status).label}
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
                    Menampilkan {complaints.length} komplain.
                </div>
            </section>

            <ActionModal complaint={detail} onClose={() => setDetail(null)} onDone={onDone} />
        </div>
    );
}

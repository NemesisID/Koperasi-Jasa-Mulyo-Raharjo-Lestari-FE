// Page Penarikan Tunai (alur.md): pengurus/petugas cari member → isi nominal
// + bukti foto → saldo anggota langsung terpotong (POST /wallet/withdraw-cash).
// Plus antrean pengajuan anggota (approve/reject) — tanpa ini pengajuan anggota terkatung-katung.
import { useState } from 'react';
import { Banknote, Check, Search, X } from 'lucide-react';
import { PageHeader } from '@/Components/Koperasi/ManagerUI';
import { Modal } from '@/Components/Koperasi/Popups';
import { useApi, api, rp, dfmt } from '@/lib/api';
import { usePopup } from './Index';

const cn = (...cls) => cls.filter(Boolean).join(' ');

const inputCls = 'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-foreground transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15';

function WithdrawModal({ member, onClose, onDone }) {
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [amount, setAmount] = useState('');
    const [photo, setPhoto] = useState(null);
    const [notes, setNotes] = useState('');
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('member_id', member.id);
            fd.append('amount', Number(String(amount).replace(/[^\d]/g, '')));
            if (photo) fd.append('photo', photo);
            if (notes) fd.append('notes', notes);
            await api('/wallet/withdraw-cash', { method: 'POST', body: fd });
            onDone(`Penarikan tunai ${member.name} berhasil — saldo terpotong.`);
        } catch (err) {
            const fieldErrs = err.errors && Object.values(err.errors)[0]?.[0];
            setError(fieldErrs || err.message || 'Gagal memproses penarikan.');
        } finally { setSaving(false); }
    };

    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between px-6 py-4 bg-accent/60 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <Banknote size={20} />
                    <span>Penarikan Tunai — {member.name}</span>
                </h2>
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors">
                    <X size={18} />
                </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4 p-6 bg-card">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#eef3fc] px-4 py-3">
                        <span className="text-xs font-semibold text-primary">No. Anggota</span>
                        <strong className="block text-sm font-bold text-foreground">{member.member_code ?? '-'}</strong>
                    </div>
                    <div className="rounded-xl bg-[#eef3fc] px-4 py-3">
                        <span className="text-xs font-semibold text-primary">Tanggal (hari ini)</span>
                        <strong className="block text-sm font-bold text-foreground">{today}</strong>
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Jumlah Penarikan (Rp)</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">Rp</span>
                        <input
                            required
                            inputMode="numeric"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0"
                            className={cn(inputCls, 'pl-11 font-bold')}
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Bukti Foto (opsional)</label>
                    <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={e => setPhoto(e.target.files?.[0] ?? null)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground/80">Catatan</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Catatan tambahan..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 resize-none"
                    />
                </div>
                {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose}
                        className="h-11 flex-1 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary transition-all">
                        Batal
                    </button>
                    <button type="submit" disabled={saving}
                        className="h-11 flex-[1.5] rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60">
                        {saving ? 'Memproses...' : 'Tarik Tunai'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function WithdrawalsPage() {
    const { showStatus } = usePopup();
    const { data, loading } = useApi('/members?status=aktif&per_page=200');
    const { data: requests, reload: reloadRequests } = useApi('/wallet/withdraw-requests?status=pending&per_page=50');
    const [q, setQ] = useState('');
    const [target, setTarget] = useState(null);
    const [busyId, setBusyId] = useState('');

    const members = (data ?? []).filter(m =>
        (m.name ?? '').toLowerCase().includes(q.toLowerCase()) || (m.member_code ?? '').toLowerCase().includes(q.toLowerCase())
    );

    const decide = async (r, action) => {
        setBusyId(r.id);
        try {
            await api(`/wallet/withdraw-requests/${r.id}/approve`, {
                method: 'PATCH',
                body: { action },
            });
            reloadRequests();
            showStatus(action === 'approve' ? 'Penarikan disetujui.' : 'Penarikan ditolak.', `Permintaan ${r.member?.name ?? ''} diproses.`);
        } catch (err) {
            showStatus('Gagal Memproses', err.message || 'Gagal memproses permintaan.');
        } finally { setBusyId(''); }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Penarikan Tunai"
                desc="Tarik saldo anggota secara tunai — saldo langsung terpotong dan kas keluar tercatat."
            />

            {(requests ?? []).length > 0 && (
                <section className="overflow-hidden rounded-2xl border border-amber-200 bg-card shadow-xs">
                    <div className="p-5 border-b border-amber-100">
                        <h2 className="text-lg font-bold text-foreground">Pengajuan Penarikan Anggota ({(requests ?? []).length})</h2>
                        <p className="text-xs text-muted-foreground">Permintaan penarikan saldo yang menunggu keputusan pengurus.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                                <tr>
                                    <th className="px-6 py-3.5">Anggota</th>
                                    <th className="px-6 py-3.5">Jumlah</th>
                                    <th className="px-6 py-3.5">Metode</th>
                                    <th className="px-6 py-3.5">Diajukan</th>
                                    <th className="px-6 py-3.5">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {(requests ?? []).map(r => (
                                    <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-foreground">{r.member?.name ?? '-'} <span className="text-xs text-muted-foreground">{r.member?.member_code}</span></td>
                                        <td className="px-6 py-4 font-bold text-primary">{rp(r.amount)}</td>
                                        <td className="px-6 py-4 capitalize text-muted-foreground">{r.method}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{dfmt(r.created_at)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button onClick={() => decide(r, 'approve')} disabled={busyId === r.id}
                                                    className="flex h-8 items-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                                                    <Check size={14} /> Setujui
                                                </button>
                                                <button onClick={() => decide(r, 'reject')} disabled={busyId === r.id}
                                                    className="flex h-8 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                                                    <X size={14} /> Tolak
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center border-b border-border/60">
                    <h2 className="text-lg font-bold text-foreground">Cari Anggota</h2>
                    <div className="relative w-full sm:w-72">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={q}
                            onChange={e => setQ(e.target.value)}
                            placeholder="Cari ID atau nama anggota…"
                            className="h-9 w-full rounded-xl border border-border bg-slate-50/50 pl-9 pr-3 text-xs focus:bg-white"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="bg-[#eef3fc] text-xs font-bold uppercase tracking-wider text-slate-700">
                            <tr>
                                <th className="px-6 py-3.5">No. Anggota</th>
                                <th className="px-6 py-3.5">Nama</th>
                                <th className="px-6 py-3.5">Alamat</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading && <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">Memuat data…</td></tr>}
                            {!loading && members.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">Anggota tidak ditemukan.</td></tr>}
                            {members.map(m => (
                                <tr key={m.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground">{m.member_code ?? '-'}</td>
                                    <td className="px-6 py-4 font-semibold text-foreground">{m.name}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{m.address ?? '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{m.status}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => setTarget(m)}
                                            className="flex h-8 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-white hover:bg-primary/90">
                                            <Banknote size={14} /> Penarikan
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-border/60 bg-slate-50/50 text-xs text-muted-foreground">
                    Menampilkan {members.length} anggota aktif
                </div>
            </section>

            {target && (
                <WithdrawModal
                    member={target}
                    onClose={() => setTarget(null)}
                    onDone={msg => { setTarget(null); showStatus('Penarikan Berhasil', msg); }}
                />
            )}
        </div>
    );
}

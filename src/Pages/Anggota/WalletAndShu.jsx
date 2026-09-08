// FE-4.5 — Dompet saldo & riwayat dividen SHU anggota: mutasi saldo hasil
// sampah, form pengajuan penarikan tunai/transfer, rincian perolehan SHU tahunan.
import { useState } from 'react';
import {
    ArrowDownToLine, Banknote, Landmark, Wallet, X,
} from 'lucide-react';
import {
    DataPanel, DownloadButton, Status,
} from '@/Components/Koperasi/MemberUI';
import { Modal, StatusPopup } from '@/Components/Koperasi/Popups';
import { api, useApi, rp, dfmt } from '@/lib/api';

const cn = (...cls) => cls.filter(Boolean).join(' ');

// ─── Modal pengajuan penarikan ─────────────────────────────────
function WithdrawModal({ balance, onClose, onSuccess }) {
    const [method, setMethod] = useState('Tunai di Kasir');
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const inputCls = 'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15';
    const value = Number(String(amount).replace(/\D/g, '')) || 0;

    const submit = async (e) => {
        e.preventDefault();
        if (value < 10000) {
            setError('Minimal penarikan adalah Rp 10.000.');
            return;
        }
        if (value > balance) {
            setError('Nominal melebihi saldo dompet yang tersedia.');
            return;
        }
        if (method === 'Transfer Rekening') {
            if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
                setError('Semua data rekening bank wajib diisi untuk transfer.');
                return;
            }
        }

        setSaving(true);
        setError('');

        try {
            const body = {
                amount: value,
                method: method === 'Tunai di Kasir' ? 'tunai' : 'transfer',
            };
            if (method === 'Transfer Rekening') {
                body.bank_name = bankName.trim();
                body.account_number = accountNumber.trim();
                body.account_holder = accountHolder.trim();
            }

            const res = await api('/wallet/withdraw', {
                method: 'POST',
                body,
            });

            onSuccess(res?.message || 'Pengajuan penarikan berhasil dikirim.');
        } catch (err) {
            setError(err.message || 'Gagal mengajukan penarikan.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open onClose={onClose}>
            <div className="flex items-center justify-between px-6 py-4 bg-accent/60 border-b border-border/60">
                <h2 className="flex items-center gap-2.5 text-base font-bold text-primary">
                    <ArrowDownToLine size={20} />
                    <span>Ajukan Penarikan Saldo</span>
                </h2>
                <button type="button" onClick={onClose} aria-label="Tutup"
                    className="rounded-lg p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors">
                    <X size={18} />
                </button>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4 p-6 bg-card">
                <div className="rounded-xl border border-blue-200 bg-[#eaf1fd] px-4 py-3 text-xs">
                    Saldo dompet yang dapat ditarik: <strong className="font-bold text-primary">{rp(balance)}</strong>
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-foreground/80">Metode Pencairan</span>
                    <div className="grid grid-cols-2 gap-3">
                        {['Tunai di Kasir', 'Transfer Rekening'].map(m => (
                            <button
                                key={m}
                                type="button"
                                role="radio"
                                aria-checked={method === m}
                                onClick={() => setMethod(m)}
                                className={cn(
                                    'h-10 rounded-xl border text-xs font-semibold transition-all',
                                    method === m
                                        ? 'border-primary bg-primary text-white shadow-sm'
                                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary'
                                )}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="withdraw-amount" className="text-xs font-semibold text-foreground/80">Nominal Penarikan (Min. Rp 10.000)</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">Rp</span>
                        <input
                            id="withdraw-amount"
                            inputMode="numeric"
                            value={amount ? value.toLocaleString('id-ID') : ''}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0"
                            className={cn(inputCls, 'pl-11 font-semibold')}
                        />
                    </div>
                </div>

                {method === 'Transfer Rekening' && (
                    <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-slate-50/50 p-3.5">
                        <p className="text-xs font-bold text-foreground">Informasi Rekening Bank Tujuan</p>
                        <label className="text-xs font-medium text-foreground/80">
                            Nama Bank / E-Wallet
                            <input
                                type="text"
                                placeholder="Misal: BCA / BRI / Mandiri / GoPay"
                                value={bankName}
                                onChange={e => setBankName(e.target.value)}
                                className={cn(inputCls, 'mt-1')}
                            />
                        </label>
                        <label className="text-xs font-medium text-foreground/80">
                            Nomor Rekening
                            <input
                                type="text"
                                placeholder="Nomor rekening tujuan"
                                value={accountNumber}
                                onChange={e => setAccountNumber(e.target.value)}
                                className={cn(inputCls, 'mt-1')}
                            />
                        </label>
                        <label className="text-xs font-medium text-foreground/80">
                            Nama Pemilik Rekening
                            <input
                                type="text"
                                placeholder="Sesuai nama di buku tabungan"
                                value={accountHolder}
                                onChange={e => setAccountHolder(e.target.value)}
                                className={cn(inputCls, 'mt-1')}
                            />
                        </label>
                    </div>
                )}

                {error && <p className="text-xs font-medium text-destructive">{error}</p>}

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose}
                        className="h-11 flex-1 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary transition-all">
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="h-11 flex-[1.5] rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60"
                    >
                        {saving ? 'Mengirim…' : 'Ajukan Penarikan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function WalletAndShuPage() {
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [status, setStatus] = useState('');

    const { data: summary, loading: summaryLoading, reload: reloadSummary } = useApi('/wallet/summary');
    const { data: mutations, loading: mutationsLoading, reload: reloadMutations } = useApi('/wallet/mutations');
    const { data: shuHistory, loading: shuLoading, reload: reloadShu } = useApi('/shu/my-history');

    const balance = summary?.available_balance ?? summary?.current_balance ?? 0;
    const totalEarned = summary?.total_earned ?? 0;
    const totalWithdrawn = summary?.total_withdrawn ?? 0;
    const pendingWithdrawal = summary?.pending_withdrawal ?? 0;

    const mutationList = (mutations ?? []).map((m, idx) => {
        const catLabel = m.source === 'sampah' ? 'Sampah'
            : m.source === 'shu' ? 'SHU'
            : m.source === 'penarikan' ? 'Penarikan'
            : 'Penyesuaian';
        const isPositive = m.type === 'kredit';

        return {
            id: idx,
            date: m.date ? dfmt(m.date) : '-',
            desc: m.description || m.reference || 'Mutasi Dompet',
            cat: catLabel,
            amount: (isPositive ? '+ ' : '− ') + rp(m.amount),
            positive: isPositive,
        };
    });

    const shuList = shuHistory ?? [];

    const reloadAll = () => {
        reloadSummary();
        reloadMutations();
        reloadShu();
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground md:text-3xl">Dompet & SHU</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Saldo hasil penjualan sampah dan dividen SHU tahunan Anda.</p>
                </div>
                <button
                    onClick={() => setWithdrawOpen(true)}
                    className="flex h-10 items-center gap-2 self-start rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90 sm:self-auto"
                >
                    <ArrowDownToLine size={16} />
                    <span>Tarik Saldo</span>
                </button>
            </div>

            {/* Saldo dompet */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#073d8c] via-[#0a56c2] to-[#1466dc] p-7 text-white shadow-lg">
                <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 size-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
                <div className="relative z-10">
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-200/90">Saldo Dompet Tersedia</p>
                    <strong className="mt-1 block text-3xl font-extrabold tracking-tight md:text-4xl">
                        {summaryLoading ? 'Memuat…' : rp(balance)}
                    </strong>
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3.5">
                            <Wallet size={20} className="text-emerald-300" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Total Akumulasi Masuk</p>
                                <strong className="text-sm font-bold">{rp(totalEarned)}</strong>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3.5">
                            <Banknote size={20} className="text-rose-300" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Total Telah Ditarik</p>
                                <strong className="text-sm font-bold">{rp(totalWithdrawn)}</strong>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3.5">
                            <Landmark size={20} className="text-amber-300" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Sedang Diproses Kasir</p>
                                <strong className="text-sm font-bold">{rp(pendingWithdrawal)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mutasi saldo */}
            <DataPanel
                title="Mutasi Saldo Dompet"
                headers={['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah (IDR)']}
                rows={mutationList.map(r => [
                    <span key="d" className="text-muted-foreground">{r.date}</span>,
                    <strong key="de" className="font-semibold text-foreground">{r.desc}</strong>,
                    <span key="c" className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        r.cat === 'Sampah' ? 'bg-emerald-100 text-emerald-800'
                            : r.cat === 'SHU' ? 'bg-blue-100 text-primary'
                            : 'bg-rose-100 text-rose-800'
                    )}>
                        {r.cat}
                    </span>,
                    <strong key="a" className={cn('font-bold', r.positive ? 'text-emerald-700' : 'text-rose-600')}>{r.amount}</strong>,
                ])}
                footer={`Menampilkan ${mutationList.length} mutasi saldo`}
            />

            {/* Riwayat SHU tahunan */}
            <DataPanel
                title="Rincian Perolehan SHU Tahunan"
                headers={['Tahun Buku', 'Jasa Modal (Simpanan)', 'Jasa Usaha (Transaksi)', 'Total SHU Diterima', 'Status']}
                rows={shuList.map((r, i) => [
                    <strong key="y" className="font-bold text-foreground">{r.year}</strong>,
                    <span key="m" className="text-muted-foreground">{rp(r.jasa_modal)}</span>,
                    <span key="u" className="text-muted-foreground">{rp(r.jasa_partisipasi)}</span>,
                    <strong key="t" className="font-bold text-primary">{rp(r.total_shu)}</strong>,
                    <Status key="s" kind={r.paid_at ? 'success' : 'pending'}>
                        {r.paid_at ? 'Diterima di Dompet' : (r.status === 'published' ? 'Diterbitkan' : r.status || 'Proses')}
                    </Status>,
                ])}
                footer="SHU dihitung dari laba bersih koperasi sesuai porsi simpanan dan partisipasi transaksi anggota"
            />

            {withdrawOpen && (
                <WithdrawModal
                    balance={balance}
                    onClose={() => setWithdrawOpen(false)}
                    onSuccess={(msg) => {
                        setWithdrawOpen(false);
                        setStatus(msg || 'Pengajuan Penarikan Terkirim');
                        reloadAll();
                    }}
                />
            )}

            <StatusPopup
                open={Boolean(status)}
                title={status}
                description="Pengurus dan bendahara akan memproses verifikasi pencairan saldo dompet Anda."
                onClose={() => setStatus('')}
            />
        </div>
    );
}

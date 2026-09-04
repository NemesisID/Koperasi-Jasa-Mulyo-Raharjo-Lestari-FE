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

const cn = (...cls) => cls.filter(Boolean).join(' ');

// ponytail: mock dompet sampai endpoint /wallet/* dan /shu/* tersedia.
const MUTATIONS = [
    { date: '03 Sep 2026', desc: 'Setoran sampah NTR-20260903-0091', cat: 'Sampah', amount: '+ Rp 21.760', positive: true },
    { date: '01 Sep 2026', desc: 'Setoran sampah NTR-20260901-0084', cat: 'Sampah', amount: '+ Rp 33.600', positive: true },
    { date: '28 Agu 2026', desc: 'Penarikan tunai di kasir', cat: 'Penarikan', amount: '− Rp 50.000', positive: false },
    { date: '02 Mar 2026', desc: 'Pembagian SHU tahun buku 2025', cat: 'SHU', amount: '+ Rp 2.340.000', positive: true },
];

const SHU_HISTORY = [
    { year: '2025', modal: 'Rp 12.500.000', usaha: 'Rp 4.200.000', total: 'Rp 2.340.000', status: 'Diterima' },
    { year: '2024', modal: 'Rp 8.200.000', usaha: 'Rp 2.100.000', total: 'Rp 890.000', status: 'Diterima' },
];

// ─── Modal pengajuan penarikan ─────────────────────────────────
function WithdrawModal({ balance, onClose, onSuccess }) {
    const [method, setMethod] = useState('Tunai di Kasir');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const inputCls = 'h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15';
    const value = Number(String(amount).replace(/\D/g, '')) || 0;

    const submit = (e) => {
        e.preventDefault();
        if (value <= 0) { setError('Nominal penarikan wajib diisi.'); return; }
        if (value > balance) { setError('Nominal melebihi saldo dompet Anda.'); return; }
        setError('');
        onSuccess();
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
                    Saldo dompet Anda: <strong className="font-bold text-primary">Rp {balance.toLocaleString('id-ID')}</strong>
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
                    <label htmlFor="withdraw-amount" className="text-xs font-semibold text-foreground/80">Nominal Penarikan</label>
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
                {error && <p className="text-xs font-medium text-destructive">{error}</p>}
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose}
                        className="h-11 flex-1 rounded-xl border border-border bg-card text-sm font-semibold text-foreground/80 hover:bg-secondary transition-all">
                        Batal
                    </button>
                    <button type="submit"
                        className="h-11 flex-[1.5] rounded-xl bg-primary text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90">
                        Ajukan Penarikan
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function WalletAndShuPage() {
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [status, setStatus] = useState('');

    const balance = 128_460; // saldo dompet: hasil sampah + SHU (mock)
    const wasteBalance = 61_460;
    const shuBalance = 67_000;

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
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-200/90">Total Saldo Dompet</p>
                    <strong className="mt-1 block text-3xl font-extrabold tracking-tight md:text-4xl">
                        Rp {balance.toLocaleString('id-ID')}
                    </strong>
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3.5">
                            <Wallet size={20} className="text-emerald-300" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Hasil Sampah</p>
                                <strong className="text-sm font-bold">Rp {wasteBalance.toLocaleString('id-ID')}</strong>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3.5">
                            <Landmark size={20} className="text-amber-300" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Dividen SHU</p>
                                <strong className="text-sm font-bold">Rp {shuBalance.toLocaleString('id-ID')}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mutasi saldo */}
            <DataPanel
                title="Mutasi Saldo Dompet"
                toolbar={<DownloadButton label="Unduh Mutasi" />}
                headers={['Tanggal', 'Deskripsi', 'Kategori', 'Jumlah (IDR)']}
                rows={MUTATIONS.map((r, i) => [
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
                footer="Menampilkan 4 dari 32 mutasi"
            />

            {/* Riwayat SHU tahunan */}
            <DataPanel
                title="Rincian Perolehan SHU Tahunan"
                toolbar={<DownloadButton label="Unduh Riwayat SHU" />}
                headers={['Tahun Buku', 'Jasa Modal (Simpanan)', 'Jasa Usaha (Transaksi)', 'Total SHU Diterima', 'Status']}
                rows={SHU_HISTORY.map((r, i) => [
                    <strong key="y" className="font-bold text-foreground">{r.year}</strong>,
                    <span key="m" className="text-muted-foreground">{r.modal}</span>,
                    <span key="u" className="text-muted-foreground">{r.usaha}</span>,
                    <strong key="t" className="font-bold text-primary">{r.total}</strong>,
                    <Status key="s" kind="success">{r.status}</Status>,
                ])}
                footer="SHU dihitung dari 20% laba bersih koperasi sesuai porsi simpanan dan partisipasi usaha"
            />

            <WithdrawModal
                balance={balance}
                onClose={() => setWithdrawOpen(false)}
                onSuccess={() => { setWithdrawOpen(false); setStatus('Pengajuan Penarikan Terkirim'); }}
            />

            <StatusPopup
                open={Boolean(status)}
                title={status}
                description="Bendahara akan memproses pencairan sesuai metode yang Anda pilih."
                onClose={() => setStatus('')}
            />
        </div>
    );
}

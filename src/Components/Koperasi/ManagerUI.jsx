// Komponen UI khas portal Pengurus — dipindah dari Pages/Pengurus/Index.jsx
// agar bisa dipakai halaman Pengurus lain tanpa duplikasi (tampilan tidak berubah).
import { useState } from 'react';
import { ChevronLeft, ChevronRight, WalletCards } from 'lucide-react';

const cn = (...cls) => cls.filter(Boolean).join(' ');

export function PageHeader({ title, desc, action }) {
    return (
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
                {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
            </div>
            {action && <div className="flex flex-wrap items-center gap-3">{action}</div>}
        </div>
    );
}

export function StatCard({ icon: Icon = WalletCards, label, value, note, tone = 'blue', indicator = 'top' }) {
    const toneStyles = {
        blue: {
            iconBg: 'bg-blue-50 text-primary',
            border: indicator === 'top' ? 'border-t-4 border-t-primary' : 'border-l-4 border-l-primary',
            note: 'text-primary',
        },
        green: {
            iconBg: 'bg-emerald-50 text-emerald-600',
            border: indicator === 'top' ? 'border-t-4 border-t-emerald-600' : 'border-l-4 border-l-emerald-600',
            note: 'text-emerald-700 font-medium',
        },
        red: {
            iconBg: 'bg-rose-50 text-rose-600',
            border: indicator === 'top' ? 'border-t-4 border-t-rose-600' : 'border-l-4 border-l-rose-600',
            note: 'text-rose-600 font-medium',
        },
        gold: {
            iconBg: 'bg-amber-50 text-amber-700',
            border: indicator === 'top' ? 'border-t-4 border-t-amber-600' : 'border-l-4 border-l-amber-600',
            note: 'text-amber-700 font-medium',
        },
    };

    const s = toneStyles[tone] || toneStyles.blue;

    return (
        <article className={cn('flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md', s.border)}>
            <div className="flex items-center justify-between">
                <span className={cn('flex size-10 items-center justify-center rounded-xl', s.iconBg)}>
                    <Icon size={20} />
                </span>
                {note && <span className={cn('text-xs font-semibold', s.note)}>{note}</span>}
            </div>
            <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                <strong className="mt-1 block text-2xl font-bold text-foreground md:text-[26px]">{value}</strong>
            </div>
        </article>
    );
}

export function Pager({ total = 3 }) {
    const [page, setPage] = useState(1);
    return (
        <div className="flex items-center justify-end gap-1.5 p-4 border-t border-border/60">
            <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary disabled:opacity-40"
            >
                <ChevronLeft size={16} />
            </button>
            {Array.from({ length: total }, (_, i) => i + 1).map(x => (
                <button
                    key={x}
                    onClick={() => setPage(x)}
                    className={cn(
                        'flex size-9 items-center justify-center rounded-lg text-xs font-bold transition-all',
                        page === x
                            ? 'bg-primary text-white shadow-xs'
                            : 'border border-border bg-card text-foreground hover:bg-secondary'
                    )}
                >
                    {x}
                </button>
            ))}
            <button
                onClick={() => setPage(Math.min(total, page + 1))}
                disabled={page === total}
                className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-secondary disabled:opacity-40"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

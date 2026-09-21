// #21 — Badge tier CO2 (visual). Angka dari src/lib/co2.js (pure, self-check-able).
// Dipakai di detail tiket pengambilan sekarang; siap dipasang di profil &
// daftar anggota begitu endpoint agregasi BE tersedia.
import { Leaf } from 'lucide-react';
import { co2Estimate, co2Tier, TIER_STYLE } from '@/lib/co2';

export default function Co2Badge({ totalKg, compact = false }) {
    const style = TIER_STYLE[co2Tier(totalKg)];
    if (!style) return null;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${style.cls}`}>
            <Leaf size={12} />
            {style.label}
            {!compact && <span className="font-semibold opacity-80">· {co2Estimate(totalKg)} kg CO₂</span>}
        </span>
    );
}

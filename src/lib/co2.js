// #21 — Kalkulasi badge tier CO2 dari total berat sampah organik + anorganik.
// Tier (sprint): 1 = 10–30 kg (12–35 kg CO2) · 2 = 31–70 kg (36–85 kg CO2)
// · 3 = >70 kg (>85 kg CO2). Faktor konversi ~1,2 kg CO2 per kg sampah.
// Pure function tanpa dependensi agar bisa di-self-check: `node src/lib/co2.js`

export const CO2_PER_KG = 1.2;

export function co2Tier(totalKg) {
    const kg = Number(totalKg) || 0;
    if (kg > 70) return 3;
    if (kg >= 31) return 2;
    if (kg >= 10) return 1;
    return 0; // belum masuk tier
}

export function co2Estimate(totalKg) {
    return Math.round((Number(totalKg) || 0) * CO2_PER_KG);
}

// Visual config per tier (warna + label dampak) — dipakai Co2Badge.
export const TIER_STYLE = {
    0: null,
    1: { label: 'Tier 1 · Pemula', cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200', min: 10 },
    2: { label: 'Tier 2 · Aktif', cls: 'bg-sky-100 text-sky-800 ring-sky-200', min: 31 },
    3: { label: 'Tier 3 · Juara Lingkungan', cls: 'bg-violet-100 text-violet-800 ring-violet-200', min: 71 },
};

// ─── Self-check: node src/lib/co2.js ─────────────────────────
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('co2.js')) {
    console.assert(co2Tier(0) === 0 && co2Tier(9) === 0, 'bawah tier salah');
    console.assert(co2Tier(10) === 1 && co2Tier(30) === 1, 'tier 1 salah');
    console.assert(co2Tier(31) === 2 && co2Tier(70) === 2, 'tier 2 salah');
    console.assert(co2Tier(71) === 3 && co2Tier(120) === 3, 'tier 3 salah');
    console.assert(co2Estimate(10) === 12 && co2Estimate(30) === 36, 'estimasi CO2 salah');
    console.log('co2.js: semua self-check lolos');
}

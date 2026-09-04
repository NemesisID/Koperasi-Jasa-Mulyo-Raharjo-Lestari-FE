// Kalkulasi timbang sampah (FE-3.3): nilai kotor, potongan admin 20%, nilai bersih.
// Pure function tanpa dependensi agar mudah dites: `node src/lib/weighing.js`

export const ADMIN_FEE_RATE = 0.2;

export function calcWeighing(items) {
    // items: [{ weight, price }] — price per satuan sesuai lokasi (gudang/jemput)
    const gross = items.reduce(
        (sum, i) => sum + (Number(i.weight) || 0) * (Number(i.price) || 0),
        0,
    );
    const fee = Math.round(gross * ADMIN_FEE_RATE);
    return { gross, fee, net: gross - fee };
}

// ─── Self-check: node src/lib/weighing.js ────────────────────────
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('weighing.js')) {
    const a = calcWeighing([{ weight: 10, price: 3500 }]);
    console.assert(a.gross === 35000, `gross salah: ${a.gross}`);
    console.assert(a.fee === 7000, `fee salah: ${a.fee}`);
    console.assert(a.net === 28000, `net salah: ${a.net}`);

    const b = calcWeighing([
        { weight: 2.5, price: 2000 },
        { weight: 0, price: 12000 },
        { weight: 1.5, price: 0 },
    ]);
    console.assert(b.gross === 5000 && b.net === 4000, `multi-item salah: ${JSON.stringify(b)}`);

    const c = calcWeighing([]);
    console.assert(c.gross === 0 && c.fee === 0 && c.net === 0, 'empty salah');

    const d = calcWeighing([{ weight: 3.3, price: 3500 }]);
    console.assert(d.fee === Math.round(11550 * 0.2), 'pembulatan fee salah');

    console.log('weighing.js: semua self-check lolos');
}

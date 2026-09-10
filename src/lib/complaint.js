// R5 (revisi fase-2): label & warna status komplain.
// diterima/ditolak adalah status terminal di BE → ditampilkan sebagai "Selesai".
export const COMPLAINT_STATUS = {
    diajukan: { label: 'Diajukan', cls: 'bg-amber-100 text-amber-800' },
    proses: { label: 'Diproses', cls: 'bg-amber-100 text-amber-800' },
    diterima: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-800' },
    ditolak: { label: 'Ditolak', cls: 'bg-rose-100 text-rose-800' },
};

export const complaintStatus = (s) =>
    COMPLAINT_STATUS[s] ?? { label: s, cls: 'bg-amber-100 text-amber-800' };

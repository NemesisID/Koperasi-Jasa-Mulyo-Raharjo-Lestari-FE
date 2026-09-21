# Analisis Revisi Frontend — Sprint "Sampek Tuek"

> Sumber: `SPRINT SAMPEK TUEK (1).md` — hanya bagian **Frontend (Ragil)**.
> Tanggal analisis: 21 September 2026. Deadline testing: Selasa 22 September.
> Scope: Sprint 1 saja — **Marketplace (#22) dikecualikan total** (Sprint 2).
> Keputusan pemilik project: **#4 harga kotor** = halaman Manajemen Harga Sampah hanya menyisakan **Harga Jual** (input) + **Harga Beli** (auto = harga jual − 20%).

---

## TL;DR

Dari 21 task di catatan sprint, **20 menyentuh frontend** (total ±35 poin bobot FE tanpa marketplace). Temuan terpenting dari penelusuran kode:

1. **Halaman Manajemen Anggota (`src/Pages/Pengurus/Members.jsx`) masih 100% mock data** — tidak terhubung API sama sekali. Ini prasyarat dari 6 task sekaligus (#3 soft delete, #7 plotting, #8 plotting per alamat, #15 status nonaktif, #18 auto-plotting, #21 badge CO2). Ini pekerjaan terbesar yang tidak kelihatan dari tabel jobdesk.
2. **#10 "Upload gambar timbangan belum bisa" — kodenya sebenarnya sudah ada** (`WeighingForm.jsx` baris 425–447: kamera, preview, GPS, `POST /pickups/{id}/photo`). Kemungkinan besar masalahnya di kontrak/endpoint backend, bukan FE yang belum dibuat. Yang perlu: samakan kontrak dengan Ilham + perbaiki error handling (sekarang gagal **diam-diam**, tanpa pesan ke petugas).
3. **#13 "Pemasukan Sampah Lainnya" tidak ditemukan satu pun di kode FE** — label itu hampir pasti datang dari data kategori backend (`GET /finance-categories`). Task ini bukan kerjaan FE murni; perlu koordinasi dengan Ilham.
4. Tidak ada library drag-drop, tidak ada toast, dan `rp()` formatter uang (sudah `Intl.NumberFormat('id-ID')`) **sudah ada** tapi tidak dipakai konsisten.

---

## Kondisi arsitektur saat ini

| Aspek | Kondisi | Implikasi untuk revisi |
|---|---|---|
| Stack | React 19 + Vite 8 + Tailwind 3.4, react-router v7, `@headlessui` (terpasang tapi belum dipakai) | Tidak perlu tambah lib besar; cukup `@dnd-kit` untuk #2 |
| API layer | `src/lib/api.js`: wrapper `fetch` sendiri + hook `useApi`, Bearer token di localStorage `kjmrl_token`, sudah dukung FormData | Semua task baru tinggal pakai `useApi`; FormData untuk upload sudah didukung |
| Navigasi per role | 3 shell (Pengurus/Anggota/Petugas) pakai **switch state internal** di `Pages/<Role>/Index.jsx`, bukan nested route | Setiap halaman baru = edit switch di `Index.jsx` role terkait + sidebar di shell |
| Konfirmasi CUD | `ConfirmPopup` sudah ada di `Popups.jsx:534` tapi baru dipakai di 4 tempat (logout, hapus user `Users.jsx:279`, bayar wajib + generate tagihan `WajibOverview.jsx`) | #19 = inventaris + pasang di semua create/update/delete lain |
| Halaman yatim | `src/Pages/Anggota/WalletAndShu.jsx` & `Receipts.jsx` sudah jadi tapi **tidak dirouting** | Relevan untuk #15 (mutasi `potongan_saldo`) — sebaiknya sekalian diaktifkan |
| Format uang | `rp()` di `api.js:80` sudah `Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR'})` | #6 = pekerjaan konsistensi, bukan bikin dari nol |

---

## Analisis per task

### Blok A — Bug blocker (kontrak API sebagian sudah ada)

#### #16 Status penjemputan tidak sinkron (bobot 2)

**Akar masalah (sesuai diagnosis doc):** `PickupMonitor.jsx` (pengurus) fetch `?status=...` lalu menghitung statistik dari baris yang terfilter itu — "Sudah Selesai" selalu 0. Dashboard petugas fetch `?per_page=25` tanpa filter.

**Solusi FE:**
- Ganti hitung client-side dengan `GET /pickups/stats` (kontrak sudah ditulis: `{menunggu, selesai, batal, total, total_net_selesai}`).
- Lokasi: `src/Pages/Pengurus/PickupMonitor.jsx:92-94` (`doneCount`, `pendingCount`, `totalNet`) dan dashboard `src/Pages/Petugas/Index.jsx:48-102`.
- Kedua halaman wajib baca sumber statistik yang sama.

#### #7 + #8 + #18 Plotting (2 + 2 + 1) — satu paket

Semuanya **menggantung pada wiring halaman Members yang masih mock**. Yang perlu dibangun:

- Wiring `src/Pages/Pengurus/Members.jsx` ke `GET /members` sungguhan (drop `const MEMBERS` mock, baris 15). Tiap item kini punya `officer: {id, name} | null`.
- Tampilkan plotting **per member/alamat** (dropdown assign + filter `?officer_id=X`), bukan per tiket pickup seperti sekarang di `PickupMonitor`.
- Tampilkan hasil auto-assign petugas1 (#18) di list/detail anggota.
- Dropdown daftar petugas dari `GET /users?role=petugas` (sudah ada).

> ⚠️ **Inkonsistensi doc yang harus dikonfirmasi ke Ilham:** bagian "Status Backend" menyebut migrasi menambah `members.officer_id` (satu petugas per anggota), sedangkan tabel jobdesk #8 mensyaratkan relasi ke `member_address` (1 user 2 tempat = 2 entri). Bentuk tampilan FE tergantung jawaban ini — jangan mulai UI plotting sebelum dikonfirmasi.

#### #5 Hapus register publik (1)

Paling ringan:
- Hapus route `/register` di `src/main.jsx:19`.
- Hapus `src/Pages/Register.jsx` (POST ke `/auth/register-member` yang memang sudah dihapus Ilham).
- Hapus link "Daftar sebagai anggota" di `src/Pages/Login.jsx:101-104`.
- Jalur buat user oleh pengurus **tidak tersentuh** (sudah ada: `FormPopup` kind `member` → `POST /users`, dan `Users.jsx` UserForm).

#### #9 Hapus baris potongan 20% kedua di petugas (1)

Doc sudah memastikan backend hanya punya **satu** potongan (`TrashWeighingService::FEE_RATE`) — ini murni tampilan:
- Lokasi: hasil hitungan di `src/Pages/Petugas/WeighingForm.jsx` dan util `src/lib/weighing.js` (gross / 20% / net).
- Hapus **baris tampilan** potongan kedua; angka yang diterima anggota tidak berubah.

#### #1 Jadwal harian penjemputan (2)

- Halaman baru "jadwal per tanggal" + filter tanggal di sisi petugas (dan/atau pengurus).
- Daftarkan di switch `Pages/Petugas/Index.jsx` (dan/atau `ManagerPages`) + sidebar shell.
- Menunggu kontrak endpoint list per tanggal dari Ilham; selama belum ada, kerjakan dengan **mock** sesuai aturan kerja di doc.

### Blok B — Uang & data

#### #3 Soft delete anggota (2)

Setelah Members ter-wiring:
- Tombol hapus → `DELETE /members/{id}` (respons **200**, bukan 204) + `ConfirmPopup`.
- Tab "Terhapus" → `GET /members?trashed=1`.
- Tombol pulihkan → `PATCH /members/{id}/restore`, balikan `MemberResource`.
- Aksi pengurus saja; petugas dapat 403 — tampilkan pesan, jangan crash.

#### #15 Saldo hold 50k/bulan + nonaktif + bayar manual (3)

Tiga permukaan UI:
- **Anggota** (`src/Pages/Anggota/Index.jsx` dashboard): tampilkan `savings_hold` baru dari `GET /wallet/summary`, entri mutasi `source: "potongan_saldo"` (mapping source di `WalletAndShu.jsx:195-210` perlu ditambah — dan halaman ini yatim, sebaiknya sekalian dirouting), plus status anggota `nonaktif` + tombol bayar manual.
- **Pengurus** (`src/Pages/Pengurus/WajibOverview.jsx`): alur `POST /savings/pay` paket WAJIB Rp50.000 **sudah ada** — tinggal tambah kolom status/tunggakan dan penanganan pesan "Tagihan rutin bulan ini sudah lunas" (ditolak backend).
- Catatan: nilai tagihan sudah konsisten 50.000 sesuai keputusan doc (menyimpang dari PRD §5.1 — bukan urusan FE).

#### #4 Harga kotor — sesuai keputusan pemilik (1)

Di halaman **Manajemen Harga Sampah** (`src/Pages/Pengurus/TrashPrices.jsx`):
- Form/tabel hanya menyisakan **Harga Jual** (input) dan **Harga Beli** (auto = harga jual − 20%).
- Label "Harga Kotor" (`price_unsorted`) dihapus: baris 97, 146, 300.
- Label "Harga Bersih (auto 20%)" (dihitung FE, baris 39/106/316) diganti **"Harga Beli"**.

> ⚠️ **Risiko yang harus dikoordinasikan dengan Ilham:** `price_unsorted` masih dipakai backend menghitung upah anggota sampah **belum-terpilah** (`TrashWeighingService` cabang gudang). FE boleh berhenti menampilkannya, tapi nilai itu harus tetap hidup di BE (atau diturunkan dari harga jual). Konfirmasi juga label di papan harga anggota (`src/Pages/Anggota/PriceBoard.jsx:89`) — apakah "Harga Kotor" di sana ikut menjadi "Harga Beli".

#### #6 Titik ribuan + satuan Rp (2)

Fondasi sudah ada (`rp()` di `api.js:80`). Pekerjaannya konsistensi:
- Hapus `rp` duplikat di `ReceiptSuccessModal.jsx:7`.
- Ganti `toLocaleString('id-ID')` inline: `Pengurus/Index.jsx:521` (input total SHU), `Petugas/Index.jsx` (angka kg), `Popups.jsx:482`.
- Audit semua tampilan nominal (12+ file sudah terpetakan: `Pengurus/Index.jsx`, `TrashPrices.jsx`, `PickupMonitor.jsx`, `Users.jsx`, `WajibOverview.jsx`, `Withdrawals.jsx`, `Petugas/Index.jsx`, `WeighingForm.jsx`, `Anggota/Index.jsx`, `WalletAndShu.jsx`, `Receipts.jsx`, `ComplaintsDesk.jsx`).
- Pertimbangkan `MoneyField` di `Popups.jsx` menampilkan separator ribuan saat mengetik.

#### #20 Log perubahan harga sampah (2)

- Modal riwayat per kategori **sudah ada** di `TrashPrices.jsx` (`GET /trash-categories/{id}/price-history`).
- Yang perlu: naikkan menjadi halaman riwayat lintas kategori (harga lama, baru, user, waktu).
- Menunggu endpoint audit log dari Ilham.

#### #21 Badge tier CO2 (1)

- Komponen badge baru, dipasang di profil anggota & daftar anggota (lewat Members).
- Tier: **1** = 10–30 kg sampah (12–35 kg CO2), **2** = 31–70 kg (36–85 kg CO2), **3** = >70 kg (>85 kg CO2).
- Butuh endpoint agregasi dari Ilham; FE bisa mulai dari komponen + mock.

### Blok C — Fitur & polish

#### #2 Drag-drop urutan penjemputan (3)

- Tidak ada lib DnD — tambahkan `@dnd-kit/core` + `@dnd-kit/sortable` (paling cocok untuk React 19).
- Komponen sortable list di halaman penjemputan, **optimistic update** urutan.
- Sinkron via endpoint bulk reorder Ilham (kolom `sort_order`) — **kontraknya belum ada di doc, perlu dimintakan; ini dependency kritikal**.

#### #11 Detail pengambilan sampah (2)

- Modal baru (reuse `Modal` di `Popups.jsx`) per tiket: rincian jenis sampah, berat per jenis, foto bukti petugas.
- Saat ini belum ada modal per-tiket (yang ada history per member di `PickupMonitor`).
- Menunggu kontrak detail `GET /pickups/{id}`.

#### #17 Foto opsional di pengeluaran & pemasukan (1)

- `FormPopup` kind `income`/`expense` (`Popups.jsx:127-143, 336-350`) kini POST JSON tanpa foto.
- Ubah ke FormData + input file **opsional** + preview. Pola sudah ada: `Withdrawals.jsx:81-86` dan kamera `WeighingForm.jsx:430-434`.

#### #19 Popup konfirmasi semua CUD (3)

Komponen sudah ada; kerjanya **inventaris**. Yang teridentifikasi belum ber-konfirmasi:
- Simpan harga sampah (`TrashPrices.jsx` inline save).
- Assign petugas per tiket (`PickupMonitor.jsx`).
- Publish SHU, approve/reject penarikan (`Withdrawals.jsx`), resolve pengaduan.
- Semua create/edit via `FormPopup` (tambah, bukan ganti — FormPopup sendiri sudah jadi konfirmasi input).
- Sekalian: ganti `alert()` mentah di `PickupMonitor.jsx:84` dengan mekanisme error yang layak (belum ada toast — pertimbangkan toast ringan atau `StatusPopup`).

#### #12 UI pass (3)

Paling terakhir. Cakupan: spacing/konsistensi/responsive semua halaman + bersih-bersih:
- `Pager` masih dummy statis (`ManagerUI.jsx`).
- `DownloadButton` download .txt dummy (`MemberUI.jsx`).
- `AuthenticatedLayout.jsx` tidak terpakai.
- `@headlessui` terpasang tapi belum pernah dipakai.

#### #13 Rename "Pemasukan Sampah Lainnya" → "Penjualan Produk Lain" (1)

- **Tidak ada di kode FE** — label datang dari data kategori backend (`GET /finance-categories?type=income`, dipakai `Popups.jsx:193-198`).
- Tindakan FE: verifikasi tidak ada hardcode (sudah dilakukan: tidak ada), lalu koordinasi ke Ilham agar rename di data/enum backend. **Catat sebagai task backend, bukan FE.**

#### #14 SHU — SKIP (sesuai doc)

FE ("tampilkan rincian SHU per anggota") memang menunggu bentuk rincian yang tergantung keputusan **rata vs proporsional**. Benar ditunda, tidak dihitung sebagai progres.

---

## Urutan pengerjaan yang disarankan

Deadline testing besok (22 Sep) — prioritas ketat:

| Prioritas | Task | Alasan |
|---|---|---|
| **P0 (hari ini)** | Wiring `Members.jsx` ke API → #7/#8/#18, lalu #16, #5, #9, #10 | Bug inti + plotting; gate Jum malam menurut doc tergantung ini |
| **P1** | #3, #15, #4, #6 | Uang & data; #15 prasyarat marketplace Sprint 2 |
| **P2** | #2, #1, #11, #19, #20, #21, #17, #13* | Fitur; sebagian menunggu kontrak Ilham (* = koordinasi backend) |
| **P3** | #12 | Pass terakhir sebelum freeze (15:00 Senin) |

---

## Pertanyaan untuk daily sync dengan Ilham (sebelum mulai koding)

1. **Relasi plotting** — `members.officer_id` (satu per anggota, sesuai migrasi 17 Sep) atau per `member_address` (1 user 2 tempat = 2 entri, sesuai tabel #8)? Menentukan bentuk UI plotting.
2. **Kontrak yang belum tertulis**: bulk reorder (#2), endpoint jadwal harian (#1), detail pickup `GET /pickups/{id}` (#11), audit log harga (#20), badge CO2 (#21).
3. **Kepastian endpoint upload foto timbangan** (#10) — kodenya sudah ada di FE, tinggal cocokkan kontrak.
4. **Nasib `price_unsorted` di backend** setelah label "Harga Kotor" dihapus dari FE (#4) — masih dipakai hitung upah belum-terpilah.
5. **Rename kategori #13** di sisi backend (data/enum), karena label tidak ada di FE.

---

## Daftar file yang tersentuh (ringkasan)

| File | Task |
|---|---|
| `src/main.jsx` | #5 (hapus route register) |
| `src/Pages/Login.jsx` | #5 (hapus link daftar) |
| `src/Pages/Register.jsx` | #5 (dihapus) |
| `src/Pages/Pengurus/Members.jsx` | **wiring API** (prasyarat), #3, #7, #8, #15, #18, #21 |
| `src/Pages/Pengurus/PickupMonitor.jsx` | #16, #19 (confirm assign + ganti alert) |
| `src/Pages/Petugas/Index.jsx` | #16, #1, #6 |
| `src/Pages/Petugas/WeighingForm.jsx` | #9, #10 |
| `src/lib/weighing.js` | #9 |
| `src/Pages/Pengurus/TrashPrices.jsx` | #4, #20 |
| `src/Pages/Anggota/PriceBoard.jsx` | #4 (label) |
| `src/Pages/Anggota/Index.jsx` | #15, #6, #21 |
| `src/Pages/Anggota/WalletAndShu.jsx` | #15 (mapping `potongan_saldo`, routing) |
| `src/Pages/Pengurus/WajibOverview.jsx` | #15 (bayar manual + status) |
| `src/Components/Koperasi/Popups.jsx` | #6, #17, #19 |
| `src/Components/Koperasi/ReceiptSuccessModal.jsx` | #6 |
| `src/Pages/Pengurus/Index.jsx`, `src/Pages/Anggota/Index.jsx`, `src/Pages/Petugas/Index.jsx` | daftar halaman baru (#1, #11, #20, #21) |
| `package.json` | #2 (`@dnd-kit/core`, `@dnd-kit/sortable`) |

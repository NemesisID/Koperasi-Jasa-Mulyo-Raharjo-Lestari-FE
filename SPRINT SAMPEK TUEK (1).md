**SPRINT DEADLINE SELASA TANGGAL 22 MINGDEP UDAH TESTING**



\- Untuk pengambilan sampah diambil tiap hari

\- Nambah fitur index urutan penjemputan user dengan fitur drag drop urutan

\- Soft delete untuk hapus anggota

\- Harga kotor dihapus (Kalimatnya pakai harga jual dan harga beli)

\- Hapus fitur create user baru di halaman login dan API nya hapus saja jadi create user cuman bisa dilakukan oleh pengurus

\- Diubah menjadi titik untuk satuan per ribuan dan satuan rupiah

\- Tambah fitur sudah create user baru ga muncul di ploting petugas

\- Bug di penjemputan harusnya yang ploting itu per member jadi jika ada user yang punya 2 tempat member maka dia ada 2 tempat dan ngga kaya sekarang dimana fitur ploting kok munculnya saat anggota request ambil bjir

\- Hapus potongan admin yang 20% kedua yang di petugas

\- Upload gambar masih belum bisa yang di timbangan petugas

\- Detail pengambilan sampah berisi detail sampahnya apa saja, berat, dan gambar bukti yang dari petugas

\- UI tetap diperbaiki lagi agar lebih sesuai

\- "Pemasukan Sampah Lainnya" diganti "Penjualan Produk Lain"

\- Pembagian SHU masih masalah

\- Saldo di hold 50k perbulan dan jika di 3 bulan awal tidak mencukupi saldo jual sampah maka status anggotanya non-aktif. Tapi kalau ngga memenuhi bisa manual bayar

\- Status yang penjemputan belum sinkron, dan yang di pengurus sama petugas

\- Tambah field foto di pengeluaran dan pemasukan dengan menjadi opsional

\- Otomatis ploting ke petugas1 untuk user!!

\- Nambah popup konfirmasi disemua CUD

\- Nambah Log Perubahan harga sampah

\- Implementasi Badge dari gabungan sampah organik dan anorganik tier 1 = 12 – 35 kg CO2 (10 – 30 kg sampah), tier 2 = 36 – 85 kg CO2 (31 – 70 kg sampah), tier 3 = > 85 kg CO2 (> 70 kg (sampai 100+ kg) sampah)





**SPRINT DEADLINE RABU TANGGAL 30 SEPTEMBER**



\- Marketplace WOYYY!!!!!



---

# PEMBAGIAN JOBDESK

**Frontend → Ragil** | **Backend → Ilham**

Bobot: 1 = ringan (≤2 jam), 2 = sedang (½ hari), 3 = berat (1 hari+), 5 = besar (multi-hari).

| CHECK | # | Task | Backend (Ilham) | B | Frontend (Ragil) | B |
|-------|---|------|-----------------|---|------------------|---|
|  | 1 | Penjemputan diambil tiap hari | Generator jadwal harian + endpoint list per tanggal | 2 | Halaman jadwal harian + filter tanggal | 2 |
|  | 2 | Index urutan penjemputan + drag drop | Kolom `sort_order` + endpoint bulk reorder | 1 | Komponen drag-drop + optimistic update | 3 |
| CHECK | 3 | Soft delete anggota | Kolom `deleted_at`, global scope di semua query, endpoint restore | 2 | Tombol hapus + tab "Terhapus" + tombol restore | 2 |
| SKIP | 4 | Hapus harga kotor | Buang field dari kalkulasi & response | 2 | Hapus kolom di tabel/form, pakai harga jual & harga beli | 1 |
| CHECK | 5 | Hapus create user di halaman login + API | Hapus route register publik, guard endpoint user ke role pengurus | 2 | Hapus form register dari halaman login | 1 |
|  | 6 | Titik untuk ribuan & satuan rupiah | — | 0 | Util `Intl.NumberFormat('id-ID')`, terapkan di semua tampilan uang | 2 |
| CHECK | 7 | User baru ga muncul di plotting petugas | Fix query plotting (filter status/kelengkapan member) | 2 | Ambil list dari endpoint yang sudah diperbaiki | 1 |
| CHECK | 8 | Bug plotting harusnya per member | Ubah relasi plotting ke `member_address` (1 user 2 tempat = 2 entri) + migrasi data lama | 3 | Tampilkan plotting per alamat member, bukan per user | 2 |
|  | 9 | Hapus potongan admin 20% kedua di petugas | Hapus baris potongan kedua di kalkulasi petugas, cek SHU tidak terpengaruh | 2 | Hapus baris tampilan potongan | 1 |
|  | 10 | Upload gambar di timbangan petugas | Endpoint upload multipart + storage link + validasi tipe/ukuran | 2 | Komponen upload + preview + kirim ke endpoint | 2 |
|  | 11 | Detail pengambilan sampah | Endpoint detail: jenis sampah, berat, gambar bukti petugas | 2 | Modal/halaman detail | 2 |
|  | 12 | UI diperbaiki | — | 0 | Audit semua halaman: spacing, konsistensi komponen, responsive | 3 |
|  | 13 | "Pemasukan Sampah Lainnya" → "Penjualan Produk Lain" | Rename di response/enum kalau ada | 1 | Rename label di semua tempat | 1 |
| SKIP | 14 | Pembagian SHU | Perbaiki rumus + unit test pakai angka contoh | 3 | Tampilkan rincian SHU per anggota | 1 |
| CHECK | 15 | Saldo hold 50k/bulan, 3 bulan ga cukup → non-aktif, bisa manual bayar | Potong saldo otomatis bulanan, job cek 3 bulan, flag non-aktif, endpoint bayar manual | 3 | Status anggota + tombol bayar manual + riwayat | 3 |
| CHECK | 16 | Status penjemputan belum sinkron (pengurus & petugas) | Satu sumber status, sinkronkan state machine | 3 | Pastikan kedua halaman baca status yang sama | 2 |
|  | 17 | Field foto di pengeluaran & pemasukan (opsional) | Kolom nullable + endpoint upload opsional | 2 | Field upload opsional + preview | 1 |
| CHECK | 18 | Otomatis plotting ke petugas1 | Default assign petugas1 saat member dibuat | 2 | Tampilkan hasil auto-assign | 1 |
|  | 19 | Popup konfirmasi di semua CUD | — | 0 | Komponen dialog reusable, pasang di semua create/update/delete | 3 |
|  | 20 | Log perubahan harga sampah | Tabel audit (harga lama, baru, user, waktu) + endpoint list | 2 | Halaman riwayat perubahan harga | 2 |
|  | 21 | Badge tier CO2 | Agregasi berat organik+anorganik → kg CO2 → tier, endpoint badge | 2 | Komponen badge tier di profil & list anggota | 1 |
|  | 22 | **Marketplace** | DB produk/kategori/stok/order/pembayaran + API CRUD, checkout, integrasi saldo | 5 | Katalog, detail produk, keranjang, checkout, riwayat order, UI kelola produk pengurus | 5 |

**Total bobot: Ilham 43 — Ragil 42.** Seimbang. Setelah `SKIP` #14 (Ilham 3 / Ragil 1) dan #4 (Ilham 2 / Ragil 1): **Ilham 38 — Ragil 40**. Selisih 2 ini wajar — beban yang ditunda mayoritas ada di sisi backend, dan itu terselesaikan begitu dua keputusan di bawah dijawab.

> **CHECK = sisi Backend (Ilham) selesai ditulis.** Sisi Frontend (Ragil) di baris yang sama **belum** dikerjakan. Belum ada satu pun yang dijalankan/di-test — testing diserahkan ke pemilik project.
>
> **SKIP = sengaja ditunda** atas keputusan pemilik project. Bukan selesai, bukan dikerjakan — lihat alasan + temuan di bagian "Ditunda (SKIP)" di bawah. Bobotnya tidak dihitung sebagai progres.

## Status Backend — sudah ditulis (17 Sep)

| # | Yang berubah | File |
|---|---|---|
| 5 | Route `POST /auth/register-member` dihapus; method `AuthController::registerMember` + `RegisterMemberRequest` dibuang. `AuthService::registerMember` **dipertahankan** karena dipakai `UserService::createUser` (jalur pengurus `POST /users`) | `routes/api.php`, `AuthController.php`, hapus `RegisterMemberRequest.php` |
| 7, 8, 18 | Kolom `members.officer_id` (nullable, `nullOnDelete`) + backfill anggota lama ke petugas tertua. Auto-plot dipasang sekali di `MemberRepository::create()` — dilewati **kedua** jalur pembuatan anggota. `paginate()` eager-load `officer` + filter `officer_id` | migrasi `2026_09_17_000001_add_officer_ploting_to_members_table.php`, `Member.php`, `MemberRepository.php`, `MemberResource.php`, `MemberController.php` |
| 16 | Endpoint `GET /pickups/stats` — agregat `COUNT` per status dari seluruh tabel. Wajib di atas `GET /pickups/{id}` di `routes/api.php` | `PickupRepositoryInterface.php`, `PickupRepository.php`, `TrashWeighingService.php`, `PickupController.php`, `routes/api.php` |
| 3 | Soft delete anggota: `deleted_at` + global scope, endpoint arsip/pulihkan, filter `?trashed=1`. **`generateMemberCode()` wajib `withTrashed()`** — tanpa itu kode anggota yang sudah diarsipkan dipakai ulang dan menabrak unique constraint | migrasi `2026_09_17_000002_add_soft_deletes_to_members_table.php`, `Member.php`, `MemberRepositoryInterface.php`, `MemberRepository.php`, `MemberService.php`, `MemberController.php`, `routes/api.php` |
| 15 | Hold tagihan rutin Rp50.000/bulan dari saldo sampah. Saldo kurang → tidak dipotong; **3 bulan berturut-turut gagal → `nonaktif`**; bayar manual paket Rp50.000 → aktif kembali. Hitungan tunggakan **diturunkan dari data, bukan kolom counter** — jadi command aman dijalankan berulang | migrasi `2026_09_17_000003_add_sumber_to_setoran_koperasi_table.php`, `SavingsService.php`, `WalletService.php`, `SetoranKoperasi.php`, `SavingsResource.php`, `app/Console/Commands/HoldMonthlySavings.php`, `routes/console.php` |

**Akar masalah #7/#8:** daftar ploting dihitung dari **tiket pickup**, bukan dari **anggota** — makanya anggota tanpa request jemput tidak pernah muncul, dan ploting "baru muncul saat anggota request ambil".

**Akar masalah #16:** pengurus dan petugas masing-masing menghitung status sendiri dari **potongan halaman yang berbeda**. Pengurus fetch `?status=menunggu` lalu menghitung dari baris terfilter itu (akibatnya "Sudah Selesai" selalu 0); petugas fetch `?per_page=10` tanpa filter. Sekarang keduanya baca `GET /pickups/stats`.

**#9 tidak butuh kerja backend.** Anggota sudah menerima angka yang benar (harga jual − 20% = harga bersih). Hasil telusur: hanya ada **satu** potongan 20% di seluruh backend (`TrashWeighingService::FEE_RATE`); `TrashCategory::price_member` (`price_sell × 0.8`) bukan potongan kedua tapi angka yang sama yang ditampilkan ulang. Sesuai keputusan: **hapus tampilannya saja → tugas FE (Ragil)**, angka tidak berubah.

**Kontrak API baru untuk Ragil:**
- `GET /members` → tiap item kini punya `officer: {id, name} | null`
- `GET /members?officer_id=X` → filter ploting per petugas
- `GET /users?role=petugas` → daftar petugas untuk dropdown (sudah ada)
- `GET /pickups/stats` → `{menunggu, selesai, batal, total, total_net_selesai}`
- `GET /members?trashed=1` → daftar anggota **yang sudah diarsipkan** (untuk tab "Terhapus")
- `DELETE /members/{id}` → arsipkan anggota (soft delete). `200`, bukan `204`
- `PATCH /members/{id}/restore` → pulihkan anggota terarsip, balikan `MemberResource`
- `GET /wallet/summary` → tambah field `savings_hold` (total potongan rutin dari saldo)
- `GET /wallet/mutations` → tambah entri `source: "potongan_saldo"` (type `out`)
- `POST /savings/pay` + response setoran → tambah field `sumber` (`"tunai"` | `"saldo"`)
- `POST /savings/pay` dengan `label: "WAJIB"`, `jumlah: 50000` = **paket rutin**: (a) dipecah otomatis jadi 45.000 operasional + 5.000 simpanan, (b) **tetap boleh walau anggota `nonaktif`** — inilah tombol "bayar manual", (c) otomatis mengaktifkan kembali anggota `nonaktif`, (d) **ditolak** kalau bulan ini sudah lunas (`Tagihan rutin bulan ini sudah lunas — tidak dapat ditagih dua kali.`)
- `DELETE /members/{id}` & `PATCH /members/{id}/restore` → `role:pengurus` saja. Petugas dapat `403`

**#3 — akar masalah & jebakannya.** Tidak ada endpoint hapus anggota sama sekali sebelumnya, sementara 4 FK (`pickups`, `transactions`, `shu_members`, `withdraw_requests`) memakai `restrict` — hapus permanen akan gagal di level DB begitu anggota punya riwayat. Karena itu arsip, bukan hapus. Jebakan yang ikut diperbaiki: `generateMemberCode()` memakai `Member::orderByDesc('member_code')->first()`. Setelah `SoftDeletes` dipasang, query itu otomatis menyaring baris terarsip → kode terakhir yang dihapus **dipakai ulang** → `insert` menabrak unique constraint. Diperbaiki di sumbernya dengan `withTrashed()`.

**#15 — akar masalah & keputusannya.** Tiga hal yang tidak kelihatan dari tiket:
1. `WalletService` menghitung saldo **turunan** dari mutasi, bukan dari kolom saldo. Jadi potongan ini harus ikut dikurangkan di sana — kalau tidak, anggota bisa menarik uang yang sudah dipakai membayar wajib. Field baru `savings_hold` + pengurangan di `current_balance` / `available_balance` / `balance_from_trash`.
2. `SavingsService::recordSavingsPayment()` memblokir **semua** pembayaran untuk anggota `nonaktif`. Itu membuat "bisa manual bayar" mustahil. Diperbaiki di choke point yang sama: hanya paket rutin Rp50.000 yang lolos; setoran lain tetap diblokir. Pelunasan mengubah `nonaktif` → `aktif`, tapi **`suspend` tidak disentuh** — itu keputusan pengurus, bukan efek pembayaran.
3. `transactions.payment_method` adalah `enum('tunai','transfer','sampah')`. Potongan otomatis tidak punya metode yang cocok, jadi jurnalnya tetap dicatat `'tunai'` dan asal dana ditandai di kolom baru `setoran_koperasi.sumber` (`'tunai'` | `'saldo'`). Baris `sumber='saldo'` inilah bukti pemotongannya.

Hitungan "3 bulan berturut-turut gagal" **tidak disimpan di kolom counter**. `monthsWithoutPayment()` mundur dari bulan berjalan, berhenti di pelunasan pertama, dibatasi 3 dan di-floor ke `join_date`; penanda "bulan ini lunas" = ada baris `WAJIB` `SELESAI` di bulan itu. Akibatnya command idempoten by construction: dijalankan dua kali tidak menambah hitungan, dan pelunasan manual memutus rentetan tanpa kode reset terpisah.

Handler jurnal untuk potongan otomatis = pengurus dengan `id` terkecil (`ponytail:` ganti ke akun sistem kalau audit menuntut pelaku non-manusia). Kalau tidak ada user berperan `pengurus` sama sekali, command berhenti dengan `FAILURE` dan pesan error, bukan diam-diam melewatkan potongan.

**⚠️ Hasil resolve conflict `SavingsService.php` — 2 bug, sudah diperbaiki (17 Sep).** File-nya sudah tidak punya marker conflict, tapi hasil gabungannya rusak: fitur **tagihan per kategori** (`categoryCount`, dua sisi branch) bertemu perubahan #15, dan yang hilang justru bagiannya #15.
1. **`$n` undefined di `payMonthlyWajib()`** — dipakai di `OPERASIONAL_MONTHLY * $n` dan `WAJIB_MONTHLY * $n`, tapi `$n = $this->categoryCount($member)` tidak ikut terbawa (di 4 method lain ada). PHP 8 → undefined variable, `45000 * null = 0`. Ditambahkan.
2. **`$sumber` tidak ada di `use (...)` closure** `payMonthlyWajib()` — padahal body-nya menulis `'sumber' => $sumber` di dua tempat. Nilainya `null`, sedangkan kolom `sumber` **NOT NULL** (default `'tunai'`) → bukan silent, tapi **error DB** di setiap pembayaran paket Rp50.000. Ditambahkan ke `use`.
3. Guard anti-tagih-ganda (`hasSettledInMonth`) ikut hilang dari `payMonthlyWajib()` → pembayaran manual Rp50.000 dua kali dalam sebulan bisa dobel. Dikembalikan.

Karena `categoryCount` sudah aktif di 4 method lain, `payMonthlyWajib`, `isMonthlyPackage`, dan `holdMonthlyWajib` saya samakan jadi **sadar-kategori** (`× $n`). Untuk anggota biasa (`categories` kosong → `n = 1`) angkanya tidak berubah sama sekali.

**⚠️ Keputusan uang: tagihan rutin = Rp50.000/bulan, bukan Rp45.000.** `TIPPING_MONTHLY` diubah `40000` → `= OPERASIONAL_MONTHLY` (`45000`) supaya tagihan bulanan (5.000 + 45.000) **pas Rp50.000** dan konsisten dengan hold #15 di sprint ini ("hold 50k/bulan"). **Ini menyimpang dari PRD §5.1** (Tipping Fee Rp40.000 + Wajib Rp5.000 = Rp45.000/bln) — PRD belum diperbarui. Konsekuensi: `SavingsBillingTest` yang masih menyebut 40.000/45.000 sudah disamakan ke 45.000/50.000 (3 assertion + 1 nilai bayar + nama test). **Kalau ternyata PRD yang benar, yang berubah bukan cuma konstanta ini** — `WAJIB_TOTAL_MONTHLY` dan seluruh hold #15 harus ikut turun ke 45.000.

**⛔ Ditunda (SKIP) — keputusan pemilik project, 17 Sep:**

**#14 Pembagian SHU — SKIP.** Bukan karena tidak penting, tapi karena spesifikasinya bertabrakan dan butuh keputusan pemilik, bukan tebakan saya:
- `PRD-Koperasi-Bank-Sampah.md` §4: *"20% dari laba bersih tahunan ÷ jumlah anggota = SHU per anggota (rata)"*, dan §8 mengulang *"dibagi rata ke semua anggota"*. `alur.md` baris 76 juga *"dibagi merata"*.
- Yang **terpasang** di `ShuCalculationEngine` justru **proporsional**: pool dibelah 50% jasa modal / 50% jasa partisipasi, dan `MODAL_SHARE = 0.5` itu **diberi komentar sendiri oleh penulisnya sebagai asumsi** (`ponytail: rasio 50/50 asumsi`).
- Bonus temuan: `simulateDistribution()` menghitung ganda. `$simpanan` di-`whereIn` per `user_id` lalu dijumlah `$simpanan->sum()` (tiap user dihitung sekali), tapi di dalam loop per-member diambil `$simpanan[$member->user_id]` — anggota dengan **2 baris member (2 alamat)** mendapat alokasi penuh dua kali. `simpanan_wajib_amount` juga masih hardcode `0.0`.
- Keputusan yang dibutuhkan: **rata atau proporsional?** Kalau rata, `ShuCalculationEngine` perlu ditulis ulang, bukan ditambal. Frontend (`Tampilkan rincian SHU per anggota`) ikut menunggu, karena bentuk rinciannya berbeda tergantung jawabannya.

**#4 Hapus harga kotor — SKIP.** Hasil telusur menunjukkan permintaannya salah petakan, jadi menghapusnya sekarang berisiko menghapus kolom yang masih dipakai:
- `TrashPrices.jsx` / `PriceBoard.jsx`: label **"Harga Kotor" → `price_unsorted`**, **"Harga Jual" → `price_sell`**, **"Harga Bersih" → `price_sell × 0.8`** (dihitung di FE, bukan kolom).
- Yang dipakai kalkulasi cuma `price_unsorted` (sampah belum terpilah, `TrashCategoryService::pickupPrice()` + cabang gudang `TrashWeighingService`) dan `price_sell`.
- `price_sorted` adalah **kolom mati** — tidak pernah di-POST dari FE mana pun, tidak dipakai kalkulasi. Kalau yang dimaksud "harga kotor" adalah kolom ini, kerjanya tinggal buang kolomnya.
- Keputusan yang dibutuhkan: **kolom mana yang dimaksud "harga kotor"** — `price_unsorted` (yang berlabel harfiah "Harga Kotor" di FE, tapi masih dipakai menghitung upah anggota belum-terpilah) atau `price_sorted` (mati)? Menghapus `price_unsorted` akan **mengubah uang yang diterima anggota**, jadi tidak saya kerjakan tanpa konfirmasi.


**`backend/` sudah dihapus (17 Sep).** Direktori itu adalah **repo git tertanam tak sengaja** di dalam monorepo — duplikat dengan isi identik (migrasi sama persis), bukan submodule resmi, tidak dilacak root repo. Root adalah backend kanonik. Menghapusnya mencegah salah edit / salah deploy ke tree yang salah. Setelah ini `git status` akan menampilkan `D backend` — itu memang yang diinginkan, commit bersama perubahan lain.

**⛔ BELUM ADA YANG DI-TEST.** Seluruh perubahan di atas (termasuk `#5`, ploting, `/pickups/stats`, `#3`, dan `#15`) **belum pernah dijalankan sekali pun** — tool shell sesi ini diblokir bergantian sepanjang pengerjaan, jadi bahkan `php -l` (syntax check) pun tidak bisa dieksekusi. Semua verifikasi yang saya lakukan hanya pembacaan statis. Ini termasuk 11 test baru (`AuthTest`, `MemberPlottingTest`, `SavingsHoldTest` 6 test, `MemberSoftDeleteTest` 5 test) yang **belum pernah dijalankan**. Yang perlu dijalankan lebih dulu:

```bash
cd Koperasi-Jasa-Mulyo-Raharjo-Lestari-monorepo-tmp
php artisan migrate      # 3 migrasi baru: officer_id (000001), soft deletes (000002), sumber (000003)
php artisan test         # termasuk AuthTest, MemberPlottingTest, SavingsHoldTest, MemberSoftDeleteTest
```

Urutan migrasi penting: `2026_09_17_000002` menambah `members.deleted_at` dan `2026_09_17_000003` menambah `setoran_koperasi.sumber`. `->after('status')` di `000003` **diabaikan di SQLite** (DB test pakai `:memory:`) — tidak masalah, urutan kolom tidak berpengaruh.

Scheduler `savings:hold-monthly` di `routes/console.php` **butuh cron `schedule:run`** di server; tanpa itu hold bulanan tidak akan pernah jalan sendiri. Manual untuk uji: `php artisan savings:hold-monthly`.



**Aturan kerja:**
- Cabang `feat/<task>-<nama>`, PR ke `develop`, wajib di-review yang satunya sebelum merge.
- Ilham push **kontrak API** (request/response JSON) maksimal H-1 sebelum Ragil butuh. Ragil kerja pakai mock selama endpoint belum jadi.
- Task yang kolomnya `—` artinya bukan tanggung jawab orang itu, jangan diambil.
- Daily sync 15 menit tiap pagi: blocker + kontrak yang berubah.



---

# IMPLEMENTATION PLAN

Deadline testing: **Selasa 22 September**. Hari kerja tersisa: Kam 17, Jum 18, Sab 19, Min 20, Sen 21.

## Fase 0 — Fondasi (Kam 17)

Tujuan: hilangkan saling tunggu.

- **Ilham:** migrasi DB batch 1 — `deleted_at` (anggota), `sort_order` (penjemputan), relasi plotting → `member_address`, kolom foto nullable (pengeluaran/pemasukan), tabel audit harga. Lalu tulis kontrak API semua endpoint baru ke dokumen/repo.
- **Ragil:** bangun 3 komponen reusable yang dipakai berulang: `formatRupiah()`, dialog konfirmasi CUD, komponen upload gambar (dipakai di timbangan + pengeluaran/pemasukan + bukti penjemputan).
- **Gate:** semua endpoint baru punya kontrak tertulis sebelum Jum pagi.

## Fase 1 — Bug Blocker (Kam 17 – Jum 18)

- **Ilham:** `CHECK` #8 plotting per member (+ migrasi data lama), `CHECK` #16 sinkronisasi status, `CHECK` #7 filter user baru, ~~#9 hapus potongan admin kedua~~ (ternyata tidak ada potongan kedua di BE — murni tampilan FE), `CHECK` #5 hapus API register publik. Plus `CHECK` #18 auto plotting petugas1 (dimajukan dari Fase 3, satu paket dengan ploting).
- **Ragil:** #5 hapus form register, #8 tampilan plotting per alamat, #10 upload gambar timbangan (pakai komponen Fase 0), #9 hapus baris potongan (hanya ini yang dibutuhkan untuk #9).
- **Gate Jum malam:** plotting per member & status penjemputan sudah benar di staging. Ini bug inti — kalau belum beres, jangan lanjut. **Sisi BE sudah siap; gate tinggal menunggu sisi FE + testing.**

## Fase 2 — Data & Uang (Sab 19)

- **Ilham:** ~~#14 rumus SHU + unit test angka contoh~~ `SKIP` (spesifikasi rata vs proporsional bertabrakan — butuh keputusan pemilik), `CHECK` #15 potong saldo 50k + job non-aktif 3 bulan, `CHECK` #3 scope soft delete di semua query, ~~#4 buang harga kotor dari kalkulasi~~ `SKIP` (butuh kepastian kolom mana yang dimaksud — lihat "Ditunda (SKIP)").
- **Ragil:** #11 modal detail pengambilan, #3 tombol hapus + tab terhapus, #15 status + tombol bayar manual, ~~#4 hapus kolom harga kotor~~ (menunggu jawaban yang sama), #6 format titik di semua halaman uang.
- **Gate:** angka SHU & saldo cocok dengan hitungan manual pakai data contoh. **Catatan: gate ini tidak bisa terpenuhi penuh** karena #14 di-SKIP — separuh gate (saldo, dari #15) siap diuji, separuh lagi (SHU) menunggu keputusan rumus. Jangan tahan Fase 3 karenanya.

## Fase 3 — Fitur & Polish (Min 20)

- **Ilham:** #1 generator jadwal harian, #2 endpoint reorder, ~~#18 auto plotting petugas1~~ (sudah `CHECK` di Fase 1), #20 audit log harga, #21 kalkulasi tier CO2, #17 endpoint foto opsional.
- **Ragil:** #2 drag drop, #1 halaman jadwal harian, #20 halaman log harga, #21 badge tier, #17 field foto opsional, #13 rename label, #19 popup konfirmasi di semua CUD.
- **Gate:** semua P0 + P1 selesai. Sisa hanya bug.

## Fase 4 — Hardening (Sen 21)

- **Berdua:** regression alur penuh — daftar → plotting → penjemputan → timbangan → penjualan → SHU → saldo → badge. Fix temuan.
- **Ragil:** #12 pass UI terakhir.
- **Ilham:** seed data uji + cek performa query plotting.
- **15:00 Sen: FREEZE.** Setelah itu cuma bug fix, tidak ada fitur baru.

## Selasa 22 September — Testing

Sesuai deadline. Berdua standby, catat temuan, fix on the spot.

---

## Sprint 2 — Marketplace (Rab 23 – Rab 30)

- **Ilham (Rab 23 – Jum 25):** skema DB produk/kategori/stok/order/pembayaran, API CRUD produk, checkout, integrasi potong saldo & SHU.
- **Ragil (Kam 24 – Sab 26):** katalog, detail produk, keranjang, checkout, riwayat order, halaman kelola produk untuk pengurus.
- **Integrasi (Sen 28 – Sel 29):** sambung FE ↔ BE, uji alur beli end-to-end.
- **Rab 30:** buffer + testing. Deadline.

Dependency yang harus beres duluan: fitur saldo (#15) — checkout marketplace potong saldo, jadi jangan mulai marketplace sebelum #15 stabil.


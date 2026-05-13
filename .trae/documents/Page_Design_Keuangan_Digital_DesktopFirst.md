# Page Design (Desktop-first) — Aplikasi Keuangan Digital

## Global Styles (Tailwind design tokens)
- Layout grid: max-w-6xl, 12-col grid, gap-6; konten utama min-h-screen.
- Warna: background `slate-950`, surface `slate-900`, card `slate-900/60`, border `slate-800`, teks `slate-100`, muted `slate-400`, accent `emerald-400`, danger `rose-400`.
- Tipografi: base 14–16px; heading 24/20/18; angka (amount) gunakan tabular-nums.
- Button: primary (emerald), secondary (slate), danger (rose); hover + focus ring `ring-emerald-400/50`.
- Form: input tinggi 40–44px, helper text kecil, state error jelas.
- Responsif: desktop-first; tablet di 1024→768 (sidebar collapsible), mobile (<=640) jadi stacked.

## 1) Halaman Masuk/Daftar & Verifikasi
**Meta**: Title “Masuk — Monetra”, desc singkat keamanan login.
**Layout**: 2 kolom (kiri form, kanan panel trust) dengan CSS Grid; pada mobile jadi 1 kolom.
**Structure**
- Header minimal: logo + link “Bantuan”.
- Card Form Auth:
  - Tabs: Masuk | Daftar.
  - Field: email/HP, password; CTA utama.
  - Link: Lupa sandi.
- Panel Trust:
  - Poin keamanan (2FA, enkripsi), compliance badges teks (OJK/BI/PCI) sebagai “informational”.
- Verifikasi/KYC ringan (modal/stepper setelah daftar): data dasar + status “unverified/verified”.
**States**: loading pada submit, error inline, lockout message bila gagal berulang.

## 2) Dashboard
**Meta**: Title “Dashboard — Monetra”, OG title sama.
**Layout**: App shell (topbar + sidebar kiri + content). Sidebar fixed desktop.
**Structure**
- Topbar: search global (transaksi), tombol “Tambah Transaksi”, avatar.
- Sidebar: Dashboard, Transaksi, Anggaran, Investasi, QRIS, Akun.
- Content (12-col grid):
  - Row 1 (cards): Total pemasukan, total pengeluaran, saldo bersih.
  - Row 2: Grafik tren (30 hari) + “Anggaran bulan ini” (progress bar per kategori top 3).
  - Row 3: “Transaksi terbaru” (table ringkas) + “Portofolio ringkas”.
  - Sticky CTA: “Bayar QRIS” dan “Generate QR”.
**Interactions**: klik card membuka halaman terkait dengan filter otomatis.

## 3) Transaksi
**Meta**: Title “Transaksi — Monetra”.
**Layout**: Split view desktop (kiri daftar, kanan detail/form) memakai Flexbox; mobile jadi stack.
**Structure**
- Toolbar: rentang tanggal, tipe, kategori, sumber (manual/impor), search.
- Table/List:
  - Kolom: tanggal, deskripsi, kategori, amount (warna beda income/expense), status review.
  - Bulk actions: tandai kategori, hapus.
- Detail drawer/panel:
  - Form tambah/edit: tipe, amount, kategori, tanggal, catatan, lampiran (opsional).
- Impor: area upload CSV + mapping kolom sederhana + preview + “deteksi duplikat”.
**States**: empty state + CTA tambah/impor; error parsing impor.

## 4) Anggaran
**Meta**: Title “Anggaran — Monetra”.
**Layout**: Grid card + detail panel.
**Structure**
- Header: pilih periode (bulan), tombol “Buat Anggaran”.
- Cards per kategori:
  - Limit, terpakai, sisa; progress bar; badge “mendekati limit/melewati”.
- Detail anggaran:
  - Breakdown transaksi untuk kategori tsb.
- Modal buat/edit:
  - kategori, limit, ambang peringatan.
**Interactions**: saat melewati ambang, tampilkan alert non-intrusif (toast + banner).

## 5) Investasi
**Meta**: Title “Investasi — Monetra”.
**Layout**: 2 kolom (portofolio + aktivitas) dengan Grid.
**Structure**
- Ringkasan portofolio: nilai total, P/L sederhana (berdasarkan input), alokasi aset.
- Daftar aset (table): simbol, unit, avg price, nilai.
- Aktivitas (investment trades): list + filter; tombol “Catat Beli/Jual”.
- Modal catat trade: simbol, side, qty, price, fee, tanggal.
**States**: disclaimer kecil “bukan nasihat investasi”.

## 6) Pembayaran QRIS
**Meta**: Title “QRIS — Monetra”.
**Layout**: 3 step flow desktop (Scan/Generate → Konfirmasi → Status) menggunakan stepper horizontal.
**Structure**
- Tab: “Scan QR” | “Generate QR”.
- Scan:
  - Kamera preview (atau upload gambar QR), hasil parsing merchant + nominal (jika ada).
- Konfirmasi:
  - Field nominal (editable bila allowed), catatan, ringkasan biaya (jika ada), CTA “Bayar”.
- Status:
  - Timeline status (pending → sukses/gagal) + tombol “Simpan bukti”.
- Riwayat: tabel pembayaran, filter status.
**Security UX**: tampilkan peringatan sebelum bayar (merchant & nominal) + require re-auth (opsional) untuk nominal besar.

## 7) Akun, Keamanan & Kepatuhan
**Meta**: Title “Akun & Keamanan — Monetra”.
**Layout**: Settings layout (left subnav, right content) dengan Flexbox.
**Structure**
- Subnav: Profil, Keamanan, Consent & Data, Audit Aktivitas, Kebijakan.
- Profil: nama, kontak, status verifikasi.
- Keamanan:
  - Ubah sandi, aktifkan 2FA, daftar sesi/perangkat + tombol “Keluar dari semua”.
- Consent & Data:
  - Toggle persetujuan pemrosesan data, unduh ringkasan data.
- Audit Aktivitas:
  - Tabel event: waktu, aksi, IP (masked), perangkat, risk badge.
- Kebijakan:
  - Tautan kebijakan privasi, syarat, dan ringkasan praktik keamanan.

## 8) Admin Compliance (internal)
**Meta**: Title “Compliance Console”.
**Layout**: Dashboard tabel-heavy; filter panel kiri + hasil kanan.
**Structure**
- KPI cards: login gagal tinggi, perubahan 2FA, QRIS gagal, ekspor laporan.
- Audit explorer: filter (user, action, risk, tanggal) + detail event.
- Export: CSV/PDF (opsional) + alasan ekspor (wajib isi).
**Controls**: akses berbasis role; banner “internal only”; semua aksi admin masuk audit log.

# Kostlyfe — Manajemen Kontrakan

Aplikasi untuk mengelola kontrakan: tagihan bulanan, pembayaran (termasuk bayar di muka), perpanjangan waktu bayar, potongan renovasi, pengeluaran, kwitansi PDF, dan pengingat WhatsApp.

Stack: Next.js 16 (App Router, Cache Components) · Supabase (lokal via Docker) · Tailwind v4 · shadcn/ui.

## Menjalankan

Prasyarat: Docker Desktop berjalan, Node 22+, pnpm, [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
pnpm install
supabase start                 # menjalankan Postgres, Auth, Storage, Studio di Docker
supabase status -o env         # salin API_URL & PUBLISHABLE_KEY ke .env.local (lihat .env.example)
pnpm dev                       # http://localhost:3000
```

Login data contoh: `owner@kostlyfe.test` / `password123` (dari `supabase/seed.sql`).
Supabase Studio: http://127.0.0.1:54323

Reset database + seed: `supabase db reset`

## Cara kerja tagihan

- **Sewa** menghasilkan **tagihan per bulan** (`invoices`) mulai bulan awal sewa, otomatis dibuat s/d bulan berjalan.
- **Pembayaran** dialokasikan ke tagihan tertua yang belum lunas (FIFO). Bayar 2/6/12 bulan sekaligus → tagihan bulan depan dibuat dan langsung lunas. Kelebihan disimpan sebagai saldo.
- **Perpanjangan**: tagihan diberi jatuh tempo baru; selama belum lewat, statusnya *Diperpanjang* (bukan *Telat*).
- **Renovasi** yang ditalangi penghuni dipotong dari tagihan, sekaligus atau dicicil N bulan (sisa pembulatan di bulan terakhir). Renovasi tanpa potongan dihitung sebagai pengeluaran pemilik.
- Semua logika uang ada di fungsi Postgres (`supabase/migrations`) — `record_payment`, `reallocate_lease`, `apply_renovation`, view `invoice_balances` & `lease_summaries`.

## Test

```bash
supabase test db     # pgTAP: alokasi pembayaran, prepay, renovasi, perpanjangan, RLS
pnpm vitest run      # util format, WhatsApp, billing
pnpm lint && pnpm build
```

## Struktur

```
src/app/(app)/*          halaman: dashboard, tagihan, pembayaran, kontrakan, penghuni, sewa, renovasi, pengeluaran, pengaturan
src/app/api/kwitansi     kwitansi PDF
src/features/<domain>    server actions + form per domain
src/lib                  supabase client, format, billing, whatsapp
supabase/migrations      skema, RLS, view, fungsi
supabase/seed.sql        data contoh
```

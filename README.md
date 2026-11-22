# Portal Monitoring & Pemulihan Distribusi Rapor MANAGE (HRD HMSI ITS)

> **Solusi Arsitektur Resilien untuk Mengatasi Script Execution Timeout 6 Menit pada Google Apps Script (GAS) melalui Mekanisme Mini-Batching & Recovery Engine Idempoten.**

---

## 📌 1. Latar Belakang & Masalah Operasional

* **Konteks:** Distribusi rapor evaluasi kinerja tahunan untuk **210 mahasiswa/fungsionaris MANAGE HMSI ITS**.
* **Limitasi Teknis:** Google Apps Script (GAS) memiliki batasan keras waktu eksekusi skrip maksimal **6 menit (360 detik)** per eksekusi.
* **Insiden:**
  * **Baris 1 – 34:** Berhasil digenerate dan dikirim via email (**Terkirim Aman**).
  * **Baris 35 (Cahyo Nugroho - NRP 5026231035):** Eksekusi terhenti mendadak akibat timeout saat merender dokumen PDF (`Script execution timed out`).
  * **Baris 36 – 210 (175 Mahasiswa):** Tertahan dalam status antrean (`Pending`).
* **Kebutuhan Solusi:** Dibutuhkan sistem portal monitoring satu pintu yang memicu pemulihan (recovery trigger) secara terarah dan terukur berbasis **mini-batch (3 baris per trigger)**, sehingga eksekusi tidak lagi menabrak limit 6 menit, data terkirim aman, dan terhindar dari spam email ganda (idempoten).

---

## 📁 2. Struktur Proyek

```text
Capstone/
├── Apps/
│   └── prototype_q204_v2.html     # Standalone Dark/Slate Web Dashboard (Ready-to-deploy Vercel)
├── backend/
│   ├── Code.gs                    # Production Script Google Apps Script (doPost, createReportPdf, sendReportEmail)
│   └── mock-server.js             # Local Node.js Mock Webhook Runner (Simulasi HTTP POST GAS)
├── src/
│   ├── app/
│   │   ├── api/recovery/route.ts  # Next.js API Route (Proxy ke GAS atau Internal Mock Engine)
│   │   ├── globals.css            # Tailwind & Dark Mode Styling
│   │   ├── layout.tsx             # Root Layout Next.js
│   │   └── page.tsx               # Next.js Main Page
│   └── components/
│       └── RecoveryDashboard.tsx  # React Component Dashboard dengan State & Console Log
├── package.json                   # Dependensi Node.js / Next.js / Tailwind
├── vercel.json                    # Konfigurasi routing & rewrites Vercel
├── tailwind.config.js             # Konfigurasi Tailwind CSS
└── tsconfig.json                  # Konfigurasi TypeScript
```

---

## 🚀 3. Panduan Menjalankan Sistem

### Opsi A: Menjalankan Frontend Next.js (React + Tailwind)
```bash
# 1. Jalankan Next.js Development Server
npm run dev
# Buka http://localhost:3000 pada browser
```

### Opsi B: Menjalankan Backend Mock Webhook Runner
Jika Anda ingin menguji respon webhook backend secara lokal tanpa harus deploy ke Google Apps Script:
```bash
# Jalankan mock runner
npm run mock:backend
# Server akan aktif di http://localhost:3001/api/recovery
```

### Opsi C: Membuka Langsung Prototipe Web (Vercel Ready)
Buka file `Apps/prototype_q204_v2.html` langsung di browser, atau deploy ke Vercel (sudah terintegrasi otomatis melalui `vercel.json`).

---

## ⚙️ 4. Panduan Pemasangan di Google Apps Script (Production)

1. Buka spreadsheet database rapor Anda di Google Sheets.
2. Klik menu **Extensions** > **Apps Script**.
3. Buat file baru atau ganti isi file `Code.gs` dengan kode dari file [`backend/Code.gs`](file:///c:/Users/kayla/Documents/Kuliah/Semester%207/Capstone/backend/Code.gs).
4. Sesuaikan konstanta `CONFIG`:
   ```javascript
   const CONFIG = {
     SPREADSHEET_ID: "ID_SPREADSHEET_ANDA",
     SHEET_NAME: "Data_Distribusi",
     TEMPLATE_DOC_ID: "ID_GOOGLE_DOCS_TEMPLATE_RAPOR",
     DESTINATION_FOLDER_ID: "ID_FOLDER_GOOGLE_DRIVE",
     // ...
   };
   ```
5. Klik **Deploy** > **New Deployment**:
   * **Select type:** Web app
   * **Execute as:** *Me (email akun Anda)*
   * **Who has access:** *Anyone*
6. Salin **Web App URL** yang dihasilkan (misal `https://script.google.com/macros/s/.../exec`).
7. Buka dashboard web, klik tombol **⚙ Konfigurasi Webhook**, dan tempelkan URL tersebut ke dalam input endpoint webhook.

---

## 🛡️ 5. Fitur Keamanan & Arsitektur Idempoten

1. **Idempotency Guard:**
   Jika baris data sudah berstatus `Terkirim` dan `Selesai`, sistem melewati baris tersebut (`SKIPPED_ALREADY_SENT`) agar mahasiswa tidak menerima email ganda.
2. **Invalid Email Resiliency:**
   Jika kolom email kosong atau berformat tidak valid, baris tersebut ditandai `Email Invalid` dan dilewati secara aman tanpa membuat skrip crash.
3. **LockService Protection:**
   Menggunakan `LockService.getScriptLock()` pada Google Apps Script untuk mencegah kondisi balapan (*race condition*) apabila tombol ditekan bersamaan atau berkali-kali.
4. **Mini-Batch Size Limiting:**
   Setiap eksekusi dibatasi 3 baris (`batchSize: 3`), membutuhkan waktu ~45–60 detik, jauh di bawah batas timeout 6 menit.

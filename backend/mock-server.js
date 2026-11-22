/**
 * ======================================================================================
 * PORTAL MONITORING & PEMULIHAN DISTRIBUSI RAPOR MANAGE - HRD HMSI ITS
 * File: backend/mock-server.js
 * Description: Standalone Node.js Mock Webhook Runner (Simulasi Google Apps Script)
 *              Menjalankan endpoint webhook lokal dengan CORS & respon identik GAS.
 * Jalankan dengan: node backend/mock-server.js
 * ======================================================================================
 */

const http = require('http');

const PORT = process.env.PORT || 3001;

// Konfigurasi Sender Static
const SENDER_EMAIL = "kaylaputrimaharani@gmail.com";
const SENDER_NAME = "Kayla Putri Maharani (HRD HMSI ITS)";

// Database mock in-memory untuk pengujian data insiden
const mockDatabase = [
  {
    row: 34,
    nrp: "5026231034",
    nama: "Bella Safira",
    email: "bella.safira@mhs.is.its.ac.id",
    divisi: "Operasional Acara",
    statusPdf: "Selesai",
    statusEmail: "Terkirim",
    pdfUrl: "https://drive.google.com/file/d/mock-bella-safira",
    updatedAt: "2026-11-21T10:12:00.000Z"
  },
  {
    row: 35,
    nrp: "5026231035",
    nama: "Cahyo Nugroho",
    email: "cahyo.nugroho@mhs.is.its.ac.id",
    divisi: "Pengembangan SDM",
    statusPdf: "Gagal (Timeout 6 Menit)",
    statusEmail: "Pending",
    pdfUrl: null,
    updatedAt: null
  },
  {
    row: 36,
    nrp: "5026231036",
    nama: "Dinda Ayu Lestari",
    email: "dinda.ayu@mhs.is.its.ac.id",
    divisi: "Hubungan Masyarakat",
    statusPdf: "Pending",
    statusEmail: "Pending",
    pdfUrl: null,
    updatedAt: null
  },
  {
    row: 37,
    nrp: "5026231037",
    nama: "Eko Prasetyo",
    email: "eko.prasetyo@mhs.is.its.ac.id",
    divisi: "Media & Kreatif",
    statusPdf: "Pending",
    statusEmail: "Pending",
    pdfUrl: null,
    updatedAt: null
  }
];

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && (req.url === '/' || req.url === '/api/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      service: 'Mock GAS Webhook Runner (Recovery Engine)',
      organization: 'Divisi HRD HMSI ITS',
      port: PORT,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Recovery Webhook POST endpoint
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        let payload = {};
        if (body) {
          try {
            payload = JSON.parse(body);
          } catch (e) {
            console.warn('[MOCK-RUNNER] Body bukan JSON murni, mencoba fallback parser:', body);
          }
        }

        const startRow = parseInt(payload.startRow || 35, 10);
        const batchSize = parseInt(payload.batchSize || 3, 10);

        console.log(`\n==================================================`);
        console.log(`[MOCK GAS RUNNER] Sinyal Webhook Diterima!`);
        console.log(`[PAYLOAD] startRow: ${startRow}, batchSize: ${batchSize}`);
        console.log(`[TIME] ${new Date().toLocaleTimeString('id-ID')}`);
        console.log(`==================================================`);

        // Simulasi latensi eksekusi Google Docs PDF Render & Gmail Dispatch (~1200ms)
        await new Promise(resolve => setTimeout(resolve, 1400));

        const endRow = startRow + batchSize - 1;
        const processedDetails = [];

        for (let r = startRow; r <= endRow; r++) {
          let item = mockDatabase.find(d => d.row === r);
          if (!item) {
            item = {
              row: r,
              nrp: `50262310${r < 10 ? '0' + r : r}`,
              nama: `Mahasiswa Baris ${r}`,
              email: `mhs.${r}@mhs.is.its.ac.id`,
              divisi: 'Divisi Pelaksana',
              statusPdf: 'Pending',
              statusEmail: 'Pending'
            };
            mockDatabase.push(item);
          }

          // Idempotency check
          if (item.statusEmail === 'Terkirim' && item.statusPdf === 'Selesai') {
            console.log(`[ROW ${r}] Idempotent Skip: Data sudah terkirim.`);
            processedDetails.push({
              row: r,
              nrp: item.nrp,
              nama: item.nama,
              statusPdf: 'Selesai',
              statusEmail: 'Terkirim',
              actionTaken: 'SKIPPED_ALREADY_SENT',
              note: 'Sudah sukses dikirim sebelumnya (idempoten).'
            });
            continue;
          }

          // Email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(item.email)) {
            item.statusEmail = 'Email Invalid';
            processedDetails.push({
              row: r,
              nrp: item.nrp,
              nama: item.nama,
              statusPdf: item.statusPdf,
              statusEmail: 'Email Invalid',
              actionTaken: 'SKIPPED_INVALID_EMAIL'
            });
            continue;
          }

          // Eksekusi pemulihan
          item.statusPdf = 'Selesai';
          item.statusEmail = 'Terkirim';
          item.pdfUrl = `https://drive.google.com/file/d/rapor-manage-2026-${item.nrp}`;
          item.updatedAt = new Date().toISOString();

          console.log(`[ROW ${r}] ${item.nama} (${item.nrp}) -> PDF GENERATED & EMAIL SENT!`);

          processedDetails.push({
            row: r,
            nrp: item.nrp,
            nama: item.nama,
            statusPdf: 'Selesai',
            statusEmail: 'Terkirim',
            pdfUrl: item.pdfUrl,
            actionTaken: 'SUCCESSFULLY_PROCESSED',
            timestamp: item.updatedAt
          });
        }

        const responsePayload = {
          status: 'SUCCESS',
          message: `Berhasil memulihkan dan memproses ${processedDetails.length} mahasiswa (Baris ${startRow} - ${endRow}).`,
          processedRange: `${startRow} - ${endRow}`,
          count: processedDetails.length,
          details: processedDetails,
          serverTimestamp: new Date().toISOString()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responsePayload));
        console.log(`[MOCK GAS RUNNER] Selesai dengan status 200 OK.`);

      } catch (err) {
        console.error('[MOCK GAS RUNNER ERROR]', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ERROR',
          message: err.message
        }));
      }
    });
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint tidak ditemukan' }));
});

server.listen(PORT, () => {
  console.log(`\n==============================================================`);
  console.log(`🚀 [BACKEND MOCK WEBHOOK RUNNER AKTIF]`);
  console.log(`📡 URL Endpoint: http://localhost:${PORT}/api/recovery`);
  console.log(`ℹ️  Dapat digunakan untuk pengujian lokal pengganti URL GAS live`);
  console.log(`==============================================================\n`);
});

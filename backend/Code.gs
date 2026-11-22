/**
 * ======================================================================================
 * PORTAL MONITORING & PEMULIHAN DISTRIBUSI RAPOR MANAGE - HRD HMSI ITS
 * File: backend/Code.gs
 * Description: Google Apps Script Webhook Runner dengan Arsitektur Mini-Batching
 *              untuk mengatasi batas eksekusi 6 menit (script execution timeout).
 * ======================================================================================
 */

// ==========================================
// 1. KONFIGURASI SISTEM & GOOGLE WORKSPACE
// ==========================================
const CONFIG = {
  // Ganti dengan ID Spreadsheet database nilai/distribusi rapor Anda
  SPREADSHEET_ID: "PASTE_YOUR_SPREADSHEET_ID_HERE",
  SHEET_NAME: "Data_Distribusi",

  // Ganti dengan ID Google Docs Template Rapor MANAGE
  TEMPLATE_DOC_ID: "PASTE_YOUR_GOOGLE_DOCS_TEMPLATE_ID_HERE",

  // Ganti dengan ID Folder Google Drive tempat menyimpan arsip PDF rapor
  DESTINATION_FOLDER_ID: "PASTE_YOUR_DRIVE_FOLDER_ID_HERE",

  // Konfigurasi Email Pengirim (Static Resmi)
  SENDER_EMAIL: "kaylaputrimaharani@gmail.com",
  SENDER_NAME: "Kayla Putri Maharani (HRD HMSI ITS)",
  REPLY_TO: "kaylaputrimaharani@gmail.com",
  EMAIL_SUBJECT_PREFIX: "[RAPOR RESMI MANAGE 2026] Laporan Kinerja & Evaluasi - ",

  // Target Email Penerima Dummy Statis untuk Pengujian / Sidang Demo
  // Semua email rapor uji coba otomatis dikirimkan ke alamat ini:
  STATIC_DUMMY_RECIPIENT: "kelagoooo@gmail.com",
  USE_STATIC_DUMMY_RECIPIENT: true,

  // Indeks Kolom pada Google Sheet (1-indexed berdasarkan kolom A = 1, B = 2, dst)
  // Kolom D (Indeks 4) khusus untuk menampung alamat Email Peserta/Mahasiswa
  COLUMNS: {
    ROW_NUM: 1,      // Kolom A: No Baris
    NRP: 2,          // Kolom B: NRP
    NAMA: 3,         // Kolom C: Nama Mahasiswa
    EMAIL: 4,        // Kolom D: Email Mahasiswa (Tujuan Pengiriman)
    DIVISI: 5,       // Kolom E: Divisi / Tim
    STATUS_PDF: 6,   // Kolom F: Status PDF ("Pending" / "Selesai" / "Gagal (Timeout 6 Menit)")
    STATUS_EMAIL: 7, // Kolom G: Status Email ("Pending" / "Terkirim" / "Email Invalid")
    PDF_URL: 8,      // Kolom H: URL File PDF di Google Drive
    TIMESTAMP: 9     // Kolom I: Waktu Selesai Eksekusi
  },

  // Konfigurasi Batching Pengaman
  DEFAULT_BATCH_SIZE: 3,
  MAX_ALLOWED_BATCH: 10
};

// ==========================================
// 2. HTTP HANDLERS (WEBHOOK ENTRYPOINTS)
// ==========================================

/**
 * Handle HTTP GET request (Health Check & Info)
 */
function doGet(e) {
  const info = {
    status: "HEALTHY",
    service: "Portal Pemulihan Distribusi Rapor MANAGE Webhook Runner",
    organization: "Divisi HRD HMSI ITS",
    timestamp: new Date().toISOString(),
    allowedMethods: ["POST", "GET"],
    version: "2.1.0"
  };

  return ContentService.createTextOutput(JSON.stringify(info))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST request dari Dashboard Frontend
 * Menerima payload: { "startRow": 35, "batchSize": 3 }
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  // Mengunci eksekusi selama maksimal 30 detik untuk mencegah race condition (multi-click)
  try {
    const successLock = lock.tryLock(30000);
    if (!successLock) {
      return createJsonResponse({
        status: "ERROR",
        message: "Server sedang memproses batch lain. Mohon tunggu sesaat."
      }, 429);
    }

    // 1. Parsing Payload
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        return createJsonResponse({
          status: "ERROR",
          message: "Format JSON payload tidak valid: " + err.message
        }, 400);
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const startRow = parseInt(payload.startRow || 35, 10);
    const requestedBatchSize = parseInt(payload.batchSize || CONFIG.DEFAULT_BATCH_SIZE, 10);
    const batchSize = Math.min(requestedBatchSize, CONFIG.MAX_ALLOWED_BATCH);

    if (isNaN(startRow) || startRow < 2) {
      return createJsonResponse({
        status: "ERROR",
        message: "startRow tidak valid. Harus berupa angka baris spreadsheet (minimal baris 2)."
      }, 400);
    }

    // 2. Jalankan Proses Recovery Mini-Batch
    const result = processRecoveryBatch(startRow, batchSize);

    return createJsonResponse(result);

  } catch (error) {
    Logger.log("FATAL ERROR: " + error.toString());
    return createJsonResponse({
      status: "ERROR",
      message: "Terjadi kesalahan internal backend GAS: " + error.message,
      stack: error.stack
    }, 500);
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// 3. LOGIKA PEMULIHAN & IDEMPOTENCY
// ==========================================

/**
 * Memproses sejumlah baris data tertentu (mini-batch) secara aman dan idempoten.
 */
function processRecoveryBatch(startRow, batchSize) {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();

  if (startRow > lastRow) {
    return {
      status: "SUCCESS",
      message: "Semua baris hingga baris terakhir (" + lastRow + ") sudah terproses.",
      processedRange: startRow + " - " + lastRow,
      processedCount: 0,
      details: []
    };
  }

  const endRow = Math.min(startRow + batchSize - 1, lastRow);
  const numRowsToRead = (endRow - startRow) + 1;

  // Baca rentang data yang akan dieksekusi
  const rangeValues = sheet.getRange(startRow, 1, numRowsToRead, 9).getValues();
  const processingDetails = [];

  for (let i = 0; i < numRowsToRead; i++) {
    const currentRowNumber = startRow + i;
    const rowData = rangeValues[i];

    const nrp = String(rowData[CONFIG.COLUMNS.NRP - 1] || "").trim();
    const nama = String(rowData[CONFIG.COLUMNS.NAMA - 1] || "").trim();
    const email = String(rowData[CONFIG.COLUMNS.EMAIL - 1] || "").trim();
    const divisi = String(rowData[CONFIG.COLUMNS.DIVISI - 1] || "Staff").trim();
    const statusPdf = String(rowData[CONFIG.COLUMNS.STATUS_PDF - 1] || "").trim();
    const statusEmail = String(rowData[CONFIG.COLUMNS.STATUS_EMAIL - 1] || "").trim();

    const studentRecord = {
      row: currentRowNumber,
      nrp: nrp,
      nama: nama,
      email: email,
      divisi: divisi
    };

    // --- RULE 1: IDEMPOTENCY CHECK ---
    // Jika status email sudah "Terkirim", jangan pernah kirim ulang (cegah spam/duplikasi)
    if (statusEmail === "Terkirim" && statusPdf === "Selesai") {
      processingDetails.push({
        row: currentRowNumber,
        nrp: nrp,
        nama: nama,
        statusPdf: "Selesai",
        statusEmail: "Terkirim",
        actionTaken: "SKIPPED_ALREADY_SENT",
        note: "Data sudah sukses dikirim sebelumnya. Dilewati untuk mencegah duplikasi (idempoten)."
      });
      continue;
    }

    // --- RULE 2: EMAIL VALIDATION ---
    // Validasi format email agar tidak menyebabkan script crash
    if (!isValidEmail(email)) {
      sheet.getRange(currentRowNumber, CONFIG.COLUMNS.STATUS_EMAIL).setValue("Email Invalid");
      sheet.getRange(currentRowNumber, CONFIG.COLUMNS.TIMESTAMP).setValue(new Date());

      processingDetails.push({
        row: currentRowNumber,
        nrp: nrp,
        nama: nama,
        statusPdf: statusPdf || "Pending",
        statusEmail: "Email Invalid",
        actionTaken: "SKIPPED_INVALID_EMAIL",
        note: "Format email kosong atau tidak valid (" + email + "). Dilewati tanpa menghentikan batch."
      });
      continue;
    }

    // --- RULE 3: EKSEKUSI PEMBUATAN PDF & PENGIRIMAN EMAIL ---
    try {
      // 1. Buat Dokumen PDF dari Template
      const pdfResult = createReportPdf(studentRecord);

      // 2. Kirim Email melalui GmailApp dengan lampiran PDF
      sendReportEmail(studentRecord, pdfResult.blob);

      // 3. Update Kolom Status di Google Sheets secara real-time
      const now = new Date();
      sheet.getRange(currentRowNumber, CONFIG.COLUMNS.STATUS_PDF).setValue("Selesai");
      sheet.getRange(currentRowNumber, CONFIG.COLUMNS.STATUS_EMAIL).setValue("Terkirim");
      sheet.getRange(currentRowNumber, CONFIG.COLUMNS.PDF_URL).setValue(pdfResult.fileUrl);
      sheet.getRange(currentRowNumber, CONFIG.COLUMNS.TIMESTAMP).setValue(now);

      processingDetails.push({
        row: currentRowNumber,
        nrp: nrp,
        nama: nama,
        statusPdf: "Selesai",
        statusEmail: "Terkirim",
        pdfUrl: pdfResult.fileUrl,
        actionTaken: "SUCCESSFULLY_PROCESSED",
        timestamp: now.toISOString()
      });

    } catch (err) {
      Logger.log("Error memproses baris " + currentRowNumber + ": " + err.toString());
      sheet.getRange(currentRowNumber, CONFIG.COLUMNS.STATUS_PDF).setValue("Gagal (" + err.message.substring(0, 30) + ")");
      sheet.getRange(currentRowNumber, CONFIG.COLUMNS.STATUS_EMAIL).setValue("Pending");

      processingDetails.push({
        row: currentRowNumber,
        nrp: nrp,
        nama: nama,
        statusPdf: "Gagal",
        statusEmail: "Pending",
        actionTaken: "ERROR",
        error: err.message
      });
    }
  }

  return {
    status: "SUCCESS",
    processedRange: startRow + " - " + endRow,
    count: processingDetails.length,
    details: processingDetails,
    serverTimestamp: new Date().toISOString()
  };
}

// ==========================================
// 4. GENERATOR DOKUMEN PDF & STORAGE
// ==========================================

/**
 * Membuat dokumen PDF dari Google Docs Template dan menyimpannya di Google Drive
 */
function createReportPdf(student) {
  // Jika masih menggunakan ID template placeholder, gunakan mock PDF blob untuk pengujian
  if (CONFIG.TEMPLATE_DOC_ID === "PASTE_YOUR_GOOGLE_DOCS_TEMPLATE_ID_HERE") {
    const dummyContent = "RAPOR MANAGE 2026\n\nNRP: " + student.nrp + "\nNama: " + student.nama + "\nDivisi: " + student.divisi;
    const blob = Utilities.newBlob(dummyContent, "application/pdf", "Rapor_MANAGE_" + student.nrp + ".pdf");
    return {
      blob: blob,
      fileUrl: "https://drive.google.com/file/d/mock-preview-" + student.nrp
    };
  }

  const templateFile = DriveApp.getFileById(CONFIG.TEMPLATE_DOC_ID);
  const targetFolder = DriveApp.getFolderById(CONFIG.DESTINATION_FOLDER_ID);

  // Buat salinan sementara dari template doc
  const tempDocName = "Temp_Rapor_" + student.nrp + "_" + new Date().getTime();
  const copyDocFile = templateFile.makeCopy(tempDocName, targetFolder);
  const copyDoc = DocumentApp.openById(copyDocFile.getId());
  const body = copyDoc.getBody();

  // Ganti placeholder dengan data mahasiswa
  body.replaceText("{{NAMA}}", student.nama);
  body.replaceText("{{NRP}}", student.nrp);
  body.replaceText("{{DIVISI}}", student.divisi);
  body.replaceText("{{TANGGAL}}", Utilities.formatDate(new Date(), "Asia/Jakarta", "dd MMMM yyyy"));

  // Simpan dan tutup dokumen sebelum konversi ke PDF
  copyDoc.saveAndClose();

  // Konversi dokumen ke PDF Blob
  const pdfBlob = copyDocFile.getAs("application/pdf");
  pdfBlob.setName("Rapor_MANAGE_2026_" + student.nrp + "_" + student.nama.replace(/\s+/g, "_") + ".pdf");

  // Simpan PDF permanen ke Drive folder
  const pdfFile = targetFolder.createFile(pdfBlob);
  pdfFile.setDescription("Rapor Resmi MANAGE 2026 - " + student.nama + " (" + student.nrp + ")");

  // Hapus Google Doc sementara agar folder Drive tetap bersih
  copyDocFile.setTrashed(true);

  return {
    blob: pdfBlob,
    fileUrl: pdfFile.getUrl(),
    fileId: pdfFile.getId()
  };
}

// ==========================================
// 5. PENGIRIMAN EMAIL (GMAIL API)
// ==========================================

/**
 * Mengirimkan email resmi ke mahasiswa dengan lampiran PDF Rapor
 */
function sendReportEmail(student, pdfBlob) {
  const subject = CONFIG.EMAIL_SUBJECT_PREFIX + student.nama + " (" + student.nrp + ")";
  
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
      <div style="background-color: #0284c7; padding: 16px; border-radius: 6px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px;">PORTAL RAPOR EVALUASI MANAGE 2026</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Himpunan Mahasiswa Sistem Informasi (HMSI) ITS</p>
      </div>
      <div style="padding: 20px 0;">
        <p>Halo <strong>${escapeHtml(student.nama)}</strong> (${escapeHtml(student.nrp)}),</p>
        <p>Terima kasih atas dedikasi dan kontribusi aktif Anda dalam program kerja kepengurusan MANAGE periode ini.</p>
        <p>Bersama ini kami lampirkan dokumen resmi <strong>Rapor Evaluasi Kinerja</strong> Anda dalam format PDF yang dapat diunduh pada lampiran email ini.</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px; margin: 16px 0; font-size: 13px;">
          <strong>Divisi:</strong> ${escapeHtml(student.divisi)}<br>
          <strong>Status Distribusi:</strong> Terverifikasi & Resmi
        </div>
        <p style="font-size: 13px; color: #64748b;">Jika terdapat kendala atau pertanyaan terkait isi rapor, silakan menghubungi PIC Divisi HRD HMSI ITS.</p>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
        Email ini dikirimkan secara otomatis dari <strong>${escapeHtml(CONFIG.SENDER_EMAIL)}</strong> atas nama Divisi HRD HMSI ITS.
      </p>
    </div>
  `;

  // Tentukan alamat email penerima (gunakan dummy statis jika mode testing aktif)
  const recipientEmail = (CONFIG.USE_STATIC_DUMMY_RECIPIENT && CONFIG.STATIC_DUMMY_RECIPIENT)
    ? CONFIG.STATIC_DUMMY_RECIPIENT
    : student.email;

  // Kirim melalui GmailApp dengan attachment
  GmailApp.sendEmail(recipientEmail, subject, "Silakan buka email ini di klien yang mendukung HTML.", {
    name: CONFIG.SENDER_NAME,
    replyTo: CONFIG.REPLY_TO,
    htmlBody: htmlBody,
    attachments: [pdfBlob]
  });
}

// ==========================================
// 6. HELPER FUNCTIONS
// ==========================================

function getTargetSheet() {
  if (CONFIG.SPREADSHEET_ID === "PASTE_YOUR_SPREADSHEET_ID_HERE") {
    // Mode spreadsheet aktif bila script ditempel langsung di bound container sheet
    return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME) 
      || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  }
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.SHEET_NAME);
}

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createJsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

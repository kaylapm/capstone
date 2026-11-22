import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';

/**
 * ======================================================================================
 * API Route: /api/send-email
 * Method: POST, GET
 * Description: Pengiriman Email Rapor MANAGE HMSI via SMTP (Nodemailer)
 *              Pengirim resmi: kaylaputrimaharani@gmail.com
 *              Penerima dummy statis: kelagoooo@gmail.com
 *              Lampiran: Rapor PDF Resmi A4 (100% Selalu Terlampir)
 * ======================================================================================
 */

// Helper pembuat Buffer PDF Resmi A4 Standar HRD HMSI ITS
function generateOfficialPdfBuffer(data: {
  nama: string;
  nrp: string;
  divisi: string;
  finalScore: string;
  grade: string;
  notes: string;
  scores?: number[];
  recipient?: string;
}): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const s = data.scores || [90, 86, 85, 92, 88];

  // 1. KOP SURAT
  doc.setFillColor(5, 46, 22); // #052e16
  doc.roundedRect(15, 14, 14, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ITS', 22, 23, { align: 'center' });

  doc.setFillColor(21, 128, 61); // #15803d
  doc.roundedRect(181, 14, 14, 14, 3, 3, 'F');
  doc.text('M', 188, 23, { align: 'center' });

  // Teks Kop Surat
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8.5);
  doc.text('HIMPUNAN MAHASISWA SISTEM INFORMASI (HMSI)', 105, 16, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('FAKULTAS TEKNOLOGI ELEKTRO DAN INFORMATIKA CERDAS', 105, 21, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Institut Teknologi Sepuluh Nopember • Gedung Jurusan Sistem Informasi, Kampus ITS Sukolilo, Surabaya 60111', 105, 26, { align: 'center' });

  // Garis Pembatas Kop
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(15, 32, 195, 32);

  // 2. JUDUL RAPOR
  doc.setTextColor(5, 46, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LEMBAR EVALUASI KINERJA FUNGSIONARIS', 105, 40, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8.5);
  doc.text('PROGRAM MANAJEMEN ORGANISASI (MANAGE) • PERIODE 2026', 105, 45, { align: 'center' });

  // 3. BIODATA BOX
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 49, 180, 24, 3, 3, 'FD');

  // Kolom 1
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.text('NAMA FUNGSIONARIS', 20, 55);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(data.nama, 20, 60);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('DIVISI KEPENGURUSAN', 20, 66);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(data.divisi, 20, 70);

  // Kolom 2
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NRP / NIM', 115, 55);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(data.nrp, 115, 60);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('EMAIL PENERIMA (RESMI)', 115, 66);
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(data.recipient || 'kelagoooo@gmail.com', 115, 70);

  // 4. TABEL 5 ASPEK PENILAIAN
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('I. ASPEK PENILAIAN KINERJA FUNGSIONARIS', 15, 79);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Skala 0 – 100', 195, 79, { align: 'right' });

  // Header Tabel
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 82, 180, 8, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('No', 20, 87, { align: 'center' });
  doc.text('Kompetensi / Aspek Penilaian', 28, 87);
  doc.text('Bobot', 135, 87, { align: 'center' });
  doc.text('Skor', 160, 87, { align: 'center' });
  doc.text('Predikat', 183, 87, { align: 'center' });

  const aspects = [
    { no: '1', title: 'Keaktifan & Kehadiran Rapat Pleno/Divisi', bobot: '20%', skor: String(s[0]), predikat: 'A' },
    { no: '2', title: 'Tanggung Jawab Eksekusi Job Description', bobot: '25%', skor: String(s[1]), predikat: 'A-' },
    { no: '3', title: 'Inisiatif Kerja & Problem Solving Acara', bobot: '20%', skor: String(s[2]), predikat: 'A-' },
    { no: '4', title: 'Kolaborasi & Teamwork Antar Fungsionaris', bobot: '20%', skor: String(s[3]), predikat: 'A' },
    { no: '5', title: 'Ketepatan Waktu Task Delivery (Deadline)', bobot: '15%', skor: String(s[4]), predikat: 'A-' }
  ];

  let y = 90;
  aspects.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 7.5, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 7.5, 195, y + 7.5);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(row.no, 20, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(row.title, 28, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(row.bobot, 135, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(row.skor, 160, y + 5, { align: 'center' });
    doc.setTextColor(21, 128, 61);
    doc.text(row.predikat, 183, y + 5, { align: 'center' });

    y += 7.5;
  });

  // Border keliling tabel
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 82, 180, y - 82);

  // 5. BOX KELULUSAN KINERJA
  y += 5;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(134, 239, 172); // emerald-300
  doc.roundedRect(15, y, 180, 22, 3, 3, 'FD');

  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('STATUS KINERJA KELULUSAN', 22, y + 6);

  doc.setTextColor(5, 46, 22);
  doc.setFontSize(10.5);
  doc.text('MEMENUHI STANDAR KINERJA (LOLOS EVALUASI)', 22, y + 12);

  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Dinyatakan lulus evaluasi program kerja dan berhak atas sertifikat kepengurusan.', 22, y + 17);

  // Nilai Akhir & Predikat Box
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text('Nilai Akhir:', 148, y + 8, { align: 'right' });
  doc.setTextColor(5, 46, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(String(data.finalScore), 148, y + 16, { align: 'right' });

  doc.setFillColor(5, 46, 22);
  doc.roundedRect(158, y + 4, 30, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.text('PREDIKAT', 173, y + 9, { align: 'center' });
  doc.setFontSize(11);
  doc.text(data.grade, 173, y + 15, { align: 'center' });

  // 6. CATATAN HRD
  y += 26;
  doc.setFillColor(250, 250, 249);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, 180, 18, 3, 3, 'FD');

  // Garis aksen hijau
  doc.setFillColor(21, 128, 61);
  doc.roundedRect(15, y, 3, 18, 1, 1, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Catatan & Rekomendasi Divisi HRD HMSI ITS:', 22, y + 6);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  const cleanNotes = data.notes.replace(/^"|"$/g, '');
  const splitNotes = doc.splitTextToSize(`"${cleanNotes}"`, 168);
  doc.text(splitNotes, 22, y + 11);

  // 7. QR CODE & TANDA TANGAN
  y += 24;
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(18, y, 18, 18, 2, 2);
  doc.setFillColor(15, 23, 42);
  doc.rect(21, y + 3, 4, 4, 'F');
  doc.rect(29, y + 3, 4, 4, 'F');
  doc.rect(21, y + 11, 4, 4, 'F');
  doc.rect(27, y + 9, 3, 3, 'F');
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('ID: RAPOR-2026-HMSI-VERIFIED', 15, y + 23);

  // Tanda Tangan Kayla Putri Maharani
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('Surabaya, 21 November 2026', 195, y + 2, { align: 'right' });
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Divisi HRD HMSI ITS', 195, y + 6, { align: 'right' });

  // Badge Tertanda Tangan
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(134, 239, 172);
  doc.roundedRect(145, y + 8, 50, 5, 1, 1, 'FD');
  doc.setTextColor(21, 128, 61);
  doc.setFontSize(6.5);
  doc.text('✓ TERTANDA TANGAN DIGITAL', 170, y + 11.5, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text('Kayla Putri Maharani', 195, y + 18, { align: 'right' });
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NRP. 5026211000', 195, y + 22, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}

export async function GET() {
  const isConfigured = Boolean(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD);
  return NextResponse.json({
    status: 'ONLINE',
    service: 'SMTP Email Dispatcher (Nodemailer)',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: process.env.SMTP_PORT || '465',
    sender: process.env.SMTP_USER || 'kaylaputrimaharani@gmail.com',
    defaultRecipient: 'kelagoooo@gmail.com',
    hasAppPasswordConfigured: isConfigured,
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Kredensial SMTP
    const smtpHost = body.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(body.smtpPort || process.env.SMTP_PORT || '465', 10);
    const smtpUser = body.smtpUser || process.env.SMTP_USER || 'kaylaputrimaharani@gmail.com';
    const smtpPass = (body.smtpPass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

    // Action 1: TEST KONEKSI SAJA
    if (body.action === 'TEST_CONNECTION') {
      if (!smtpPass) {
        return NextResponse.json({
          success: false,
          error: 'Sandi Aplikasi Google (App Password) belum dimasukkan.'
        }, { status: 400 });
      }

      const testTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false }
      });

      await testTransporter.verify();

      return NextResponse.json({
        success: true,
        message: `Koneksi ke ${smtpHost} (${smtpPort}) berhasil! Kredensial Kayla Putri Maharani terverifikasi.`
      });
    }

    // Action 2: KIRIM EMAIL RAPOR
    const nama = body.nama || 'Bella Safira';
    const nrp = body.nrp || '5026231034';
    const divisi = body.divisi || 'Operasional Acara';
    const finalScore = body.finalScore || '92.2';
    const grade = body.grade || 'A';
    const notes = body.notes || 'Performa operasional acara luar biasa, kepemimpinan lapangan sangat cekatan dan solutif. Menjadi teladan bagi fungsionaris lainnya.';

    // Email penerima: statis ke kelagoooo@gmail.com
    const recipient = body.recipient || 'kelagoooo@gmail.com';

    // Lampiran PDF (jika ada data base64 dari client)
    const pdfBase64 = body.pdfBase64 || null;

    // Template HTML Email Resmi HRD HMSI ITS
    const htmlEmail = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Rapor Evaluasi Fungsionaris MANAGE HMSI 2026</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: #052e16; color: #ffffff; padding: 28px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #86efac; font-weight: 500; }
        .badge { display: inline-block; padding: 4px 12px; background: #15803d; color: #fff; font-size: 11px; font-weight: 700; border-radius: 20px; margin-top: 10px; }
        .content { padding: 24px; font-size: 14px; line-height: 1.6; color: #334155; }
        .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .info-table td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .info-table td.label { font-weight: 600; color: #64748b; width: 38%; }
        .info-table td.val { font-weight: 700; color: #0f172a; }
        .grade-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }
        .grade-box .score { font-size: 32px; font-weight: 900; color: #15803d; }
        .grade-box .status { font-size: 14px; font-weight: 800; color: #14532d; margin-top: 4px; }
        .notes-box { background: #fafaf9; border-left: 4px solid #15803d; padding: 12px 16px; font-style: italic; color: #475569; margin: 16px 0; font-size: 13px; border-radius: 4px; }
        .footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
        .sig { text-align: right; margin-top: 24px; padding-right: 8px; }
        .sig .name { font-weight: 800; color: #0f172a; text-decoration: underline; font-size: 14px; }
        .sig .title { color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>HIMPUNAN MAHASISWA SISTEM INFORMASI ITS</h1>
          <p>Departemen Sistem Informasi — FTEIC ITS Surabaya</p>
          <div class="badge">MANAGE 2026 OFFICIAL REPORT</div>
        </div>

        <div class="content">
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Berikut kami sampaikan <strong>Rapor Evaluasi Fungsionaris MANAGE 2026</strong> resmi dari Divisi Human Resource Development (HRD) HMSI ITS.</p>
          
          <table class="info-table">
            <tr>
              <td class="label">Nama Lengkap</td>
              <td class="val">${nama}</td>
            </tr>
            <tr>
              <td class="label">NRP / NIM</td>
              <td class="val">${nrp}</td>
            </tr>
            <tr>
              <td class="label">Divisi Kepengurusan</td>
              <td class="val">${divisi}</td>
            </tr>
            <tr>
              <td class="label">Target Penerima</td>
              <td class="val">${recipient}</td>
            </tr>
          </table>

          <div class="grade-box">
            <div style="font-size: 12px; color: #15803d; font-weight: bold; text-transform: uppercase;">Hasil Evaluasi Akhir</div>
            <div class="score">${finalScore} / 100 (Predikat ${grade})</div>
            <div class="status">✓ MEMENUHI STANDAR KINERJA (LOLOS EVALUASI)</div>
          </div>

          <p><strong>Catatan & Apresiasi Divisi HRD HMSI:</strong></p>
          <div class="notes-box">
            "${notes}"
          </div>

          <p style="font-size: 13px; color: #15803d; font-weight: bold;">
            📄 Dokumen resmi PDF lembar evaluasi (A4 standar HMSI ITS) telah dilampirkan bersama email ini. Silakan unduh file lampiran sebagai bukti kelulusan evaluasi.
          </p>

          <div class="sig">
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">Surabaya, 21 November 2026</div>
            <div class="title">Kepala Divisi HRD HMSI ITS</div>
            <div style="padding: 6px 0;">
              <span style="display: inline-block; padding: 2px 8px; background: #dcfce7; color: #166534; font-size: 10px; font-weight: bold; border-radius: 4px; border: 1px solid #86efac;">✓ TERTANDA TANGAN DIGITAL</span>
            </div>
            <div class="name">Kayla Putri Maharani</div>
            <div class="title">NRP. 5026211000</div>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;">Email ini dikirimkan secara resmi oleh Portal Monitoring & Pemulihan Distribusi Rapor MANAGE.</p>
          <p style="margin: 4px 0 0; font-size: 11px; color: #94a3b8;">Pengirim: ${smtpUser} | Penerima: ${recipient}</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Persiapan Lampiran PDF (100% Guaranteed Attachment)
    const attachments: any[] = [];
    const filename = `Rapor_MANAGE_2026_${nrp}_${nama.replace(/\s+/g, '_')}.pdf`;

    if (pdfBase64) {
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      attachments.push({
        filename,
        content: Buffer.from(cleanBase64, 'base64'),
        contentType: 'application/pdf'
      });
    } else {
      // Jika diklik langsung dari baris tabel (tanpa membuka modal), buat PDF resmi otomatis di server!
      const pdfBuffer = generateOfficialPdfBuffer({
        nama,
        nrp,
        divisi,
        finalScore,
        grade,
        notes,
        scores: body.scores,
        recipient
      });
      attachments.push({
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    // Jika SMTP password belum diatur, gunakan Ethereal Test Transporter
    if (!smtpPass) {
      console.warn('[SMTP] Password belum disetel. Menggunakan Ethereal test transporter...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        const etherealTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });

        const testInfo = await etherealTransporter.sendMail({
          from: `"Kayla Putri Maharani (HRD HMSI ITS)" <${smtpUser}>`,
          to: recipient,
          subject: `[RAPOR MANAGE HMSI 2026] Hasil Evaluasi Fungsionaris - ${nama} (${nrp})`,
          html: htmlEmail,
          attachments
        });

        const previewUrl = nodemailer.getTestMessageUrl(testInfo);

        return NextResponse.json({
          success: true,
          mode: 'ETHEREAL_TEST_PREVIEW',
          message: `Email & PDF terkirim ke SMTP Test Server! Untuk kirim riil ke ${recipient}, masukkan Sandi Aplikasi Google 16 karakter.`,
          previewUrl: previewUrl || null,
          recipient,
          sender: smtpUser,
          student: { nama, nrp, divisi }
        });
      } catch (testErr: any) {
        return NextResponse.json({
          success: false,
          mode: 'CONFIG_REQUIRED',
          error: 'Sandi Aplikasi Google belum disetel. Buka menu Pengaturan SMTP di sidebar untuk mengisi 16-karakter App Password.',
          recipient,
          sender: smtpUser
        }, { status: 400 });
      }
    }

    // Buat Transporter SMTP Riil (Gmail)
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Eksekusi Pengiriman Email Riil beserta Lampiran PDF Resmi
    const info = await transporter.sendMail({
      from: `"Kayla Putri Maharani (HRD HMSI ITS)" <${smtpUser}>`,
      to: recipient,
      subject: `[RAPOR MANAGE HMSI 2026] Hasil Evaluasi Fungsionaris - ${nama} (${nrp})`,
      html: htmlEmail,
      attachments
    });

    console.log(`[SMTP] Berhasil mengirim email & PDF resmi ke ${recipient} (ID: ${info.messageId})`);

    return NextResponse.json({
      success: true,
      mode: 'REAL_SMTP',
      messageId: info.messageId,
      message: `Email & Rapor PDF (${filename}) berhasil dikirim langsung ke ${recipient} via SMTP (${smtpHost})!`,
      recipient,
      sender: smtpUser,
      timestamp: new Date().toISOString(),
      student: { nama, nrp, divisi },
      hasAttachment: true
    });

  } catch (error: any) {
    console.error('[SMTP ERROR]:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message || 'Gagal mengirim email via SMTP',
      help: 'Pastikan Anda menggunakan Sandi Aplikasi Google (App Password 16 karakter), bukan kata sandi akun Google biasa.'
    }, { status: 500 });
  }
}

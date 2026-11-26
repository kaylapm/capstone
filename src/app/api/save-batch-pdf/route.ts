import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

const PDF_RECORDS: Record<string, {
  nama: string;
  nrp: string;
  divisi: string;
  recipient: string;
  scores: number[];
  finalScore: string;
  grade: string;
  notes: string;
}> = {
  '35': {
    nama: 'Cahyo Nugroho',
    nrp: '5026231035',
    divisi: 'Pengembangan Sumber Daya Manusia (PSDM)',
    recipient: 'kelagoooo@gmail.com',
    scores: [90, 86, 85, 92, 88],
    finalScore: '88.2',
    grade: 'A-',
    notes: 'Fungsionaris menunjukkan dedikasi tinggi dan kemampuan komunikasi yang sangat baik di dalam tim. Eksekusi tugas terlaksana dengan rapi dan tuntas.'
  },
  '36': {
    nama: 'Dinda Ayu Lestari',
    nrp: '5026231036',
    divisi: 'Hubungan Masyarakat',
    recipient: 'kelagoooo@gmail.com',
    scores: [96, 94, 92, 95, 93],
    finalScore: '94.0',
    grade: 'A',
    notes: 'Hubungan relasi eksternal dan sponsorship tertangani dengan profesional. Kemampuan negosiasi dan diplomasi di atas rata-rata.'
  },
  '37': {
    nama: 'Eko Prasetyo',
    nrp: '5026231037',
    divisi: 'Media & Informasi',
    recipient: 'kelagoooo@gmail.com',
    scores: [92, 90, 91, 93, 89],
    finalScore: '91.0',
    grade: 'A',
    notes: 'Kualitas desain grafis dan publikasi media sosial sangat konsisten dan kreatif. Selalu tepat waktu memenuhi permintaan konten divisi lain.'
  }
};

function generatePdfBuffer(data: typeof PDF_RECORDS['35']): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const s = data.scores || [90, 86, 85, 92, 88];

  // 1. KOP SURAT
  doc.setFillColor(5, 46, 22);
  doc.roundedRect(15, 14, 14, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ITS', 22, 23, { align: 'center' });

  doc.setFillColor(21, 128, 61);
  doc.roundedRect(181, 14, 14, 14, 3, 3, 'F');
  doc.text('M', 188, 23, { align: 'center' });

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
  doc.text('EMAIL PENERIMA (KOLOM D)', 115, 66);
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

  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 82, 180, y - 82);

  // 5. BOX KELULUSAN KINERJA
  y += 5;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(134, 239, 172);
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

  doc.setFillColor(21, 128, 61);
  doc.roundedRect(15, y, 3, 18, 1, 1, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Catatan & Rekomendasi Divisi HRD HMSI ITS:', 22, y + 6);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  const cleanNotes = (data.notes || '').replace(/^"|"$/g, '');
  const splitNotes = doc.splitTextToSize(`"${cleanNotes}"`, 168);
  doc.text(splitNotes, 22, y + 11);

  // 7. QR CODE & TANDA TANGAN DIGITAL
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

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('Surabaya, 21 November 2026', 195, y + 2, { align: 'right' });
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepala Divisi HRD HMSI ITS', 195, y + 6, { align: 'right' });

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rows: string[] = body.rows || ['35', '36', '37'];

    const zip = new JSZip();
    const folder = zip.folder('output rapot');

    for (const rowKey of rows) {
      const record = PDF_RECORDS[rowKey];
      if (!record) continue;

      const pdfBuffer = generatePdfBuffer(record);
      const safeNama = record.nama.replace(/\s+/g, '_');
      const filename = `Rapor_MANAGE_2026_${record.nrp}_${safeNama}.pdf`;

      folder?.file(filename, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="output_rapot.zip"',
        'Content-Length': String(zipBuffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Gagal membuat arsip ZIP output rapot'
      },
      { status: 500 }
    );
  }
}

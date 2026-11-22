import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Portal Monitoring & Pemulihan Distribusi Rapor MANAGE | HRD HMSI ITS',
  description: 'Sistem Monitoring dan Recovery Engine Distribusi Rapor Fungsionaris MANAGE - HRD HMSI ITS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-[#eef2f6] text-slate-800 min-h-screen antialiased selection:bg-[#14532d] selection:text-white">
        {children}
      </body>
    </html>
  );
}

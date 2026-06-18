import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  ),
  title: "Otoendeks — Kasko Değeri Sorgula",
  description: "Aracının marka, model yılı ve tipine göre güncel kasko değerini sorgula.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex w-full max-w-5xl items-center gap-1 px-6 h-14">
            <Link href="/" className="mr-6 flex items-center gap-2 font-semibold text-slate-900 tracking-tight">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">O</span>
              <span className="text-base">otoendeks</span>
            </Link>
            <Link href="/" className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
              Kasko Değeri
            </Link>
            <Link href="/sifir-arac" className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
              Sıfır Araç Fiyatları
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

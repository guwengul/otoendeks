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
      <body className="min-h-full flex flex-col">
        <header className="border-b border-gray-100 bg-white">
          <nav className="mx-auto flex w-full max-w-5xl items-center gap-6 px-6 py-3">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Kasko Değeri
            </Link>
            <Link href="/sifir-arac" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Sıfır Araç Fiyatları
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

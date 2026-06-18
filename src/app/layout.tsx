import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
            <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              Kasko Değeri
            </Link>
            <Link href="/sifir-arac" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              Sıfır Araç Fiyatları
            </Link>
            <Link href="/kredi" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.613 4.5 4.304v15a.75.75 0 0 0 .75.75h13.5a.75.75 0 0 0 .75-.75v-15c0-.69-.807-1.604-1.907-1.732A48.507 48.507 0 0 0 12 2.25Z" />
              </svg>
              Kredi Hesaplama
            </Link>
            <div className="ml-auto">
              {user ? (
                <Link href="/araclarim" className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors rounded-md">
                  Araçlarım
                </Link>
              ) : (
                <Link href="/giris" className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
                  Giriş yap
                </Link>
              )}
            </div>
          </nav>
        </header>
        {children}
        <footer className="mt-auto border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-5xl px-6 py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900 w-fit">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white text-[10px] font-bold">O</span>
                  <span className="text-sm">otoendeks</span>
                </Link>
                <p className="mt-2 text-xs text-slate-400 max-w-xs">Türkiye Sigorta Birliği (TSB) verilerine dayalı güncel kasko değerleri ve sıfır araç fiyatları.</p>
              </div>
              <div className="flex gap-12">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Araçlar</p>
                  <ul className="space-y-1.5">
                    <li><Link href="/" className="text-sm text-slate-500 hover:text-indigo-600">Kasko Değeri</Link></li>
                    <li><Link href="/sifir-arac" className="text-sm text-slate-500 hover:text-indigo-600">Sıfır Araç Fiyatları</Link></li>
                    <li><Link href="/kredi" className="text-sm text-slate-500 hover:text-indigo-600">Kredi Hesaplama</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Veri</p>
                  <ul className="space-y-1.5">
                    <li><span className="text-sm text-slate-400">Kaynak: TSB</span></li>
                    <li><span className="text-sm text-slate-400">Aylık güncellenir</span></li>
                    <li><Link href="/gizlilik" className="text-sm text-slate-500 hover:text-indigo-600">Gizlilik Politikası</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-400">
              © {new Date().getFullYear()} Otoendeks. Bilgi amaçlıdır, resmi sigorta değeri için sigorta şirketinize danışın.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

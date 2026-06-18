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
            <Link href="/" className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
              Kasko Değeri
            </Link>
            <Link href="/sifir-arac" className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
              Sıfır Araç Fiyatları
            </Link>
            <div className="ml-auto">
              {user ? (
                <Link href="/garajim" className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors rounded-md">
                  Garajım
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

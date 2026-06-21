import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { IkonKasko, IkonArac, IkonKredi, IkonPiyasa } from "@/components/BolumIkon";
import { NavMobil } from "@/components/NavMobil";
import { PostHogProvider } from "@/components/PostHogProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  title: "Otoendeks — Kasko Değeri, Sıfır Araç Fiyatları & Kredi Hesaplama",
  description: "Aracınızın güncel kasko değerini sorgulayın, sıfır araç fiyatlarını karşılaştırın ve kredi taksitinizi hesaplayın.",
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
        <PostHogProvider>
        <header className="relative border-b border-slate-200 bg-white">
          <nav className="mx-auto flex w-full max-w-5xl items-center gap-1 px-6 h-14">
            <Link href="/" className="mr-4 flex items-center gap-2 font-semibold text-slate-900 tracking-tight shrink-0">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4.2 17.5A9 9 0 1 1 19.8 17.5" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="12" y1="13" x2="6.2" y2="9.6" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="12" cy="13" r="2" fill="#4f46e5"/>
              </svg>
              <span className="text-xl font-bold">otoendeks</span>
            </Link>

            {/* masaüstü linkleri */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="/piyasa-fiyati" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors rounded-md hover:bg-indigo-50">
                <IkonPiyasa className="shrink-0 text-indigo-500" />
                Piyasa Fiyatı
              </Link>
              <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
                <IkonKasko className="shrink-0" />
                Kasko Değeri
              </Link>
              <Link href="/sifir-arac" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
                <IkonArac className="shrink-0" />
                Sıfır Araç Fiyatları
              </Link>
              <Link href="/kredi" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-indigo-50">
                <IkonKredi className="shrink-0" />
                Kredi Hesaplama
              </Link>
            </div>

            {/* masaüstü giriş butonu */}
            <div className="ml-auto hidden md:block">
              {user ? (
                <Link href="/araclarim" className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100 transition-colors">
                  Araçlarım
                </Link>
              ) : (
                <Link href="/giris" className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                  Giriş yap
                </Link>
              )}
            </div>

            {/* mobil hamburger + açılır menü */}
            <NavMobil girisYapilmis={!!user} />
          </nav>
        </header>
        {children}
        <footer className="mt-auto border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-5xl px-6 py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link href="/" className="flex items-center gap-1.5 font-semibold text-slate-900 w-fit">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4.2 17.5A9 9 0 1 1 19.8 17.5" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round"/>
                    <line x1="12" y1="13" x2="6.2" y2="9.6" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="12" cy="13" r="2" fill="#4f46e5"/>
                  </svg>
                  <span className="text-sm">otoendeks</span>
                </Link>
                <p className="mt-2 text-xs text-slate-400 max-w-xs">TSB verilerine dayalı kasko değerleri, sıfır araç fiyatları ve kredi hesaplama aracı.</p>
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
              © {new Date().getFullYear()} Otoendeks. Sunulan veriler bilgi amaçlıdır; bağlayıcı değildir. Resmi kasko değeri için sigorta şirketinize başvurunuz.
            </div>
          </div>
        </footer>
        </PostHogProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IkonKasko, IkonArac, IkonKredi } from "@/components/BolumIkon";

const LINKLER = [
  { href: "/",           label: "Kasko Değeri",       Ikon: IkonKasko },
  { href: "/sifir-arac", label: "Sıfır Araç Fiyatları", Ikon: IkonArac },
  { href: "/kredi",      label: "Kredi Hesaplama",    Ikon: IkonKredi },
];

export function NavMobil({ girisYapilmis }: { girisYapilmis: boolean }) {
  const [acik, setAcik] = useState(false);
  const pathname = usePathname();

  // sayfa değişince menüyü kapat
  useEffect(() => { setAcik(false); }, [pathname]);

  return (
    <>
      {/* hamburger butonu — sadece mobil */}
      <button
        className="ml-auto flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 transition-colors md:hidden"
        onClick={() => setAcik(v => !v)}
        aria-label={acik ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={acik}
      >
        {acik ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* açılır menü */}
      {acik && (
        <div className="absolute left-0 right-0 top-14 z-50 border-b border-slate-200 bg-white shadow-lg md:hidden">
          <nav className="mx-auto max-w-5xl px-4 py-3 flex flex-col gap-1">
            {LINKLER.map(({ href, label, Ikon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                <Ikon size={20} className="shrink-0 text-slate-400" />
                {label}
              </Link>
            ))}
            <div className="my-1 border-t border-slate-100" />
            {girisYapilmis ? (
              <Link
                href="/araclarim"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                Araçlarım
              </Link>
            ) : (
              <Link
                href="/giris"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                Giriş yap
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

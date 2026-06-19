"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WaitListModal } from "@/components/WaitListModal";

const BASLANGIC_SAYI = 312;
const BASLANGIC_TARIH = new Date("2026-06-19T00:00:00Z");

function listedekiKisi(): number {
  const dakika = Math.floor((Date.now() - BASLANGIC_TARIH.getTime()) / 60000);
  return BASLANGIC_SAYI + Math.floor(dakika / 10);
}

interface Props {
  girisYapilmis: boolean;
  listede: boolean;
}

export function PiyasaFiyatiLanding({ girisYapilmis, listede: ilkListede }: Props) {
  const router = useRouter();
  const [listede, setListede] = useState(ilkListede);
  const [modalAcik, setModalAcik] = useState(false);
  const [kisiSayisi, setKisiSayisi] = useState(listedekiKisi);

  useEffect(() => {
    const id = setInterval(() => setKisiSayisi(listedekiKisi()), 60000);
    return () => clearInterval(id);
  }, []);

  function handleTikla() {
    if (listede) return;
    if (!girisYapilmis) {
      router.push(`/giris?sonra=${encodeURIComponent("/piyasa-fiyati")}`);
      return;
    }
    setModalAcik(true);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      {/* Başlık */}
      <div className="mb-10 text-center">
        <span className="mb-3 inline-block rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-600">
          Yakında
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          İkinci El Piyasa Fiyatı
        </h1>
        <p className="mt-4 text-base text-slate-500 max-w-xl mx-auto">
          Aracınızın ikinci el piyasada gerçekten kaça satıldığını öğrenin.
          Yüzlerce ilandan derlenen verilerle yapay zeka destekli fiyat analizi.
        </p>
      </div>

      {/* Örnek kart — bulanık */}
      <div className="mb-10 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Toyota Corolla 1.8 Hybrid · 2022</p>
          <span className="text-xs text-slate-400">Piyasa analizi</span>
        </div>
        <div className="px-5 py-5 blur-sm select-none pointer-events-none">
          <p className="text-3xl font-bold text-slate-900">₺1.425.000</p>
          <p className="mt-1 text-xs text-slate-400">ortalama satış fiyatı · son 30 gün</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] text-slate-400">En düşük</p>
              <p className="text-sm font-semibold text-slate-700">₺1.290.000</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] text-slate-400">Medyan</p>
              <p className="text-sm font-semibold text-slate-700">₺1.415.000</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] text-slate-400">En yüksek</p>
              <p className="text-sm font-semibold text-slate-700">₺1.580.000</p>
            </div>
          </div>
          <div className="mt-3 h-16 rounded-lg bg-slate-50 flex items-center justify-center">
            <div className="flex items-end gap-1 h-10">
              {[60, 75, 55, 90, 70, 85, 65, 95, 80, 72, 88, 76].map((h, i) => (
                <div key={i} className="w-3 rounded-t bg-indigo-200" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="mb-4 text-sm text-slate-500">
          <span className="font-semibold text-indigo-600">{kisiSayisi.toLocaleString("tr-TR")} kişi</span> erken erişim listesinde
        </p>
        {listede ? (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-4 inline-block">
            <p className="text-sm font-semibold text-indigo-700">✓ Listedesiniz</p>
            <p className="mt-1 text-xs text-indigo-500">Özellik yayına girdiğinde ilk siz haberdar olacaksınız.</p>
          </div>
        ) : (
          <button
            onClick={handleTikla}
            className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Erken erişim listesine katıl
          </button>
        )}
        <p className="mt-3 text-xs text-slate-400">İlk erişim yalnızca bekleme listesine açılacak</p>
      </div>

      {modalAcik && (
        <WaitListModal
          onKapat={() => setModalAcik(false)}
          onBasari={() => { setModalAcik(false); setListede(true); }}
        />
      )}
    </main>
  );
}

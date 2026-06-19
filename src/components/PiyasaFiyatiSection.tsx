"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { waitListeEkle } from "@/app/actions/waitlist";

const BASLANGIC_SAYI = 312;
const BASLANGIC_TARIH = new Date("2026-06-19T00:00:00Z");

function listedekiKisi(): number {
  const dakika = Math.floor((Date.now() - BASLANGIC_TARIH.getTime()) / 60000);
  return BASLANGIC_SAYI + Math.floor(dakika / 10);
}

interface Props {
  girisYapilmis: boolean;
  listede: boolean;
  geriDonUrl: string;
}

export function PiyasaFiyatiSection({ girisYapilmis, listede: ilkListede, geriDonUrl }: Props) {
  const router = useRouter();
  const [listede, setListede] = useState(ilkListede);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesajAcik, setMesajAcik] = useState(false);
  const [kisiSayisi, setKisiSayisi] = useState(listedekiKisi);

  useEffect(() => {
    const id = setInterval(() => setKisiSayisi(listedekiKisi()), 60000);
    return () => clearInterval(id);
  }, []);

  async function handleTikla() {
    if (listede) return;

    if (!girisYapilmis) {
      router.push(`/giris?sonra=${encodeURIComponent(geriDonUrl)}`);
      return;
    }

    setYukleniyor(true);
    const sonuc = await waitListeEkle("piyasa_fiyati");
    setYukleniyor(false);
    if (sonuc.ok) {
      setListede(true);
      setMesajAcik(true);
    }
  }

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Başlık */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">İkinci El Piyasa Fiyatı</p>
        <span className="text-xs text-slate-400">
          <span className="font-medium text-indigo-600">{kisiSayisi.toLocaleString("tr-TR")}</span> kişi bekliyor
        </span>
      </div>

      {/* Bulanık fiyat alanı */}
      <div className="relative px-5 py-4 select-none">
        {/* Placeholder içerik */}
        <div className="flex items-end gap-3 blur-sm pointer-events-none">
          <p className="text-3xl font-bold tracking-tight text-slate-900">₺1.250.000</p>
          <p className="mb-1 text-xs text-slate-400">ortalama satış fiyatı</p>
        </div>
        <div className="mt-2 flex gap-4 blur-sm pointer-events-none">
          <span className="text-xs text-slate-400">En düşük: ₺1.100.000</span>
          <span className="text-xs text-slate-400">En yüksek: ₺1.380.000</span>
        </div>

        {/* Tıklanabilir overlay */}
        <button
          onClick={handleTikla}
          disabled={yukleniyor}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/60 backdrop-blur-[1px] transition-colors hover:bg-white/70"
        >
          {listede ? (
            <span className="rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-xs font-medium text-indigo-700">
              ✓ Listeye katıldınız — çıktığında haber vereceğiz
            </span>
          ) : (
            <>
              <span className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors">
                {yukleniyor ? "..." : "Erken erişim listesine katıl"}
              </span>
              <span className="text-[11px] text-slate-400">İlk erişim yalnızca bekleme listesine açılacak</span>
            </>
          )}
        </button>
      </div>

      {/* Başarı mesajı */}
      {mesajAcik && (
        <div className="px-5 py-3 bg-indigo-50 border-t border-indigo-100 text-xs text-indigo-700">
          Harika! Piyasa fiyatı özelliği yayına girdiğinde sizi bilgilendireceğiz.
        </div>
      )}
    </div>
  );
}

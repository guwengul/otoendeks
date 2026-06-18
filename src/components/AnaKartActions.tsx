"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { aracEkle } from "@/app/actions/garaj";
import { izlemeEkle } from "@/app/actions/izleme";

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.824L.057 23.882a.5.5 0 0 0 .613.614l6.115-1.453A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.17-1.444l-.37-.22-3.832.91.926-3.77-.242-.387A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

type AracBilgi = {
  markaKodu: number;
  tipKodu: number;
  markaAdi: string;
  tipAdi: string;
  modelYili: number;
  markaSlug: string;
  fiyatKayit?: number;
};

export function AnaKartActions({
  ozet,
  tumunuMetin,
  arac,
  girisYapilmis,
  zatenEklendi,
  zatenTakipte = false,
}: {
  ozet: string;
  tumunuMetin: string;
  arac: AracBilgi;
  girisYapilmis: boolean;
  zatenEklendi: boolean;
  zatenTakipte?: boolean;
}) {
  const router = useRouter();
  const [eklendi, setEklendi] = useState(zatenEklendi);
  const [takipte, setTakipte] = useState(zatenTakipte);
  const [secimAcik, setSecimAcik] = useState(false);
  const [pending, setPending] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const waMetin = encodeURIComponent(ozet + "\n" + pageUrl);
  const xMetin = encodeURIComponent(ozet);
  const encodedUrl = encodeURIComponent(pageUrl);

  function handleTakip() {
    if (!girisYapilmis) {
      router.push(`/giris?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (eklendi) {
      router.push("/araclarim");
      return;
    }
    if (takipte) {
      router.push("/araclarim?sekme=izliyorum");
      return;
    }
    setSecimAcik(true);
  }

  async function handleEkle(sahipMi: boolean) {
    setSecimAcik(false);
    setPending(true);
    setHata(null);
    if (!sahipMi) {
      const sonuc = await izlemeEkle({
        marka_kodu: arac.markaKodu,
        tip_kodu: arac.tipKodu,
        marka_adi: arac.markaAdi,
        tip_adi: arac.tipAdi,
        marka_slug: arac.markaSlug,
        fiyat_kayit: arac.fiyatKayit ?? 0,
        model_yili: arac.modelYili,
      });
      setPending(false);
      if (!sonuc?.error) setTakipte(true);
      else setHata(sonuc.error);
      return;
    }
    const sonuc = await aracEkle({
      marka_kodu: arac.markaKodu,
      tip_kodu: arac.tipKodu,
      marka_adi: arac.markaAdi,
      tip_adi: arac.tipAdi,
      model_yili: arac.modelYili,
      marka_slug: arac.markaSlug,
      sahip_mi: true,
    });
    setPending(false);
    if (!sonuc?.error) setEklendi(true);
    else setHata(sonuc.error);
  }

  function handleKopyala() {
    navigator.clipboard.writeText(tumunuMetin + "\n" + pageUrl);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {hata && <p className="mb-2 text-xs text-red-600">{hata}</p>}
      <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <button
          onClick={handleTakip}
          disabled={pending}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
            eklendi || takipte
              ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span>{eklendi || takipte ? "★" : "☆"}</span>
          <span>{pending ? "Ekleniyor..." : eklendi ? "Araçlarımda" : takipte ? "Takipteyim" : "Bu aracı takip et"}</span>
        </button>
        {secimAcik && (
          <div className="absolute left-0 top-full mt-1 z-10 w-52 rounded-xl border border-slate-200 bg-white shadow-lg">
            <button
              onClick={() => handleEkle(true)}
              className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-indigo-50 rounded-t-xl"
            >
              <span className="text-sm font-medium text-slate-900">Benim arabam</span>
              <span className="text-xs text-slate-500">MTV, muayene, sigorta hatırlatıcıları</span>
            </button>
            <div className="border-t border-slate-100" />
            <button
              onClick={() => handleEkle(false)}
              className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-slate-50 rounded-b-xl"
            >
              <span className="text-sm font-medium text-slate-900">Sadece takip et</span>
              <span className="text-xs text-slate-500">Fiyat değişince bildirim al</span>
            </button>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5 shrink-0">
        <a
          href={`https://wa.me/?text=${waMetin}`}
          target="_blank" rel="noopener noreferrer"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] text-white transition-opacity hover:opacity-80"
          title="WhatsApp'ta paylaş"
        >
          <IconWhatsApp />
        </a>
        <a
          href={`https://x.com/intent/tweet?text=${xMetin}&url=${encodedUrl}`}
          target="_blank" rel="noopener noreferrer"
          className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80"
          title="X'te paylaş"
        >
          <IconX />
        </a>
        <button
          onClick={handleKopyala}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
          title="Detayları kopyala"
        >
          {kopyalandi ? (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : <IconCopy />}
        </button>
      </div>
      </div>
    </div>
  );
}

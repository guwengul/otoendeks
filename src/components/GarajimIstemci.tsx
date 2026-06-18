"use client";

import { useState } from "react";
import Link from "next/link";
import { aracSil, tarihKaydet, fiyatBildirimiGuncelle } from "@/app/actions/garaj";
import { slugify } from "@/lib/slug";

type AracTarih = { id: string; tip: string; tarih: string };
type Arac = {
  id: string;
  tip_kodu: number;
  marka_adi: string;
  tip_adi: string;
  model_yili: number;
  marka_slug: string;
  sahip_mi: boolean;
  fiyat_bildirimi: boolean;
  kasko_fiyati: number | null;
  arac_tarihler: AracTarih[];
};

const TIP_LABEL: Record<string, string> = {
  mtv: "MTV hatırlatıcı",
  muayene: "Bir sonraki muayene",
  kasko: "Trafik sigortası bitiş",
};

const TIP_ACIKLAMA: Record<string, string> = {
  mtv: "31 Ocak ve 31 Temmuz'dan 1 hafta önce hatırlatırız.",
  muayene: "Muayene tarihinden 2 hafta önce hatırlatırız.",
  kasko: "Poliçe bitişinden 1 hafta önce hatırlatırız.",
};

function fmt(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

function MTVSatiri({ aracId, mevcut }: { aracId: string; mevcut?: string }) {
  // MTV için özel tarih yok — sadece "aktif mi" bilgisi. mevcut varsa aktif.
  const [aktif, setAktif] = useState(!!mevcut);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    setAktif(v => !v);
    // MTV için sabit bir tarih kaydediyoruz (31 Temmuz bu yıl veya gelecek yıl)
    const buYil = new Date().getFullYear();
    const temmuz = `${buYil}-07-31`;
    if (!aktif) {
      await tarihKaydet(aracId, "mtv", temmuz);
    } else {
      // Silmek için çok eski bir tarih yazıyoruz — backend'de ignore edilir
      await tarihKaydet(aracId, "mtv", "1970-01-01");
    }
    setPending(false);
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-600">{TIP_LABEL["mtv"]}</p>
          <p className="text-xs text-slate-400 mt-0.5">{TIP_ACIKLAMA["mtv"]}</p>
        </div>
        <button onClick={toggle} disabled={pending} className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${aktif ? "bg-indigo-500" : "bg-slate-200"}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${aktif ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </div>
    </div>
  );
}

function TarihSatiri({ aracId, tip, mevcut }: { aracId: string; tip: "muayene" | "kasko"; mevcut?: string }) {
  const [duzenleniyor, setDuzenleniyor] = useState(false);
  const [tarih, setTarih] = useState(mevcut ?? "");
  const [pending, setPending] = useState(false);

  async function kaydet() {
    if (!tarih) return;
    setPending(true);
    await tarihKaydet(aracId, tip, tarih);
    setPending(false);
    setDuzenleniyor(false);
  }

  const kalan = mevcut && mevcut !== "1970-01-01"
    ? Math.ceil((new Date(mevcut).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-600">{TIP_LABEL[tip]}</p>
          <p className="text-xs text-slate-400 mt-0.5">{TIP_ACIKLAMA[tip]}</p>
        </div>
        <div className="shrink-0 text-right">
          {duzenleniyor ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                className="rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button onClick={kaydet} disabled={pending} className="text-xs font-medium text-indigo-600 disabled:opacity-50">
                {pending ? "..." : "Kaydet"}
              </button>
              <button onClick={() => setDuzenleniyor(false)} className="text-xs text-slate-400">İptal</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {mevcut && mevcut !== "1970-01-01" ? (
                <>
                  <span className="text-xs text-slate-600">{new Date(mevcut).toLocaleDateString("tr-TR")}</span>
                  {kalan !== null && kalan >= 0 && kalan <= 30 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{kalan} gün</span>
                  )}
                  {kalan !== null && kalan < 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Geçti</span>
                  )}
                </>
              ) : null}
              <button onClick={() => setDuzenleniyor(true)} className="text-xs text-slate-400 hover:text-indigo-600">
                {mevcut && mevcut !== "1970-01-01" ? "Düzenle" : "Ekle"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AracKarti({ arac }: { arac: Arac }) {
  const [siliyor, setSiliyor] = useState(false);
  const [bildirim, setBildirim] = useState(arac.fiyat_bildirimi);
  const [bildirimPending, setBildirimPending] = useState(false);

  async function handleBildirim() {
    setBildirimPending(true);
    const yeni = !bildirim;
    setBildirim(yeni);
    await fiyatBildirimiGuncelle(arac.id, yeni);
    setBildirimPending(false);
  }
  const tarihByTip = Object.fromEntries(arac.arac_tarihler.map((t) => [t.tip, t.tarih]));
  const detayHref = `/kasko-deger/${arac.marka_slug}/${arac.model_yili}/${arac.tip_kodu}-${slugify(arac.tip_adi)}`;

  async function sil() {
    setSiliyor(true);
    await aracSil(arac.id);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              arac.sahip_mi ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
            }`}>
              {arac.sahip_mi ? "Benim arabam" : "Takip"}
            </span>
          </div>
          <Link href={detayHref} className="font-semibold text-slate-900 hover:text-indigo-600 text-sm">
            {arac.marka_adi} {arac.model_yili}
          </Link>
          <p className="text-xs text-slate-500">{arac.tip_adi}</p>
        </div>
        <div className="text-right shrink-0">
          <Link href={detayHref} className="hover:opacity-80">
            {arac.kasko_fiyati ? (
              <span className="text-lg font-bold text-slate-900">{fmt(arac.kasko_fiyati)}</span>
            ) : (
              <span className="text-sm text-slate-400">—</span>
            )}
            <p className="text-xs text-slate-400">güncel kasko</p>
          </Link>
        </div>
      </div>

      {/* Tarihler — sadece benim arabam için */}
      {arac.sahip_mi && (
        <div className="border-t border-slate-100 pt-1 divide-y divide-slate-100">
          <MTVSatiri aracId={arac.id} mevcut={tarihByTip["mtv"]} />
          <TarihSatiri aracId={arac.id} tip="muayene" mevcut={tarihByTip["muayene"]} />
          <TarihSatiri aracId={arac.id} tip="kasko" mevcut={tarihByTip["kasko"]} />
        </div>
      )}

      {/* Takip modunda bildirim toggle */}
      {!arac.sahip_mi && (
        <div className="border-t border-slate-100 pt-3">
          <button
            onClick={handleBildirim}
            disabled={bildirimPending}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <span className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors ${bildirim ? "bg-indigo-500" : "bg-slate-200"}`}>
              <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform mt-0.5 ${bildirim ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </span>
            <span>Fiyat değişince bildir</span>
          </button>
        </div>
      )}

      <div className="mt-3 border-t border-slate-100 pt-3 flex justify-between items-center">
        <Link href={detayHref} className="text-xs text-indigo-600 hover:underline">
          Detaya git →
        </Link>
        <button onClick={sil} disabled={siliyor} className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50">
          {siliyor ? "Siliniyor..." : "Kaldır"}
        </button>
      </div>
    </div>
  );
}

export function GarajimIstemci({ araclar }: { araclar: Arac[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {araclar.map((a) => (
        <AracKarti key={a.id} arac={a} />
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { aracSil, tarihKaydet } from "@/app/actions/garaj";
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
  kasko_fiyati: number | null;
  arac_tarihler: AracTarih[];
};

const TIP_LABEL: Record<string, string> = {
  mtv: "MTV son ödeme",
  muayene: "Muayene",
  kasko: "Kasko bitiş",
};

function fmt(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

function TarihSatiri({ aracId, tip, mevcut }: { aracId: string; tip: string; mevcut?: string }) {
  const [duzenleniyor, setDuzenleniyor] = useState(false);
  const [tarih, setTarih] = useState(mevcut ?? "");
  const [pending, setPending] = useState(false);

  async function kaydet() {
    if (!tarih) return;
    setPending(true);
    await tarihKaydet(aracId, tip as "mtv" | "muayene" | "kasko", tarih);
    setPending(false);
    setDuzenleniyor(false);
  }

  const kalan = mevcut
    ? Math.ceil((new Date(mevcut).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-xs text-slate-500 w-28 shrink-0">{TIP_LABEL[tip]}</span>
      {duzenleniyor ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button onClick={kaydet} disabled={pending} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
            {pending ? "..." : "Kaydet"}
          </button>
          <button onClick={() => setDuzenleniyor(false)} className="text-xs text-slate-400">İptal</button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-end">
          {mevcut ? (
            <>
              <span className="text-xs text-slate-700">{new Date(mevcut).toLocaleDateString("tr-TR")}</span>
              {kalan !== null && kalan >= 0 && kalan <= 30 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{kalan} gün</span>
              )}
              {kalan !== null && kalan < 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Geçti</span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
          <button onClick={() => setDuzenleniyor(true)} className="text-xs text-slate-400 hover:text-indigo-600">
            {mevcut ? "Düzenle" : "Ekle"}
          </button>
        </div>
      )}
    </div>
  );
}

function AracKarti({ arac }: { arac: Arac }) {
  const [siliyor, setSiliyor] = useState(false);
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
        <div className="border-t border-slate-100 pt-2">
          {(["mtv", "muayene", "kasko"] as const).map((tip) => (
            <TarihSatiri key={tip} aracId={arac.id} tip={tip} mevcut={tarihByTip[tip]} />
          ))}
        </div>
      )}

      {/* Takip modunda bilgi */}
      {!arac.sahip_mi && (
        <div className="border-t border-slate-100 pt-2">
          <p className="text-xs text-slate-400">Kasko fiyatı değişince bildirim alacaksın.</p>
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

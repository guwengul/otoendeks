"use client";

import { useState } from "react";
import Link from "next/link";
import { aracSil, tarihKaydet } from "@/app/actions/garaj";

type AracTarih = { id: string; tip: string; tarih: string };
type Arac = {
  id: string;
  tip_kodu: number;
  marka_adi: string;
  tip_adi: string;
  model_yili: number;
  marka_slug: string;
  kasko_fiyati: number | null;
  kasko_fiyati_fmt: string;
  arac_tarihler: AracTarih[];
};

const TIP_LABEL: Record<string, string> = {
  mtv: "MTV",
  muayene: "Muayene",
  kasko: "Kasko bitiş",
};

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
      <span className="text-xs text-slate-500 w-24 shrink-0">{TIP_LABEL[tip]}</span>
      {duzenleniyor ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={kaydet}
            disabled={pending}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
          >
            {pending ? "..." : "Kaydet"}
          </button>
          <button onClick={() => setDuzenleniyor(false)} className="text-xs text-slate-400">
            İptal
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-end">
          {mevcut ? (
            <>
              <span className="text-xs text-slate-700">
                {new Date(mevcut).toLocaleDateString("tr-TR")}
              </span>
              {kalan !== null && kalan <= 30 && kalan >= 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {kalan} gün
                </span>
              )}
              {kalan !== null && kalan < 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                  Geçti
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-300">—</span>
          )}
          <button
            onClick={() => setDuzenleniyor(true)}
            className="text-xs text-slate-400 hover:text-indigo-600"
          >
            {mevcut ? "Düzenle" : "Ekle"}
          </button>
        </div>
      )}
    </div>
  );
}

function AracKarti({ arac }: { arac: Arac }) {
  const [siliyor, setSiliyor] = useState(false);
  const tarihByTip = Object.fromEntries(
    arac.arac_tarihler.map((t) => [t.tip, t.tarih])
  );

  async function sil() {
    setSiliyor(true);
    await aracSil(arac.id);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <Link
            href={`/kasko-deger/${arac.marka_slug}/${arac.model_yili}/${arac.tip_kodu}-`}
            className="font-semibold text-slate-900 hover:text-indigo-600 text-sm"
          >
            {arac.marka_adi} {arac.model_yili}
          </Link>
          <p className="text-xs text-slate-500 mt-0.5">{arac.tip_adi}</p>
        </div>
        <div className="text-right shrink-0">
          {arac.kasko_fiyati ? (
            <span className="text-lg font-bold text-slate-900">{arac.kasko_fiyati_fmt}</span>
          ) : (
            <span className="text-sm text-slate-400">—</span>
          )}
          <p className="text-xs text-slate-400">güncel kasko</p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-2">
        {(["mtv", "muayene", "kasko"] as const).map((tip) => (
          <TarihSatiri
            key={tip}
            aracId={arac.id}
            tip={tip}
            mevcut={tarihByTip[tip]}
          />
        ))}
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3 flex justify-end">
        <button
          onClick={sil}
          disabled={siliyor}
          className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50"
        >
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

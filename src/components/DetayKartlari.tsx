"use client";

import type { AylikNoktasi } from "@/lib/kasko";

function pct(ilk: number, son: number) {
  if (!ilk) return 0;
  return ((son - ilk) / ilk) * 100;
}
function isaret(v: number) { return v >= 0 ? "+" : ""; }
function fmt(v: number) { return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.abs(v)); }

type EnflasyonData = {
  ilk: AylikNoktasi;
  son: AylikNoktasi;
  ilkAyLabel: string;
  sonAyLabel: string;
};

type EskimeData = {
  tl: number;
  usd: number;
  altin: number;
  modelYili: number;
};

function PaylasButtom({ metin }: { metin: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(metin)}
      className="mt-3 w-full rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
    >
      Kopyala & Paylaş
    </button>
  );
}

export function DetayKartlari({
  enflasyon,
  eskime,
  aracAdi,
}: {
  enflasyon: EnflasyonData | null;
  eskime: EskimeData | null;
  aracAdi: string;
}) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {enflasyon && (() => {
        const tlPct = pct(enflasyon.ilk.deger_tl, enflasyon.son.deger_tl);
        const usdPct = pct(enflasyon.ilk.deger_usd, enflasyon.son.deger_usd);
        const altinPct = pct(enflasyon.ilk.deger_altin_gram, enflasyon.son.deger_altin_gram);
        const metin =
          `${aracAdi}\n` +
          `${enflasyon.ilkAyLabel} → ${enflasyon.sonAyLabel}\n` +
          `TL ${isaret(tlPct)}%${fmt(tlPct)} · USD ${isaret(usdPct)}%${fmt(usdPct)} · Altın ${isaret(altinPct)}%${fmt(altinPct)}\n` +
          `otoendeks.com`;

        return (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            <p className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
              {enflasyon.ilkAyLabel} → {enflasyon.sonAyLabel}
            </p>
            <p className="text-sm leading-relaxed text-gray-700">
              TL'de{" "}
              <span className={`font-bold ${tlPct >= 0 ? "text-orange-500" : "text-green-600"}`}>
                {isaret(tlPct)}%{fmt(tlPct)}
              </span>
              {" "}kazandı — dolar'da{" "}
              <span className={`font-bold ${usdPct >= 0 ? "text-orange-500" : "text-green-600"}`}>
                {isaret(usdPct)}%{fmt(usdPct)}
              </span>
              {", "}altında{" "}
              <span className={`font-bold ${altinPct >= 0 ? "text-orange-500" : "text-green-600"}`}>
                {isaret(altinPct)}%{fmt(altinPct)}
              </span>
              .
            </p>
            <PaylasButtom metin={metin} />
          </div>
        );
      })()}

      {eskime && (() => {
        const metin =
          `${aracAdi} — 1 yıl eskimesinin bedeli\n` +
          `${fmt(eskime.tl)} TL · $${fmt(eskime.usd)} · ${fmt(eskime.altin)} gram altın\n` +
          `(${eskime.modelYili + 1} → ${eskime.modelYili} model farkı)\n` +
          `otoendeks.com`;

        return (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            <p className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
              1 yıl eskimesinin bedeli
            </p>
            <p className="text-sm leading-relaxed text-gray-700">
              {eskime.modelYili + 1} → {eskime.modelYili} modele düşmek{" "}
              <span className="font-bold text-gray-900">{fmt(eskime.tl)} TL</span>
              {" · "}
              <span className="font-bold text-gray-900">${fmt(eskime.usd)}</span>
              {" · "}
              <span className="font-bold text-gray-900">{fmt(eskime.altin)} gram altın</span>
              {" "}değer kaybı.
            </p>
            <PaylasButtom metin={metin} />
          </div>
        );
      })()}
    </div>
  );
}

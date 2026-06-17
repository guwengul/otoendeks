"use client";

import type { AylikNoktasi } from "@/lib/kasko";

function isaret(v: number) { return v >= 0 ? "+" : "−"; }
function fmt(v: number) { return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.abs(v)); }
function farkRenk(v: number) { return v >= 0 ? "text-orange-500" : "text-green-600"; }

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
        const tlFark = enflasyon.son.deger_tl - enflasyon.ilk.deger_tl;
        const usdFark = enflasyon.son.deger_usd - enflasyon.ilk.deger_usd;
        const altinFark = enflasyon.son.deger_altin_gram - enflasyon.ilk.deger_altin_gram;
        const metin =
          `${aracAdi} — ${enflasyon.ilkAyLabel} → ${enflasyon.sonAyLabel}\n` +
          `TL: ${fmt(enflasyon.ilk.deger_tl)} → ${fmt(enflasyon.son.deger_tl)} (${isaret(tlFark)}${fmt(tlFark)})\n` +
          `USD: $${fmt(enflasyon.ilk.deger_usd)} → $${fmt(enflasyon.son.deger_usd)} (${isaret(usdFark)}$${fmt(usdFark)})\n` +
          `Altın: ${fmt(enflasyon.ilk.deger_altin_gram)} gr → ${fmt(enflasyon.son.deger_altin_gram)} gr (${isaret(altinFark)}${fmt(altinFark)} gr)\n` +
          `otoendeks.com`;

        return (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              {enflasyon.ilkAyLabel} → {enflasyon.sonAyLabel}
            </p>
            <div className="space-y-2">
              {[
                { label: "TL", ilk: `${fmt(enflasyon.ilk.deger_tl)} TL`, son: `${fmt(enflasyon.son.deger_tl)} TL`, fark: tlFark, farkStr: `${isaret(tlFark)}${fmt(tlFark)} TL` },
                { label: "USD", ilk: `$${fmt(enflasyon.ilk.deger_usd)}`, son: `$${fmt(enflasyon.son.deger_usd)}`, fark: usdFark, farkStr: `${isaret(usdFark)}$${fmt(usdFark)}` },
                { label: "Altın", ilk: `${fmt(enflasyon.ilk.deger_altin_gram)} gr`, son: `${fmt(enflasyon.son.deger_altin_gram)} gr`, fark: altinFark, farkStr: `${isaret(altinFark)}${fmt(altinFark)} gr` },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between text-sm">
                  <span className="w-10 text-xs text-gray-400">{r.label}</span>
                  <span className="text-gray-500">{r.ilk}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-gray-800">{r.son}</span>
                  <span className={`text-xs font-semibold ${farkRenk(r.fark)}`}>{r.farkStr}</span>
                </div>
              ))}
            </div>
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

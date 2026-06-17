"use client";

import React from "react";
import type { AylikNoktasi } from "@/lib/kasko";

function isaret(v: number) { return v >= 0 ? "+" : "−"; }
function fmt(v: number) { return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.abs(v)); }
// ₺ sembolünü JSX olarak küçük render etmek için ayrı component
function FmtTL({ v }: { v: number }) {
  return <><span className="text-[0.8em]">₺</span>{fmt(v)}</>;
}
function fmtTLstr(v: number) { return `₺${fmt(v)}`; }
function farkRenk(v: number) { return v >= 0 ? "text-green-600" : "text-orange-500"; }

type EnflasyonData = {
  ilk: AylikNoktasi;
  son: AylikNoktasi;
  ilkAyLabel: string;
  sonAyLabel: string;
};

type EskimeData = {
  yeni: { tl: number; usd: number; altin: number };
  eski: { tl: number; usd: number; altin: number };
  modelYili: number;
};

function PaylasButonu({ metin }: { metin: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(metin)}
      className="mt-4 w-full rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50"
    >
      Kopyala & Paylaş
    </button>
  );
}

type SatirProps = { label: string; ilk: React.ReactNode; son: React.ReactNode; fark: number; farkStr: React.ReactNode };

function KarsilastirmaSatiri({ label, ilk, son, fark, farkStr }: SatirProps) {
  return (
    <div className="grid items-center gap-x-1 text-sm tabular-nums" style={{ gridTemplateColumns: "2rem 1fr 1rem 1fr 5.5rem" }}>
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-right font-mono text-gray-500">{ilk}</span>
      <span className="text-center text-gray-300">→</span>
      <span className="text-right font-mono font-medium text-gray-800">{son}</span>
      <span className={`text-right text-xs font-semibold ${farkRenk(fark)}`}>{farkStr}</span>
    </div>
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
  const kartSayisi = (enflasyon ? 1 : 0) + (eskime ? 1 : 0);
  if (kartSayisi === 0) return null;

  return (
    <div className={`mb-8 grid grid-cols-1 gap-3 ${kartSayisi === 2 ? "sm:grid-cols-2" : ""}`}>

      {enflasyon && (() => {
        const tlFark = enflasyon.son.deger_tl - enflasyon.ilk.deger_tl;
        const usdFark = enflasyon.son.deger_usd - enflasyon.ilk.deger_usd;
        const altinFark = enflasyon.son.deger_altin_gram - enflasyon.ilk.deger_altin_gram;
        const metin =
          `${aracAdi} — ${enflasyon.ilkAyLabel} → ${enflasyon.sonAyLabel}\n` +
          `TL: ${fmtTLstr(enflasyon.ilk.deger_tl)} → ${fmtTLstr(enflasyon.son.deger_tl)} (${isaret(tlFark)}${fmtTLstr(tlFark)})\n` +
          `USD: $${fmt(enflasyon.ilk.deger_usd)} → $${fmt(enflasyon.son.deger_usd)} (${isaret(usdFark)}$${fmt(usdFark)})\n` +
          `Altın: ${fmt(enflasyon.ilk.deger_altin_gram)} gr → ${fmt(enflasyon.son.deger_altin_gram)} gr (${isaret(altinFark)}${fmt(altinFark)} gr)\n` +
          `otoendeks.com`;

        return (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              {enflasyon.ilkAyLabel} → {enflasyon.sonAyLabel}
            </p>
            <div className="space-y-2">
              <KarsilastirmaSatiri label="TL"
                ilk={<FmtTL v={enflasyon.ilk.deger_tl} />} son={<FmtTL v={enflasyon.son.deger_tl} />}
                fark={tlFark} farkStr={<>{isaret(tlFark)}<FmtTL v={tlFark} /></>} />
              <KarsilastirmaSatiri label="USD"
                ilk={`$${fmt(enflasyon.ilk.deger_usd)}`} son={`$${fmt(enflasyon.son.deger_usd)}`}
                fark={usdFark} farkStr={`${isaret(usdFark)}$${fmt(usdFark)}`} />
              <KarsilastirmaSatiri label="Altın"
                ilk={`${fmt(enflasyon.ilk.deger_altin_gram)} gr`} son={`${fmt(enflasyon.son.deger_altin_gram)} gr`}
                fark={altinFark} farkStr={`${isaret(altinFark)}${fmt(altinFark)} gr`} />
            </div>
            <PaylasButonu metin={metin} />
          </div>
        );
      })()}

      {eskime && (() => {
        const tlFark = eskime.eski.tl - eskime.yeni.tl;
        const usdFark = eskime.eski.usd - eskime.yeni.usd;
        const altinFark = eskime.eski.altin - eskime.yeni.altin;
        const metin =
          `${aracAdi} — ${eskime.modelYili + 1} → ${eskime.modelYili} model karşılaştırması\n` +
          `TL: ${fmtTLstr(eskime.yeni.tl)} → ${fmtTLstr(eskime.eski.tl)} (${isaret(tlFark)}${fmtTLstr(tlFark)})\n` +
          `USD: $${fmt(eskime.yeni.usd)} → $${fmt(eskime.eski.usd)} (${isaret(usdFark)}$${fmt(usdFark)})\n` +
          `Altın: ${fmt(eskime.yeni.altin)} gr → ${fmt(eskime.eski.altin)} gr (${isaret(altinFark)}${fmt(altinFark)} gr)\n` +
          `otoendeks.com`;

        return (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
              {eskime.modelYili + 1} Model → {eskime.modelYili} Model Karşılaştırması
            </p>
            <div className="space-y-2">
              <KarsilastirmaSatiri label="TL"
                ilk={<FmtTL v={eskime.yeni.tl} />} son={<FmtTL v={eskime.eski.tl} />}
                fark={tlFark} farkStr={<>{isaret(tlFark)}<FmtTL v={tlFark} /></>} />
              <KarsilastirmaSatiri label="USD"
                ilk={`$${fmt(eskime.yeni.usd)}`} son={`$${fmt(eskime.eski.usd)}`}
                fark={usdFark} farkStr={`${isaret(usdFark)}$${fmt(usdFark)}`} />
              <KarsilastirmaSatiri label="Altın"
                ilk={`${fmt(eskime.yeni.altin)} gr`} son={`${fmt(eskime.eski.altin)} gr`}
                fark={altinFark} farkStr={`${isaret(altinFark)}${fmt(altinFark)} gr`} />
            </div>
            <PaylasButonu metin={metin} />
          </div>
        );
      })()}

    </div>
  );
}

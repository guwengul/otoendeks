"use client";

import React, { useEffect, useState } from "react";
import type { AylikNoktasi } from "@/lib/kasko";

function isaret(v: number) { return v >= 0 ? "+" : "−"; }
function fmt(v: number) { return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.abs(v)); }
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
  yeniYil: number;
  eskiYil: number;
};

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

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.824L.057 23.882a.5.5 0 0 0 .613.614l6.115-1.453A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 0 1-5.17-1.444l-.37-.22-3.832.91.926-3.77-.242-.387A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function IconShare() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}

function PaylasIkonlari({ metin }: { metin: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const encodedText = encodeURIComponent(metin);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(pageUrl);

  function handleKopyala() {
    navigator.clipboard.writeText(metin + "\n" + pageUrl);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ text: metin, url: pageUrl });
    } catch {
      // kullanıcı iptal etti
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 pt-3">
      <a
        href={`https://wa.me/?text=${encodedText}%0A${encodedUrl}`}
        target="_blank" rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition-opacity hover:opacity-80"
        title="WhatsApp'ta paylaş"
      >
        <IconWhatsApp />
      </a>
      <a
        href={`https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-80"
        title="X'te paylaş"
      >
        <IconX />
      </a>
      <button
        onClick={handleKopyala}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
        title="Kopyala"
      >
        {kopyalandi ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : <IconCopy />}
      </button>
      {canNativeShare && (
        <button
          onClick={handleNativeShare}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
          title="Paylaş"
        >
          <IconShare />
        </button>
      )}
    </div>
  );
}

export function DetayKartlari({
  enflasyon,
  eskime,
  aracAdi,
  anaFiyat,
  anaAyLabel,
}: {
  enflasyon: EnflasyonData | null;
  eskime: EskimeData | null;
  aracAdi: string;
  anaFiyat: number | null;
  anaAyLabel: string;
}) {
  const kartSayisi = (enflasyon ? 1 : 0) + (eskime ? 1 : 0);
  if (kartSayisi === 0) return null;

  const enflasyonMetin = enflasyon
    ? (() => {
        const tlFark = enflasyon.son.deger_tl - enflasyon.ilk.deger_tl;
        const usdFark = enflasyon.son.deger_usd - enflasyon.ilk.deger_usd;
        const altinFark = enflasyon.son.deger_altin_gram - enflasyon.ilk.deger_altin_gram;
        return (
          `${aracAdi} — ${enflasyon.ilkAyLabel} → ${enflasyon.sonAyLabel}\n` +
          `TL: ${fmtTLstr(enflasyon.ilk.deger_tl)} → ${fmtTLstr(enflasyon.son.deger_tl)} (${isaret(tlFark)}${fmtTLstr(tlFark)})\n` +
          `USD: $${fmt(enflasyon.ilk.deger_usd)} → $${fmt(enflasyon.son.deger_usd)} (${isaret(usdFark)}$${fmt(usdFark)})\n` +
          `Altın: ${fmt(enflasyon.ilk.deger_altin_gram)} gr → ${fmt(enflasyon.son.deger_altin_gram)} gr (${isaret(altinFark)}${fmt(altinFark)} gr)`
        );
      })()
    : null;

  const eskimeMetin = eskime
    ? (() => {
        const tlFark = eskime.eski.tl - eskime.yeni.tl;
        const usdFark = eskime.eski.usd - eskime.yeni.usd;
        const altinFark = eskime.eski.altin - eskime.yeni.altin;
        return (
          `${aracAdi} — ${eskime.yeniYil} → ${eskime.eskiYil} model karşılaştırması\n` +
          `TL: ${fmtTLstr(eskime.yeni.tl)} → ${fmtTLstr(eskime.eski.tl)} (${isaret(tlFark)}${fmtTLstr(tlFark)})\n` +
          `USD: $${fmt(eskime.yeni.usd)} → $${fmt(eskime.eski.usd)} (${isaret(usdFark)}$${fmt(usdFark)})\n` +
          `Altın: ${fmt(eskime.yeni.altin)} gr → ${fmt(eskime.eski.altin)} gr (${isaret(altinFark)}${fmt(altinFark)} gr)`
        );
      })()
    : null;

  const tumunuMetin =
    `${aracAdi}\n` +
    (anaFiyat ? `Kasko Değeri: ${fmtTLstr(anaFiyat)} (${anaAyLabel} TSB)\n` : "") +
    (enflasyonMetin ? "\n" + enflasyonMetin : "") +
    (eskimeMetin ? "\n\n" + eskimeMetin : "") +
    "\n\notoendeks.com";

  return (
    <div className="mb-8 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {enflasyon ? (() => {
          const tlFark = enflasyon.son.deger_tl - enflasyon.ilk.deger_tl;
          const usdFark = enflasyon.son.deger_usd - enflasyon.ilk.deger_usd;
          const altinFark = enflasyon.son.deger_altin_gram - enflasyon.ilk.deger_altin_gram;
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
            </div>
          );
        })() : (
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-300">Dönem Karşılaştırması</p>
            <p className="text-xs text-gray-300">Yeterli veri yok</p>
          </div>
        )}

        {eskime ? (() => {
          const tlFark = eskime.eski.tl - eskime.yeni.tl;
          const usdFark = eskime.eski.usd - eskime.yeni.usd;
          const altinFark = eskime.eski.altin - eskime.yeni.altin;
          return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                {eskime.yeniYil} → {eskime.eskiYil} Model Karşılaştırması
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
            </div>
          );
        })() : (
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-300">Model Yılı Karşılaştırması</p>
            <p className="text-xs text-gray-300">Yeterli veri yok</p>
          </div>
        )}
      </div>

      <PaylasIkonlari metin={tumunuMetin} />
    </div>
  );
}

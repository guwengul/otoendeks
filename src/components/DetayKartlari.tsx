"use client";

import React from "react";
import type { AylikNoktasi } from "@/lib/kasko";

function fmt(v: number) { return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.abs(v)); }
function FmtTL({ v }: { v: number }) {
  return <><span className="text-[0.8em]">₺</span>{fmt(v)}</>;
}

export type EnflasyonData = {
  ilk: AylikNoktasi;
  son: AylikNoktasi;
  ilkAyLabel: string;
  sonAyLabel: string;
};

export type EskimeData = {
  yeni: { tl: number; usd: number; altin: number };
  eski: { tl: number; usd: number; altin: number };
  yeniYil: number;
  eskiYil: number;
};

function DegisimSatiri({
  label,
  ilkStr,
  sonStr,
  fark,
}: {
  label: string;
  ilkStr: React.ReactNode;
  sonStr: React.ReactNode;
  fark: number;
}) {
  const yukari = fark > 0;
  const notr = fark === 0;
  const renk = yukari ? "text-emerald-600" : notr ? "text-slate-400" : "text-orange-500";
  const bgRenk = yukari ? "bg-emerald-50" : notr ? "bg-slate-50" : "bg-orange-50";
  const pct = null; // fark/ilk oranı gerekirse eklenebilir

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="w-8 shrink-0 text-xs font-medium text-slate-400">{label}</span>
      <span className="text-xs tabular-nums text-slate-400 line-through">{ilkStr}</span>
      <svg className="h-3 w-3 shrink-0 text-slate-300" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6h8M7 3l3 3-3 3" />
      </svg>
      <span className="flex-1 text-right text-sm font-semibold tabular-nums text-slate-800">{sonStr}</span>
      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${renk} ${bgRenk}`}>
        {!notr && (
          <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 10 10" fill="currentColor">
            {yukari ? <path d="M5 2L9 8H1L5 2Z" /> : <path d="M5 8L1 2H9L5 8Z" />}
          </svg>
        )}
        {fark > 0 ? "+" : fark < 0 ? "−" : ""}{fmt(fark)}
      </span>
    </div>
  );
}

export function DetayKartlari({
  enflasyon,
  eskime,
}: {
  enflasyon: EnflasyonData | null;
  eskime: EskimeData | null;
}) {
  const kartSayisi = (enflasyon ? 1 : 0) + (eskime ? 1 : 0);
  if (kartSayisi === 0) return null;

  return (
    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {enflasyon ? (() => {
        const tlFark = enflasyon.son.deger_tl - enflasyon.ilk.deger_tl;
        const usdFark = enflasyon.son.deger_usd - enflasyon.ilk.deger_usd;
        const altinFark = enflasyon.son.deger_altin_gram - enflasyon.ilk.deger_altin_gram;
        return (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Dönem Değişimi
            </p>
            <p className="mb-3 text-xs text-slate-500">{enflasyon.ilkAyLabel} → {enflasyon.sonAyLabel}</p>
            <div className="divide-y divide-slate-100">
              <DegisimSatiri label="TL"
                ilkStr={<FmtTL v={enflasyon.ilk.deger_tl} />}
                sonStr={<FmtTL v={enflasyon.son.deger_tl} />}
                fark={tlFark} />
              <DegisimSatiri label="USD"
                ilkStr={`$${fmt(enflasyon.ilk.deger_usd)}`}
                sonStr={`$${fmt(enflasyon.son.deger_usd)}`}
                fark={usdFark} />
              <DegisimSatiri label="Altın"
                ilkStr={`${fmt(enflasyon.ilk.deger_altin_gram)} gr`}
                sonStr={`${fmt(enflasyon.son.deger_altin_gram)} gr`}
                fark={altinFark} />
            </div>
          </div>
        );
      })() : (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300">Dönem Değişimi</p>
          <p className="text-xs text-slate-300">Yeterli veri yok</p>
        </div>
      )}

      {eskime ? (() => {
        const tlFark = eskime.eski.tl - eskime.yeni.tl;
        const usdFark = eskime.eski.usd - eskime.yeni.usd;
        const altinFark = eskime.eski.altin - eskime.yeni.altin;
        return (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Model Yılı Farkı
            </p>
            <p className="mb-3 text-xs text-slate-500">{eskime.yeniYil} → {eskime.eskiYil} model</p>
            <div className="divide-y divide-slate-100">
              <DegisimSatiri label="TL"
                ilkStr={<FmtTL v={eskime.yeni.tl} />}
                sonStr={<FmtTL v={eskime.eski.tl} />}
                fark={tlFark} />
              <DegisimSatiri label="USD"
                ilkStr={`$${fmt(eskime.yeni.usd)}`}
                sonStr={`$${fmt(eskime.eski.usd)}`}
                fark={usdFark} />
              <DegisimSatiri label="Altın"
                ilkStr={`${fmt(eskime.yeni.altin)} gr`}
                sonStr={`${fmt(eskime.eski.altin)} gr`}
                fark={altinFark} />
            </div>
          </div>
        );
      })() : (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300">Model Yılı Farkı</p>
          <p className="text-xs text-slate-300">Yeterli veri yok</p>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import type { AylikNoktasi } from "@/lib/kasko";

function fmt(v: number) { return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.abs(v)); }

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

function DegisimSatiri({ label, deger, fark }: { label: string; deger: string; fark: number }) {
  const yukari = fark > 0;
  const notr = fark === 0;
  const renk = yukari ? "text-emerald-600" : notr ? "text-slate-400" : "text-orange-500";
  const bgRenk = yukari ? "bg-emerald-50" : notr ? "bg-slate-50" : "bg-orange-50";
  const isaretStr = fark > 0 ? "+" : fark < 0 ? "−" : "";

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-slate-400 w-10 shrink-0">{label}</span>
      <span className="flex-1 text-right text-sm font-semibold tabular-nums text-slate-800">{deger}</span>
      <span className={`ml-3 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium w-24 justify-end ${renk} ${bgRenk}`}>
        {!notr && (
          <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 10 10" fill="currentColor">
            {yukari ? <path d="M5 2L9 8H1L5 2Z" /> : <path d="M5 8L1 2H9L5 8Z" />}
          </svg>
        )}
        {isaretStr}{fmt(fark)}
      </span>
    </div>
  );
}

function Kart({ baslik, donem, tlFark, satirlar }: {
  baslik: string;
  donem: string;
  tlFark: number;
  satirlar: { label: string; deger: string; fark: number }[];
}) {
  const yukari = tlFark > 0;
  const notr = tlFark === 0;
  const renk = yukari ? "text-emerald-600" : notr ? "text-slate-400" : "text-orange-500";
  const isaretStr = tlFark > 0 ? "+" : tlFark < 0 ? "−" : "";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-xs text-slate-500">{baslik}</p>
        <p className="text-xs text-slate-400 shrink-0">{donem}</p>
      </div>
      <p className={`mb-3 text-xl font-bold tabular-nums ${renk}`}>
        {isaretStr}₺{fmt(tlFark)}
      </p>
      <div className="divide-y divide-slate-100">
        {satirlar.map((s) => (
          <DegisimSatiri key={s.label} label={s.label} deger={s.deger} fark={s.fark} />
        ))}
      </div>
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
  if (!enflasyon && !eskime) return null;

  return (
    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {enflasyon ? (
        <Kart
          baslik={`${enflasyon.ilkAyLabel} → ${enflasyon.sonAyLabel}`}
          donem="1 yıllık değişim"
          tlFark={enflasyon.son.deger_tl - enflasyon.ilk.deger_tl}
          satirlar={[
            { label: "TL", deger: `₺${fmt(enflasyon.son.deger_tl)}`, fark: enflasyon.son.deger_tl - enflasyon.ilk.deger_tl },
            { label: "USD", deger: `$${fmt(enflasyon.son.deger_usd)}`, fark: enflasyon.son.deger_usd - enflasyon.ilk.deger_usd },
            { label: "Altın", deger: `${fmt(enflasyon.son.deger_altin_gram)} gr`, fark: enflasyon.son.deger_altin_gram - enflasyon.ilk.deger_altin_gram },
          ]}
        />
      ) : (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-2">Dönem Değişimi</p>
          <p className="text-xs text-slate-300">Yeterli veri yok</p>
        </div>
      )}

      {eskime ? (
        <Kart
          baslik={`${eskime.yeniYil} model → ${eskime.eskiYil} model`}
          donem="model yılı farkı"
          tlFark={eskime.eski.tl - eskime.yeni.tl}
          satirlar={[
            { label: "TL", deger: `₺${fmt(eskime.eski.tl)}`, fark: eskime.eski.tl - eskime.yeni.tl },
            { label: "USD", deger: `$${fmt(eskime.eski.usd)}`, fark: eskime.eski.usd - eskime.yeni.usd },
            { label: "Altın", deger: `${fmt(eskime.eski.altin)} gr`, fark: eskime.eski.altin - eskime.yeni.altin },
          ]}
        />
      ) : (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-2">Model Yılı Farkı</p>
          <p className="text-xs text-slate-300">Yeterli veri yok</p>
        </div>
      )}
    </div>
  );
}

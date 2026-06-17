"use client";

import { useMemo, useState } from "react";
import type { SifirEndeksVeri } from "@/lib/kasko";
import { extractModelAdi } from "@/lib/kasko";

function formatTL(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

function DegisimBadge({ pct, etiket }: { pct: number | null; etiket: string }) {
  if (pct === null) return null;
  const renk = pct > 0 ? "bg-green-50 text-green-700" : pct < 0 ? "bg-orange-50 text-orange-700" : "bg-gray-100 text-gray-500";
  const isaret = pct > 0 ? "+" : "";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${renk}`}>
      {etiket} {isaret}{pct.toFixed(1)}%
    </span>
  );
}

type TipRow = {
  tip_kodu: number;
  tipAdiKisa: string;
  deger: number;
  aylikPct: number | null;
  yillikPct: number | null;
};

type ModelGrup = {
  model: string;
  tipler: TipRow[];
};

export function SifirEndeksListesi({ veri, markaAdi }: { veri: SifirEndeksVeri; markaAdi: string }) {
  const [query, setQuery] = useState("");

  const gruplar = useMemo((): ModelGrup[] => {
    const modelMap = new Map<string, TipRow[]>();
    for (const r of veri.current) {
      const model = extractModelAdi(r.tip_adi, markaAdi);
      const tipAdiKisa = r.tip_adi.startsWith(markaAdi) ? r.tip_adi.slice(markaAdi.length).trim() : r.tip_adi;
      const prev = veri.prevMonthMap.get(r.tip_kodu);
      const yilOnce = veri.prevYearMap.get(r.tip_kodu);
      const aylikPct = prev ? ((r.deger - prev) / prev) * 100 : null;
      const yillikPct = yilOnce ? ((r.deger - yilOnce) / yilOnce) * 100 : null;
      const tip: TipRow = { tip_kodu: r.tip_kodu, tipAdiKisa, deger: r.deger, aylikPct, yillikPct };
      const list = modelMap.get(model) ?? [];
      list.push(tip);
      modelMap.set(model, list);
    }
    return [...modelMap.entries()].map(([model, tipler]) => ({ model, tipler }));
  }, [veri, markaAdi]);

  const filtreliGruplar = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return gruplar;
    const tokens = q.split(/\s+/).filter(Boolean);
    return gruplar
      .map((g) => ({
        ...g,
        tipler: g.tipler.filter((t) => {
          const hay = `${g.model} ${t.tipAdiKisa}`.toLocaleLowerCase("tr");
          return tokens.every((tk) => hay.includes(tk));
        }),
      }))
      .filter((g) => g.tipler.length > 0);
  }, [gruplar, query]);

  return (
    <div className="w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Model veya versiyon ara..."
        className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {filtreliGruplar.length === 0 && (
        <p className="mt-6 text-center text-sm text-gray-500">Sonuç bulunamadı.</p>
      )}

      <div className="space-y-4">
        {filtreliGruplar.map((g) => (
          <div key={g.model} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="divide-y divide-gray-100">
              {g.tipler.map((tip) => (
                <div key={tip.tip_kodu} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{tip.tipAdiKisa}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DegisimBadge pct={tip.aylikPct} etiket="Aylık" />
                    <DegisimBadge pct={tip.yillikPct} etiket="Yıllık" />
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatTL(tip.deger)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

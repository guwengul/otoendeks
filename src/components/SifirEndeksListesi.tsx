"use client";

import { useMemo, useState } from "react";
import type { SifirEndeksVeri } from "@/lib/kasko";
import { extractModelAdi, isTicari } from "@/lib/kasko";

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
  const [tab, setTab] = useState<"binek" | "ticari">("binek");

  const { binekGruplar, ticariGruplar } = useMemo(() => {
    const toGruplar = (rows: typeof veri.current): ModelGrup[] => {
      const modelMap = new Map<string, TipRow[]>();
      for (const r of rows) {
        const model = extractModelAdi(r.tip_adi, markaAdi);
        const tipAdiKisa = r.tip_adi.slice(markaAdi.length).trim().slice(model.length).trim() || r.tip_adi;
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
    };

    const binek = veri.current.filter((r) => !isTicari(r.tip_adi));
    const ticari = veri.current.filter((r) => isTicari(r.tip_adi));
    return { binekGruplar: toGruplar(binek), ticariGruplar: toGruplar(ticari) };
  }, [veri, markaAdi]);

  const aktifGruplar = tab === "binek" ? binekGruplar : ticariGruplar;

  const filtreliGruplar = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return aktifGruplar;
    const tokens = q.split(/\s+/).filter(Boolean);
    return aktifGruplar
      .map((g) => ({
        ...g,
        tipler: g.tipler.filter((t) => {
          const hay = `${g.model} ${t.tipAdiKisa}`.toLocaleLowerCase("tr");
          return tokens.every((tk) => hay.includes(tk));
        }),
      }))
      .filter((g) => g.tipler.length > 0);
  }, [aktifGruplar, query]);

  return (
    <div className="w-full">
      {/* Tab */}
      <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
        {(["binek", "ticari"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setQuery(""); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t === "binek" ? `Binek (${binekGruplar.reduce((a, g) => a + g.tipler.length, 0)})` : `Ticari (${ticariGruplar.reduce((a, g) => a + g.tipler.length, 0)})`}
          </button>
        ))}
      </div>

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
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <h2 className="text-sm font-semibold text-gray-800">{g.model}</h2>
            </div>
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

"use client";

import { useMemo, useState } from "react";
import type { SifirEndeksRow } from "@/lib/kasko";
import { extractModelAdi } from "@/lib/kasko";

function formatTL(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

function ayLabel(yyyymm: string) {
  const [y, m] = yyyymm.split("-");
  const AYLAR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${AYLAR[Number(m) - 1]} ${y.slice(2)}`;
}

function farkRenk(ilk: number, son: number) {
  if (son > ilk) return "text-green-600";
  if (son < ilk) return "text-orange-500";
  return "text-gray-400";
}

export function SifirEndeksTablosu({ rows, markaAdi }: { rows: SifirEndeksRow[]; markaAdi: string }) {
  const [query, setQuery] = useState("");
  const [acikModeller, setAcikModeller] = useState<Set<string>>(new Set());

  const { aylar, gruplar } = useMemo(() => {
    const aySet = new Set<string>();
    for (const r of rows) aySet.add(r.snapshot_month.slice(0, 7));
    const aylar = [...aySet].sort();

    // tip_kodu → { model, tip_adi_kisa, aylar Map }
    type TipGrup = { tipKodu: number; tipAdiKisa: string; fiyatlar: Map<string, number> };
    const modelMap = new Map<string, TipGrup[]>();

    const tipMap = new Map<number, TipGrup>();
    for (const r of rows) {
      let tip = tipMap.get(r.tip_kodu);
      if (!tip) {
        const model = extractModelAdi(r.tip_adi, markaAdi);
        const tipAdiKisa = r.tip_adi.slice(markaAdi.length).trim().slice(model.length).trim();
        tip = { tipKodu: r.tip_kodu, tipAdiKisa: tipAdiKisa || r.tip_adi, fiyatlar: new Map() };
        tipMap.set(r.tip_kodu, tip);
        const key = model;
        const list = modelMap.get(key) ?? [];
        list.push(tip);
        modelMap.set(key, list);
      }
      tip.fiyatlar.set(r.snapshot_month.slice(0, 7), r.deger);
    }

    return { aylar, gruplar: modelMap };
  }, [rows, markaAdi]);

  const filtreliGruplar = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return gruplar;
    const tokens = q.split(/\s+/).filter(Boolean);
    const result = new Map<string, ReturnType<typeof gruplar.get>>();
    for (const [model, tipler] of gruplar) {
      const filtrelenenTipler = tipler!.filter((t) => {
        const hay = `${model} ${t.tipAdiKisa}`.toLocaleLowerCase("tr");
        return tokens.every((tk) => hay.includes(tk));
      });
      if (filtrelenenTipler.length > 0) result.set(model, filtrelenenTipler);
    }
    return result;
  }, [gruplar, query]);

  function toggleModel(model: string) {
    setAcikModeller((prev) => {
      const next = new Set(prev);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });
  }

  const sonAy = aylar[aylar.length - 1];
  const oncekiAy = aylar[aylar.length - 2] ?? null;
  const ilkAy = aylar[0];

  function degisimBadge(pct: number | null, etiket: string) {
    if (pct === null) return null;
    const renk = pct > 0 ? "bg-green-50 text-green-700" : pct < 0 ? "bg-orange-50 text-orange-700" : "bg-gray-100 text-gray-500";
    const isaret = pct > 0 ? "+" : "";
    return (
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${renk}`}>
        {etiket} {isaret}{pct.toFixed(1)}%
      </span>
    );
  }

  function modelDegisim(tipler: NonNullable<ReturnType<typeof filtreliGruplar.get>>) {
    const ort = (ay: string) => {
      const fs = tipler.map((t) => t.fiyatlar.get(ay)).filter((v): v is number => v !== undefined);
      if (!fs.length) return null;
      return fs.reduce((a, b) => a + b, 0) / fs.length;
    };
    const son = ort(sonAy);
    const once = oncekiAy ? ort(oncekiAy) : null;
    const ilk = ort(ilkAy);
    const aylik = son && once ? ((son - once) / once) * 100 : null;
    const yillik = son && ilk && ilkAy !== sonAy ? ((son - ilk) / ilk) * 100 : null;
    return { aylik, yillik };
  }

  return (
    <div className="w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Model veya versiyon ara..."
        className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {filtreliGruplar.size === 0 && (
        <p className="mt-6 text-center text-sm text-gray-500">Sonuç bulunamadı.</p>
      )}

      <div className="space-y-2">
        {[...filtreliGruplar.entries()].map(([model, tipler]) => {
          const acik = acikModeller.has(model) || query.trim().length > 0;
          const sonFiyatlar = tipler!.map((t) => t.fiyatlar.get(sonAy) ?? 0).filter(Boolean);
          const minF = Math.min(...sonFiyatlar);
          const maxF = Math.max(...sonFiyatlar);
          const { aylik, yillik } = modelDegisim(tipler!);

          return (
            <div key={model} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Model başlığı */}
              <button
                onClick={() => toggleModel(model)}
                className="flex w-full items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3 text-left"
              >
                <span className="text-sm font-semibold text-gray-800">{model}</span>
                <div className="flex items-center gap-2">
                  {sonFiyatlar.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {minF === maxF ? formatTL(minF) : `${formatTL(minF)} – ${formatTL(maxF)}`}
                    </span>
                  )}
                  {degisimBadge(aylik, "Aylık")}
                  {degisimBadge(yillik, "Yıllık")}
                  <span className="text-xs text-gray-400">{tipler!.length} ver.</span>
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-4 w-4 text-gray-400 transition-transform ${acik ? "rotate-180" : ""}`}
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </button>

              {/* Aylık fiyat tablosu */}
              {acik && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="py-2 pl-4 pr-2 text-left font-medium text-gray-500 min-w-[180px]">Versiyon</th>
                        {aylar.map((ay) => (
                          <th key={ay} className="px-2 py-2 text-right font-medium text-gray-500 whitespace-nowrap">
                            {ayLabel(ay)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {tipler!.map((tip) => {
                        const ilkFiyat = tip.fiyatlar.get(aylar[0]) ?? 0;
                        const sonFiyat = tip.fiyatlar.get(sonAy) ?? 0;
                        return (
                          <tr key={tip.tipKodu} className="hover:bg-gray-50/50">
                            <td className="py-2.5 pl-4 pr-2 text-gray-700 leading-snug">{tip.tipAdiKisa}</td>
                            {aylar.map((ay) => {
                              const f = tip.fiyatlar.get(ay);
                              const renk = f && ilkFiyat && sonFiyat
                                ? farkRenk(ilkFiyat, f)
                                : "text-gray-400";
                              return (
                                <td key={ay} className={`px-2 py-2.5 text-right tabular-nums whitespace-nowrap font-mono ${renk}`}>
                                  {f ? formatTL(f) : "—"}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

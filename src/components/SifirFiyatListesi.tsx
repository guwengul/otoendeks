"use client";

import { useMemo, useState } from "react";
import type { SifirFiyat } from "@/lib/kasko";

function formatTL(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

const YAKIT_RENK: Record<string, string> = {
  "Benzin": "bg-orange-50 text-orange-700",
  "Dizel": "bg-gray-100 text-gray-600",
  "Elektrik": "bg-green-50 text-green-700",
  "Hibrit": "bg-blue-50 text-blue-700",
  "Mild Hibrit": "bg-teal-50 text-teal-700",
  "LPG": "bg-purple-50 text-purple-700",
};

export function SifirFiyatListesi({ rows }: { rows: SifirFiyat[] }) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    const filtered = tokens.length
      ? rows.filter((r) => {
          const hay = `${r.model_adi} ${r.versiyon}`.toLocaleLowerCase("tr");
          return tokens.every((t) => hay.includes(t));
        })
      : rows;

    const map = new Map<string, SifirFiyat[]>();
    for (const r of filtered) {
      const list = map.get(r.model_adi) ?? [];
      list.push(r);
      map.set(r.model_adi, list);
    }
    return map;
  }, [rows, query]);

  return (
    <div className="w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Model veya versiyon ara..."
        className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {grouped.size === 0 && (
        <p className="mt-6 text-center text-sm text-gray-500">Sonuç bulunamadı.</p>
      )}

      <div className="space-y-4">
        {[...grouped.entries()].map(([modelAdi, versiyonlar]) => (
          <div key={modelAdi} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <h2 className="text-sm font-semibold text-gray-800">{modelAdi}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {versiyonlar.map((r) => {
                const kampanya = r.kampanya_fiyati > 0;
                return (
                  <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">{r.versiyon}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${YAKIT_RENK[r.yakit] ?? "bg-gray-100 text-gray-600"}`}>
                          {r.yakit}
                        </span>
                        <span className="text-[10px] text-gray-400">{r.vites}</span>
                        {r.guc && <span className="text-[10px] text-gray-400">{r.guc} hp</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className="text-[10px] text-gray-400">Liste</span>
                        <span className={`text-sm font-medium ${kampanya ? "text-gray-400 line-through" : "text-gray-900 font-semibold"}`}>
                          {formatTL(r.liste_fiyati)}
                        </span>
                      </div>
                      {kampanya && (
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-[10px] text-green-600">Kampanya</span>
                          <span className="text-sm font-semibold text-green-700">{formatTL(r.kampanya_fiyati)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

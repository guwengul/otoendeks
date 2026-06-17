"use client";

import { useState } from "react";
import type { AylikNoktasi } from "@/lib/kasko";

type Birim = "tl" | "usd" | "altin";

function formatDeger(value: number, birim: Birim): string {
  if (birim === "tl")
    return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value) + " TL";
  if (birim === "usd")
    return "$" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value) + " gr";
}

function formatAy(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${aylar[Number(month) - 1]} ${year.slice(2)}`;
}

function Grafik({ noktalar, birim }: { noktalar: number[]; birim: Birim }) {
  const width = 600;
  const height = 200;
  const pad = { top: 20, right: 20, bottom: 28, left: 72 };
  const iw = width - pad.left - pad.right;
  const ih = height - pad.top - pad.bottom;

  const max = Math.max(...noktalar);
  const min = Math.min(...noktalar);
  const range = max - min || 1;

  const pts = noktalar.map((v, i) => ({
    x: pad.left + (noktalar.length === 1 ? iw / 2 : (i / (noktalar.length - 1)) * iw),
    y: pad.top + ih - ((v - min) / range) * ih,
    v,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const step = Math.ceil(noktalar.length / 6);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <line x1={pad.left} y1={pad.top + ih} x2={width - pad.right} y2={pad.top + ih} stroke="#e5e7eb" />
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ih} stroke="#e5e7eb" />
      <text x={pad.left - 6} y={pad.top + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{formatDeger(max, birim)}</text>
      <text x={pad.left - 6} y={pad.top + ih} textAnchor="end" fontSize="10" fill="#9ca3af">{formatDeger(min, birim)}</text>
      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth={2} />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#2563eb" />)}
    </svg>
  );
}

export function FiyatGecmisiGrafik({ gecmis }: { gecmis: AylikNoktasi[] }) {
  const [birim, setBirim] = useState<Birim>("tl");
  if (gecmis.length === 0) return null;

  const ilk = gecmis[0];
  const son = gecmis[gecmis.length - 1];

  function degisim(ilkVal: number, sonVal: number) {
    if (!ilkVal) return null;
    const pct = ((sonVal - ilkVal) / ilkVal) * 100;
    const isaret = pct >= 0 ? "+" : "";
    return { pct, label: `${isaret}${pct.toFixed(1)}%`, pozitif: pct >= 0 };
  }

  const degisimler = {
    tl: degisim(ilk.deger_tl, son.deger_tl),
    usd: degisim(ilk.deger_usd, son.deger_usd),
    altin: degisim(ilk.deger_altin_gram, son.deger_altin_gram),
  };

  const noktalar = {
    tl: gecmis.map((d) => d.deger_tl),
    usd: gecmis.map((d) => d.deger_usd),
    altin: gecmis.map((d) => d.deger_altin_gram),
  };

  const tabs: { key: Birim; label: string }[] = [
    { key: "tl", label: "TL" },
    { key: "usd", label: "USD" },
    { key: "altin", label: "Altın" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-6">
        {tabs.map((t) => {
          const d = degisimler[t.key];
          return (
            <button
              key={t.key}
              onClick={() => setBirim(t.key)}
              className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors ${
                birim === t.key ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-xs text-gray-500">{t.label}</span>
              {d && (
                <span className={`text-sm font-semibold ${d.pozitif ? "text-red-500" : "text-green-600"}`}>
                  {d.label}
                </span>
              )}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-gray-400">
          {formatAy(ilk.snapshot_month)} – {formatAy(son.snapshot_month)}
        </span>
      </div>
      <Grafik noktalar={noktalar[birim]} birim={birim} />
    </div>
  );
}

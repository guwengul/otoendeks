"use client";

import { useState } from "react";
import type { AylikNoktasi } from "@/lib/kasko";

type Birim = "tl" | "usd" | "altin";

function formatDeger(value: number, birim: Birim): string {
  if (birim === "tl")
    return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
  if (birim === "usd")
    return "$" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value) + " gr";
}

function formatAy(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${aylar[Number(month) - 1]} ${year.slice(2)}`;
}

type Tooltip = { x: number; y: number; value: number; ay: string } | null;

function Grafik({ noktalar, aylar, birim, artiyor }: { noktalar: number[]; aylar: string[]; birim: Birim; artiyor: boolean }) {
  const [tooltip, setTooltip] = useState<Tooltip>(null);

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
    ay: aylar[i],
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const color = artiyor ? "#16a34a" : "#f97316";

  // tooltip box dimensions
  const TW = 120;
  const TH = 38;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      onMouseLeave={() => setTooltip(null)}
    >
      <line x1={pad.left} y1={pad.top + ih} x2={width - pad.right} y2={pad.top + ih} stroke="#e5e7eb" />
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ih} stroke="#e5e7eb" />
      <text x={pad.left - 6} y={pad.top + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{formatDeger(max, birim)}</text>
      <text x={pad.left - 6} y={pad.top + ih} textAnchor="end" fontSize="10" fill="#9ca3af">{formatDeger(min, birim)}</text>
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y} r={5}
          fill={color}
          stroke="white" strokeWidth={1.5}
          style={{ cursor: "pointer" }}
          onMouseEnter={() => setTooltip({ x: p.x, y: p.y, value: p.v, ay: p.ay })}
        />
      ))}

      {tooltip && (() => {
        const tx = Math.min(Math.max(tooltip.x - TW / 2, pad.left), width - pad.right - TW);
        const ty = tooltip.y - TH - 8;
        return (
          <g pointerEvents="none">
            <rect x={tx} y={ty} width={TW} height={TH} rx={5} fill="white" stroke="#d1d5db" strokeWidth={1} />
            <text x={tx + TW / 2} y={ty + 13} textAnchor="middle" fontSize="10" fill="#6b7280">{tooltip.ay}</text>
            <text x={tx + TW / 2} y={ty + 28} textAnchor="middle" fontSize="12" fontWeight="600" fill="#111827">
              {formatDeger(tooltip.value, birim)}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

export function FiyatGecmisiGrafik({ gecmis }: { gecmis: AylikNoktasi[] }) {
  const [birim, setBirim] = useState<Birim>("tl");
  if (gecmis.length === 0) return null;

  const ilk = gecmis[0];
  const son = gecmis[gecmis.length - 1];

  const pozitif = {
    tl: son.deger_tl >= ilk.deger_tl,
    usd: son.deger_usd >= ilk.deger_usd,
    altin: son.deger_altin_gram >= ilk.deger_altin_gram,
  };

  const noktalar = {
    tl: gecmis.map((d) => d.deger_tl),
    usd: gecmis.map((d) => d.deger_usd),
    altin: gecmis.map((d) => d.deger_altin_gram),
  };

  const aylar = gecmis.map((d) => formatAy(d.snapshot_month));

  const tabs: { key: Birim; label: string }[] = [
    { key: "tl", label: "TL" },
    { key: "usd", label: "USD" },
    { key: "altin", label: "Altın" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setBirim(t.key)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors ${
              birim === t.key
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {formatAy(ilk.snapshot_month)} – {formatAy(son.snapshot_month)}
        </span>
      </div>
      <Grafik noktalar={noktalar[birim]} aylar={aylar} birim={birim} artiyor={pozitif[birim]} />
    </div>
  );
}

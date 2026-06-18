"use client";

import { useState, useMemo } from "react";
import { aylikTaksit, type KrediTipi } from "@/lib/kredi";

const VADELER_TASIT   = [6, 12, 18, 24, 36, 48, 60];
const VADELER_IHTIYAC = [6, 12, 18, 24, 36];

// BDDK ihtiyaç kredisi vade sınırları (tutar bazlı)
function ihtiyacMaxVade(tutar: number): number {
  if (tutar > 250000) return 12;
  if (tutar > 125000) return 24;
  return 36;
}

function fmt(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

function Satir({ label, deger }: { label: string; deger: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900 tabular-nums">{deger}</span>
    </div>
  );
}

export function KrediHesaplama() {
  const [tip, setTip] = useState<KrediTipi>("tasit");
  const [tutar, setTutar] = useState(500000);
  const [tutarInput, setTutarInput] = useState("500.000");
  const [vade, setVade] = useState(24);
  const [aylikFaiz, setAylikFaiz] = useState(3.5);

  function handleTutarInput(raw: string) {
    const digits = raw.replace(/\D/g, "");
    const num = Number(digits);
    setTutarInput(num ? new Intl.NumberFormat("tr-TR").format(num) : "");
    if (num >= 1000) setTutar(num);
  }

  function handleFaizInput(raw: string) {
    const normalized = raw.replace(",", ".");
    const num = parseFloat(normalized);
    if (!isNaN(num) && num >= 0 && num <= 10) setAylikFaiz(Math.round(num * 10) / 10);
  }

  const sonuc = useMemo(() => {
    const maxV = tip === "ihtiyac" ? ihtiyacMaxVade(tutar) : 60;
    const v = Math.min(vade, maxV);
    const taksit = aylikTaksit(tutar, aylikFaiz, v);
    const toplam = taksit * v;
    const faizToplam = toplam - tutar;
    const yillikFaiz = aylikFaiz * 12;
    return { taksit, toplam, faizToplam, yillikFaiz, efektifVade: v };
  }, [tutar, aylikFaiz, vade, tip]);

  const maxVade = tip === "ihtiyac" ? ihtiyacMaxVade(tutar) : 60;
  const vadeler = (tip === "ihtiyac" ? VADELER_IHTIYAC : VADELER_TASIT).filter(v => v <= maxVade);
  const gecerliVade = vade > maxVade ? maxVade : vade;

  return (
    <div className="w-full max-w-xl">
      {/* Sekme */}
      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
        {(["tasit", "ihtiyac"] as KrediTipi[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTip(t); if (t === "ihtiyac" && vade > 36) setVade(36); }}
            className={`rounded-md px-5 py-2 text-sm font-medium transition-colors ${tip === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t === "tasit" ? "Taşıt Kredisi" : "İhtiyaç Kredisi"}
          </button>
        ))}
      </div>

      {/* Giriş alanları */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        {/* Tutar */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Kredi tutarı</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">₺</span>
            <input
              type="text"
              inputMode="numeric"
              value={tutarInput}
              onChange={(e) => handleTutarInput(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-7 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="500.000"
            />
          </div>
          <div className="mt-2 flex gap-2 flex-wrap">
            {[100000, 250000, 500000, 750000, 1000000].map((v) => (
              <button
                key={v}
                onClick={() => { setTutar(v); setTutarInput(new Intl.NumberFormat("tr-TR").format(v)); }}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${tutar === v ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >
                {fmt(v)}
              </button>
            ))}
          </div>
        </div>

        {/* Vade */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Vade</label>
            {tip === "ihtiyac" && maxVade < 36 && (
              <span className="text-[11px] text-amber-600 font-medium">
                BDDK: bu tutar için maks. {maxVade} ay
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {vadeler.map((v) => (
              <button
                key={v}
                onClick={() => setVade(v)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${gecerliVade === v ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
              >
                {v} ay
              </button>
            ))}
          </div>
        </div>

        {/* Faiz oranı */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Aylık faiz oranı</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                value={aylikFaiz}
                onChange={(e) => handleFaizInput(e.target.value)}
                className="w-16 rounded-md border border-slate-300 py-1 px-2 text-sm text-center font-semibold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={aylikFaiz}
            onChange={(e) => setAylikFaiz(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>%0.1</span>
            <span>%10.0</span>
          </div>
        </div>
      </div>

      {/* Sonuç */}
      <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
        <p className="mb-1 text-xs font-medium text-indigo-500 uppercase tracking-wide">Aylık taksit</p>
        <p className="text-5xl font-bold tracking-tight text-slate-900 tabular-nums mb-4">{fmt(Math.round(sonuc.taksit))}</p>
        <div className="rounded-xl bg-white/70 px-4 divide-y divide-slate-100">
          <Satir label="Toplam ödeme" deger={fmt(Math.round(sonuc.toplam))} />
          <Satir label="Toplam faiz" deger={fmt(Math.round(sonuc.faizToplam))} />
          <Satir label="Yıllık faiz oranı" deger={`%${sonuc.yillikFaiz.toFixed(1)}`} />
          <Satir label="Vade" deger={`${sonuc.efektifVade} ay`} />
        </div>
      </div>
    </div>
  );
}

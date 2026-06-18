"use client";

import { useState, useMemo } from "react";
import { type KrediTipi } from "@/lib/kredi";

// Vergi oranları
const BSMV = 0.05;
const KKDF: Record<KrediTipi, number> = { tasit: 0, ihtiyac: 0.15 };

const VADELER_TASIT   = [6, 12, 18, 24, 36, 48, 60];
const VADELER_IHTIYAC = [6, 12, 18, 24, 36];

function ihtiyacMaxVade(tutar: number): number {
  if (tutar > 250000) return 12;
  if (tutar > 125000) return 24;
  return 36;
}

function fmt(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}
function fmtK(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(v);
}

// Efektif aylık oran = baz_oran × (1 + KKDF) × (1 + BSMV)
function efektifOran(bazOranPct: number, tip: KrediTipi): number {
  return bazOranPct * (1 + KKDF[tip]) * (1 + BSMV);
}

function aylikTaksit(tutar: number, efektifPct: number, vade: number): number {
  const r = efektifPct / 100;
  if (r === 0) return tutar / vade;
  return (tutar * r * Math.pow(1 + r, vade)) / (Math.pow(1 + r, vade) - 1);
}

type TaksitSatir = {
  ay: number;
  taksit: number;
  anapara: number;
  faiz: number;
  kkdf: number;
  bsmv: number;
  kalan: number;
};

function amortizasyon(tutar: number, bazOranPct: number, vade: number, tip: KrediTipi): TaksitSatir[] {
  const bazR = bazOranPct / 100;
  const taksit = aylikTaksit(tutar, efektifOran(bazOranPct, tip), vade);
  let kalan = tutar;
  const satirlar: TaksitSatir[] = [];

  for (let ay = 1; ay <= vade; ay++) {
    const faiz = kalan * bazR;
    const kkdfT = faiz * KKDF[tip];
    const bsmvT = (faiz + kkdfT) * BSMV;
    // Son ayda kalan bakiyeyi temizle (yuvarlama hataları için)
    const anapara = ay === vade ? kalan : taksit - faiz - kkdfT - bsmvT;
    kalan = Math.max(0, kalan - anapara);
    satirlar.push({
      ay,
      taksit: anapara + faiz + kkdfT + bsmvT,
      anapara,
      faiz,
      kkdf: kkdfT,
      bsmv: bsmvT,
      kalan,
    });
  }
  return satirlar;
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
  const [bazFaiz, setBazFaiz] = useState(3.5);
  const [tabloAcik, setTabloAcik] = useState(false);

  function handleTutarInput(raw: string) {
    const digits = raw.replace(/\D/g, "");
    const num = Number(digits);
    setTutarInput(num ? new Intl.NumberFormat("tr-TR").format(num) : "");
    if (num >= 1000) setTutar(num);
  }

  function handleFaizInput(raw: string) {
    const num = parseFloat(raw.replace(",", "."));
    if (!isNaN(num) && num >= 0 && num <= 10) setBazFaiz(Math.round(num * 10) / 10);
  }

  const maxVade = tip === "ihtiyac" ? ihtiyacMaxVade(tutar) : 60;
  const gecerliVade = Math.min(vade, maxVade);
  const vadeler = (tip === "ihtiyac" ? VADELER_IHTIYAC : VADELER_TASIT).filter(v => v <= maxVade);

  const efOran = efektifOran(bazFaiz, tip);

  const sonuc = useMemo(() => {
    const taksit = aylikTaksit(tutar, efektifOran(bazFaiz, tip), gecerliVade);
    const toplam = taksit * gecerliVade;
    const satirlar = amortizasyon(tutar, bazFaiz, gecerliVade, tip);
    const toplamFaiz = satirlar.reduce((s, r) => s + r.faiz, 0);
    const toplamKKDF  = satirlar.reduce((s, r) => s + r.kkdf, 0);
    const toplamBSMV  = satirlar.reduce((s, r) => s + r.bsmv, 0);
    return { taksit, toplam, toplamFaiz, toplamKKDF, toplamBSMV, satirlar };
  }, [tutar, bazFaiz, gecerliVade, tip]);

  const gosterKKDF = tip === "ihtiyac";

  return (
    <div className="w-full max-w-2xl">
      {/* Sekme */}
      <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-full sm:w-fit">
        {(["tasit", "ihtiyac"] as KrediTipi[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTip(t); if (t === "ihtiyac" && vade > 36) setVade(36); }}
            className={`flex-1 sm:flex-none rounded-md px-5 py-2 text-sm font-medium transition-colors ${tip === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t === "tasit" ? "Taşıt Kredisi" : "İhtiyaç Kredisi"}
          </button>
        ))}
      </div>

      {/* Giriş */}
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
              <button key={v}
                onClick={() => { setTutar(v); setTutarInput(new Intl.NumberFormat("tr-TR").format(v)); }}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${tutar === v ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
              >{fmt(v)}</button>
            ))}
          </div>
        </div>

        {/* Vade */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Vade</label>
            {tip === "ihtiyac" && maxVade < 36 && (
              <span className="text-[11px] text-amber-600 font-medium">Bu tutar için azami vade {maxVade} ay (BDDK)</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {vadeler.map((v) => (
              <button key={v} onClick={() => setVade(v)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${gecerliVade === v ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
              >{v} ay</button>
            ))}
          </div>
        </div>

        {/* Faiz */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Baz aylık faiz oranı</label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Vergilerle efektif: %{efOran.toFixed(3)}
                {gosterKKDF ? " (KKDF %15 + BSMV %5)" : " (BSMV %5)"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number" min={0.1} max={10} step={0.1} value={bazFaiz}
                onChange={(e) => handleFaizInput(e.target.value)}
                className="w-16 rounded-md border border-slate-300 py-1 px-2 text-sm text-center font-semibold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>
          <input type="range" min={0.1} max={10} step={0.1} value={bazFaiz}
            onChange={(e) => setBazFaiz(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>%0.1</span><span>%10.0</span>
          </div>
        </div>
      </div>

      {/* Sonuç özeti */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Aylık taksit</span>
          <span className="text-3xl font-bold tabular-nums text-slate-900">{fmt(Math.round(sonuc.taksit))}</span>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 divide-y divide-slate-100">
          <Satir label="Toplam ödeme" deger={fmt(Math.round(sonuc.toplam))} />
          <Satir label="Toplam faiz"  deger={fmt(Math.round(sonuc.toplamFaiz))} />
          <Satir label={gosterKKDF ? "Vergi (KKDF + BSMV)" : "Vergi (BSMV)"} deger={fmt(Math.round(sonuc.toplamKKDF + sonuc.toplamBSMV))} />
          <Satir label="Vade"         deger={`${gecerliVade} ay`} />
        </div>
      </div>

      {/* Taksit tablosu */}
      <div className="mt-4">
        <button
          onClick={() => setTabloAcik(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>Taksit tablosu</span>
          <svg className={`h-4 w-4 text-slate-400 transition-transform ${tabloAcik ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {tabloAcik && (
          <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Ay</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Taksit</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Anapara</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Faiz</th>
                  {gosterKKDF && <th className="px-3 py-2.5 text-right font-semibold text-slate-500">KKDF</th>}
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">BSMV</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Kalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sonuc.satirlar.map((s) => (
                  <tr key={s.ay} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 text-slate-500 tabular-nums">{s.ay}</td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900 tabular-nums">{fmtK(s.taksit)}</td>
                    <td className="px-3 py-2 text-right text-indigo-700 tabular-nums">{fmtK(s.anapara)}</td>
                    <td className="px-3 py-2 text-right text-slate-600 tabular-nums">{fmtK(s.faiz)}</td>
                    {gosterKKDF && <td className="px-3 py-2 text-right text-amber-600 tabular-nums">{fmtK(s.kkdf)}</td>}
                    <td className="px-3 py-2 text-right text-amber-600 tabular-nums">{fmtK(s.bsmv)}</td>
                    <td className="px-3 py-2 text-right text-slate-400 tabular-nums">{fmtK(s.kalan)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                  <td className="px-3 py-2.5 text-slate-500">Toplam</td>
                  <td className="px-3 py-2.5 text-right text-slate-900 tabular-nums">{fmt(Math.round(sonuc.toplam))}</td>
                  <td className="px-3 py-2.5 text-right text-indigo-700 tabular-nums">{fmt(tutar)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">{fmt(Math.round(sonuc.toplamFaiz))}</td>
                  {gosterKKDF && <td className="px-3 py-2.5 text-right text-amber-600 tabular-nums">{fmt(Math.round(sonuc.toplamKKDF))}</td>}
                  <td className="px-3 py-2.5 text-right text-amber-600 tabular-nums">{fmt(Math.round(sonuc.toplamBSMV))}</td>
                  <td className="px-3 py-2.5 text-right text-slate-400">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

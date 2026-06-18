"use client";

import { useState, useMemo } from "react";
import { BANKALAR, aylikTaksit, type KrediTipi, type Banka } from "@/lib/kredi";

type Sonuc = {
  banka: Banka;
  bilgi: NonNullable<Banka["ihtiyac"]>;
  taksit: number;
  toplam: number;
  faizToplam: number;
};

const VADELER = [6, 12, 18, 24, 36, 48];

function fmt(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

function BankaAvatar({ kisaltma, renk }: { kisaltma: string; renk: string }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center rounded-lg text-white text-xs font-bold w-10 h-10"
      style={{ backgroundColor: renk }}
    >
      {kisaltma.slice(0, 2)}
    </div>
  );
}

const FAIZ_MIN = 1.0;
const FAIZ_MAX = 6.0;

export function KrediHesaplama() {
  const [tip, setTip] = useState<KrediTipi>("tasit");
  const [tutar, setTutar] = useState(500000);
  const [tutarInput, setTutarInput] = useState("500.000");
  const [vade, setVade] = useState(24);
  const [maxFaiz, setMaxFaiz] = useState(FAIZ_MAX);

  function handleTutarInput(raw: string) {
    const digits = raw.replace(/\D/g, "");
    const num = Number(digits);
    setTutarInput(num ? new Intl.NumberFormat("tr-TR").format(num) : "");
    if (num >= 1000) setTutar(num);
  }

  const sonuclar = useMemo((): Sonuc[] => {
    return BANKALAR
      .flatMap((b) => {
        const bilgi = tip === "ihtiyac" ? b.ihtiyac : b.tasit;
        if (!bilgi) return [];
        if (bilgi.aylikFaiz > maxFaiz) return [];
        if (vade < bilgi.minVade || vade > bilgi.maxVade) return [];
        if (tutar < bilgi.minTutar || tutar > bilgi.maxTutar) return [];
        const taksit = aylikTaksit(tutar, bilgi.aylikFaiz, vade);
        const toplam = taksit * vade;
        const faizToplam = toplam - tutar;
        return [{ banka: b, bilgi, taksit, toplam, faizToplam }];
      })
      .sort((a, b) => a.taksit - b.taksit);
  }, [tip, tutar, vade, maxFaiz]);

  const maxVade = tip === "ihtiyac" ? 36 : 48;
  const vadeler = VADELER.filter(v => v <= maxVade);

  return (
    <div className="w-full">
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

      {/* Hesap makinesi */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Kredi tutarı</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">₺</span>
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

          <div className="sm:w-56">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Vade</label>
            <div className="flex flex-wrap gap-2">
              {vadeler.map((v) => (
                <button
                  key={v}
                  onClick={() => setVade(v)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${vade === v ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                >
                  {v} ay
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Faiz filtresi */}
        <div className="border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Maks. aylık faiz oranı</label>
            <span className="text-sm font-bold text-indigo-600 tabular-nums">
              %{maxFaiz.toFixed(1)}
              {maxFaiz >= FAIZ_MAX && <span className="ml-1 text-xs font-normal text-slate-400">(tümü)</span>}
            </span>
          </div>
          <input
            type="range"
            min={FAIZ_MIN}
            max={FAIZ_MAX}
            step={0.1}
            value={maxFaiz}
            onChange={(e) => setMaxFaiz(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>%{FAIZ_MIN.toFixed(1)}</span>
            <span>%{FAIZ_MAX.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Sonuçlar */}
      {sonuclar.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-12">Seçtiğiniz tutar ve vade için uygun banka bulunamadı.</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-slate-400">
            {fmt(tutar)} · {vade} ay · {sonuclar.length} banka karşılaştırıldı · aylık taksite göre sıralandı
          </p>
          <div className="space-y-3">
            {sonuclar.map(({ banka, bilgi, taksit, toplam, faizToplam }, i) => (
              <div
                key={banka.ad}
                className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${i === 0 ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200"}`}
              >
                {i === 0 && (
                  <div className="mb-2.5 flex items-center gap-1.5">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">En düşük taksit</span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <BankaAvatar kisaltma={banka.kisaltma} renk={banka.renk} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{banka.ad}</p>
                    <p className="text-xs text-slate-400">Aylık %{bilgi.aylikFaiz}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-slate-900 tabular-nums">{fmt(Math.round(taksit))}</p>
                    <p className="text-xs text-slate-400">/ay</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 rounded-lg bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wide text-slate-400">Toplam ödeme</span>
                    <span className="font-semibold text-slate-700">{fmt(Math.round(toplam))}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wide text-slate-400">Toplam faiz</span>
                    <span className="font-semibold text-slate-700">{fmt(Math.round(faizToplam))}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wide text-slate-400">Vade aralığı</span>
                    <span className="font-semibold text-slate-700">{bilgi.minVade}–{bilgi.maxVade} ay</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-400 text-center">
            Faiz oranları yaklaşık değerlerdir. Güncel oranlar ve başvuru için bankaların resmi web sitelerini ziyaret edin.
          </p>
        </>
      )}
    </div>
  );
}

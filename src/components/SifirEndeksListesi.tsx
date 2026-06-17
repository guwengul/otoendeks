"use client";

import { useMemo, useState } from "react";
import type { SifirEndeksVeri } from "@/lib/kasko";
import { extractModelAdi } from "@/lib/kasko";

function formatTL(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

function ayAdi(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function DegisimBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-300">—</span>;
  const renk = pct > 0 ? "text-red-600" : pct < 0 ? "text-green-600" : "text-gray-400";
  return (
    <span className={`text-xs font-medium ${renk}`}>
      {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

function BayiFiyatModal({ onKapat }: { onKapat: () => void }) {
  const [email, setEmail] = useState("");
  const [gonderildi, setGonderildi] = useState(false);

  function gonder(e: React.FormEvent) {
    e.preventDefault();
    // TODO: lead kaydı
    setGonderildi(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onKapat}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {gonderildi ? (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-gray-900">Teşekkürler!</p>
            <p className="mt-2 text-sm text-gray-500">Güncel bayi fiyatları hazır olduğunda sizi bilgilendireceğiz.</p>
            <button onClick={onKapat} className="mt-6 w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              Kapat
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-gray-900">Güncel bayi fiyatları</h2>
            <p className="mt-1 text-sm text-gray-500">
              Bayilerin anlık kampanya fiyatlarını takip etmek için e-posta adresinizi bırakın.
            </p>
            <form onSubmit={gonder} className="mt-4 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                Bildir
              </button>
            </form>
            <button onClick={onKapat} className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600">
              Vazgeç
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type TipRow = {
  tip_kodu: number;
  tipAdi: string;
  deger: number;
  oncekiAy: number | null;
  oncekiYil: number | null;
  aylikPct: number | null;
  yillikPct: number | null;
};

type ModelGrup = { model: string; tipler: TipRow[] };

export function SifirEndeksListesi({
  veri,
  markaAdi,
}: {
  veri: SifirEndeksVeri;
  markaAdi: string;
}) {
  const [query, setQuery] = useState("");
  const [modalAcik, setModalAcik] = useState(false);

  const gruplar = useMemo((): ModelGrup[] => {
    const modelMap = new Map<string, TipRow[]>();
    for (const r of veri.current) {
      const model = extractModelAdi(r.tip_adi, markaAdi);
      const tipAdi = r.tip_adi.startsWith(markaAdi) ? r.tip_adi.slice(markaAdi.length).trim() : r.tip_adi;
      const prev = veri.prevMonthMap.get(r.tip_kodu) ?? null;
      const yilOnce = veri.prevYearMap.get(r.tip_kodu) ?? null;
      const aylikPct = prev ? ((r.deger - prev) / prev) * 100 : null;
      const yillikPct = yilOnce ? ((r.deger - yilOnce) / yilOnce) * 100 : null;
      const tip: TipRow = { tip_kodu: r.tip_kodu, tipAdi, deger: r.deger, oncekiAy: prev, oncekiYil: yilOnce, aylikPct, yillikPct };
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
          const hay = t.tipAdi.toLocaleLowerCase("tr");
          return tokens.every((tk) => hay.includes(tk));
        }),
      }))
      .filter((g) => g.tipler.length > 0);
  }, [gruplar, query]);

  const oncekiAyAdi = veri.oncekiAy ? ayAdi(veri.oncekiAy) : null;
  const oncekiYilAdi = ayAdi(veri.sonAy.replace(/^(\d{4})/, (_, y) => String(Number(y) - 1)));

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

      <div className="space-y-3">
        {filtreliGruplar.map((g) => (
          <div key={g.model} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="divide-y divide-gray-100">
              {g.tipler.map((tip) => (
                <div key={tip.tip_kodu} className="px-4 py-3">
                  {/* Araç adı */}
                  <p className="text-sm font-medium text-gray-900 leading-snug mb-3">{tip.tipAdi}</p>

                  {/* Fiyat kolonları */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {/* TSB Değeri */}
                    <div>
                      <p className="text-gray-400 mb-0.5">TSB Değeri</p>
                      <p className="text-sm font-semibold text-gray-900">{formatTL(tip.deger)}</p>
                    </div>

                    {/* Önceki Ay */}
                    <div>
                      <p className="text-gray-400 mb-0.5">{oncekiAyAdi ?? "Önceki Ay"}</p>
                      <p className="text-sm font-medium text-gray-700">
                        {tip.oncekiAy ? formatTL(tip.oncekiAy) : <span className="text-gray-300">—</span>}
                      </p>
                      <DegisimBadge pct={tip.aylikPct} />
                    </div>

                    {/* Önceki Yıl */}
                    <div>
                      <p className="text-gray-400 mb-0.5">{oncekiYilAdi}</p>
                      <p className="text-sm font-medium text-gray-700">
                        {tip.oncekiYil ? formatTL(tip.oncekiYil) : <span className="text-gray-300">—</span>}
                      </p>
                      <DegisimBadge pct={tip.yillikPct} />
                    </div>
                  </div>

                  {/* Bayi fiyatı CTA */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => setModalAcik(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Güncel bayi fiyatı →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {modalAcik && <BayiFiyatModal onKapat={() => setModalAcik(false)} />}
    </div>
  );
}

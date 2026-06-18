"use client";

import { useMemo, useState } from "react";
import type { AracSpek, SifirEndeksVeri } from "@/lib/kasko";
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
  const renk = pct > 0 ? "text-green-600" : pct < 0 ? "text-orange-500" : "text-gray-400";
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
  spek: AracSpek | null;
};

type ModelGrup = { model: string; tipler: TipRow[] };

export function SifirEndeksListesi({
  veri,
  markaAdi,
}: {
  veri: SifirEndeksVeri;
  markaAdi: string;
}) {
  // Tab: markanın hem binek hem ticari/özel araçları varsa göster
  const tablar = useMemo(() => {
    const tipler = new Set(veri.current.map((r) => veri.aracTipiMap[r.tip_kodu] ?? "binek"));
    const binekVar = tipler.has("binek");
    const ticariVar = tipler.has("ticari") || tipler.has("özel");
    if (binekVar && ticariVar) return ["binek", "ticari"] as const;
    return null; // tek tür → tab yok
  }, [veri]);

  const [aktifTab, setAktifTab] = useState<"binek" | "ticari">("binek");
  const [query, setQuery] = useState("");
  const [modalAcik, setModalAcik] = useState(false);
  const [acikGruplar, setAcikGruplar] = useState<Set<string>>(new Set());

  function toggleGrup(model: string) {
    setAcikGruplar((prev) => {
      const next = new Set(prev);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });
  }

  const gruplar = useMemo((): ModelGrup[] => {
    const modelMap = new Map<string, TipRow[]>();
    for (const r of veri.current) {
      const aracTipi = veri.aracTipiMap[r.tip_kodu] ?? "binek";
      if (tablar) {
        // Tab varsa: aktif taba göre filtrele
        const isBinek = aracTipi === "binek";
        if (aktifTab === "binek" && !isBinek) continue;
        if (aktifTab === "ticari" && isBinek) continue;
      }
      const model = veri.modelAdiMap[r.tip_kodu] ?? extractModelAdi(r.tip_adi, markaAdi);
      const tipAdi = r.tip_adi.startsWith(markaAdi) ? r.tip_adi.slice(markaAdi.length).trim() : r.tip_adi;
      const prev = veri.prevMonthMap[r.tip_kodu] ?? null;
      const yilOnce = veri.prevYearMap[r.tip_kodu] ?? null;
      const aylikPct = prev ? ((r.deger - prev) / prev) * 100 : null;
      const yillikPct = yilOnce ? ((r.deger - yilOnce) / yilOnce) * 100 : null;
      const tip: TipRow = { tip_kodu: r.tip_kodu, tipAdi, deger: r.deger, oncekiAy: prev, oncekiYil: yilOnce, aylikPct, yillikPct, spek: veri.spekMap[r.tip_kodu] ?? null };
      const list = modelMap.get(model) ?? [];
      list.push(tip);
      modelMap.set(model, list);
    }
    return [...modelMap.entries()]
      .map(([model, tipler]) => ({ model, tipler }))
      .sort((a, b) => Math.min(...a.tipler.map((t) => t.deger)) - Math.min(...b.tipler.map((t) => t.deger)));
  }, [veri, markaAdi, tablar, aktifTab]);

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
      {tablar && (
        <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
          {tablar.map((t) => (
            <button
              key={t}
              onClick={() => { setAktifTab(t); setAcikGruplar(new Set()); setQuery(""); }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${aktifTab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t === "binek" ? "Binek" : "Ticari"}
            </button>
          ))}
        </div>
      )}

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

      <div className="space-y-2">
        {filtreliGruplar.map((g) => {
          const acik = query.trim().length > 0 || acikGruplar.has(g.model);
          return (
          <div key={g.model} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Grup başlığı */}
            <button
              onClick={() => toggleGrup(g.model)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900">{markaAdi} {g.model}</span>
              <span className="flex items-center gap-2 text-xs text-gray-400">
                {g.tipler.length} versiyon
                <svg className={`w-4 h-4 transition-transform ${acik ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            {acik && <div className="divide-y divide-gray-100 border-t border-gray-100">
              {g.tipler.map((tip) => (
                <div key={tip.tip_kodu} className="flex items-start justify-between gap-4 px-4 py-3">
                  {/* Sol: araç adı + spek chip'leri + CTA */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{tip.tipAdi}</p>
                    {tip.spek && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {tip.spek.yakit && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{tip.spek.yakit}</span>}
                        {tip.spek.motor_guc_hp && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{tip.spek.motor_guc_hp} hp</span>}
                        {tip.spek.motor_hacmi && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{tip.spek.motor_hacmi}L</span>}
                        {tip.spek.vites && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{tip.spek.vites}</span>}
                        {tip.spek.kasa && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{tip.spek.kasa}</span>}
                        {tip.spek.cekis && tip.spek.cekis !== "2wd" && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{tip.spek.cekis}</span>}
                      </div>
                    )}
                    <button
                      onClick={() => setModalAcik(true)}
                      className="mt-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Güncel bayi fiyatı →
                    </button>
                  </div>

                  {/* Sağ: fiyatlar */}
                  <div className="shrink-0 text-right">
                    {/* Güncel fiyat — büyük */}
                    <p className="text-base font-bold text-gray-900 tabular-nums">{formatTL(tip.deger)}</p>
                    {/* Önceki ay */}
                    {tip.oncekiAy && (
                      <p className="mt-1 text-xs text-gray-400 tabular-nums">
                        {oncekiAyAdi}: {formatTL(tip.oncekiAy)}{" "}
                        <DegisimBadge pct={tip.aylikPct} />
                      </p>
                    )}
                    {/* Önceki yıl */}
                    {tip.oncekiYil && (
                      <p className="text-xs text-gray-400 tabular-nums">
                        {oncekiYilAdi}: {formatTL(tip.oncekiYil)}{" "}
                        <DegisimBadge pct={tip.yillikPct} />
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>}
          </div>
        );})}
      </div>

      {modalAcik && <BayiFiyatModal onKapat={() => setModalAcik(false)} />}
    </div>
  );
}

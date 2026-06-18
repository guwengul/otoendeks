"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AracSpek, SifirEndeksVeri } from "@/lib/kasko";
import { extractModelAdi } from "@/lib/kasko";
import { izlemeEkle } from "@/app/actions/izleme";

function formatTL(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

function ayAdi(isoDate: string) {
  const d = new Date(isoDate);
  return d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
}

function DegisimBadge({ pct, size = "sm" }: { pct: number | null; size?: "xs" | "sm" }) {
  if (pct === null) return <span className="text-xs text-slate-300">—</span>;
  const yukari = pct > 0;
  const notr = pct === 0;
  const renk = yukari ? "text-emerald-600" : notr ? "text-slate-400" : "text-orange-500";
  const bgRenk = yukari ? "bg-emerald-50" : notr ? "bg-slate-50" : "bg-orange-50";
  const textSize = size === "sm" ? "text-xs" : "text-[10px]";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium ${textSize} ${renk} ${bgRenk}`}>
      {!notr && (
        <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 10 10" fill="currentColor">
          {yukari
            ? <path d="M5 2L9 8H1L5 2Z" />
            : <path d="M5 8L1 2H9L5 8Z" />}
        </svg>
      )}
      {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 52, h = 22, pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const yukari = values[values.length - 1] >= values[0];
  const stroke = yukari ? "#059669" : "#f97316";
  const lastX = parseFloat(pts[pts.length - 1].split(",")[0]);
  const lastY = parseFloat(pts[pts.length - 1].split(",")[1]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline points={pts.join(" ")} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx={lastX} cy={lastY} r="2" fill={stroke} />
    </svg>
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
            <p className="text-lg font-semibold text-slate-900">Teşekkürler!</p>
            <p className="mt-2 text-sm text-slate-500">Güncel bayi fiyatları hazır olduğunda sizi bilgilendireceğiz.</p>
            <button onClick={onKapat} className="mt-6 w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
              Kapat
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-slate-900">Güncel bayi fiyatları</h2>
            <p className="mt-1 text-sm text-slate-500">
              Bayilerin anlık kampanya fiyatlarını takip etmek için e-posta adresinizi bırakın.
            </p>
            <form onSubmit={gonder} className="mt-4 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                Bildir
              </button>
            </form>
            <button onClick={onKapat} className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600">
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
  trend: number[];
};

type ModelGrup = { model: string; tipler: TipRow[] };

export function SifirEndeksListesi({
  veri,
  markaAdi,
  markaKodu,
  markaSlug,
  girisYapilmis,
  izlenenler,
}: {
  veri: SifirEndeksVeri;
  markaAdi: string;
  markaKodu?: number;
  markaSlug?: string;
  girisYapilmis?: boolean;
  izlenenler?: Set<number>;
}) {
  const tablar = useMemo(() => {
    const tipler = new Set(veri.current.map((r) => veri.aracTipiMap[r.tip_kodu] ?? "binek"));
    const binekVar = tipler.has("binek");
    const ticariVar = tipler.has("ticari") || tipler.has("özel");
    if (binekVar && ticariVar) return ["binek", "ticari"] as const;
    return null;
  }, [veri]);

  const router = useRouter();
  const [aktifTab, setAktifTab] = useState<"binek" | "ticari">("binek");
  const [query, setQuery] = useState("");
  const [modalAcik, setModalAcik] = useState(false);
  const [acikGruplar, setAcikGruplar] = useState<Set<string>>(new Set());
  const [izlenenSet, setIzlenenSet] = useState<Set<number>>(izlenenler ?? new Set());
  const [takipPending, setTakipPending] = useState<number | null>(null);

  async function handleTakip(tip: TipRow) {
    if (!girisYapilmis) {
      router.push(`/giris?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (izlenenSet.has(tip.tip_kodu)) {
      router.push("/araclarim");
      return;
    }
    if (!markaKodu || !markaSlug) return;
    setTakipPending(tip.tip_kodu);
    const sonuc = await izlemeEkle({
      marka_kodu: markaKodu,
      tip_kodu: tip.tip_kodu,
      marka_adi: markaAdi,
      tip_adi: tip.tipAdi,
      marka_slug: markaSlug,
      fiyat_kayit: tip.deger,
    });
    setTakipPending(null);
    if (!sonuc?.error) {
      setIzlenenSet(prev => new Set([...prev, tip.tip_kodu]));
    } else {
      alert("Eklenemedi: " + sonuc.error);
    }
  }

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
      const trend = veri.trendMap[r.tip_kodu] ?? [];
      const tip: TipRow = { tip_kodu: r.tip_kodu, tipAdi, deger: r.deger, oncekiAy: prev, oncekiYil: yilOnce, aylikPct, yillikPct, spek: veri.spekMap[r.tip_kodu] ?? null, trend };
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
        <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
          {tablar.map((t) => (
            <button
              key={t}
              onClick={() => { setAktifTab(t); setAcikGruplar(new Set()); setQuery(""); }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${aktifTab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
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
        className="mb-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {filtreliGruplar.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">Sonuç bulunamadı.</p>
      )}

      <div className="space-y-3">
        {filtreliGruplar.map((g) => {
          const acik = query.trim().length > 0 || acikGruplar.has(g.model);
          const minFiyat = Math.min(...g.tipler.map((t) => t.deger));
          const maxFiyat = Math.max(...g.tipler.map((t) => t.deger));
          const grupAylikPct = g.tipler[0]?.aylikPct ?? null;
          return (
            <div key={g.model} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Grup başlığı */}
              <button
                onClick={() => toggleGrup(g.model)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-slate-900">{markaAdi} {g.model}</span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {g.tipler.length} versiyon
                      {minFiyat !== maxFiyat && ` · ${formatTL(minFiyat)} – ${formatTL(maxFiyat)}`}
                      {minFiyat === maxFiyat && ` · ${formatTL(minFiyat)}`}
                    </span>
                    {grupAylikPct !== null && <DegisimBadge pct={grupAylikPct} size="xs" />}
                  </div>
                </div>
                <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${acik ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {acik && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {g.tipler.map((tip) => (
                    <div key={tip.tip_kodu} className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        {/* Sol: araç adı + spek + CTA */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 leading-snug">{tip.tipAdi}</p>
                          {tip.spek && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {tip.spek.yakit && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{tip.spek.yakit}</span>}
                              {tip.spek.motor_guc_hp && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{tip.spek.motor_guc_hp} hp</span>}
                              {tip.spek.motor_hacmi && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{tip.spek.motor_hacmi}L</span>}
                              {tip.spek.vites && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{tip.spek.vites}</span>}
                              {tip.spek.kasa && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{tip.spek.kasa}</span>}
                              {tip.spek.cekis && tip.spek.cekis !== "2wd" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{tip.spek.cekis}</span>}
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-3">
                            <button
                              onClick={() => setModalAcik(true)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Güncel bayi fiyatı →
                            </button>
                            <button
                              onClick={() => handleTakip(tip)}
                              disabled={takipPending === tip.tip_kodu}
                              className={`flex items-center gap-1 text-xs disabled:opacity-50 ${
                                izlenenSet.has(tip.tip_kodu)
                                  ? "text-indigo-600 font-medium"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              <span>{izlenenSet.has(tip.tip_kodu) ? "★" : "☆"}</span>
                              <span>{takipPending === tip.tip_kodu ? "..." : izlenenSet.has(tip.tip_kodu) ? "İzliyorum" : "İzle"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Sağ: sparkline + fiyatlar */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {tip.trend.length >= 2 && (
                            <Sparkline values={tip.trend} />
                          )}
                          <p className="text-lg font-bold text-slate-900 tabular-nums leading-tight">{formatTL(tip.deger)}</p>
                          <div className="flex flex-col items-end gap-0.5">
                            {tip.oncekiAy !== null && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400">{oncekiAyAdi}</span>
                                <DegisimBadge pct={tip.aylikPct} size="xs" />
                              </div>
                            )}
                            {tip.oncekiYil !== null && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400">{oncekiYilAdi}</span>
                                <DegisimBadge pct={tip.yillikPct} size="xs" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalAcik && <BayiFiyatModal onKapat={() => setModalAcik(false)} />}
    </div>
  );
}

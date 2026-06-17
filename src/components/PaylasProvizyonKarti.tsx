"use client";

import type { AylikNoktasi } from "@/lib/kasko";

function formatTL(v: number) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v) + " TL";
}
function formatAy(iso: string) {
  const [year, month] = iso.split("-");
  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  return `${aylar[Number(month) - 1]} ${year}`;
}
function pct(ilk: number, son: number) {
  if (!ilk) return 0;
  return ((son - ilk) / ilk) * 100;
}

export function PaylasProvizyonKarti({
  gecmis,
  aracAdi,
  modelYili,
}: {
  gecmis: AylikNoktasi[];
  aracAdi: string;
  modelYili: number;
}) {
  if (gecmis.length < 2) return null;

  const ilk = gecmis[0];
  const son = gecmis[gecmis.length - 1];

  const tlPct = pct(ilk.deger_tl, son.deger_tl);
  const usdPct = pct(ilk.deger_usd, son.deger_usd);
  const altinPct = pct(ilk.deger_altin_gram, son.deger_altin_gram);

  const isaret = (v: number) => (v >= 0 ? "+" : "");

  const paylasMetni =
    `${aracAdi} ${modelYili} — ${formatAy(ilk.snapshot_month)}'dan ${formatAy(son.snapshot_month)}'a kasko değeri:\n` +
    `📋 TL: ${formatTL(ilk.deger_tl)} → ${formatTL(son.deger_tl)} (${isaret(tlPct)}${tlPct.toFixed(1)}%)\n` +
    `💵 USD: $${ilk.deger_usd.toLocaleString("tr-TR")} → $${son.deger_usd.toLocaleString("tr-TR")} (${isaret(usdPct)}${usdPct.toFixed(1)}%)\n` +
    `🥇 Altın: ${ilk.deger_altin_gram} gr → ${son.deger_altin_gram} gr (${isaret(altinPct)}${altinPct.toFixed(1)}%)\n` +
    `kasko.io`;

  async function kopyala() {
    await navigator.clipboard.writeText(paylasMetni);
  }

  return (
    <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
        {formatAy(ilk.snapshot_month)} → {formatAy(son.snapshot_month)}
      </p>
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-500">TL</p>
          <p className={`text-lg font-bold ${tlPct >= 0 ? "text-orange-500" : "text-green-600"}`}>
            {isaret(tlPct)}{tlPct.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">USD</p>
          <p className={`text-lg font-bold ${usdPct >= 0 ? "text-orange-500" : "text-green-600"}`}>
            {isaret(usdPct)}{usdPct.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Altın</p>
          <p className={`text-lg font-bold ${altinPct >= 0 ? "text-orange-500" : "text-green-600"}`}>
            {isaret(altinPct)}{altinPct.toFixed(1)}%
          </p>
        </div>
      </div>
      <button
        onClick={kopyala}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
      >
        Paylaş / Kopyala
      </button>
    </div>
  );
}

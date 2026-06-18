"use client";

import { useState } from "react";
import Link from "next/link";
import { izlemeSil, izlemeBildirimiGuncelle } from "@/app/actions/izleme";

type IzlemeItem = {
  id: string;
  marka_kodu: number;
  tip_kodu: number;
  marka_adi: string;
  tip_adi: string;
  marka_slug: string;
  fiyat_kayit: number;
  fiyat_bildirimi: boolean;
  guncel_fiyat: number | null;
};

function fmt(v: number) {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(v);
}

function IzlemeKarti({ item }: { item: IzlemeItem }) {
  const [siliyor, setSiliyor] = useState(false);
  const [bildirim, setBildirim] = useState(item.fiyat_bildirimi);
  const [bildirimPending, setBildirimPending] = useState(false);

  const fark = item.guncel_fiyat ? item.guncel_fiyat - item.fiyat_kayit : null;
  const farkPct = fark && item.fiyat_kayit ? (fark / item.fiyat_kayit) * 100 : null;

  async function handleSil() {
    setSiliyor(true);
    await izlemeSil(item.id);
  }

  async function handleBildirim() {
    setBildirimPending(true);
    const yeni = !bildirim;
    setBildirim(yeni);
    await izlemeBildirimiGuncelle(item.id, yeni);
    setBildirimPending(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Sıfır araç</p>
          <p className="font-semibold text-slate-900 text-sm">{item.marka_adi}</p>
          <p className="text-xs text-slate-500">{item.tip_adi}</p>
        </div>
        <div className="text-right shrink-0">
          {item.guncel_fiyat ? (
            <>
              <p className="text-lg font-bold text-slate-900">{fmt(item.guncel_fiyat)}</p>
              {fark !== null && farkPct !== null && (
                <p className={`text-xs font-medium ${fark > 0 ? "text-orange-500" : fark < 0 ? "text-emerald-600" : "text-slate-400"}`}>
                  {fark > 0 ? "+" : ""}{fmt(fark)} ({farkPct > 0 ? "+" : ""}{farkPct.toFixed(1)}%)
                </p>
              )}
              <p className="text-xs text-slate-400">eklendiğinde: {fmt(item.fiyat_kayit)}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">{fmt(item.fiyat_kayit)}</p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
        <button
          onClick={handleBildirim}
          disabled={bildirimPending}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
        >
          <span className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors ${bildirim ? "bg-indigo-500" : "bg-slate-200"}`}>
            <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform mt-0.5 ${bildirim ? "translate-x-3.5" : "translate-x-0.5"}`} />
          </span>
          <span>Fiyat değişince bildir</span>
        </button>
        <button
          onClick={handleSil}
          disabled={siliyor}
          className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50"
        >
          {siliyor ? "..." : "Kaldır"}
        </button>
      </div>
    </div>
  );
}

export function IzlemeIstemci({ items }: { items: IzlemeItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
        <p className="text-slate-400 text-sm">Henüz araç izlemiyorsun.</p>
        <p className="mt-1 text-xs text-slate-400">
          Sıfır araç sayfasında ☆ ile ekleyebilirsin.
        </p>
        <Link
          href="/sifir-arac"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Sıfır araç fiyatları
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <IzlemeKarti key={item.id} item={item} />
      ))}
    </div>
  );
}

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
  model_yili: number | null;
  fiyat_kayit: number;
  usd_kayit: number | null;
  altin_kayit: number | null;
  fiyat_bildirimi: boolean;
  created_at: string;
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

  const eklemeTarihi = new Date(item.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-slate-900 text-sm">{item.marka_adi}</p>
          <p className="text-xs text-slate-500">{item.tip_adi}{item.model_yili ? ` · ${item.model_yili}` : ""}</p>
        </div>
        <div className="text-right shrink-0">
          {item.guncel_fiyat ? (
            <>
              <p className="text-lg font-bold text-slate-900">{fmt(item.guncel_fiyat)}</p>
              {fark !== null && farkPct !== null && fark !== 0 && (
                <p className={`text-xs font-medium ${fark > 0 ? "text-orange-500" : "text-emerald-600"}`}>
                  {fark > 0 ? "+" : ""}{fmt(fark)} ({farkPct > 0 ? "+" : ""}{farkPct.toFixed(1)}%)
                </p>
              )}
            </>
          ) : (
            <p className="text-lg font-bold text-slate-900">{fmt(item.fiyat_kayit)}</p>
          )}
        </div>
      </div>

      {/* Ekleme tarihi + kayıt anındaki değerler */}
      <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2">
        <p className="text-[11px] text-slate-400 mb-1">{eklemeTarihi} tarihinde eklendiğinde</p>
        <div className="flex gap-4">
          <div>
            <p className="text-xs font-medium text-slate-700">₺{new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(item.fiyat_kayit)}</p>
          </div>
          {item.usd_kayit && (
            <div>
              <p className="text-xs font-medium text-slate-700">${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(item.usd_kayit)}</p>
            </div>
          )}
          {item.altin_kayit && (
            <div>
              <p className="text-xs font-medium text-slate-700">{new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(item.altin_kayit)} gr altın</p>
            </div>
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
        <p className="text-slate-400 text-sm">Henüz takibe aldığın araç yok.</p>
        <p className="mt-1 text-xs text-slate-400">
          Sıfır araç sayfasında "Takibe al" ile ekleyebilirsin.
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

"use client";

import { useState } from "react";
import { waitListeCik } from "@/app/actions/waitlist";

const OZELLIK_ETIKET: Record<string, string> = {
  piyasa_fiyati: "İkinci El Piyasa Fiyatı",
};

interface Item {
  ozellik: string;
  created_at: string;
}

export function WaitListBolumu({ items: ilkItems }: { items: Item[] }) {
  const [items, setItems] = useState(ilkItems);

  async function handleCik(ozellik: string) {
    const sonuc = await waitListeCik(ozellik);
    if (sonuc?.ok) {
      setItems((prev) => prev.filter((i) => i.ozellik !== ozellik));
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-10">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Bekleme Listelerim</p>
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm">
        {items.map((item) => (
          <div key={item.ozellik} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {OZELLIK_ETIKET[item.ozellik] ?? item.ozellik}
              </p>
              <p className="text-xs text-slate-400">
                Erken erişim listesindeydiniz ·{" "}
                {new Date(item.created_at).toLocaleDateString("tr-TR")} tarihinde katıldınız
              </p>
            </div>
            <button
              onClick={() => handleCik(item.ozellik)}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors shrink-0 ml-4"
            >
              Listeden çık
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

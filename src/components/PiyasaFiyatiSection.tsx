"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { waitListeEkle } from "@/app/actions/waitlist";

interface Props {
  girisYapilmis: boolean;
  listede: boolean;
  geriDonUrl: string;
}

export function PiyasaFiyatiSection({ girisYapilmis, listede: ilkListede, geriDonUrl }: Props) {
  const router = useRouter();
  const [listede, setListede] = useState(ilkListede);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function handleTikla() {
    if (!girisYapilmis) {
      router.push(`/giris?sonra=${encodeURIComponent(geriDonUrl)}`);
      return;
    }
    if (listede) return;
    setYukleniyor(true);
    const sonuc = await waitListeEkle("piyasa_fiyati");
    setYukleniyor(false);
    if (sonuc.ok) setListede(true);
  }

  return (
    <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-800">Piyasa Fiyatı</p>
          <p className="mt-0.5 text-xs text-amber-700">
            Bu aracın ikinci el piyasada gerçek satış fiyatı — yakında geliyor.
          </p>
        </div>
        {listede ? (
          <span className="shrink-0 rounded-lg bg-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800">
            ✓ Listedesiniz
          </span>
        ) : (
          <button
            onClick={handleTikla}
            disabled={yukleniyor}
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
          >
            {yukleniyor ? "..." : "Haberdar et"}
          </button>
        )}
      </div>
    </div>
  );
}

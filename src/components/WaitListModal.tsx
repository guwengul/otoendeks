"use client";

import { useState } from "react";
import { waitListeEkle } from "@/app/actions/waitlist";

const AMAC_SECENEKLER = [
  { value: "bireysel", label: "Kişisel araç takibi" },
  { value: "galeri", label: "Galeri / ikinci el satıcısı" },
  { value: "sigorta", label: "Sigorta / ekspertiz" },
  { value: "diger", label: "Diğer" },
];

const HACIM_SECENEKLER = [
  { value: "10-alti", label: "Ayda 10'dan az" },
  { value: "10-50", label: "Ayda 10–50 araç" },
  { value: "50-ustu", label: "Ayda 50'den fazla" },
];

interface Props {
  onKapat: () => void;
  onBasari: () => void;
}

export function WaitListModal({ onKapat, onBasari }: Props) {
  const [amac, setAmac] = useState("");
  const [hacim, setHacim] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const ticari = amac === "galeri" || amac === "sigorta";

  async function handleGonder() {
    if (!amac) return;
    setYukleniyor(true);
    const meta: Record<string, string> = { amac };
    if (ticari && hacim) meta.hacim = hacim;
    const sonuc = await waitListeEkle("piyasa_fiyati", meta);
    setYukleniyor(false);
    if (sonuc.ok) onBasari();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onKapat}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5">
          <p className="text-base font-semibold text-slate-900">Erken erişim listesi</p>
          <p className="mt-1 text-sm text-slate-500">İki hızlı soru — piyasa fiyatı özelliğini size daha iyi sunmak için.</p>
        </div>

        {/* Kullanım amacı */}
        <p className="mb-2 text-xs font-medium text-slate-700">Bu özelliği nasıl kullanmayı düşünüyorsunuz?</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {AMAC_SECENEKLER.map((s) => (
            <button
              key={s.value}
              onClick={() => { setAmac(s.value); setHacim(""); }}
              className={`rounded-lg border px-3 py-2.5 text-xs font-medium text-left transition-colors ${
                amac === s.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Hacim sorusu — sadece ticari */}
        {ticari && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-slate-700">Aylık kaç araç değerlendiriyorsunuz?</p>
            <div className="flex gap-2">
              {HACIM_SECENEKLER.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setHacim(s.value)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    hacim === s.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={onKapat}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Vazgeç
          </button>
          <button
            onClick={handleGonder}
            disabled={!amac || yukleniyor}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {yukleniyor ? "..." : "Listeye katıl"}
          </button>
        </div>
      </div>
    </div>
  );
}

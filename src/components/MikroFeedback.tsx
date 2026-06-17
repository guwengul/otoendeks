"use client";

import { useState } from "react";

export function MikroFeedback({ tipKodu, modelYili }: { tipKodu: number; modelYili: number }) {
  const storageKey = `fb-${tipKodu}-${modelYili}`;

  const [oy, setOy] = useState<1 | -1 | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem(storageKey);
    return v ? (Number(v) as 1 | -1) : null;
  });
  const [gonderiyor, setGonderiyor] = useState(false);

  async function handleOy(yeniOy: 1 | -1) {
    if (oy !== null || gonderiyor) return;
    setGonderiyor(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tip_kodu: tipKodu, model_yili: modelYili, oy: yeniOy }),
      });
      localStorage.setItem(storageKey, String(yeniOy));
      setOy(yeniOy);
    } finally {
      setGonderiyor(false);
    }
  }

  if (oy !== null) {
    return (
      <div className="py-3 text-center text-sm text-gray-400">
        {oy === 1 ? "👍" : "👎"} Teşekkürler, görüşün kaydedildi.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 py-3">
      <span className="text-sm text-gray-500">Bu bilgi faydalı oldu mu?</span>
      <button
        onClick={() => handleOy(1)}
        disabled={gonderiyor}
        className="text-xl transition-transform hover:scale-125 disabled:opacity-40"
        aria-label="Evet, faydalı"
      >
        👍
      </button>
      <button
        onClick={() => handleOy(-1)}
        disabled={gonderiyor}
        className="text-xl transition-transform hover:scale-125 disabled:opacity-40"
        aria-label="Hayır, faydalı değil"
      >
        👎
      </button>
    </div>
  );
}

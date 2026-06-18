"use client";

import { useState } from "react";

export function MikroFeedback({ tipKodu, modelYili }: { tipKodu: number; modelYili: number }) {
  const storageKey = `fb-${tipKodu}-${modelYili}`;

  const [seciliOy, setSeciliOy] = useState<1 | -1 | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem(storageKey);
    return v ? (Number(v) as 1 | -1) : null;
  });
  const [yorum, setYorum] = useState("");
  const [gonderiyor, setGonderiyor] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(storageKey);
  });

  function handleOy(oy: 1 | -1) {
    if (seciliOy !== null || gonderiyor) return;
    setSeciliOy(oy);
  }

  async function gonder(yorumMetni: string) {
    if (seciliOy === null || gonderiyor) return;
    setGonderiyor(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tip_kodu: tipKodu,
          model_yili: modelYili,
          oy: seciliOy,
          yorum: yorumMetni.trim() || null,
        }),
      });
      localStorage.setItem(storageKey, String(seciliOy));
      setTamamlandi(true);
    } finally {
      setGonderiyor(false);
    }
  }

  if (tamamlandi) {
    return (
      <div className="py-3 text-center text-sm text-gray-400">
        {seciliOy === 1 ? "👍" : "👎"} Teşekkürler, görüşün kaydedildi.
      </div>
    );
  }

  if (seciliOy !== null) {
    return (
      <div className="py-3">
        <p className="mb-2 text-center text-sm text-gray-500">
          {seciliOy === 1 ? "👍" : "👎"} Kısa bir yorum eklemek ister misin?
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={yorum}
            onChange={(e) => setYorum(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && gonder(yorum)}
            placeholder="İsteğe bağlı..."
            maxLength={200}
            autoFocus
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={() => gonder(yorum)}
            disabled={gonderiyor}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
          >
            Gönder
          </button>
          <button
            onClick={() => gonder("")}
            disabled={gonderiyor}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-50 disabled:opacity-40"
          >
            Geç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-4 py-3">
      <span className="text-sm text-gray-500">Bu bilgi faydalı oldu mu?</span>
      <button
        onClick={() => handleOy(1)}
        className="text-xl transition-transform hover:scale-125"
        aria-label="Evet, faydalı"
      >
        👍
      </button>
      <button
        onClick={() => handleOy(-1)}
        className="text-xl transition-transform hover:scale-125"
        aria-label="Hayır, faydalı değil"
      >
        👎
      </button>
    </div>
  );
}

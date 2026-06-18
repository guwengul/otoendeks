"use client";

import { useState } from "react";

export function MikroFeedback({ tipKodu, modelYili }: { tipKodu: number; modelYili: number }) {
  const storageKey = `fb-${tipKodu}-${modelYili}`;

  const [acik, setAcik] = useState(false);
  const [yorum, setYorum] = useState("");
  const [gonderiyor, setGonderiyor] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(storageKey);
  });

  async function gonder() {
    if (gonderiyor) return;
    setGonderiyor(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tip_kodu: tipKodu,
          model_yili: modelYili,
          oy: -1,
          yorum: yorum.trim() || null,
        }),
      });
      localStorage.setItem(storageKey, "-1");
      setTamamlandi(true);
    } finally {
      setGonderiyor(false);
    }
  }

  if (tamamlandi) {
    return (
      <p className="py-2 text-center text-xs text-slate-400">Bildiriminiz alındı, teşekkürler.</p>
    );
  }

  if (acik) {
    return (
      <div className="py-2">
        <p className="mb-2 text-xs text-slate-500">Hangi değerin hatalı olduğunu belirtir misiniz? (isteğe bağlı)</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={yorum}
            onChange={(e) => setYorum(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && gonder()}
            placeholder="örn. gerçek değer ₺1.200.000 civarında"
            maxLength={200}
            autoFocus
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={gonder}
            disabled={gonderiyor}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            Gönder
          </button>
          <button
            onClick={() => setAcik(false)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-50"
          >
            İptal
          </button>
        </div>
      </div>
    );
  }

  return (
    <p className="py-2 text-center text-xs text-slate-400">
      Değer hatalı mı?{" "}
      <button
        onClick={() => setAcik(true)}
        className="text-indigo-500 hover:text-indigo-700 hover:underline"
      >
        Bildir
      </button>
    </p>
  );
}

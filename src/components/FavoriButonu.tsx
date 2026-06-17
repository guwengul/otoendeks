"use client";

import { useState } from "react";

export function FavoriButonu() {
  const [tiklandiMi, setTiklandiMi] = useState(false);

  if (tiklandiMi) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
        Fiyat değişimlerini takip etmek için üye ol — yakında!
      </div>
    );
  }

  return (
    <button
      onClick={() => setTiklandiMi(true)}
      className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      ♡ Takip et — fiyat değişince haber ver
    </button>
  );
}

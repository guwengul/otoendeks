"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Item = {
  key: string;
  label: string;
  sublabel?: string;
  href: string;
};

export function AramaListesi({
  items,
  placeholder,
  defaultCount,
}: {
  items: Item[];
  placeholder: string;
  defaultCount?: number;
}) {
  const [query, setQuery] = useState("");
  const [tumunuGoster, setTumunuGoster] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return items;
    const tokens = q.split(/\s+/).filter(Boolean);
    return items.filter((item) => {
      const label = item.label.toLocaleLowerCase("tr");
      return tokens.every((t) => label.includes(t));
    });
  }, [items, query]);

  const aramaYapiliyor = query.trim().length > 0;
  const gosterilecek =
    aramaYapiliyor || tumunuGoster || !defaultCount
      ? filtered
      : filtered.slice(0, defaultCount);
  const gizlenenSayi = aramaYapiliyor ? 0 : filtered.length - gosterilecek.length;

  return (
    <div className="w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {gosterilecek.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="block rounded-lg border border-gray-200 px-4 py-3 text-sm transition-colors hover:border-red-400 hover:bg-red-50"
            >
              <div className="font-medium text-gray-900">{item.label}</div>
              {item.sublabel && <div className="text-xs text-gray-500">{item.sublabel}</div>}
            </Link>
          </li>
        ))}
      </ul>
      {gizlenenSayi > 0 && (
        <button
          onClick={() => setTumunuGoster(true)}
          className="mt-4 w-full rounded-lg border border-gray-200 py-2.5 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          + {gizlenenSayi} marka daha göster
        </button>
      )}
      {filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-gray-500">Sonuç bulunamadı.</p>
      )}
    </div>
  );
}

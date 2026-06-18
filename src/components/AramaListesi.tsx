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
  tekSutun,
}: {
  items: Item[];
  placeholder: string;
  defaultCount?: number;
  tekSutun?: boolean;
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
        className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <ul className={`grid gap-2 ${tekSutun ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"}`}>
        {gosterilecek.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors hover:border-indigo-400 hover:bg-indigo-50"
            >
              <div className={`flex items-center justify-between gap-4 ${tekSutun ? "" : "flex-col items-start gap-0.5"}`}>
                <div className="font-medium text-slate-900">{item.label}</div>
                {item.sublabel && <div className={`text-xs text-slate-500 shrink-0 ${tekSutun ? "font-semibold" : ""}`}>{item.sublabel}</div>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {gizlenenSayi > 0 && (
        <button
          onClick={() => setTumunuGoster(true)}
          className="mt-4 w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
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

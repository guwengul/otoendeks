"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Item = {
  key: string;
  label: string;
  sublabel?: string;
  href: string;
};

export function AramaListesi({ items, placeholder }: { items: Item[]; placeholder: string }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return items;
    return items.filter((item) => item.label.toLocaleLowerCase("tr").includes(q));
  }, [items, query]);

  return (
    <div className="w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {filtered.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="block rounded-lg border border-gray-200 px-4 py-3 text-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              <div className="font-medium text-gray-900">{item.label}</div>
              {item.sublabel && <div className="text-xs text-gray-500">{item.sublabel}</div>}
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="mt-6 text-center text-sm text-gray-500">Sonuç bulunamadı.</p>
      )}
    </div>
  );
}

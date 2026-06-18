"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AraclarimSekmeler({
  aktif,
  aracSayisi,
  izlemeSayisi,
}: {
  aktif: string;
  aracSayisi: number;
  izlemeSayisi: number;
}) {
  return (
    <div className="flex gap-1 border-b border-slate-200">
      <Link
        href="/araclarim"
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          aktif === "araclarim"
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Araçlarım
        {aracSayisi > 0 && (
          <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
            {aracSayisi}
          </span>
        )}
      </Link>
      <Link
        href="/araclarim?sekme=izliyorum"
        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
          aktif === "izliyorum"
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Takiptekiler
        {izlemeSayisi > 0 && (
          <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
            {izlemeSayisi}
          </span>
        )}
      </Link>
    </div>
  );
}

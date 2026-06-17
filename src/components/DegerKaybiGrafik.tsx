import type { DegerNoktasi } from "@/lib/kasko";

function fmt(value: number): string {
  return "₺" + new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
}

export function DegerKaybiGrafik({
  gecmis,
  modelYili,
}: {
  gecmis: DegerNoktasi[];
  modelYili: number;
}) {
  const sirali = [...gecmis].sort((a, b) => a.model_yili - b.model_yili);
  if (sirali.length === 0) return null;

  const maxDeger = Math.max(...sirali.map((d) => d.deger));
  const current = sirali.find((d) => d.model_yili === modelYili);

  return (
    <div className="space-y-2">
      {sirali.map((d) => {
        const isCurrent = d.model_yili === modelYili;
        const barPct = (d.deger / maxDeger) * 100;
        const farkPct =
          current && !isCurrent
            ? ((d.deger - current.deger) / current.deger) * 100
            : null;
        const artis = farkPct !== null && farkPct > 0;

        return (
          <div
            key={d.model_yili}
            className={`rounded-lg px-4 py-3 ${isCurrent ? "border border-gray-300 bg-white" : "bg-gray-50"}`}
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className={`text-sm font-medium ${isCurrent ? "text-gray-900" : "text-gray-500"}`}>
                {d.model_yili} model{isCurrent ? " ◄" : ""}
              </span>
              <div className="flex items-baseline gap-2">
                {farkPct !== null && (
                  <span className={`text-xs font-semibold ${artis ? "text-green-600" : "text-orange-500"}`}>
                    {artis ? "+" : ""}{farkPct.toFixed(1)}%
                  </span>
                )}
                <span className={`text-sm font-bold tabular-nums ${isCurrent ? "text-gray-900" : "text-gray-600"}`}>
                  {fmt(d.deger)}
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div
                className={`h-1.5 rounded-full ${isCurrent ? "bg-gray-700" : artis ? "bg-green-400" : "bg-orange-400"}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

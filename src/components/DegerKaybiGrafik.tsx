import type { DegerNoktasi } from "@/lib/kasko";

function formatTL(value: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value) + " TL";
}

export function DegerKaybiGrafik({ gecmis }: { gecmis: DegerNoktasi[] }) {
  const sirali = [...gecmis].sort((a, b) => a.model_yili - b.model_yili);
  if (sirali.length === 0) return null;

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 70 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const degerler = sirali.map((d) => d.deger);
  const maxDeger = Math.max(...degerler);
  const minDeger = Math.min(...degerler);
  const range = maxDeger - minDeger || 1;

  const points = sirali.map((d, i) => {
    const x = padding.left + (sirali.length === 1 ? innerWidth / 2 : (i / (sirali.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - ((d.deger - minDeger) / range) * innerHeight;
    return { x, y, ...d };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Değer kaybı grafiği">
      <line x1={padding.left} y1={padding.top + innerHeight} x2={width - padding.right} y2={padding.top + innerHeight} stroke="#e5e7eb" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} stroke="#e5e7eb" />

      <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{formatTL(maxDeger)}</text>
      <text x={padding.left - 8} y={padding.top + innerHeight} textAnchor="end" fontSize="10" fill="#9ca3af">{formatTL(minDeger)}</text>

      {/* Segmentleri ayrı ayrı renklendir */}
      {points.slice(1).map((p, i) => {
        const prev = points[i];
        const artiyor = p.deger > prev.deger;
        return (
          <line key={i} x1={prev.x} y1={prev.y} x2={p.x} y2={p.y}
            stroke={artiyor ? "#16a34a" : "#f97316"} strokeWidth={2.5} />
        );
      })}

      {points.map((p, i) => {
        const renk = i === 0
          ? "#9ca3af"
          : p.deger > points[i - 1].deger ? "#16a34a" : "#f97316";
        return (
          <g key={p.model_yili}>
            <circle cx={p.x} cy={p.y} r={4} fill={renk} />
            <text x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#6b7280">{p.model_yili}</text>
          </g>
        );
      })}
    </svg>
  );
}

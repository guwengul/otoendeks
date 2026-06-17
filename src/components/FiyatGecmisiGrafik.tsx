import type { AylikNoktasi } from "@/lib/kasko";

function formatTL(value: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value) + " TL";
}

function formatAy(isoDate: string): string {
  const [year, month] = isoDate.split("-");
  const aylar = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${aylar[Number(month) - 1]} ${year.slice(2)}`;
}

export function FiyatGecmisiGrafik({ gecmis }: { gecmis: AylikNoktasi[] }) {
  if (gecmis.length === 0) return null;

  const width = 600;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 70 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const degerler = gecmis.map((d) => d.deger);
  const maxDeger = Math.max(...degerler);
  const minDeger = Math.min(...degerler);
  const range = maxDeger - minDeger || 1;

  const points = gecmis.map((d, i) => {
    const x = padding.left + (gecmis.length === 1 ? innerWidth / 2 : (i / (gecmis.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - ((d.deger - minDeger) / range) * innerHeight;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // x ekseninde her ayı yazmak yerine sadece birkaç etiket göster
  const labelStep = Math.ceil(gecmis.length / 6);
  const labelPoints = points.filter((_, i) => i % labelStep === 0 || i === points.length - 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Fiyat geçmişi grafiği">
      <line x1={padding.left} y1={padding.top + innerHeight} x2={width - padding.right} y2={padding.top + innerHeight} stroke="#d1d5db" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} stroke="#d1d5db" />

      <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" fontSize="10" fill="#6b7280">
        {formatTL(maxDeger)}
      </text>
      <text x={padding.left - 8} y={padding.top + innerHeight} textAnchor="end" fontSize="10" fill="#6b7280">
        {formatTL(minDeger)}
      </text>

      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth={2} />

      {points.map((p) => (
        <circle key={p.snapshot_month} cx={p.x} cy={p.y} r={3} fill="#2563eb" />
      ))}

      {labelPoints.map((p) => (
        <text key={p.snapshot_month} x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#6b7280">
          {formatAy(p.snapshot_month)}
        </text>
      ))}
    </svg>
  );
}

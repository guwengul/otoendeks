export type KrediTipi = "ihtiyac" | "tasit";

export function aylikTaksit(tutar: number, aylikFaizPct: number, vadeAy: number): number {
  const r = aylikFaizPct / 100;
  if (r === 0) return tutar / vadeAy;
  return (tutar * r * Math.pow(1 + r, vadeAy)) / (Math.pow(1 + r, vadeAy) - 1);
}

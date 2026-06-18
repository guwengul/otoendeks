export type KrediTipi = "ihtiyac" | "tasit";

export type Banka = {
  ad: string;
  kisaltma: string;
  renk: string;
  ihtiyac: { aylikFaiz: number; minVade: number; maxVade: number; minTutar: number; maxTutar: number } | null;
  tasit: { aylikFaiz: number; minVade: number; maxVade: number; minTutar: number; maxTutar: number } | null;
};

// Aylık faiz oranı (%). Kaynak: banka web siteleri — periyodik güncelleme gerekir.
export const BANKALAR: Banka[] = [
  {
    ad: "Ziraat Bankası", kisaltma: "Ziraat", renk: "#E30613",
    ihtiyac: { aylikFaiz: 3.99, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.89, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 1500000 },
  },
  {
    ad: "İş Bankası", kisaltma: "İşbank", renk: "#003087",
    ihtiyac: { aylikFaiz: 3.89, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.79, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 2000000 },
  },
  {
    ad: "Garanti BBVA", kisaltma: "Garanti", renk: "#00A850",
    ihtiyac: { aylikFaiz: 3.99, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.89, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 2000000 },
  },
  {
    ad: "Akbank", kisaltma: "Akbank", renk: "#EF2029",
    ihtiyac: { aylikFaiz: 3.89, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.79, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 2000000 },
  },
  {
    ad: "Yapı Kredi", kisaltma: "YKB", renk: "#003DA5",
    ihtiyac: { aylikFaiz: 3.99, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.89, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 2000000 },
  },
  {
    ad: "Vakıfbank", kisaltma: "Vakıf", renk: "#005BAC",
    ihtiyac: { aylikFaiz: 3.89, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.79, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 1500000 },
  },
  {
    ad: "Halkbank", kisaltma: "Halk", renk: "#006633",
    ihtiyac: { aylikFaiz: 3.89, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.79, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 1500000 },
  },
  {
    ad: "DenizBank", kisaltma: "Deniz", renk: "#009FE3",
    ihtiyac: { aylikFaiz: 4.09, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 300000 },
    tasit:   { aylikFaiz: 3.99, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 1500000 },
  },
  {
    ad: "QNB Finansbank", kisaltma: "QNB", renk: "#5C0F8B",
    ihtiyac: { aylikFaiz: 3.84, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.79, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 2000000 },
  },
  {
    ad: "TEB", kisaltma: "TEB", renk: "#003DA5",
    ihtiyac: { aylikFaiz: 3.99, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 300000 },
    tasit:   { aylikFaiz: 3.89, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 1500000 },
  },
  {
    ad: "ING", kisaltma: "ING", renk: "#FF6200",
    ihtiyac: { aylikFaiz: 4.19, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 250000 },
    tasit:   null,
  },
  {
    ad: "Kuveyt Türk", kisaltma: "KT", renk: "#006838",
    ihtiyac: { aylikFaiz: 3.79, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.69, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 2000000 },
  },
  {
    ad: "Albaraka Türk", kisaltma: "Albaraka", renk: "#00529B",
    ihtiyac: { aylikFaiz: 3.79, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.69, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 2000000 },
  },
  {
    ad: "Vakıf Katılım", kisaltma: "VK", renk: "#005BAC",
    ihtiyac: { aylikFaiz: 3.79, minVade: 3, maxVade: 36, minTutar: 5000, maxTutar: 500000 },
    tasit:   { aylikFaiz: 3.69, minVade: 3, maxVade: 48, minTutar: 10000, maxTutar: 2000000 },
  },
];

export function aylikTaksit(tutar: number, aylikFaizPct: number, vadeAy: number): number {
  const r = aylikFaizPct / 100;
  if (r === 0) return tutar / vadeAy;
  return (tutar * r * Math.pow(1 + r, vadeAy)) / (Math.pow(1 + r, vadeAy) - 1);
}

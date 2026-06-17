import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

function fmt(v: number) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(Math.abs(v));
}
function isaret(v: number) { return v >= 0 ? "+" : "−"; }
function fmtTL(v: number) { return `₺${fmt(v)}`; }
function farkRenk(v: number) { return v >= 0 ? "#16a34a" : "#f97316"; }

function Satir({ label, deger, fark }: { label: string; deger: string; fark: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <span style={{ fontSize: 15, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: farkRenk(fark) }}>
        {isaret(fark)}{deger}
      </span>
    </div>
  );
}

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;

  const baslik = s.get("baslik") ?? "";
  const fiyat = s.get("fiyat") ?? "";
  const donem = s.get("donem") ?? "";

  const enIlkAy = s.get("enIlkAy");
  const enSonAy = s.get("enSonAy");
  const enTlFark = s.has("enTlFark") ? Number(s.get("enTlFark")) : null;
  const enUsdFark = s.has("enUsdFark") ? Number(s.get("enUsdFark")) : null;
  const enAltinFark = s.has("enAltinFark") ? Number(s.get("enAltinFark")) : null;
  const hasEnflasyon = enIlkAy && enSonAy && enTlFark !== null && enUsdFark !== null && enAltinFark !== null;

  const esYeniYil = s.get("esYeniYil");
  const esEskiYil = s.get("esEskiYil");
  const esTlFark = s.has("esTlFark") ? Number(s.get("esTlFark")) : null;
  const esUsdFark = s.has("esUsdFark") ? Number(s.get("esUsdFark")) : null;
  const esAltinFark = s.has("esAltinFark") ? Number(s.get("esAltinFark")) : null;
  const hasEskime = esYeniYil && esEskiYil && esTlFark !== null && esUsdFark !== null && esAltinFark !== null;

  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: "#f9fafb",
            fontFamily: "sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "22px 48px",
              backgroundColor: "white",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
              otoendeks
            </span>
            <span style={{ marginLeft: 12, fontSize: 15, color: "#9ca3af" }}>
              kasko değer sorgulama
            </span>
          </div>

          {/* Main */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "36px 48px 32px" }}>
            <span style={{ fontSize: 22, color: "#6b7280", marginBottom: 10 }}>{baslik}</span>
            <span
              style={{
                fontSize: 76,
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1,
                letterSpacing: "-2px",
              }}
            >
              {fiyat}
            </span>
            <span style={{ fontSize: 16, color: "#9ca3af", marginTop: 14 }}>
              {donem} · TSB kasko değeri
            </span>

            {/* Cards */}
            {(hasEnflasyon || hasEskime) && (
              <div style={{ display: "flex", gap: 16, marginTop: 28 }}>
                {hasEnflasyon && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      backgroundColor: "white",
                      borderRadius: 12,
                      padding: "18px 22px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 14,
                      }}
                    >
                      {enIlkAy} → {enSonAy}
                    </span>
                    <Satir label="TL" deger={fmtTL(enTlFark!)} fark={enTlFark!} />
                    <Satir label="USD" deger={`$${fmt(enUsdFark!)}`} fark={enUsdFark!} />
                    <Satir label="Altın" deger={`${fmt(enAltinFark!)} gr`} fark={enAltinFark!} />
                  </div>
                )}
                {hasEskime && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      backgroundColor: "white",
                      borderRadius: 12,
                      padding: "18px 22px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        marginBottom: 14,
                      }}
                    >
                      {esYeniYil} → {esEskiYil} Model
                    </span>
                    <Satir label="TL" deger={fmtTL(esTlFark!)} fark={esTlFark!} />
                    <Satir label="USD" deger={`$${fmt(esUsdFark!)}`} fark={esUsdFark!} />
                    <Satir label="Altın" deger={`${fmt(esAltinFark!)} gr`} fark={esAltinFark!} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  } catch {
    return new Response("OG image oluşturulamadı", { status: 500 });
  }
}

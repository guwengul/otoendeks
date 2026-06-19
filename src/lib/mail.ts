const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://otoendeks.com";
const SECRET = process.env.MAIL_API_SECRET ?? "";

async function mailGonder(to: string, subject: string, html: string) {
  await fetch(`${BASE_URL}/api/mail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-secret": SECRET,
    },
    body: JSON.stringify({ to, subject, html }),
  });
}

export async function waitListOnayMailiGonder(email: string) {
  await mailGonder(
    email,
    "Bekleme listesine katıldınız — otoendeks",
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1e293b">
      <p style="font-size:22px;font-weight:700;margin:0 0 8px">İkinci El Piyasa Fiyatı</p>
      <p style="font-size:15px;color:#475569;margin:0 0 24px">
        Erken erişim listesine katıldınız. Özellik yayına girdiğinde ilk siz haberdar olacaksınız.
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px"/>
      <p style="font-size:13px;color:#94a3b8;margin:0">
        Bu maili siz talep ettiniz. Listeden çıkmak için
        <a href="${BASE_URL}/araclarim" style="color:#6366f1">araçlarım</a> sayfasını ziyaret edin.
      </p>
    </div>
    `
  );
}

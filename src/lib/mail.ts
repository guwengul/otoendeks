import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const GONDEREN = "otoendeks <onboarding@resend.dev>";

export async function waitListOnayMailiGonder(email: string) {
  await resend.emails.send({
    from: GONDEREN,
    to: email,
    subject: "Bekleme listesine katıldınız — otoendeks",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1e293b">
        <p style="font-size:22px;font-weight:700;margin:0 0 8px">İkinci El Piyasa Fiyatı</p>
        <p style="font-size:15px;color:#475569;margin:0 0 24px">
          Erken erişim listesine katıldınız. Özellik yayına girdiğinde ilk siz haberdar olacaksınız.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px"/>
        <p style="font-size:13px;color:#94a3b8;margin:0">
          Bu maili siz talep ettiniz. Listeden çıkmak için
          <a href="https://otoendeks.com/araclarim" style="color:#6366f1">araçlarım</a> sayfasını ziyaret edin.
        </p>
      </div>
    `,
  });
}

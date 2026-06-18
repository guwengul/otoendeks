import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası — Otoendeks",
};

export default function GizlilikPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Gizlilik Politikası</h1>
      <p className="mb-8 text-sm text-slate-400">Son güncelleme: Haziran 2026</p>

      <div className="prose prose-sm prose-slate max-w-none space-y-6 text-slate-700">

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">1. Veri Sorumlusu</h2>
          <p>
            Bu platform, Otoendeks tarafından işletilmektedir. Kişisel verileriniz, 6698 sayılı
            Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında aşağıda belirtilen amaçlarla
            işlenmektedir. Sorularınız için{" "}
            <a href="mailto:merhaba@otoendeks.com" className="text-indigo-600 hover:underline">
              merhaba@otoendeks.com
            </a>{" "}
            adresine ulaşabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">2. Toplanan Veriler</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Ad Soyad ve E-posta adresi</strong> — hesap oluşturma sırasında alınır.</li>
            <li><strong>Araç bilgileri</strong> — garajınıza eklediğiniz araçlar (marka, model, yıl).</li>
            <li><strong>Önemli tarihler</strong> — MTV, muayene ve kasko bitiş tarihleri (yalnızca siz girdiyseniz).</li>
          </ul>
          <p className="mt-2">
            Ödeme bilgisi, TC kimlik numarası veya konum verisi toplanmamaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">3. Verilerin Kullanım Amacı</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Hesabınızı oluşturmak ve yönetmek</li>
            <li>Garajınızdaki araçlara ait hatırlatıcı e-postaları göndermek (MTV, muayene, kasko bitiş, kasko fiyat değişikliği)</li>
            <li>Teknik sorunlar için sizinle iletişim kurmak</li>
          </ul>
          <p className="mt-2">Verileriniz pazarlama amacıyla kullanılmaz, 3. taraflara satılmaz.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">4. Verinin Saklandığı Yer</h2>
          <p>
            Kişisel verileriniz{" "}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              Supabase
            </a>{" "}
            altyapısında AB bölgesindeki sunucularda güvenli biçimde saklanmaktadır. E-posta
            gönderimi için{" "}
            <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
              Resend
            </a>{" "}
            hizmetinden yararlanılmaktadır. Her iki sağlayıcı da GDPR uyumludur.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">5. Haklarınız</h2>
          <p>KVKK madde 11 kapsamında aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Verilerinize erişim talep etme</li>
            <li>Yanlış verilerin düzeltilmesini isteme</li>
            <li>Verilerinizin silinmesini talep etme — hesabınızı sildiğinizde tüm kişisel verileriniz otomatik olarak silinir</li>
            <li>İşlemeye itiraz etme</li>
          </ul>
          <p className="mt-2">
            Taleplerinizi{" "}
            <a href="mailto:merhaba@otoendeks.com" className="text-indigo-600 hover:underline">
              merhaba@otoendeks.com
            </a>{" "}
            adresine iletebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">6. Çerezler</h2>
          <p>
            Yalnızca oturum yönetimi için zorunlu çerezler kullanılmaktadır. Analitik veya
            pazarlama çerezi bulunmamaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900 mb-2">7. Değişiklikler</h2>
          <p>
            Bu politika güncellendiğinde sayfanın üst kısmındaki tarih değiştirilecektir.
            Önemli değişikliklerde kayıtlı kullanıcılara e-posta ile bildirim yapılacaktır.
          </p>
        </section>

      </div>
    </main>
  );
}

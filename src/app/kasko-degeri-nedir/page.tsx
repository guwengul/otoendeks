import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kasko Değeri Nedir?",
  description: "TSB kasko değer listesi nedir, nasıl hesaplanır, avantaj ve dezavantajları nelerdir? Piyasa değerini etkileyen faktörler.",
  alternates: { canonical: "https://otoendeks.com/kasko-degeri-nedir" },
  openGraph: {
    title: "Kasko Değeri Nedir? | Otoendeks",
    description: "TSB kasko değer listesi nedir, nasıl hesaplanır, avantaj ve dezavantajları nelerdir?",
    url: "https://otoendeks.com/kasko-degeri-nedir",
  },
};

export default function KaskoDegeriNedirPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:underline">Kasko Değeri</Link>
        {" / "}
        <span className="text-slate-900">Kasko Değeri Nedir?</span>
      </nav>

      <h1 className="mb-8 text-2xl font-semibold text-slate-900">Kasko Değeri Nedir?</h1>

      <div className="space-y-8 text-sm leading-relaxed text-slate-600">
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-800">TSB Kasko Değer Listesi</h2>
          <p>
            Kasko değeri, Türkiye Sigorta Birliği (TSB) tarafından aylık olarak yayımlanan resmi
            bir liste üzerinden belirlenir. Bu liste; marka, model, model yılı ve kullanım amacı
            dikkate alınarak hazırlanır ve yalnızca <strong>15 yaşından küçük araçları</strong> kapsar.
          </p>
          <p className="mt-3">
            Sigorta şirketleri kasko poliçesi düzenlerken bu listeyi referans alır. Araç alım-satım
            işlemlerinde de yaygın biçimde kullanılan kasko değeri, resmi bir fiyat göstergesi
            niteliği taşımaktadır.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-800">Avantajları</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Standart ve şeffaf bir hesaplama yöntemi sunar</li>
            <li>Tüm markalar için tek bir kaynaktan erişilebilir</li>
            <li>Sigorta primlerinin belirlenmesinde resmi dayanak oluşturur</li>
            <li>Araç değerini hızlıca öğrenmek için pratik bir başlangıç noktasıdır</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-800">Dezavantajları</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Aracın gerçek piyasa değerini her zaman yansıtmayabilir. Örneğin, kilometre farkı
              büyük olan iki araç kasko listesinde aynı değerde görünebilir.
            </li>
            <li>Hasar geçmişi, boya durumu ve donanım farklılıkları listeye yansımaz</li>
            <li>Piyasadaki arz-talep dengesini anlık olarak takip etmez</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-800">Piyasa Değerini Etkileyen Faktörler</h2>
          <p className="mb-3">
            Kasko değeri bir referans noktasıdır; ancak ikinci el piyasadaki gerçek satış fiyatı
            aşağıdaki unsurlara göre önemli ölçüde farklılaşabilir:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Hasar ve tramer kaydı</li>
            <li>Boyalı veya değişen parçalar</li>
            <li>Kilometre</li>
            <li>Kullanım şekli ve bakım geçmişi</li>
            <li>Kasa tipi ve fabrika donanımı</li>
            <li>Satışın yapıldığı şehir</li>
            <li>Kozmetik durum (iç ve dış)</li>
          </ul>
        </section>

        <section className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <h2 className="mb-2 text-base font-semibold text-indigo-800">Kasko Değerinizi Sorgulayın</h2>
          <p className="mb-4 text-indigo-700">
            Aracınızın güncel TSB kasko değerini marka, model yılı ve tipine göre sorgulayabilirsiniz.
            Değer geçmişini TL, USD ve altın bazında takip edin.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Kasko değeri sorgula →
          </Link>
        </section>
      </div>
    </main>
  );
}

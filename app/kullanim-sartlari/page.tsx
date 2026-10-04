import { InfoList, InfoPage, InfoSection } from "@/components/legal/InfoPage";
import { createPublicMetadata } from "@/lib/public-metadata";

export const metadata = createPublicMetadata({
  title: "Kullanım Şartları",
  description: "Sosyalio hizmetlerinin sipariş, hedef bilgisi, platform ilişkisi ve kabul edilebilir kullanım şartları.",
  path: "/kullanim-sartlari",
});

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Hizmet Şartları" title="Kullanım Şartları" intro="Sosyalio üzerinden sipariş oluşturan kullanıcıların hizmet akışına ilişkin temel sorumluluk ve beklentileri.">
      <InfoSection title="Sipariş ve hedef bilgisi">
        <InfoList items={[
          "Kullanıcı, hizmetin uygulanacağı doğru kullanıcı adı, profil veya içerik bağlantısını sağlamakla sorumludur.",
          "Yanlış, eksik, erişilemeyen veya sipariş sonrasında değiştirilen hedef bilgileri teslimatı geciktirebilir ya da engelleyebilir.",
          "Bir hata fark edildiğinde hizmet işleme alınmadan önce Canlı Destek üzerinden bildirim yapılmalıdır; işlem başladıktan sonra hedef değişikliği mümkün olmayabilir.",
          "Sosyalio hiçbir aşamada sosyal medya hesabı parolası istemez. Kullanıcılar parola veya erişim kodu paylaşmamalıdır.",
        ]} />
      </InfoSection>
      <InfoSection title="Hizmet süreci">
        <p>Paketlerde belirtilen başlangıç veya teslim süreleri tahminidir; platform koşulları, teknik yoğunluk, hedef hesabın durumu ve üçüncü taraf kısıtlamaları nedeniyle değişebilir. Kesin sonuç veya kesintisiz süre garantisi verilmez.</p>
        <p>Ödeme ve sipariş kaydı tamamlandıktan sonra siparişin operasyonel durumu yetkili yönetim ekranından PENDING, PROCESSING, COMPLETED veya CANCELLED olarak yönetilebilir. Ödeme durumu ile hizmetin operasyonel durumu ayrı süreçlerdir.</p>
      </InfoSection>
      <InfoSection title="Üçüncü taraf platformlar">
        <p>Instagram, TikTok, YouTube, X, Facebook ve diğer platformlar bağımsız üçüncü taraflardır; adları ve markaları ilgili sahiplerine aittir. Sosyalio bu platformların resmi temsilcisi, bayisi veya ortağı olduğunu iddia etmez.</p>
        <p>Platformların kuralları, teknik yapısı veya erişim politikalarında yaptığı değişiklikler hizmetin kapsamını ve uygulanabilirliğini etkileyebilir.</p>
      </InfoSection>
      <InfoSection title="Kabul edilebilir kullanım">
        <p>Hizmetler yasa dışı faaliyetler, dolandırıcılık, taciz, kişilik haklarının ihlali, yanıltıcı davranışlar veya üçüncü kişilerin haklarına zarar verme amacıyla kullanılamaz. Şüpheli veya kötüye kullanım niteliğindeki siparişler incelenebilir ve hizmet sunumu durdurulabilir.</p>
      </InfoSection>
      <InfoSection title="Değişiklikler ve destek">
        <p>Hizmet kapsamı, aktif paketler ve fiyatlar sipariş öncesinde sitede gösterilir ve zaman içinde değişebilir. Mevcut bir siparişle ilgili soru veya itirazlar, sipariş numarası belirtilerek Canlı Destek üzerinden iletilebilir.</p>
      </InfoSection>
    </InfoPage>
  );
}

import { InfoList, InfoPage, InfoSection } from "@/components/legal/InfoPage";
import { createPublicMetadata } from "@/lib/public-metadata";

export const metadata = createPublicMetadata({
  title: "Gizlilik Politikası",
  description: "Sosyalio hizmetlerinde işlenen veriler, kullanım amaçları, ödeme ve canlı destek süreçleri hakkında gizlilik bilgileri.",
  path: "/gizlilik",
});

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Gizlilik" title="Gizlilik Politikası" intro="Bu politika, Sosyalio hizmetleri kullanılırken hangi bilgilerin hangi amaçlarla işlendiğini anlaşılır biçimde açıklar.">
      <InfoSection title="İşlenen bilgiler">
        <InfoList items={[
          "Sipariş numarası, seçilen platform, hizmet, paket, miktar, fiyat ve sipariş durumu.",
          "Siparişin iletilmesi ve sorgulanması için kullanılan e-posta adresi.",
          "Hizmetin yönlendirileceği sosyal medya kullanıcı adı, profil veya içerik bağlantısı.",
          "Canlı destek görüşmelerinde paylaştığınız ad, mesajlar ve görüşme zamanları.",
          "Güvenlik, hata tespiti ve kötüye kullanımı önleme amacıyla gerekli teknik istek, oturum, çerez ve bağlantı bilgileri.",
        ]} />
      </InfoSection>
      <InfoSection title="Kullanım amaçları">
        <InfoList items={[
          "Siparişin oluşturulması, doğru hizmete yönlendirilmesi ve durumunun takip edilmesi.",
          "Ödeme sonucunun doğrulanması ve siparişle eşleştirilmesi.",
          "Destek taleplerinin yanıtlanması ve hizmet sorunlarının incelenmesi.",
          "Sistem güvenliğinin sağlanması, spam, kötüye kullanım ve yetkisiz erişimin önlenmesi.",
          "Teknik arızaların giderilmesi ve yasal yükümlülüklerin yerine getirilmesi.",
        ]} />
      </InfoSection>
      <InfoSection title="Ödeme bilgileri">
        <p>Ödeme özelliği etkinleştirildiğinde ödeme işlemi Shopier altyapısı üzerinden gerçekleştirilir. Kart numarası, son kullanma tarihi ve güvenlik kodu gibi kart bilgileri Sosyalio tarafından saklanmaz.</p>
        <p>Sosyalio; ödeme sağlayıcısı, işlem referansı, ödeme durumu, tutar, para birimi ve doğrulama zamanı gibi siparişle eşleştirilmesi gereken ödeme kayıtlarını işleyebilir.</p>
      </InfoSection>
      <InfoSection title="Çerezler, teknik kayıtlar ve paylaşım">
        <p>Oturumun güvenli yürütülmesi, canlı destek görüşmesinin tanınması ve temel site işlevlerinin çalışması için zorunlu çerezler kullanılabilir. Mevcut sistemde reklam profillemesi veya davranışsal reklam amacıyla bir kullanım beyan edilmemektedir.</p>
        <p>Bilgiler; hizmetin sunulması için gerekli olduğu ölçüde ödeme sağlayıcısı Shopier, barındırma/veritabanı altyapısı sağlayıcıları ve hukuken yetkili mercilerle paylaşılabilir.</p>
      </InfoSection>
      <InfoSection title="Saklama ve güvenlik">
        <p>Bilgiler hizmetin sunulması, uyuşmazlıkların çözümü, güvenlik ve yasal yükümlülükler için gerekli süre boyunca saklanır; gereklilik sona erdiğinde silinir, anonimleştirilir veya erişimi sınırlandırılır. Yetkisiz erişimi azaltmak için oturum koruması, erişim kontrolü ve sunucu tarafı doğrulamalar kullanılır.</p>
      </InfoSection>
    </InfoPage>
  );
}

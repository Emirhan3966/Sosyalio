import { DraftNotice, InfoList, InfoPage, InfoSection } from "@/components/legal/InfoPage";
import { createPublicMetadata } from "@/lib/public-metadata";

export const metadata = createPublicMetadata({
  title: "KVKK Aydınlatma Metni",
  description: "Sosyalio kapsamında kişisel verilerin işlenmesine ilişkin KVKK aydınlatma taslağı.",
  path: "/kvkk",
});

// HUKUKİ TASLAK: Veri sorumlusu bilgileri tamamlandıktan sonra hukuk danışmanı tarafından incelenmelidir.
export default function KvkkPage() {
  const controllerName = process.env.LEGAL_DATA_CONTROLLER_NAME?.trim();
  const controllerContact = process.env.LEGAL_DATA_CONTROLLER_CONTACT?.trim();

  return (
    <InfoPage eyebrow="KVKK" title="Kişisel Verilerin Korunması Aydınlatma Metni" intro="Bu sayfa, Sosyalio hizmetleri kapsamında işlenen kişisel verilere ilişkin genel aydınlatma taslağıdır.">
      {!controllerName || !controllerContact ? <DraftNotice>Önemli: Veri sorumlusunun doğrulanmış yasal unvanı ve resmi başvuru iletişim bilgisi henüz yapılandırılmamıştır. Bu alanlar tamamlanıp hukuki inceleme yapılmadan metin nihai aydınlatma metni olarak değerlendirilmemelidir.</DraftNotice> : null}
      <InfoSection title="Veri sorumlusu">
        <p>{controllerName ? <><strong>Veri sorumlusu:</strong> {controllerName}</> : "Veri sorumlusu yasal unvanı yapılandırma aşamasındadır."}</p>
        <p>{controllerContact ? <><strong>Başvuru kanalı:</strong> {controllerContact}</> : "Resmi KVKK başvuru kanalı yapılandırma aşamasındadır. Genel hizmet soruları için site içi Canlı Destek kullanılabilir."}</p>
      </InfoSection>
      <InfoSection title="İşlenen kişisel veri grupları">
        <InfoList items={[
          "Kimlik/iletişim kapsamında ad ve e-posta bilgileri.",
          "Sipariş, paket, tutar, ödeme durumu ve işlem referansı gibi müşteri işlem bilgileri.",
          "Hizmetin yöneltileceği sosyal medya kullanıcı adı, profil veya içerik bağlantısı.",
          "Canlı destek mesajları ve talep geçmişi.",
          "IP bağlantısı, güvenlik kaydı, zorunlu çerez ve oturum bilgileri gibi işlem güvenliği verileri.",
        ]} />
      </InfoSection>
      <InfoSection title="İşleme amaçları ve hukuki sebepler">
        <p>Veriler; sipariş ve sözleşme süreçlerinin yürütülmesi, ödeme durumunun doğrulanması, destek hizmetlerinin sunulması, bilgi güvenliğinin sağlanması, kötüye kullanımın önlenmesi ve hukuki yükümlülüklerin yerine getirilmesi amaçlarıyla işlenebilir.</p>
        <p>İşleme faaliyetine göre sözleşmenin kurulması veya ifası, hukuki yükümlülük, bir hakkın tesisi/kullanılması/korunması ve temel haklara zarar vermemek kaydıyla meşru menfaat hukuki sebeplerine dayanılabilir. Açık rıza gereken ayrı bir faaliyet oluşursa ayrıca talep edilmelidir.</p>
      </InfoSection>
      <InfoSection title="Aktarım ve toplama yöntemi">
        <p>Veriler site formları, sipariş ve destek ekranları ile teknik sistem kayıtları üzerinden elektronik ortamda toplanır. Hizmetin yürütülmesi için gerekli olduğu ölçüde Shopier, barındırma ve veritabanı altyapısı sağlayıcılarıyla; ayrıca hukuken yetkili kurumlarla paylaşılabilir.</p>
      </InfoSection>
      <InfoSection title="İlgili kişinin hakları">
        <p>KVKK’nın 11. maddesi kapsamındaki şartlar çerçevesinde kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, düzeltme, silme veya yok etme talep etme ve kanuna aykırı işlem nedeniyle zararın giderilmesini isteme haklarınız bulunabilir.</p>
        <p>Resmi başvuru kanalı yukarıdaki veri sorumlusu bilgileriyle birlikte yayımlanacaktır. Başvuruların kimlik doğrulamasına elverişli ve talebi açıkça belirten biçimde yapılması gerekir.</p>
      </InfoSection>
    </InfoPage>
  );
}

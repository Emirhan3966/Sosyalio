import { InfoPage, InfoSection } from "@/components/legal/InfoPage";
import { createPublicMetadata } from "@/lib/public-metadata";

export const metadata = createPublicMetadata({
  title: "İptal ve İade Politikası",
  description: "Sosyalio dijital hizmetlerinde iptal, iade, yanlış hedef bilgisi, teknik hata ve destek talebi süreçleri.",
  path: "/iptal-iade",
});

export default function RefundPage() {
  return (
    <InfoPage eyebrow="Sipariş Yardımı" title="İptal ve İade Politikası" intro="Dijital hizmet siparişlerinde talebin hangi aşamada olduğuna göre izlenecek genel inceleme yaklaşımı.">
      <InfoSection title="Hizmet başlamadan önce">
        <p>Sipariş henüz işleme alınmadıysa iptal talebi Canlı Destek üzerinden sipariş numarasıyla iletilebilir. Talep, siparişin ve ödeme kaydının durumu kontrol edilerek değerlendirilir.</p>
      </InfoSection>
      <InfoSection title="Hizmet işleme başladıktan sonra">
        <p>Dijital hizmetin ifasına başlanmış olması, tamamlanan bölüm ve geri döndürülebilirlik değerlendirmesinde dikkate alınır. Her talep somut siparişin durumu ve yürürlükteki tüketici mevzuatından doğan haklar çerçevesinde incelenir.</p>
      </InfoSection>
      <InfoSection title="Yanlış hedef bilgisi">
        <p>Kullanıcının yanlış kullanıcı adı veya bağlantı ilettiği fark edilirse mümkün olan en kısa sürede destek talebi açılmalıdır. İşlem başlamadan önce düzeltme yapılabilir; işlem başladıktan sonra teslim edilen kısmın geri alınması veya hedefin değiştirilmesi teknik olarak mümkün olmayabilir.</p>
      </InfoSection>
      <InfoSection title="Hizmetin sağlanamaması">
        <p>Hizmetin Sosyalio kaynaklı bir nedenle hiç sağlanamaması durumunda yeniden ifa, eşdeğer çözüm veya uygun iade seçeneği sipariş özelinde değerlendirilir. Platform kısıtlamaları veya hedef hesabın erişilemez olması gibi durumlarda kullanıcıyla çözüm için iletişim kurulur.</p>
      </InfoSection>
      <InfoSection title="Mükerrer ödeme ve teknik hata">
        <p>Aynı sipariş için mükerrer tahsilat veya doğrulanabilir bir ödeme hatası oluştuysa ödeme kayıtları incelenir ve hatalı tahsilat için uygun düzeltme/iade süreci başlatılır. Kart bilgileri Sosyalio tarafından tutulmadığından ödeme sağlayıcısının işlem süresi uygulanabilir.</p>
      </InfoSection>
      <InfoSection title="Talep nasıl iletilir?">
        <p>Sayfanın sağ altındaki Canlı Destek kanalından sipariş numaranızı ve talebinizin nedenini paylaşın. Parola veya kart bilgisi göndermeyin. İnceleme sırasında sipariş, ödeme ve hizmetin operasyonel durumu birlikte kontrol edilir.</p>
        <p>Bu politika, tüketicinin emredici mevzuattan doğan haklarını ortadan kaldırmayı veya sınırlandırmayı amaçlamaz.</p>
      </InfoSection>
    </InfoPage>
  );
}

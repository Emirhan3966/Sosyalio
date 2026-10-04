import Link from "next/link";
import { Headphones, Search, Shield } from "@/components/Icons";
import { InfoPage, InfoSection } from "@/components/legal/InfoPage";
import { createPublicMetadata } from "@/lib/public-metadata";

export const metadata = createPublicMetadata({
  title: "İletişim",
  description: "Sosyalio siparişleri ve hizmetleri için canlı destek üzerinden iletişim kurun.",
  path: "/iletisim",
});

export default function ContactPage() {
  return (
    <InfoPage eyebrow="Yardım Merkezi" title="Sosyalio ile iletişime geçin" intro="Sipariş öncesi sorularınız ve mevcut siparişleriniz için site içindeki Canlı Destek kanalını kullanabilirsiniz.">
      <div className="grid gap-5 md:grid-cols-2">
        <InfoSection title="Canlı Destek">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Headphones className="h-5 w-5" /></span>
          <p>Sayfanın sağ alt köşesindeki <strong>Canlı Destek</strong> düğmesini açarak ekibimize mesaj bırakabilirsiniz.</p>
          <p>Siparişiniz varsa sipariş numaranızı paylaşmanız, talebinizi daha hızlı incelememize yardımcı olur. Parolanızı veya kart bilginizi paylaşmayın.</p>
        </InfoSection>
        <InfoSection title="Sipariş takibi">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Search className="h-5 w-5" /></span>
          <p>Sipariş ve ödeme durumunu, sipariş numarası ile siparişte kullanılan e-posta adresini girerek kontrol edebilirsiniz.</p>
          <Link href="/#sorgula" className="btn-secondary mt-2">Sipariş Sorgula</Link>
        </InfoSection>
      </div>
      <InfoSection title="Güvenli iletişim">
        <p className="flex gap-3"><Shield className="mt-1 h-5 w-5 shrink-0 text-violet-600" />Sosyalio destek görüşmelerinde sosyal medya hesabınızın parolasını veya ödeme kartı bilgilerinizi istemez. Projede doğrulanmış bir destek e-posta adresi, telefon veya fiziksel adres yapılandırılmadığı için bu sayfada böyle bir bilgi yayımlanmamaktadır.</p>
      </InfoSection>
    </InfoPage>
  );
}

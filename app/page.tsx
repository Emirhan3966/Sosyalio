import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { OrderLookup } from "@/components/OrderLookup";
import { PlatformCatalog } from "@/components/storefront/PlatformCatalog";
import { SectionHeading } from "@/components/SectionHeading";
import { ArrowRight, Check, ChevronDown, Headphones, Lock, PackageIcon, Search, Shield } from "@/components/Icons";
import { prisma } from "@/lib/prisma";

const homeTitle = "Sosyalio — Sosyal Medya Hizmetleri Pazaryeri";
const homeDescription = "Instagram, TikTok, YouTube, X ve diğer platformlar için düzenli, takip edilebilir sosyal medya hizmetleri kataloğu.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: { title: homeTitle, description: homeDescription, url: "/", siteName: "Sosyalio", locale: "tr_TR", type: "website", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Sosyalio" }] },
  twitter: { card: "summary_large_image", title: homeTitle, description: homeDescription, images: ["/twitter-image"] },
};

const faqs = [
  ["Şifremi vermem gerekiyor mu?", "Hayır. Hizmetler için sosyal medya hesabınızın şifresini istemiyoruz; yalnızca gerekli profil veya içerik bağlantısını kullanıyoruz."],
  ["Siparişimi nasıl takip ederim?", "Sipariş numaranız ve siparişte kullandığınız e-posta adresiyle Sipariş Sorgula alanından güncel durumu görüntüleyebilirsiniz."],
  ["Sipariş ne zaman başlar?", "Başlangıç ve teslimat süresi seçtiğiniz pakete göre değişebilir. Varsa tahmini süreyi paket kartında görebilirsiniz."],
  ["Yanlış kullanıcı adı girersem ne olur?", "Sipariş işleme alınmadan önce destek üzerinden bizimle iletişime geçin. İşlem başladıktan sonra hedef bilgisi değiştirilemeyebilir."],
  ["Ödeme güvenli mi?", "Ödeme durumu, ödeme sağlayıcısından gelen doğrulanmış bildirimle sunucu tarafında kontrol edilir."],
  ["Siparişim tamamlanmazsa ne yapmalıyım?", "Sipariş numaranızla durumunuzu kontrol edin ve destek alanından sipariş bilginizi paylaşarak yardım isteyin."],
] as const;

function HeroMascot() {
  return (
    <div className="relative mx-auto min-h-[350px] w-full max-w-[520px] sm:min-h-[470px] lg:min-h-[560px]">
      <div className="absolute inset-x-[12%] bottom-[4%] top-[12%] z-0 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="absolute inset-x-[18%] bottom-[2%] z-0 h-16 rounded-[50%] bg-slate-950/60 blur-2xl" />
      <Image
        src="/brand/hero-mascot.png"
        alt="Sosyal medya platformlarını yöneten Sosyalio maskotu"
        width={1086}
        height={1448}
        priority
        unoptimized
        sizes="(max-width: 640px) 330px, (max-width: 1024px) 430px, 520px"
        className="mascot-enter absolute bottom-0 left-1/2 z-10 h-[350px] w-auto max-w-none -translate-x-1/2 object-contain drop-shadow-[0_28px_35px_rgba(3,7,18,.34)] sm:h-[470px] lg:h-[560px]"
      />
      <div className="mascot-float absolute -left-[3%] top-[1%] z-20 hidden items-center gap-2.5 whitespace-nowrap rounded-2xl border border-white/70 bg-white/95 px-3.5 py-3 text-slate-800 shadow-[0_16px_38px_rgba(15,23,42,.18)] backdrop-blur sm:flex lg:-left-[12%] lg:top-[3%]">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600"><Lock className="h-4 w-4" /></span>
        <div><p className="text-xs font-extrabold">Şifre Gerekmez</p><p className="mt-0.5 text-[10px] text-slate-500">Güvenli sipariş akışı</p></div>
      </div>
      <div className="mascot-float-delayed absolute -right-[10%] top-[4%] z-20 hidden items-center gap-2.5 whitespace-nowrap rounded-2xl border border-white/70 bg-white/95 px-3.5 py-3 text-slate-800 shadow-[0_16px_38px_rgba(15,23,42,.18)] backdrop-blur lg:flex">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Shield className="h-4 w-4" /></span>
        <div><p className="text-xs font-extrabold">Güvenli Ödeme</p><p className="mt-0.5 text-[10px] text-slate-500">Sunucu doğrulamalı</p></div>
      </div>
      <div className="mascot-float-slow absolute bottom-[8%] left-0 z-20 flex items-center gap-2.5 whitespace-nowrap rounded-2xl border border-white/70 bg-white/95 px-3 py-2.5 text-slate-800 shadow-[0_16px_38px_rgba(15,23,42,.18)] backdrop-blur sm:-left-[4%] sm:px-3.5 sm:py-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Search className="h-4 w-4" /></span>
        <div><p className="text-xs font-extrabold">Sipariş Takibi</p><p className="mt-0.5 hidden text-[10px] text-slate-500 sm:block">Durumunu kolayca izle</p></div>
      </div>
      <div className="absolute bottom-[1%] right-[4%] z-20 hidden rounded-full border border-white/10 bg-slate-950/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-slate-300 backdrop-blur sm:block">
        7/24 Sipariş
      </div>
    </div>
  );
}

const trustItems = [[Lock, "Şifre Gerekmez", "Hizmetler için hesap şifresi istemiyoruz."], [Shield, "Güvenli Ödeme", "Ödeme durumu sunucu tarafında doğrulanır."], [Search, "Sipariş Takibi", "Sipariş numaranızla durumunuzu takip edin."], [Headphones, "Destek", "Sipariş sürecinde destek alabilirsiniz."]] as const;
const whyUsItems = [[PackageIcon, "Açık fiyatlandırma", "Paket fiyatlarını ödeme öncesinde net olarak görürsünüz."], [Lock, "Şifre gerektirmez", "Sipariş için yalnızca gerekli profil veya içerik bağlantısını girersiniz."], [Search, "Sipariş takibi", "Sipariş numaranızla durumunuzu kontrol edebilirsiniz."], [Shield, "Güvenli ödeme altyapısı", "Ödeme sonucu istemci tarafına güvenilmeden sunucuda doğrulanır."]] as const;

export const dynamic = "force-dynamic";

export default async function Home() {
  const platformRows = await prisma.servicePlatform.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" }, include: { _count: { select: { services: { where: { isActive: true } } } } } });
  const platforms = platformRows.map((item) => ({ id: item.id, name: item.name, slug: item.slug, description: item.description, serviceCount: item._count.services }));

  return <main className="overflow-hidden">
    <Header />
    <section id="anasayfa" className="noise relative overflow-hidden border-b border-slate-800 bg-[#0b1120] pb-10 pt-10 sm:pb-14 sm:pt-14 lg:pb-16 lg:pt-16"><div className="hero-grid hero-grid-dark absolute inset-0" /><div className="absolute -left-28 top-4 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" /><div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" /><div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#111827]/55" /><div className="container-shell relative grid items-center gap-7 lg:grid-cols-[1.08fr_.92fr] lg:gap-10"><div className="text-center lg:text-left"><span className="eyebrow border-white/10 bg-white/[.06] text-violet-200"><span className="h-2 w-2 rounded-full bg-emerald-400" />Sosyal medya hizmetleri</span><h1 className="mx-auto mt-6 max-w-[720px] text-[40px] font-extrabold leading-[1.08] tracking-[-0.045em] text-white sm:text-[54px] lg:mx-0 lg:text-[62px]">Sosyal medyada gücünü <span className="hero-gradient-text">planlı büyüt.</span></h1><p className="mx-auto mt-6 max-w-[600px] text-base leading-7 text-slate-300 sm:text-lg sm:leading-8 lg:mx-0">Platformunu seç, hizmet ve paketleri karşılaştır; siparişini şifre paylaşmadan, takip edilebilir bir akışla oluştur.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"><Link href="/#hizmetler" className="btn-primary">Hizmetleri İncele <ArrowRight className="h-4 w-4" /></Link><Link href="/#sorgula" className="btn-secondary border-white/15 bg-white/[.06] text-white hover:border-white/25 hover:bg-white/10">Sipariş Sorgula</Link></div></div><HeroMascot /></div></section>

    <section aria-label="Güven özellikleri" className="border-b border-slate-200 bg-gradient-to-b from-[#eef1f8] to-white"><div className="container-shell grid sm:grid-cols-2 lg:grid-cols-4">{trustItems.map(([icon, title, text], index) => { const Icon = icon; return <article key={title} className={`flex min-h-[108px] gap-3.5 py-6 sm:px-5 ${index > 0 ? "border-t border-slate-200/70" : ""} ${index % 2 === 1 ? "sm:border-l" : ""} ${index >= 2 ? "sm:border-t" : "sm:border-t-0"} ${index > 0 ? "lg:border-l lg:border-t-0" : "lg:border-0"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-violet-100 bg-white text-violet-600 shadow-sm"><Icon className="h-5 w-5" /></span><div><h2 className="text-sm font-extrabold">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div></article>; })}</div></section>

    <section id="hizmetler" className="relative overflow-hidden bg-gradient-to-b from-white via-[#f8f9fd] to-[#f5f6fb] py-16 sm:py-20 lg:py-20"><div className="pointer-events-none absolute -right-40 top-16 h-96 w-96 rounded-full bg-violet-200/20 blur-3xl" /><div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-blue-100/30 blur-3xl" /><div className="container-shell relative"><SectionHeading eyebrow="Sosyal Medya Hizmetleri" title={<>Tüm platformlar, <span className="gradient-text">tek düzenli katalog</span></>} description="Platformunu seç, ihtiyacın olan hizmeti bul ve paketini oluştur." /><PlatformCatalog platforms={platforms} /></div></section>

    <section id="nasil-calisir" className="py-14 sm:py-16 lg:py-20"><div className="container-shell"><SectionHeading eyebrow="Nasıl Çalışır?" title={<>Siparişini <span className="gradient-text">3 adımda</span> tamamla</>} description="İhtiyacına uygun hizmeti seç ve sipariş bilgilerini tamamla." /><div className="mt-9 grid gap-4 md:grid-cols-3">{[[Search, "Hizmeti seç", "Platform kataloğundan ihtiyacına uygun hizmeti bul."], [PackageIcon, "Paketini belirle", "Miktar, fiyat ve paket bilgilerini karşılaştır."], [Check, "Siparişini tamamla", "Gerekli bağlantıyı gir ve ödeme adımına ilerle."]].map(([icon, title, text], index) => { const Icon = icon as typeof Search; return <article key={String(title)} className="relative rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(30,36,70,.05)]"><span className="absolute right-5 top-5 text-3xl font-extrabold tracking-[-.06em] text-slate-100">0{index + 1}</span><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-lg font-extrabold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-muted">{String(text)}</p></article>; })}</div><div className="mx-auto mt-6 grid max-w-3xl gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:grid-cols-3">{[[Lock, "Şifre Gerekmez"], [Shield, "Güvenli Ödeme"], [Search, "Sipariş Takibi"]].map(([icon, label]) => { const Icon = icon as typeof Lock; return <span key={String(label)} className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-600 shadow-sm"><Icon className="h-4 w-4 text-violet-600" />{String(label)}</span>; })}</div></div></section>

    <section className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-br from-[#f7f8fc] via-[#fafaff] to-violet-50/50 py-16 sm:py-20 lg:py-20"><div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[720px] -translate-x-1/2 rounded-full bg-violet-100/30 blur-3xl" /><div className="container-shell relative"><SectionHeading eyebrow="Neden Sosyalio?" title="Neden bizi tercih etmelisiniz?" description="Sipariş öncesinden ödeme doğrulamasına kadar açık ve takip edilebilir bir deneyim." /><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{whyUsItems.map(([icon, title, text]) => { const Icon = icon; return <article key={title} className="rounded-[22px] border border-slate-200 bg-white/90 p-6 shadow-[0_8px_28px_rgba(30,36,70,.035)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_30px_rgba(30,36,70,.06)]"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600"><Icon className="h-5 w-5" /></span><h3 className="mt-5 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></article>; })}</div></div></section>

    <section id="sorgula" className="py-16 sm:py-20 lg:py-24"><div className="container-shell"><div className="grid items-center gap-9 rounded-[28px] border border-slate-200 bg-[#fafaff] p-6 sm:p-9 lg:grid-cols-2 lg:p-12"><div><span className="eyebrow"><Search className="h-4 w-4" />Sipariş Takibi</span><h2 className="section-title mt-5">Siparişin hangi aşamada?</h2><p className="mt-4 max-w-lg leading-7 text-muted">Sipariş numaranı ve e-posta adresini girerek sipariş ve ödeme durumunu görüntüle.</p></div><OrderLookup /></div></div></section>

    <section id="sss" className="border-t border-slate-200 bg-[#f8f9fc] py-16 sm:py-20 lg:py-24"><div className="container-shell grid gap-10 lg:grid-cols-[.72fr_1fr] lg:gap-20"><div><SectionHeading align="left" eyebrow="Yardım" title={<>Sıkça sorulan <span className="gradient-text">sorular</span></>} description="Sipariş ve ödeme süreciyle ilgili temel bilgiler." /></div><div className="space-y-3">{faqs.map(([question, answer], index) => <details key={question} open={index === 0} className="group rounded-2xl border border-slate-200 bg-white px-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-extrabold sm:text-base">{question}<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600 transition group-open:rotate-180"><ChevronDown className="h-4 w-4" /></span></summary><p className="pb-5 pr-8 text-sm leading-6 text-muted">{answer}</p></details>)}</div></div></section>

  </main>;
}

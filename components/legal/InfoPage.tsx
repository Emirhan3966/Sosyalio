import { Header } from "@/components/Header";

export function InfoPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f8fc]">
      <Header />
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-12 sm:py-16">
        <div className="hero-grid absolute inset-0" />
        <div className="container-shell relative">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-.045em] text-ink sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">{intro}</p>
        </div>
      </section>
      <section className="py-10 sm:py-14">
        <article className="container-shell"><div className="mx-auto max-w-4xl space-y-5">{children}</div></article>
      </section>
    </main>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(30,36,70,.04)] sm:p-8">
      <h2 className="text-xl font-black tracking-[-.02em] text-ink sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 sm:text-[15px]">{children}</div>
    </section>
  );
}

export function InfoList({ items }: { items: readonly string[] }) {
  return <ul className="space-y-2 pl-5">{items.map((item) => <li key={item} className="list-disc pl-1 marker:text-violet-500">{item}</li>)}</ul>;
}

export function DraftNotice({ children }: { children: React.ReactNode }) {
  return <aside className="rounded-[20px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold leading-6 text-amber-900">{children}</aside>;
}

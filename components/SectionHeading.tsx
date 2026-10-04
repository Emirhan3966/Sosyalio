import { Sparkles } from "./Icons";

export function SectionHeading({ eyebrow, title, description, align = "center" }: { eyebrow: string; title: React.ReactNode; description: string; align?: "left" | "center" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="eyebrow"><Sparkles className="h-4 w-4" />{eyebrow}</span>
      <h2 className="section-title mt-5">{title}</h2>
      <p className="mt-4 text-base leading-7 text-muted sm:text-lg">{description}</p>
    </div>
  );
}

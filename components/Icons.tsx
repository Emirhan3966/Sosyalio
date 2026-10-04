import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const brandBase = { ...base, width: 24, height: 24, strokeWidth: 2.35, role: "img" };
const solidBrandBase = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "currentColor", stroke: "none", role: "img" };

export function ArrowRight(props: IconProps) { return <svg {...base} {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
export function ChevronDown(props: IconProps) { return <svg {...base} {...props}><path d="m7 10 5 5 5-5" /></svg>; }
export function Check(props: IconProps) { return <svg {...base} {...props}><path d="m5 12 4 4L19 6" /></svg>; }
export function Bolt(props: IconProps) { return <svg {...base} {...props}><path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" /></svg>; }
export function Shield(props: IconProps) { return <svg {...base} {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>; }
export function Users(props: IconProps) { return <svg {...base} {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
export function Search(props: IconProps) { return <svg {...base} {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
export function Instagram(props: IconProps) { return <svg {...brandBase} aria-label="Instagram" {...props}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>; }
export function TikTok(props: IconProps) { return <svg {...solidBrandBase} aria-label="TikTok" {...props}><path d="M13.2 2h3.45c.28 2.27 1.62 3.65 4.15 4.02v3.3a8.2 8.2 0 0 1-4.15-1.18v7.08A6.78 6.78 0 1 1 10.7 8.5v3.48a3.43 3.43 0 1 0 2.5 3.24V2Z" /></svg>; }
export function Youtube(props: IconProps) { return <svg {...brandBase} aria-label="YouTube" {...props}><path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.5 12 4.5 12 4.5s-5.7 0-7.5.6a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.6 7.5.6 7.5.6s5.7 0 7.5-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8Z" /><path d="m10 15 5-3-5-3v6Z" /></svg>; }
export function XIcon(props: IconProps) { return <svg {...brandBase} aria-label="X" {...props}><path d="M4 4l16 16M20 4 4 20" /></svg>; }
export function Lock(props: IconProps) { return <svg {...base} {...props}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>; }
export function Headphones(props: IconProps) { return <svg {...base} {...props}><path d="M4 14a8 8 0 0 1 16 0M18 19c0 1.1-.9 2-2 2h-3" /><path d="M4 14v4a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 1ZM20 14v4a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 1Z" /></svg>; }
export function Star(props: IconProps) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="m12 2.8 2.8 5.7 6.3.9-4.5 4.4 1 6.2-5.6-3-5.6 3 1-6.2-4.5-4.4 6.3-.9L12 2.8Z" /></svg>; }
export function Menu(props: IconProps) { return <svg {...base} {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>; }
export function Sparkles(props: IconProps) { return <svg {...base} {...props}><path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4L12 3ZM5 15l-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8L5 15ZM19 13l-.6 1.4L17 15l1.4.6L19 17l.6-1.4L21 15l-1.4-.6L19 13Z" /></svg>; }
export function HomeIcon(props: IconProps) { return <svg {...base} {...props}><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></svg>; }
export function OrdersIcon(props: IconProps) { return <svg {...base} {...props}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3V1h6v2M9 8h6M9 12h6M9 16h4" /></svg>; }
export function BoxesIcon(props: IconProps) { return <svg {...base} {...props}><path d="m12 2 8 4-8 4-8-4 8-4Z" /><path d="m4 10 8 4 8-4M4 14l8 4 8-4" /></svg>; }
export function LogOut(props: IconProps) { return <svg {...base} {...props}><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></svg>; }
export function Mail(props: IconProps) { return <svg {...base} {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>; }
export function Calendar(props: IconProps) { return <svg {...base} {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>; }
export function ExternalLink(props: IconProps) { return <svg {...base} {...props}><path d="M14 3h7v7M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>; }
export function Plus(props: IconProps) { return <svg {...base} {...props}><path d="M12 5v14M5 12h14" /></svg>; }
export function Save(props: IconProps) { return <svg {...base} {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>; }
export function Facebook(props: IconProps) { return <svg {...solidBrandBase} aria-label="Facebook" {...props}><path d="M14.05 22v-8.3h2.8l.42-3.24h-3.22V8.39c0-.94.26-1.58 1.61-1.58h1.72v-2.9c-.3-.04-1.32-.13-2.52-.13-2.49 0-4.2 1.52-4.2 4.32v2.36H7.84v3.24h2.82V22h3.39Z" /></svg>; }
export function Spotify(props: IconProps) { return <svg {...brandBase} aria-label="Spotify" strokeWidth="2.8" {...props}><circle cx="12" cy="12" r="9.25" /><path d="M6.8 9.1c3.9-1.15 8.25-.68 11.45 1.05M7.65 13c3.25-.82 6.75-.46 9.35.91M8.55 16.45c2.5-.55 5.15-.27 7.2.78" /></svg>; }
export function Telegram(props: IconProps) { return <svg {...solidBrandBase} aria-label="Telegram" {...props}><path d="M21.55 3.2 18.4 20.55c-.24 1.22-.88 1.52-1.79.95l-4.8-3.54-2.32 2.23c-.25.26-.47.47-.96.47l.34-4.89 8.9-8.04c.39-.34-.08-.53-.6-.19L6.18 14.46l-4.73-1.48c-1.03-.32-1.05-1.03.21-1.52L20.17 4.3c.86-.32 1.61.19 1.38-1.1Z" /></svg>; }
export function Discord(props: IconProps) { return <svg {...solidBrandBase} aria-label="Discord" {...props}><path fillRule="evenodd" d="M19.3 5.34A17.2 17.2 0 0 0 15.2 4l-.52 1.08a15.7 15.7 0 0 0-5.34 0L8.8 4A17 17 0 0 0 4.7 5.35C2.1 9.2 1.4 12.95 1.75 16.65a16.7 16.7 0 0 0 5.03 2.55l1.22-1.67c-.67-.25-1.32-.56-1.92-.92l.47-.36c3.7 1.71 7.72 1.71 11.38 0l.47.36c-.61.36-1.26.67-1.93.92l1.22 1.67a16.7 16.7 0 0 0 5.03-2.55c.42-4.29-.72-8-3.42-11.31ZM8.75 14.5c-1.12 0-2.04-1.03-2.04-2.3 0-1.27.9-2.3 2.04-2.3 1.15 0 2.06 1.04 2.04 2.3 0 1.27-.9 2.3-2.04 2.3Zm6.5 0c-1.12 0-2.04-1.03-2.04-2.3 0-1.27.9-2.3 2.04-2.3 1.15 0 2.06 1.04 2.04 2.3 0 1.27-.89 2.3-2.04 2.3Z" /></svg>; }
export function Twitch(props: IconProps) { return <svg {...solidBrandBase} aria-label="Twitch" {...props}><path fillRule="evenodd" d="M3 2h19v13.2L16.8 20h-4.05L10 22.75V20H5V5L3 2Zm5 3v11h4v2l2-2h3.8l2.2-2.1V5H8Zm3 3h2v5h-2V8Zm5 0h2v5h-2V8Z" /></svg>; }
export function Linkedin(props: IconProps) { return <svg {...solidBrandBase} aria-label="LinkedIn" {...props}><path d="M5.34 3.5A2.34 2.34 0 1 1 5.33 8.2a2.34 2.34 0 0 1 .01-4.69ZM3.3 9.85h4.08V22H3.3V9.85Zm6.5 0h3.92v1.66h.06c.54-1.04 1.88-2.14 3.87-2.14 4.14 0 4.9 2.73 4.9 6.27V22h-4.08v-5.64c0-1.35-.02-3.08-1.88-3.08-1.88 0-2.17 1.47-2.17 2.98V22H9.8V9.85Z" /></svg>; }
export function Threads(props: IconProps) { return <svg {...brandBase} aria-label="Threads" strokeWidth="2.8" {...props}><path d="M18.5 8.5C17.2 5.2 14.8 3.5 12 3.5c-4.7 0-7.5 3.6-7.5 8.5s2.8 8.5 7.5 8.5c4.2 0 7-2.3 7-5.5 0-2.8-2.4-4.5-6-4.5-2.6 0-4.5 1.2-4.5 3.2 0 1.7 1.4 2.8 3.3 2.8 3.1 0 4.7-2.4 4.2-5.2-.4-2.2-1.8-3.3-4-3.3" /></svg>; }
export function Pinterest(props: IconProps) { return <svg {...brandBase} aria-label="Pinterest" {...props}><circle cx="12" cy="12" r="9" /><path d="M10 18 12 8c.5-2 4-1.5 3.5 1.5-.5 3-3.5 4-5 2M10 18l-1 3" /></svg>; }
export function Snapchat(props: IconProps) { return <svg {...solidBrandBase} aria-label="Snapchat" {...props}><path d="M12 2.25c-3.06 0-5.2 2.35-5.2 5.73 0 .72.12 1.46.08 2.16-.08.43-.38.6-.75.75-.48.2-1.04.22-1.5.45-.68.34-.4 1.18.08 1.47.71.43 1.59.54 2.07 1.29.37.58.28 1.3.62 1.9.52.9 1.7.83 2.52 1.25.68.35 1.21 1.25 2.08 1.25s1.4-.9 2.08-1.25c.82-.42 2-.35 2.52-1.25.34-.6.25-1.32.62-1.9.48-.75 1.36-.86 2.07-1.29.48-.29.76-1.13.08-1.47-.46-.23-1.02-.25-1.5-.45-.37-.15-.67-.32-.75-.75-.04-.7.08-1.44.08-2.16 0-3.38-2.14-5.73-5.2-5.73Z" /></svg>; }
export function Eye(props: IconProps) { return <svg {...base} {...props}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>; }
export function PackageIcon(props: IconProps) { return <svg {...base} {...props}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></svg>; }
export function MessageCircle(props: IconProps) { return <svg {...base} {...props}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-4-.9L3 21l1.7-4.5A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></svg>; }
export function SendIcon(props: IconProps) { return <svg {...base} {...props}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>; }
export function CloseIcon(props: IconProps) { return <svg {...base} {...props}><path d="m18 6-12 12M6 6l12 12" /></svg>; }

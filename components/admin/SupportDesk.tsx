"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, SendIcon } from "@/components/Icons";
import { safeSupportJson, type SupportApiPayload } from "@/lib/support-client";

type Status = "OPEN" | "CLOSED";
type Message = { id: string; sender: "VISITOR" | "ADMIN" | "SYSTEM"; content: string; createdAt: string; readAt: string | null };
type ConversationListItem = { id: string; visitorName: string; status: Status; lastMessageAt: string; lastMessage: { content: string; sender: Message["sender"] } | null; unreadCount: number };
type ConversationDetail = { id: string; visitorName: string; status: Status; createdAt: string };
type ListPayload = SupportApiPayload & { conversations: ConversationListItem[]; unreadTotal: number };
type DetailPayload = SupportApiPayload & { conversation: ConversationDetail; messages: Message[] };
type ReplyPayload = SupportApiPayload & { message: Message; status: Status };
type StatusPayload = SupportApiPayload & { conversation: { id: string; status: Status } };

const POLL_INTERVAL = 4000;

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Şimdi";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} dk önce`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} sa önce`;
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function messageTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function SupportDesk() {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | Status>("ALL");
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const query = filter === "ALL" ? "" : `?status=${filter}`;
    const response = await fetch(`/api/admin/support/conversations${query}`, { cache: "no-store" });
    if (response.status === 401) { router.replace("/admin/login"); return; }
    const data = await safeSupportJson<ListPayload>(response, "Destek konuşmaları yüklenemedi.");
    setConversations(data.conversations);
    setSelectedId((current) => data.conversations.some((item: ConversationListItem) => item.id === current) ? current : data.conversations[0]?.id ?? null);
    setLoading(false);
  }, [filter, router]);

  const loadDetail = useCallback(async (id: string) => {
    const response = await fetch(`/api/admin/support/conversations/${id}`, { cache: "no-store" });
    if (response.status === 401) { router.replace("/admin/login"); return; }
    const data = await safeSupportJson<DetailPayload>(response, "Konuşma ayrıntıları yüklenemedi.");
    setDetail(data.conversation);
    setMessages(data.messages);
  }, [router]);

  useEffect(() => { const run = () => void loadList().catch((reason) => setError(reason instanceof Error ? reason.message : "Destek konuşmaları yüklenemedi.")); const initial = window.setTimeout(run, 0); const timer = window.setInterval(run, POLL_INTERVAL); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [loadList]);
  useEffect(() => { if (!selectedId) return; const run = () => void loadDetail(selectedId).catch((reason) => setError(reason instanceof Error ? reason.message : "Konuşma ayrıntıları yüklenemedi.")); const initial = window.setTimeout(run, 0); const timer = window.setInterval(run, POLL_INTERVAL); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [selectedId, loadDetail]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    const content = reply.trim();
    if (!content || !selectedId || sending) return;
    setSending(true); setError("");
    try {
      const response = await fetch(`/api/admin/support/conversations/${selectedId}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      await safeSupportJson<ReplyPayload>(response, "Yanıt gönderilemedi. Lütfen tekrar deneyin.");
      setReply("");
      await Promise.all([loadDetail(selectedId), loadList()]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Yanıt gönderilemedi."); }
    finally { setSending(false); }
  }

  async function toggleStatus() {
    if (!detail) return;
    if (detail.status === "CLOSED") return;
    const status: Status = "CLOSED";
    try {
      const response = await fetch(`/api/admin/support/conversations/${detail.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      await safeSupportJson<StatusPayload>(response, "Konuşma durumu güncellenemedi.");
      setDetail({ ...detail, status });
      await loadList();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Konuşma durumu güncellenemedi.");
    }
  }

  return (
    <div>
      <div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-violet-600">Müşteri İletişimi</p><h1 className="mt-2 text-3xl font-black tracking-tight">Canlı Destek</h1><p className="mt-2 text-sm text-muted">Ziyaretçi mesajlarını görüntüleyin ve doğrudan yanıtlayın.</p></div>
      {error && <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</div>}
      <section className="mt-8 grid min-h-[650px] overflow-hidden rounded-[28px] border border-[#e8e4f1] bg-white shadow-card lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-slate-100 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 p-4"><div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">{(["ALL", "OPEN", "CLOSED"] as const).map((value) => <button key={value} type="button" onClick={() => { setFilter(value); setLoading(true); }} className={`rounded-lg px-2 py-2 text-xs font-bold transition ${filter === value ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}>{value === "ALL" ? "Tümü" : value === "OPEN" ? "Açık" : "Kapalı"}</button>)}</div></div>
          <div className="max-h-[310px] overflow-y-auto lg:max-h-[590px]">
            {loading && <p className="p-8 text-center text-sm text-slate-400">Konuşmalar yükleniyor...</p>}
            {!loading && conversations.length === 0 && <div className="p-8 text-center"><MessageCircle className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm text-slate-400">Bu filtrede konuşma yok.</p></div>}
            {conversations.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`block w-full border-b border-slate-100 p-4 text-left transition hover:bg-violet-50/50 ${selectedId === item.id ? "bg-violet-50" : ""}`}><div className="flex items-center justify-between gap-3"><p className={`truncate text-sm ${item.unreadCount ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>{item.visitorName}</p><span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${item.status === "OPEN" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.status === "OPEN" ? "AÇIK" : "KAPALI"}</span></div><p className={`mt-2 truncate text-xs ${item.unreadCount ? "font-semibold text-slate-700" : "text-slate-400"}`}>{item.lastMessage?.content ?? "Henüz mesaj yok"}</p><div className="mt-2 flex items-center justify-between"><span className="text-[10px] text-slate-400">{relativeTime(item.lastMessageAt)}</span>{item.unreadCount > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">{item.unreadCount}</span>}</div></button>)}
          </div>
        </aside>

        <div className="flex min-h-[520px] min-w-0 flex-col">
          {!detail || detail.id !== selectedId ? <div className="grid flex-1 place-items-center p-8 text-center"><div><MessageCircle className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm text-slate-400">Görüntülemek için bir konuşma seçin.</p></div></div> : <>
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><p className="font-extrabold text-slate-800">{detail.visitorName}</p><p className="mt-1 text-xs text-slate-400">Durum: {detail.status === "OPEN" ? "Açık" : "Kapalı — arşiv"} · {messageTime(detail.createdAt)}</p></div>{detail.status === "OPEN" && <button type="button" onClick={toggleStatus} className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100">Konuşmayı Kapat</button>}</header>
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#faf9fd] p-5">
              {messages.map((message) => { const admin = message.sender === "ADMIN"; const system = message.sender === "SYSTEM"; return <div key={message.id} className={`flex ${admin ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${admin ? "rounded-br-md bg-[#6548d8] text-white" : "rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-sm"}`}><p className={`mb-1 text-[10px] font-extrabold uppercase tracking-wider ${admin ? "text-violet-200" : "text-violet-500"}`}>{admin ? "Admin" : system ? "Sistem" : "Ziyaretçi"}</p><p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p><p className={`mt-1.5 text-right text-[10px] ${admin ? "text-violet-200" : "text-slate-400"}`}>{messageTime(message.createdAt)}</p></div></div>; })}
            </div>
            {detail.status === "OPEN" ? <form onSubmit={sendReply} className="border-t border-slate-100 bg-white p-4"><div className="flex items-end gap-2"><textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength={1000} rows={2} placeholder="Yanıtınızı yazın..." className="min-h-12 flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /><button type="submit" disabled={!reply.trim() || sending} className="btn-primary !h-12 !min-h-12 !px-5 disabled:opacity-50"><SendIcon className="h-4 w-4" /><span className="hidden sm:inline">Gönder</span></button></div></form> : <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-center text-xs font-semibold text-slate-500">Bu konuşma arşiv kaydıdır. Yeni ziyaretçi mesajları ayrı bir konuşmada görünür.</div>}
          </>}
        </div>
      </section>
    </div>
  );
}

"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon, MessageCircle, SendIcon } from "@/components/Icons";
import { safeSupportJson, type SupportApiPayload } from "@/lib/support-client";

type Message = { id: string; sender: "VISITOR" | "ADMIN" | "SYSTEM"; content: string; createdAt: string; readAt: string | null };
type Conversation = { id: string; visitorName: string; status: "OPEN" | "CLOSED" };
type ConversationPayload = SupportApiPayload & { conversation: Conversation | null; messages: Message[] };
type MessagesPayload = SupportApiPayload & { status: Conversation["status"]; messages: Message[] };
type MessagePayload = SupportApiPayload & { status: Conversation["status"]; message: Message };

const POLL_INTERVAL = 4000;

function mergeMessages(current: Message[], incoming: Message[]) {
  const byId = new Map(current.filter((item) => !item.id.startsWith("pending-")).map((item) => [item.id, item]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function SupportWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [visitorName, setVisitorName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || conversation || needsName || !loading) return;
    let active = true;
    fetch("/api/support/conversation", { cache: "no-store" })
      .then(async (response) => {
        const data = await safeSupportJson<ConversationPayload>(response, "Canlı desteğe şu anda ulaşılamıyor. Lütfen tekrar deneyin.");
        if (!active) return;
        if (data.conversation) {
          setConversation(data.conversation);
          setMessages(data.messages);
        } else {
          setNeedsName(true);
        }
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Canlı desteğe şu anda ulaşılamıyor. Lütfen tekrar deneyin."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, conversation, needsName, loading]);

  useEffect(() => {
    if (!open || !conversation) return;
    let active = true;
    const poll = async () => {
      const lastMessage = messages.filter((item) => !item.id.startsWith("pending-")).at(-1);
      try {
        const response = await fetch(`/api/support/messages${lastMessage ? `?after=${encodeURIComponent(lastMessage.id)}` : ""}`, { cache: "no-store" });
        const data = await safeSupportJson<MessagesPayload>(response, "Yeni mesajlar şu anda alınamıyor.");
        if (active) {
          setConversation((current) => current ? { ...current, status: data.status } : current);
          if (data.messages.length) setMessages((current) => mergeMessages(current, data.messages));
        }
      } catch { /* A temporary polling failure should not interrupt the chat. */ }
    };
    const timer = window.setInterval(poll, POLL_INTERVAL);
    return () => { active = false; window.clearInterval(timer); };
  }, [open, conversation, messages]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, open]);

  async function startConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = visitorName.trim().replace(/\s+/g, " ");
    if (normalizedName.length < 2 || normalizedName.length > 30) {
      setError("Ad veya kullanıcı adı 2–30 karakter olmalıdır.");
      return;
    }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/support/conversation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorName: normalizedName }) });
      const data = await safeSupportJson<ConversationPayload>(response, "Canlı destek görüşmesi başlatılamadı.");
      if (!data.conversation) throw new Error("Canlı destek görüşmesi başlatılamadı.");
      setConversation(data.conversation);
      setMessages(data.messages);
      setNeedsName(false);
      setVisitorName("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Canlı destek görüşmesi başlatılamadı.");
    } finally { setLoading(false); }
  }

  async function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending || !conversation || conversation.status === "CLOSED") return;
    if (trimmed.length > 1000) { setError("Mesaj en fazla 1000 karakter olabilir."); return; }
    const pendingId = `pending-${Date.now()}`;
    setMessages((current) => [...current, { id: pendingId, sender: "VISITOR", content: trimmed, createdAt: new Date().toISOString(), readAt: null }]);
    setContent(""); setError(""); setSending(true);
    try {
      const response = await fetch("/api/support/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: trimmed }) });
      const data = await safeSupportJson<MessagePayload>(response, "Mesaj gönderilemedi. Lütfen tekrar deneyin.");
      setMessages((current) => mergeMessages(current.filter((item) => item.id !== pendingId), [data.message]));
      setConversation((current) => current ? { ...current, status: data.status } : current);
    } catch (reason) {
      setMessages((current) => current.filter((item) => item.id !== pendingId));
      setContent(trimmed);
      setError(reason instanceof Error ? reason.message : "Mesaj gönderilemedi.");
    } finally { setSending(false); }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  }

  function toggleWidget() {
    if (!open && conversation?.status === "CLOSED") {
      setConversation(null); setMessages([]); setVisitorName(""); setNeedsName(true); setError(""); setLoading(false);
    } else if (!open && !conversation && !needsName) {
      setLoading(true); setError("");
    }
    setOpen((value) => !value);
  }

  if (pathname.startsWith("/admin")) return null;

  return <div className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6">
    {open && <section aria-label="Canlı destek" className="fixed bottom-[84px] left-3 right-3 flex h-[min(560px,calc(100dvh-108px))] flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_22px_70px_rgba(35,29,82,.2)] animate-[support-in_.2s_ease-out] sm:left-auto sm:right-6 sm:w-[380px]">
      <header className="flex items-center justify-between border-b border-violet-100 bg-[#201b49] px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><MessageCircle className="h-5 w-5" /></span><div><h2 className="text-sm font-extrabold">Canlı Destek</h2><p className="mt-0.5 text-[11px] text-violet-200">{conversation ? conversation.visitorName : "Size nasıl yardımcı olabiliriz?"}</p></div></div><button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-violet-100 transition hover:bg-white/10" aria-label="Destek penceresini kapat"><CloseIcon className="h-5 w-5" /></button></header>

      {!conversation && needsName ? <form onSubmit={startConversation} className="flex min-h-0 flex-1 flex-col justify-center bg-[#faf9fd] p-6"><div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"><h3 className="text-lg font-black text-slate-900">Canlı Destek</h3><p className="mt-2 text-sm leading-6 text-slate-500">Görüşmeye başlamak için adınızı veya kullanmak istediğiniz takma adı yazın.</p><label className="mt-5 block text-xs font-extrabold text-slate-600">Adınız veya kullanıcı adınız<input autoFocus value={visitorName} onChange={(event) => setVisitorName(event.target.value)} minLength={2} maxLength={30} placeholder="Emir" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" required /></label>{error && <p className="mt-3 text-xs font-semibold text-red-600" role="alert">{error}</p>}<button type="submit" disabled={loading || visitorName.trim().length < 2} className="mt-4 w-full rounded-xl bg-[#6548d8] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#593bc8] disabled:cursor-not-allowed disabled:opacity-40">{loading ? "Başlatılıyor..." : "Canlı Destekle Görüş"}</button></div></form> : <>
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#faf9fd] px-4 py-5" aria-live="polite">{loading && <p className="py-10 text-center text-sm text-slate-400">Görüşme kontrol ediliyor...</p>}{messages.map((message) => { const visitor = message.sender === "VISITOR"; return <div key={message.id} className={`flex ${visitor ? "justify-end" : "justify-start"}`}><div className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${visitor ? "rounded-br-md bg-[#6548d8] text-white" : "rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-sm"}`}><p className="whitespace-pre-wrap break-words">{message.content}</p><p className={`mt-1 text-right text-[10px] ${visitor ? "text-violet-200" : "text-slate-400"}`}>{timeLabel(message.createdAt)}</p></div></div>; })}</div>
        <form onSubmit={sendMessage} className="border-t border-slate-100 bg-white p-3">{conversation?.status === "CLOSED" && <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">Bu görüşme kapatıldı. Pencereyi kapatıp yeniden açtığınızda yeni bir görüşme başlar.</p>}{error && <p className="mb-2 text-xs font-semibold text-red-600" role="alert">{error}</p>}<div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-1.5 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100"><textarea value={content} onChange={(event) => setContent(event.target.value)} onKeyDown={onKeyDown} maxLength={1000} rows={1} disabled={!conversation || conversation.status === "CLOSED"} placeholder="Mesajınızı yazın..." className="max-h-24 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50" /><button type="submit" disabled={!content.trim() || sending || !conversation || conversation.status === "CLOSED"} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#6548d8] text-white transition hover:bg-[#593bc8] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Mesaj gönder"><SendIcon className="h-4 w-4" /></button></div></form>
      </>}
    </section>}
    <button type="button" onClick={toggleWidget} aria-expanded={open} aria-label={open ? "Canlı desteği kapat" : "Canlı desteği aç"} className="grid h-14 w-14 place-items-center rounded-2xl bg-[#6548d8] text-white shadow-[0_10px_28px_rgba(74,56,165,.28)] transition hover:-translate-y-0.5 hover:bg-[#593bc8] focus:outline-none focus:ring-4 focus:ring-violet-200">{open ? <CloseIcon className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}</button>
  </div>;
}

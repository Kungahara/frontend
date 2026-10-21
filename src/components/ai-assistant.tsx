"use client";

import { ArrowUp, Bot, LoaderCircle, Plus, X } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { inventoryFetch } from "@/lib/inventory-client";

const copy = {
  en: {
    title: "AI assistant", subtitle: "Your Kungahara companion", open: "Open AI assistant", close: "Close assistant", reset: "New conversation",
    greeting: "How can I help you today?", introduction: "Ask a question about your workspace, or choose a place to start.",
    prompts: ["How do I add a product?", "Help me record a sale", "How do I organize my documents?"],
    placeholder: "Ask your assistant…", send: "Send message", thinking: "Thinking…", you: "You", note: "AI can make mistakes. Check important details.",
    unavailable: "The assistant is not connected yet. Please try again once setup is complete.", error: "Unable to get a reply. Your message is ready to try again.",
  },
  fr: {
    title: "Assistant IA", subtitle: "Votre compagnon Kungahara", open: "Ouvrir l’assistant IA", close: "Fermer l’assistant", reset: "Nouvelle conversation",
    greeting: "Comment puis-je vous aider ?", introduction: "Posez une question sur votre espace ou choisissez un sujet pour commencer.",
    prompts: ["Comment ajouter un produit ?", "Aidez-moi à enregistrer une vente", "Comment organiser mes documents ?"],
    placeholder: "Posez votre question…", send: "Envoyer le message", thinking: "Réflexion…", you: "Vous", note: "L’IA peut se tromper. Vérifiez les informations importantes.",
    unavailable: "L’assistant n’est pas encore connecté. Réessayez une fois la configuration terminée.", error: "Impossible d’obtenir une réponse. Votre message est prêt à être renvoyé.",
  },
  rw: {
    title: "Umufasha wa AI", subtitle: "Umufasha wawe muri Kungahara", open: "Fungura umufasha wa AI", close: "Funga umufasha", reset: "Ikiganiro gishya",
    greeting: "Nagufasha iki uyu munsi?", introduction: "Baza ikibazo ku mikorere y’urubuga cyangwa uhitemo aho uhera.",
    prompts: ["Nongeramo igicuruzwa nte?", "Mfasha kwandika igicuruzwa cyagurishijwe", "Natunganya inyandiko zanjye nte?"],
    placeholder: "Baza umufasha wawe…", send: "Ohereza ubutumwa", thinking: "Ndimo gutekereza…", you: "Wowe", note: "AI ishobora kwibeshya. Genzura amakuru y’ingenzi.",
    unavailable: "Umufasha ntarahuzwa. Ongera ugerageze nyuma yo kumuhuza.", error: "Igisubizo nticyabonetse. Ubutumwa bwawe bwiteguye kongera koherezwa.",
  },
};

type Message = { role: "user" | "assistant"; content: string };

export function AiAssistant() {
  const locale = useLocale();
  const t = copy[locale as keyof typeof copy] ?? copy.en;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<"unavailable" | "error" | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => { if (open && !busy) input.current?.focus(); }, [open, busy]);
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: "nearest" }); }, [messages, busy, open]);

  function close() {
    setOpen(false);
    window.requestAnimationFrame(() => launcher.current?.focus());
  }

  async function send(event?: FormEvent, prompt = draft) {
    event?.preventDefault();
    const content = prompt.trim();
    if (!content || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setError(null);
    setBusy(true);
    try {
      const response = await inventoryFetch("/api/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ messages: next.slice(-20), locale, page: pathname }),
      });
      const body = await response.json();
      if (!response.ok || typeof body.reply !== "string") {
        setError(body.error?.code === "assistant_not_configured" ? "unavailable" : "error");
        setMessages(next.slice(0, -1));
        setDraft(content);
        return;
      }
      setMessages([...next, { role: "assistant", content: body.reply }]);
    } catch {
      if (!controller.signal.aborted) {
        setError("error");
        setMessages(next.slice(0, -1));
        setDraft(content);
      }
    } finally {
      pending.current = null;
      setBusy(false);
    }
  }

  return <div className="ai-assistant" onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); close(); } }}>
    {open && <section className="ai-assistant-panel" id="ai-assistant-panel" role="dialog" aria-label={t.title}>
      <header className="ai-assistant-header">
        <span className="ai-assistant-avatar"><Bot aria-hidden="true" /></span>
        <div><h2>{t.title}</h2><p>{t.subtitle}</p></div>
        <button type="button" disabled={busy} aria-label={t.reset} title={t.reset} onClick={() => { setMessages([]); setDraft(""); setError(null); input.current?.focus(); }}><Plus aria-hidden="true" /></button>
        <button type="button" aria-label={t.close} title={t.close} onClick={close}><X aria-hidden="true" /></button>
      </header>
      <div className="ai-assistant-body">
        {!messages.length && <div className="ai-assistant-welcome">
          <h3>{t.greeting}</h3><p>{t.introduction}</p>
          <div className="ai-assistant-prompts">{t.prompts.map((prompt) => <button type="button" disabled={busy} key={prompt} onClick={() => void send(undefined, prompt)}>{prompt}<ArrowUp aria-hidden="true" /></button>)}</div>
        </div>}
        <div className="ai-assistant-messages" role="log" aria-label={t.title} aria-live="polite" aria-relevant="additions">
          {messages.map((message, index) => <article className={`ai-assistant-message ${message.role}`} key={index}><span>{message.role === "user" ? t.you : t.title}</span><p>{message.content}</p></article>)}
        </div>
        {busy && <p className="ai-assistant-thinking" role="status"><LoaderCircle aria-hidden="true" />{t.thinking}</p>}
        <div ref={end} />
      </div>
      {error && <p className="ai-assistant-error" role="alert">{t[error]}</p>}
      <form className="ai-assistant-composer" onSubmit={(event) => void send(event)}>
        <div><textarea ref={input} aria-label={t.placeholder} placeholder={t.placeholder} value={draft} maxLength={4000} rows={2} disabled={busy} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} /><button type="submit" disabled={busy || !draft.trim()} aria-label={t.send} title={t.send}>{busy ? <LoaderCircle className="ai-assistant-spinner" aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}</button></div>
        <small>{t.note}</small>
      </form>
    </section>}
    <button className="ai-assistant-launcher" hidden={open} ref={launcher} type="button" aria-label={t.open} aria-expanded={open} aria-controls={open ? "ai-assistant-panel" : undefined} onClick={() => setOpen(true)}><Bot aria-hidden="true" /></button>
  </div>;
}

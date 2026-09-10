"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { apiErrorMessage } from "@/lib/api/client";
import { useWorkspaceCopy } from "@/components/workspace-copy-translator";

export function HelpContent() {
  const commonText = useTranslations("Common");
  const tr = useWorkspaceCopy();
  const [openItem, setOpenItem] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [managedQuestions, setManagedQuestions] = useState<{ id: string; title: string; content: string }[]>([]);

  useEffect(() => {
    fetch("/api/help-content")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((body) => setManagedQuestions(Array.isArray(body.items) ? body.items : []))
      .catch(() => setManagedQuestions([]));
  }, []);

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!feedback.trim()) return;
    setSending(true); setSent(false); setSendError("");
    try {
      const response = await fetch("/api/support-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: feedback.trim() }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiErrorMessage(body, "Unable to send your message."));
      setFeedback(""); setSent(true);
    } catch (reason) {
      setSendError(reason instanceof Error ? reason.message : "Unable to send your message.");
    } finally { setSending(false); }
  }

  return <section className="help-page" aria-labelledby="help-title">
    <header className="help-heading"><h1 id="help-title">How can we help?</h1></header>

    <div className="help-list">
      {managedQuestions.map((item, index) => {
        const isOpen = openItem === index;
        const answerId = `help-answer-${index}`;
        return <article className={`help-item${isOpen ? " open" : ""}`} key={item.id}>
          <button className="help-question" type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setOpenItem(isOpen ? -1 : index)}>
            <span className="help-number">{index + 1}</span><strong>{tr(item.title)}</strong><span className="help-toggle"><Plus aria-hidden="true" /></span>
          </button>
          {isOpen && <div className="help-answer" id={answerId}><p>{tr(item.content)}</p></div>}
        </article>;
      })}

      <article className="help-feedback-card">
        <div><strong>Still need help?</strong><p>Send us a suggestion or describe a problem.</p></div>
        <form onSubmit={submitFeedback}>
          <label htmlFor="help-feedback">Suggestion or problem</label>
          <textarea id="help-feedback" rows={2} maxLength={1000} value={feedback} placeholder="Type your message here…" onChange={(event) => { setFeedback(event.target.value); setSent(false); }} />
          <button type="submit" disabled={!feedback.trim() || sending}><Send aria-hidden="true" /><span>{sending ? commonText("sending") : "Send"}</span></button>
        </form>
        {sent && <p className="help-feedback-sent" role="status">Your message was sent to Kungahara support.</p>}
        {sendError && <p className="help-feedback-error" role="alert">{sendError}</p>}
      </article>
    </div>
  </section>;
}

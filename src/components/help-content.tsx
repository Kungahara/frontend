"use client";

import { FormEvent, useState } from "react";
import { Plus, Send } from "lucide-react";

const questions = [
  {
    question: "How do I record a sale?",
    answer: "Open Sales from the sidebar, choose the products and quantities sold, then confirm the sale. Your stock and dashboard totals update automatically.",
  },
  {
    question: "How do I add or update stock?",
    answer: "Go to Stock to add a product, change its quantity, update its price, or organize it into a category.",
  },
  {
    question: "How do loan reminders work?",
    answer: "Kungahara shows in-app reminders as repayment deadlines approach. You can turn these reminders on or off from Settings.",
  },
  {
    question: "Can I download my business records?",
    answer: "Yes. Open Settings, find Data & account, and choose the sales, stock, loans, or documents export you need.",
  },
  {
    question: "How do I change my account details?",
    answer: "Use Settings to update your name, business name, profile picture, password, appearance, and notification preferences.",
  },
];

export function HelpContent() {
  const [openItem, setOpenItem] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

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
      if (!response.ok) throw new Error(body?.error?.message ?? "Unable to send your message.");
      setFeedback(""); setSent(true);
    } catch (reason) {
      setSendError(reason instanceof Error ? reason.message : "Unable to send your message.");
    } finally { setSending(false); }
  }

  return <section className="help-page" aria-labelledby="help-title">
    <header className="help-heading"><h1 id="help-title">How can we help?</h1></header>

    <div className="help-list">
      {questions.map((item, index) => {
        const isOpen = openItem === index;
        const answerId = `help-answer-${index}`;
        return <article className={`help-item${isOpen ? " open" : ""}`} key={item.question}>
          <button className="help-question" type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setOpenItem(isOpen ? -1 : index)}>
            <span className="help-number">{index + 1}</span><strong>{item.question}</strong><span className="help-toggle"><Plus aria-hidden="true" /></span>
          </button>
          {isOpen && <div className="help-answer" id={answerId}><p>{item.answer}</p></div>}
        </article>;
      })}

      <article className="help-feedback-card">
        <div><strong>Still need help?</strong><p>Send us a suggestion or describe a problem.</p></div>
        <form onSubmit={submitFeedback}>
          <label htmlFor="help-feedback">Suggestion or problem</label>
          <textarea id="help-feedback" rows={2} maxLength={1000} value={feedback} placeholder="Type your message here…" onChange={(event) => { setFeedback(event.target.value); setSent(false); }} />
          <button type="submit" disabled={!feedback.trim() || sending}><Send aria-hidden="true" /><span>{sending ? "Sending…" : "Send"}</span></button>
        </form>
        {sent && <p className="help-feedback-sent" role="status">Your message was emailed to Kungahara support.</p>}
        {sendError && <p className="help-feedback-error" role="alert">{sendError}</p>}
      </article>
    </div>
  </section>;
}

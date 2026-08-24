"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

export function MarketingFaqList({ items }: { items: readonly (readonly [string, string])[] }) {
  const [openItem, setOpenItem] = useState(0);

  return <div className="help-list marketing-help-list">
    {items.map(([question, answer], index) => {
      const isOpen = openItem === index;
      const answerId = `marketing-faq-answer-${index}`;
      return <article className={`help-item${isOpen ? " open" : ""}`} key={question}>
        <button className="help-question" type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setOpenItem(isOpen ? -1 : index)}>
          <span className="help-number">{index + 1}</span><strong>{question}</strong><span className="help-toggle"><Plus aria-hidden="true" /></span>
        </button>
        {isOpen && <div className="help-answer" id={answerId}><p>{answer}</p></div>}
      </article>;
    })}
  </div>;
}

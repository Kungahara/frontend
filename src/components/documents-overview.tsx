"use client";

import { Clock3, FileText, Folder, HardDrive } from "lucide-react";

const cards = [
  { title: "Total documents", value: "0 files", description: "Files saved in your workspace", icon: FileText, tone: "blue" },
  { title: "Folders", value: "0 folders", description: "Folders organizing your files", icon: Folder, tone: "folder" },
  { title: "Storage used", value: "0 B / 5 GB", description: "Space currently in use", icon: HardDrive, tone: "storage" },
  { title: "Recently added", value: "0 this week", description: "Files uploaded this week", icon: Clock3, tone: "recent" },
];

export function DocumentsOverview() {
  return <div className="documents-page-content">
    <div className="stock-summary-grid documents-summary-grid">
      {cards.map(({ title, value, description, icon: Icon, tone }) => {
        const primary = tone === "blue";
        return <article className={`stock-summary-card documents-summary-card ${tone}${primary ? " stock-value-card" : ""}`} key={title}>
          <span className="stock-summary-title">{title}</span>
          <span className="stock-summary-icon documents-summary-icon"><Icon aria-hidden="true" /></span>
          <div className={primary ? "stock-value-amount" : "stock-summary-value-row"}>{primary ? value : <strong>{value}</strong>}</div>
          <span className={primary ? "historical-card-note" : "stock-summary-previous"}>{description}</span>
        </article>;
      })}
    </div>
  </div>;
}

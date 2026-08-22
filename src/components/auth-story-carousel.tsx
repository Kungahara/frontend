"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { title: "Your business at a glance", description: "See income, expenses, sales, stock, and profit from one clear dashboard.", image: "/images/auth-showcase/dashboard.png", alt: "Kungahara business dashboard" },
  { title: "Stay ahead of your stock", description: "Track every product, quantity, and low-stock warning before it becomes a problem.", image: "/images/auth-showcase/stock.png", alt: "Kungahara stock management workspace" },
  { title: "Turn sales into insight", description: "Understand what sells, spot trends, and follow performance over time.", image: "/images/auth-showcase/sales.png", alt: "Kungahara sales analytics workspace" },
  { title: "Keep your finances healthy", description: "Monitor income, profit, expenses, and upcoming loan deadlines with confidence.", image: "/images/auth-showcase/finance.png", alt: "Kungahara finance and loans workspace" },
  { title: "Keep every document close", description: "Organize receipts, agreements, and business records in one secure workspace.", image: "/images/auth-showcase/documents.png", alt: "Kungahara document management workspace" },
];

export function AuthStoryCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => setActive((current) => (current + 1) % slides.length), 5500);
    return () => window.clearTimeout(timer);
  }, [active, paused]);
  const slide = slides[active];
  return <div className="auth-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    <div className="auth-showcase-copy" aria-live="polite" aria-atomic="true" key={`copy-${slide.title}`}>
      <span>Built for growing businesses</span>
      <h2>{slide.title}</h2>
      <p>{slide.description}</p>
    </div>
    <div className="auth-showcase-visual" key={slide.image}>
      <div className="auth-showcase-frame"><Image src={slide.image} alt={slide.alt} fill sizes="(max-width: 820px) 0px, 55vw" priority={active === 0} /></div>
      <div className="auth-showcase-badge"><strong>{String(active + 1).padStart(2, "0")}</strong><span>{slide.title}</span></div>
    </div>
    <div className="carousel-indicators" aria-label="Feature slides">{slides.map((item, index) => <button type="button" className={index === active ? "active" : ""} aria-label={`Show ${item.title}`} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)} key={item.title} />)}</div>
  </div>;
}

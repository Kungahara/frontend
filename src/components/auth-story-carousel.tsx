"use client";
import { useEffect, useState } from "react";

const words = ["For", "Showcasing", "Features"];

export function AuthStoryCarousel() {
  const [active, setActive] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setActive((current) => (current + 1) % words.length), 3000); return () => window.clearInterval(timer); }, []);
  return <div className="auth-carousel"><div className="rotating-word" aria-live="polite" aria-atomic="true" key={words[active]}>{words[active]}</div><div className="carousel-indicators" aria-label="Feature slides">{words.map((word, index) => <button type="button" className={index === active ? "active" : ""} aria-label={`Show ${word}`} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)} key={word} />)}</div></div>;
}

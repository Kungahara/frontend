"use client";
import Image from "next/image";
import { FileText, LayoutDashboard, ShoppingCart } from "lucide-react";
import type { CSSProperties, SVGProps } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";

function StockFeatureIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z" /><path d="M6 21V10a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v11M6 13h12M6 17h12" /></svg>;
}

function FinanceFeatureIcon(props: SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" /><path d="M3.5 9h17M16.5 14.5h1" /></svg>;
}

function SpeechBubbleImage() {
  return <svg className="auth-feature-bubble-outline" viewBox="0 0 64 64" aria-hidden="true"><path d="M34 3C48.912 3 61 15.088 61 30S48.912 57 34 57c-5.4 0-10.44-1.58-14.66-4.3L7 59.5l3.8-14.7A26.86 26.86 0 0 1 7 31C7 15.536 19.088 3 34 3Z" /></svg>;
}

const slides = [
  { key: "dashboard", image: "/images/auth-showcase/dashboard-final.png", icon: LayoutDashboard },
  { key: "stock", image: "/images/auth-showcase/stock-final.png", icon: StockFeatureIcon },
  { key: "sales", image: "/images/auth-showcase/sales-final.png", icon: ShoppingCart },
  { key: "finance", image: "/images/auth-showcase/finance-final.png", icon: FinanceFeatureIcon },
  { key: "documents", image: "/images/auth-showcase/documents-final.png", icon: FileText },
];

export function AuthStoryCarousel() {
  const t = useTranslations("Auth.carousel");
  const [active, setActive] = useState(0);
  const ActiveIcon = slides[active].icon;
  return <div className="auth-carousel">
    <div className="auth-showcase-visual">
      <div className="auth-showcase-deck">{slides.map((slide, index) => {
        const position = (index - active + slides.length) % slides.length;
        const horizontalOffsets = ["0rem", "1rem", "-1rem", "1.45rem", "-1.45rem"];
        const verticalOffsets = ["2rem", "0.75rem", "0.75rem", "0.25rem", "0.25rem"];
        const rotations = ["0deg", "3deg", "-3deg", "5deg", "-5deg"];
        const scales = ["1", "0.98", "0.98", "0.955", "0.955"];
        const style = { "--deck-position": position, "--deck-x": horizontalOffsets[position], "--deck-y": verticalOffsets[position], "--deck-rotation": rotations[position], "--deck-scale": scales[position], backgroundImage: `url("${slide.image}")`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover" } as CSSProperties;
        return <div className={`auth-showcase-frame${position === 0 ? " current" : ""}${position === 1 ? " next" : ""}`} style={style} aria-hidden={position !== 0} onAnimationEnd={position === 0 ? () => setActive((current) => (current + 1) % slides.length) : undefined} key={slide.image}><Image src={slide.image} alt={position === 0 ? t(`${slide.key}.alt`) : ""} fill sizes="(max-width: 820px) 0px, 55vw" loading="eager" unoptimized /></div>;
      })}</div>
    </div>
    <span className="auth-feature-callout" aria-hidden="true"><SpeechBubbleImage /><span className="auth-feature-callout-glyph"><ActiveIcon /></span></span>
    <div className="auth-showcase-caption" aria-live="polite" aria-atomic="true" key={`caption-${active}`}><h2>{t(`${slides[active].key}.title`)}</h2><p>{t(`${slides[active].key}.description`)}</p></div>
    <div className="carousel-indicators" aria-label={t("slidesLabel")}>{slides.map((item, index) => <button type="button" className={index === active ? "active" : ""} aria-label={t("showSlide", { title: t(`${item.key}.title`) })} aria-current={index === active ? "true" : undefined} onClick={() => setActive(index)} key={item.key} />)}</div>
  </div>;
}

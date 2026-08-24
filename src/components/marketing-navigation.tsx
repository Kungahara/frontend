"use client";

import { useEffect, useState } from "react";

const links = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "about", label: "About us" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact us" },
];

export function MarketingNavigation() {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const sections = links
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    let animationFrame = 0;
    const updateFromPosition = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const marker = window.innerHeight * 0.28;
        const current = sections.reduce((active, section) => (
          section.getBoundingClientRect().top <= marker ? section.id : active
        ), sections[0]?.id ?? "home");
        setActiveSection(current);
      });
    };

    const rememberCurrentPosition = () => {
      window.sessionStorage.setItem("kungahara:auth-backdrop-scroll", String(window.scrollY));
    };

    const restorePosition = Number(new URLSearchParams(window.location.search).get("restoreY"));
    if (Number.isFinite(restorePosition) && restorePosition >= 0 && window.location.search.includes("restoreY=")) {
      const restore = () => window.scrollTo({ top: restorePosition, behavior: "instant" });
      restore();
      requestAnimationFrame(() => {
        restore();
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.hash}`);
        updateFromPosition();
      });
    }

    const rememberAuthBackdrop = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a");
      if (!(link instanceof HTMLAnchorElement)) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || !["/login", "/signup"].includes(destination.pathname)) return;
      rememberCurrentPosition();
      const marker = window.innerHeight * 0.28;
      const backdropSection = sections.reduce((active, section) => section.getBoundingClientRect().top <= marker ? section.id : active, sections[0]?.id ?? "home");
      destination.searchParams.set("backdropY", String(Math.round(window.scrollY)));
      destination.searchParams.set("backdropSection", backdropSection);
      link.setAttribute("href", `${destination.pathname}${destination.search}${destination.hash}`);
    };

    window.addEventListener("scroll", updateFromPosition, { passive: true });
    window.addEventListener("resize", updateFromPosition);
    window.addEventListener("hashchange", updateFromPosition);
    window.addEventListener("pagehide", rememberCurrentPosition);
    document.addEventListener("pointerdown", rememberAuthBackdrop, true);
    document.addEventListener("click", rememberAuthBackdrop, true);
    updateFromPosition();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateFromPosition);
      window.removeEventListener("resize", updateFromPosition);
      window.removeEventListener("hashchange", updateFromPosition);
      window.removeEventListener("pagehide", rememberCurrentPosition);
      document.removeEventListener("pointerdown", rememberAuthBackdrop, true);
      document.removeEventListener("click", rememberAuthBackdrop, true);
    };
  }, []);

  return <nav className="marketing-nav" aria-label="Main navigation">
    {links.map(({ id, label }) => <a
      className={activeSection === id ? "active" : undefined}
      href={`#${id}`}
      aria-current={activeSection === id ? "location" : undefined}
      onClick={() => setActiveSection(id)}
      key={id}
    >{label}</a>)}
  </nav>;
}

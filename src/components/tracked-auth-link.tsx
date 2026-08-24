"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

export function TrackedAuthLink({ children, className, href }: { children: ReactNode; className?: string; href: string }) {
  function followWithBackdrop(event: MouseEvent<HTMLAnchorElement>) {
    if (!["/login", "/signup"].includes(href)) return;
    event.preventDefault();
    const position = String(Math.round(window.scrollY));
    const marker = window.innerHeight * 0.28;
    const sections = [...document.querySelectorAll<HTMLElement>("main.marketing-page > section[id]")];
    const currentSection = sections.reduce((active, section) => section.getBoundingClientRect().top <= marker ? section.id : active, sections[0]?.id ?? "home");
    window.sessionStorage.setItem("kungahara:auth-backdrop-scroll", position);
    window.dispatchEvent(new CustomEvent("kungahara:open-auth", { detail: { mode: href === "/signup" ? "signup" : "login", position, section: currentSection } }));
  }

  return <Link className={className} href={href} onClick={followWithBackdrop}>{children}</Link>;
}

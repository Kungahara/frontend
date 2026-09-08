"use client";

import { landingText, type LandingLanguage } from "@/lib/landing-copy";

const languages: LandingLanguage[] = ["rw", "en", "fr"];

export function MarketingLanguageToggle({ initialLanguage }: { initialLanguage: LandingLanguage }) {
  function selectLanguage(language: LandingLanguage) {
    try { window.localStorage.setItem("kungahara:language", language); } catch { /* The cookie still preserves the choice. */ }
    void fetch("/api/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    }).finally(() => window.location.reload());
  }

  return <div className="dashboard-language-toggle marketing-language-toggle" role="group" aria-label={landingText("Language", initialLanguage)}>
    {languages.map((language) => <button className={initialLanguage === language ? "active" : ""} type="button" aria-pressed={initialLanguage === language} title={language.toUpperCase()} key={language} onClick={() => selectLanguage(language)}>{language.toUpperCase()}</button>)}
  </div>;
}

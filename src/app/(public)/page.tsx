import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  ChevronRight,
  FileText,
  Focus,
  Code2,
  Mail,
  PackageCheck,
  ShoppingCart,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";

import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { MarketingNavigation } from "@/components/marketing-navigation";
import { MarketingFaqList } from "@/components/marketing-faq-list";
import { TrackedAuthLink } from "@/components/tracked-auth-link";
import { AuthModalHost } from "@/components/auth-modal-host";
import { MarketingContactForm } from "@/components/marketing-contact-form";
import { MarketingLanguageToggle } from "@/components/marketing-language-toggle";
import { landingText, type LandingLanguage } from "@/lib/landing-copy";

const features = [
  { icon: BarChart3, title: "A dashboard that makes sense", copy: "See income, expenses, profit, stock value, and business activity without digging through separate tools." },
  { icon: PackageCheck, title: "Stock you can trust", copy: "Know what is available, what is selling, and which products need your attention before they run out." },
  { icon: ShoppingCart, title: "Sales, clearly recorded", copy: "Record sales quickly and understand which products, periods, and categories are driving your revenue." },
  { icon: WalletCards, title: "Finance without the guesswork", copy: "Follow money invested, income, profit, losses, and loan deadlines from one organized workspace." },
  { icon: FileText, title: "Documents kept close", copy: "Store receipts, agreements, invoices, and business records in folders that are easy to find later." },
  { icon: BadgeDollarSign, title: "Built around your currency", copy: "Work naturally in RWF and monitor additional currencies without losing sight of your real business totals." },
];

const steps = [
  { number: "01", title: "Create your workspace", copy: "Start with a secure account and set up the business information that matters to you." },
  { number: "02", title: "Add your daily activity", copy: "Record products, sales, documents, expenses, and loans as your business moves." },
  { number: "03", title: "Make clearer decisions", copy: "Use live summaries and trends to know what is working and what needs attention next." },
];

const faqs = [
  ["Who is Kungahara designed for?", "Kungahara is designed for growing shops, sellers, and small businesses that want a clearer way to manage stock, sales, finances, and records."],
  ["Do I need accounting experience?", "No. The workspace uses straightforward language and visual summaries so you can understand the health of your business without specialist software knowledge."],
  ["Can I use Rwandan francs?", "Yes. RWF is supported as the main working currency, and you can monitor additional currencies when your business needs them."],
  ["Are my documents kept together with my business data?", "Yes. Your Docs gives you a dedicated place for receipts, agreements, invoices, and other business files."],
  ["Can I access Kungahara on a phone?", "Yes. The landing page and application are responsive, so you can use the core experience across desktop, tablet, and mobile screens."],
] as const;

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has("kungahara_session");
  const savedLanguage = cookieStore.get("kungahara-language")?.value;
  const language: LandingLanguage = savedLanguage === "fr" || savedLanguage === "rw" ? savedLanguage : "en";
  const tr = (value: string) => landingText(value, language);

  return <main className="marketing-page">
    <AuthModalHost />
    <header className="marketing-header">
      <Brand />
      <MarketingNavigation language={language} />
      <div className="marketing-auth-actions">
        <MarketingLanguageToggle initialLanguage={language} />
        {hasSession ? <>
          <Link className="marketing-login" href="/dashboard">{tr("Dashboard")}</Link>
          <LogoutButton className="marketing-signup" label={tr("Log out")} redirectTo="/" />
        </> : <>
          <TrackedAuthLink className="marketing-login" href="/login">{tr("Log in")}</TrackedAuthLink>
          <TrackedAuthLink className="marketing-signup" href="/signup">{tr("Sign up")}</TrackedAuthLink>
        </>}
      </div>
    </header>

    <section className="marketing-hero" id="home">

      <div className="marketing-hero-copy">
        <p className="marketing-trust marketing-hero-trust"><span className="marketing-trust-label">{tr("New")}</span><span>{tr("Trusted by Modern Sellers")}</span></p>
        <h1>{tr("One clear place to run")}<br /><em>{tr("your whole business.")}</em></h1>
        <p className="marketing-hero-description">{tr("Kungahara brings your stock, sales, finances, and documents into one calm workspace—so you spend less time chasing numbers and more time growing.")}</p>
        <div className="marketing-hero-actions">
          <TrackedAuthLink className="marketing-primary-cta" href={hasSession ? "/dashboard" : "/signup"}>{tr(hasSession ? "Open dashboard" : "Get started free")}<ArrowRight aria-hidden="true" /></TrackedAuthLink>
          <TrackedAuthLink className="marketing-secondary-cta" href={hasSession ? "/dashboard" : "/login"}>{tr("Continue to workplace")}<ArrowRight aria-hidden="true" /></TrackedAuthLink>
        </div>
      </div>

      <div className="marketing-product-stage" aria-label={tr("Kungahara dashboard preview")}>
        <span className="marketing-orb marketing-orb-one" />
        <span className="marketing-orb marketing-orb-two" />
        <div className="marketing-browser-frame">
          <div className="marketing-browser-bar"><span /><span /><span /><p>app.kungahara.com/dashboard</p></div>
          <div className="marketing-dashboard-image">
            <Image
              src="/images/landing/dashboard-preview-owner-v2.png"
              alt={tr("Kungahara dashboard showing finances, stock, sales, and business insights")}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              unoptimized
              priority
            />
          </div>
        </div>
      </div>
    </section>

    <section className="marketing-section marketing-features" id="features">
      <div className="marketing-section-heading">
        <h2>{tr("Run the business.")}<br /><em>{tr("See the whole picture.")}</em></h2>
        <p>{tr("Each tool is useful on its own. Together, they give you one dependable view of how your business is doing.")}</p>
      </div>
      <div className="marketing-feature-grid">{features.map(({ icon: Icon, title, copy }, index) => <article className="marketing-feature-card" key={title}>
        <span className="marketing-feature-number">0{index + 1}</span>
        <span className="marketing-feature-icon"><Icon aria-hidden="true" /></span>
        <div className="marketing-feature-copy">
          <h3>{tr(title)}</h3><p>{tr(copy)}</p>
          <a href="#contact">{tr("Learn more")} <ChevronRight aria-hidden="true" /></a>
        </div>
      </article>)}</div>
    </section>

    <section className="marketing-section marketing-process" id="how-it-works">
      <div className="marketing-process-intro">
        <p className="marketing-kicker marketing-trust marketing-process-trust"><span className="marketing-trust-dot" />{tr("How it works")}</p>
        <h2>{tr("From scattered details")}<br /><em>{tr("to confident decisions.")}</em></h2>
        <p>{tr("Kungahara keeps the process simple. Add what happens in your business, and your workspace turns it into a clear, useful picture.")}</p>
        <TrackedAuthLink className="marketing-primary-cta" href={hasSession ? "/dashboard" : "/signup"}>{tr("Start your workspace")}<ArrowRight aria-hidden="true" /></TrackedAuthLink>
      </div>
      <div className="marketing-step-list">
        <svg className="marketing-step-path" viewBox="0 0 640 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M 528 78 C 650 78 675 96 675 126 C 675 162 645 183 580 183 L 160 183 C 110 183 82 190 82 205 C 82 220 95 230 111 235" />
          <path d="M 640 315 C 678 320 688 346 688 372 C 688 410 645 429 580 429 L 120 429 C 50 429 -60 460 -60 490 C -60 520 -35 535 0 535" />
        </svg>
        {steps.map((step) => <article key={step.number}>
          <span>{step.number}</span><div><h3>{tr(step.title)}</h3><p>{tr(step.copy)}</p></div>
        </article>)}
      </div>
    </section>

    <section className="marketing-section marketing-about" id="about">
      <div className="marketing-about-visual">
        <div className="marketing-about-card main"><p>{tr("Built for the way growing businesses really work.")}</p><strong>{tr("Clarity for every business day.")}</strong></div>
        <div className="marketing-about-card stat"><strong>150+</strong><span>{tr("connected workspaces")}</span></div>
        <div className="marketing-about-card note"><Focus aria-hidden="true" /><span>{tr("Designed with simplicity at the center.")}</span></div>
      </div>
      <div className="marketing-about-copy">
        <p className="marketing-kicker marketing-trust marketing-about-trust"><span className="marketing-trust-dot" aria-hidden="true" />{tr("About Kungahara")}</p>
        <h2>{tr("Business software")}<br /><em>{tr("should feel human.")}</em></h2>
        <p>{tr("Kungahara exists to make everyday business management easier to understand. We bring essential tools together in a focused experience shaped around clarity, confidence, and steady growth.")}</p>
        <p>{tr("From a first sale to a growing product catalogue, the workspace helps business owners stay close to the details without becoming overwhelmed by them.")}</p>
        <a className="marketing-text-cta" href="#contact">{tr("Talk to our team")}<ArrowRight aria-hidden="true" /></a>
      </div>
    </section>

    <section className="marketing-section marketing-faq" id="faq">
      <div className="marketing-section-heading">
        <h2>{tr("Everything you need")}<br /><em>{tr("to get started.")}</em></h2>
      </div>
      <MarketingFaqList items={faqs.map(([question, answer]) => [tr(question), tr(answer)] as const)} />
    </section>

    <section className="marketing-section marketing-contact" id="contact">
      <div className="marketing-contact-copy">
        <p className="marketing-kicker marketing-trust marketing-contact-trust"><span className="marketing-trust-dot" aria-hidden="true" />{tr("Contact us")}</p>
        <h2>{tr("Let's build a clearer")}<br /><em>{tr("business together.")}</em></h2>
        <p>{tr("Have a question, need help getting started, or want to learn whether Kungahara fits your business? Send us a message.")}</p>
        <a href="mailto:hervendizeye0@gmail.com"><Mail aria-hidden="true" /> hervendizeye0@gmail.com</a>
      </div>
      <MarketingContactForm language={language} />
    </section>

    <footer className="marketing-footer">
      <div className="marketing-footer-signoff">
        <div className="marketing-footer-top">
          <div className="marketing-footer-intro">
            <Brand />
            <p>{tr("One clear place to manage stock, sales, finances, and records, built for growing businesses.")}</p>
          </div>
          <nav className="marketing-footer-column" aria-label={tr("Product links")}>
            <strong>{tr("Product")}</strong>
            <a href="#features">{tr("Features")}</a>
            <a href="#how-it-works">{tr("How it works")}</a>
            <TrackedAuthLink href={hasSession ? "/dashboard" : "/signup"}>{tr(hasSession ? "Dashboard" : "Get started")}</TrackedAuthLink>
          </nav>
          <nav className="marketing-footer-column" aria-label={tr("Company links")}>
            <strong>{tr("Company")}</strong>
            <a href="#about">{tr("About us")}</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">{tr("Contact")}</a>
          </nav>
          <nav className="marketing-footer-column" aria-label={tr("Legal links")}>
            <strong>{tr("Legal")}</strong>
            <Link href="/terms">{tr("Terms of service")}</Link>
            <Link href="/privacy">{tr("Privacy policy")}</Link>
          </nav>
          <div className="marketing-footer-socials">
            <strong>{tr("Follow Kungahara")}</strong>
            <div>
              <a href="https://github.com/Kungahara" target="_blank" rel="noreferrer" aria-label={tr("Kungahara on GitHub")}><Code2 aria-hidden="true" /></a>
              <a href="mailto:hervendizeye0@gmail.com" aria-label={tr("Email Kungahara")}><Mail aria-hidden="true" /></a>
            </div>
          </div>
        </div>
        <span className="marketing-footer-orb one" aria-hidden="true" />
        <span className="marketing-footer-orb two" aria-hidden="true" />
        <p aria-label="Kungahara">Kungahara</p>
        <small>{tr("© 2026 Kungahara. All rights reserved.")}</small>
      </div>
    </footer>
  </main>;
}

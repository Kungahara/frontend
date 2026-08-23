import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  ChevronRight,
  FileText,
  Mail,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";

import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";

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
];

export default async function HomePage() {
  const hasSession = (await cookies()).has("kungahara_session");

  return <main className="marketing-page">
    <header className="marketing-header">
      <Brand />
      <nav className="marketing-nav" aria-label="Main navigation">
        <a href="#home">Home</a>
        <a href="#features">Features</a>
        <a href="#how-it-works">How it works</a>
        <a href="#about">About us</a>
        <a href="#faq">FAQ</a>
        <a href="#contact">Contact us</a>
      </nav>
      <div className="marketing-auth-actions">
        {hasSession ? <>
          <Link className="marketing-login" href="/dashboard">Dashboard</Link>
          <LogoutButton className="marketing-signup" label="Log out" redirectTo="/" />
        </> : <>
          <Link className="marketing-login" href="/login">Log in</Link>
          <Link className="marketing-signup" href="/signup">Sign up</Link>
        </>}
      </div>
    </header>

    <section className="marketing-hero" id="home">

      <div className="marketing-hero-copy">
        <p className="marketing-trust"><span className="marketing-trust-dot" aria-hidden="true" /> Trusted by Modern Sellers</p>
        <h1>One clear place to run<br /><em>your whole business.</em></h1>
        <p className="marketing-hero-description">Kungahara brings your stock, sales, finances, and documents into one calm workspace—so you spend less time chasing numbers and more time growing.</p>
        <div className="marketing-hero-actions">
          <Link className="marketing-primary-cta" href={hasSession ? "/dashboard" : "/signup"}>{hasSession ? "Open dashboard" : "Get started free"}<ArrowRight aria-hidden="true" /></Link>
          <Link className="marketing-secondary-cta" href={hasSession ? "/dashboard" : "/login"}>Continue to workplace<ArrowRight aria-hidden="true" /></Link>
        </div>
      </div>

      <div className="marketing-product-stage" aria-label="Kungahara dashboard preview">
        <span className="marketing-orb marketing-orb-one" />
        <span className="marketing-orb marketing-orb-two" />
        <div className="marketing-browser-frame">
          <div className="marketing-browser-bar"><span /><span /><span /><p>app.kungahara.com/dashboard</p></div>
          <div className="marketing-dashboard-image">
            <Image
              src="/images/landing/dashboard-preview-enhanced.png"
              alt="Kungahara dashboard showing finances, stock, sales, and business insights"
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              quality={100}
              unoptimized
              priority
            />
          </div>
        </div>
      </div>
    </section>

    <section className="marketing-section marketing-features" id="features">
      <div className="marketing-section-heading">
        <p className="marketing-kicker">Everything connected</p>
        <h2>Run the business.<br /><em>See the whole picture.</em></h2>
        <p>Each tool is useful on its own. Together, they give you one dependable view of how your business is doing.</p>
      </div>
      <div className="marketing-feature-grid">{features.map(({ icon: Icon, title, copy }, index) => <article className="marketing-feature-card" key={title}>
        <span className="marketing-feature-number">0{index + 1}</span>
        <span className="marketing-feature-icon"><Icon aria-hidden="true" /></span>
        <h3>{title}</h3><p>{copy}</p>
        <a href="#contact">Learn more <ChevronRight aria-hidden="true" /></a>
      </article>)}</div>
    </section>

    <section className="marketing-section marketing-process" id="how-it-works">
      <div className="marketing-process-intro">
        <p className="marketing-kicker">How it works</p>
        <h2>From scattered details<br /><em>to confident decisions.</em></h2>
        <p>Kungahara keeps the process simple. Add what happens in your business, and your workspace turns it into a clear, useful picture.</p>
        <Link className="marketing-primary-cta" href={hasSession ? "/dashboard" : "/signup"}>Start your workspace<ArrowRight aria-hidden="true" /></Link>
      </div>
      <div className="marketing-step-list">{steps.map((step) => <article key={step.number}>
        <span>{step.number}</span><div><h3>{step.title}</h3><p>{step.copy}</p></div>
      </article>)}</div>
    </section>

    <section className="marketing-section marketing-about" id="about">
      <div className="marketing-about-visual">
        <div className="marketing-about-card main"><p>Built for the way growing businesses really work.</p><strong>Clarity for every business day.</strong></div>
        <div className="marketing-about-card stat"><strong>5</strong><span>connected workspaces</span></div>
        <div className="marketing-about-card note"><Sparkles aria-hidden="true" /><span>Designed with simplicity at the center.</span></div>
      </div>
      <div className="marketing-about-copy">
        <p className="marketing-kicker">About Kungahara</p>
        <h2>Business software<br /><em>should feel human.</em></h2>
        <p>Kungahara exists to make everyday business management easier to understand. We bring essential tools together in a focused experience shaped around clarity, confidence, and steady growth.</p>
        <p>From a first sale to a growing product catalogue, the workspace helps business owners stay close to the details without becoming overwhelmed by them.</p>
        <a className="marketing-text-cta" href="#contact">Talk to our team<ArrowRight aria-hidden="true" /></a>
      </div>
    </section>

    <section className="marketing-section marketing-faq" id="faq">
      <div className="marketing-section-heading">
        <p className="marketing-kicker">Questions, answered</p>
        <h2>Everything you need<br /><em>to get started.</em></h2>
      </div>
      <div className="marketing-faq-list">{faqs.map(([question, answer], index) => <details open={index === 0} key={question}>
        <summary><span>{question}</span><i>+</i></summary><p>{answer}</p>
      </details>)}</div>
    </section>

    <section className="marketing-section marketing-contact" id="contact">
      <div className="marketing-contact-copy">
        <p className="marketing-kicker">Contact us</p>
        <h2>Let&apos;s build a clearer<br /><em>business together.</em></h2>
        <p>Have a question, need help getting started, or want to learn whether Kungahara fits your business? Send us a message.</p>
        <a href="mailto:hello@kungahara.com"><Mail aria-hidden="true" /> hello@kungahara.com</a>
      </div>
      <form className="marketing-contact-form">
        <div><label htmlFor="contact-name">Your name</label><input id="contact-name" name="name" placeholder="Enter your name" /></div>
        <div><label htmlFor="contact-email">Email address</label><input id="contact-email" name="email" type="email" placeholder="you@example.com" /></div>
        <div><label htmlFor="contact-business">Business name</label><input id="contact-business" name="business" placeholder="Your business" /></div>
        <div><label htmlFor="contact-message">How can we help?</label><textarea id="contact-message" name="message" rows={4} placeholder="Tell us what you need" /></div>
        <button type="submit">Send message<ArrowRight aria-hidden="true" /></button>
      </form>
    </section>

    <footer className="marketing-footer">
      <Brand />
      <p>One clear place to understand and grow your business.</p>
      <nav aria-label="Footer navigation"><a href="#features">Features</a><a href="#about">About us</a><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
      <small>© 2026 Kungahara. All rights reserved.</small>
    </footer>
  </main>;
}

import Link from "next/link";

export default function PrivacyPage() {
  return <main className="legal-page"><article><Link href="/signup">← Back to sign up</Link><p className="eyebrow">Kungahara</p><h1>Privacy Policy</h1><p>Kungahara uses the account and business information you provide to authenticate you, operate your workspace, and protect the service. Passwords are stored only as secure hashes, and confirmation passwords are never sent or stored.</p><p>OAuth providers share basic identity information only after you consent. Kungahara does not sell your personal information.</p></article></main>;
}

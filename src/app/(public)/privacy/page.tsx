import { LegalDocumentLayout, LegalSection } from "@/components/legal-document-layout";

const sections: LegalSection[] = [
  { id: "information", title: "Information we collect", content: <><p>We collect account details such as your name, email address, business name, profile picture, and authentication information. We also process the stock, sales, finance, loan, and document information you choose to add to your workspace.</p><p>Basic technical information may be processed to keep the service secure and working correctly.</p></> },
  { id: "use", title: "How we use information", content: <p>We use information to create and authenticate accounts, provide workspace features, deliver requested notifications, respond to support messages, protect the service, troubleshoot problems, and improve Kungahara.</p> },
  { id: "authentication", title: "Authentication and passwords", content: <><p>Passwords are stored as secure hashes rather than readable passwords. Confirmation passwords are used only to check that entries match and are never stored.</p><p>If you choose Google or Microsoft sign-in, the provider shares basic identity information after you consent. We do not receive your provider password.</p></> },
  { id: "sharing", title: "When information is shared", content: <><p>Kungahara does not sell your personal information. Information may be shared with infrastructure and service providers only when needed to operate features such as hosting, email delivery, authentication, file storage, and browser notifications.</p><p>We may also disclose information when legally required or when necessary to protect users, the service, or the public.</p></> },
  { id: "retention", title: "Storage and retention", content: <p>We retain information while your account is active and as reasonably needed to operate the service, meet legal obligations, resolve disputes, and maintain security. Retention periods may differ depending on the type of data and why it is held.</p> },
  { id: "choices", title: "Your choices", content: <p>You can update profile and business details, control notification delivery, export supported business records, and request account deletion through Kungahara&apos;s settings. You may also contact us with a privacy question or correction request.</p> },
  { id: "security", title: "How we protect information", content: <p>We use access controls, secure authentication, limited token lifetimes, and other technical safeguards designed to protect your information. No online system can guarantee absolute security, so you should also protect your account credentials.</p> },
  { id: "changes", title: "Policy updates", content: <p>We may revise this policy as Kungahara and its privacy practices develop. Material changes will be communicated before they take effect, and the effective date above will be updated.</p> },
];

export default function PrivacyPage() {
  return <LegalDocumentLayout label="Privacy" title="Privacy Policy" summary="A straightforward explanation of what Kungahara collects and how your information is handled." sections={sections} />;
}

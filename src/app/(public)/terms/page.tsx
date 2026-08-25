import { LegalDocumentLayout, LegalSection } from "@/components/legal-document-layout";

const sections: LegalSection[] = [
  { id: "acceptance", title: "Accepting these terms", content: <p>By creating an account or using Kungahara, you agree to these terms. If you use Kungahara for a business, you confirm that you have authority to accept these terms on its behalf.</p> },
  { id: "service", title: "Using Kungahara", content: <><p>Kungahara provides tools for managing business information such as stock, sales, finances, loans, and documents. You may use the service only for lawful business purposes.</p><p>You must not misuse the service, interfere with its operation, attempt unauthorized access, or use it to violate another person&apos;s rights.</p></> },
  { id: "accounts", title: "Accounts and security", content: <><p>Provide accurate registration information and keep it current. You are responsible for activity under your account and for protecting your password and sign-in methods.</p><p>Notify us promptly if you believe your account has been accessed without permission.</p></> },
  { id: "business-data", title: "Your business data", content: <><p>You retain ownership of the information and documents you add to Kungahara. You give us permission to process that data only as needed to operate, secure, maintain, and improve the service.</p><p>You are responsible for ensuring that you have the right to upload and use the data stored in your workspace.</p></> },
  { id: "availability", title: "Service availability", content: <p>We work to keep Kungahara reliable, but the service may occasionally be interrupted for maintenance, security, or circumstances outside our control. Features may evolve as the product improves.</p> },
  { id: "decisions", title: "Business decisions", content: <p>Kungahara organizes information you provide, but it is not accounting, tax, legal, or financial advice. Review important figures and consult a qualified professional when appropriate before making business decisions.</p> },
  { id: "suspension", title: "Suspension and termination", content: <p>We may restrict or end access when an account seriously violates these terms, threatens the service or other users, or when required by law. You may stop using Kungahara at any time and may request account deletion through the available account settings.</p> },
  { id: "changes", title: "Changes to these terms", content: <p>We may update these terms as Kungahara develops. If a change materially affects your rights or responsibilities, we will provide reasonable notice before it takes effect. Continued use after the effective date means you accept the updated terms.</p> },
];

export default function TermsPage() {
  return <LegalDocumentLayout label="Legal" title="Terms & Conditions" summary="The ground rules for using Kungahara clearly, safely, and responsibly." sections={sections} />;
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocumentLayout, type LegalSection } from "@/components/legal-document-layout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.terms");
  return { title: t("title") };
}

export default async function TermsPage() {
  const t = await getTranslations("Legal.terms");
  const sections: LegalSection[] = [
    { id: "acceptance", title: t("acceptance.title"), content: <p>{t("acceptance.body")}</p> },
    { id: "service", title: t("service.title"), content: <><p>{t("service.body1")}</p><p>{t("service.body2")}</p></> },
    { id: "accounts", title: t("accounts.title"), content: <><p>{t("accounts.body1")}</p><p>{t("accounts.body2")}</p></> },
    { id: "business-data", title: t("businessData.title"), content: <><p>{t("businessData.body1")}</p><p>{t("businessData.body2")}</p></> },
    { id: "availability", title: t("availability.title"), content: <p>{t("availability.body")}</p> },
    { id: "decisions", title: t("decisions.title"), content: <p>{t("decisions.body")}</p> },
    { id: "suspension", title: t("suspension.title"), content: <p>{t("suspension.body")}</p> },
    { id: "changes", title: t("changes.title"), content: <p>{t("changes.body")}</p> },
  ];
  return <LegalDocumentLayout label={t("label")} title={t("title")} summary={t("summary")} sections={sections} />;
}

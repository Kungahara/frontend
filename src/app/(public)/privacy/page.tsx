import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDocumentLayout, type LegalSection } from "@/components/legal-document-layout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.privacy");
  return { title: t("title") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Legal.privacy");
  const sections: LegalSection[] = [
    { id: "information", title: t("information.title"), content: <><p>{t("information.body1")}</p><p>{t("information.body2")}</p></> },
    { id: "use", title: t("use.title"), content: <p>{t("use.body")}</p> },
    { id: "authentication", title: t("authentication.title"), content: <><p>{t("authentication.body1")}</p><p>{t("authentication.body2")}</p></> },
    { id: "sharing", title: t("sharing.title"), content: <><p>{t("sharing.body1")}</p><p>{t("sharing.body2")}</p></> },
    { id: "retention", title: t("retention.title"), content: <p>{t("retention.body")}</p> },
    { id: "choices", title: t("choices.title"), content: <p>{t("choices.body")}</p> },
    { id: "security", title: t("security.title"), content: <p>{t("security.body")}</p> },
    { id: "changes", title: t("changes.title"), content: <p>{t("changes.body")}</p> },
  ];
  return <LegalDocumentLayout label={t("label")} title={t("title")} summary={t("summary")} sections={sections} />;
}

"use client";

import { useTranslations } from "next-intl";

type LoadingMessage = "preparingSignIn" | "preparingRecovery" | "preparingReset" | "preparing" | "verifying";

export function FormLoading({ message }: { message: LoadingMessage }) {
  const t = useTranslations("Loading");
  return <p className="form-loading">{t(message)}</p>;
}

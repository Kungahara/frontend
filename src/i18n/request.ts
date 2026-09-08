import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const localeCookie = "kungahara-language";

export default getRequestConfig(async () => {
  const store = await cookies();
  const requested = store.get(localeCookie)?.value;
  const locale = requested === "fr" || requested === "rw" ? requested : "en";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

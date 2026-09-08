const rwMonths = ["Mutarama", "Gashyantare", "Werurwe", "Mata", "Gicurasi", "Kamena", "Nyakanga", "Kanama", "Nzeri", "Ukwakira", "Ugushyingo", "Ukuboza"];
const rwShortMonths = ["Mut", "Gas", "Wer", "Mata", "Gic", "Kam", "Nya", "Kan", "Nze", "Ukw", "Ugu", "Uku"];
const rwWeekdays = ["Ku Cyumweru", "Ku wa Mbere", "Ku wa Kabiri", "Ku wa Gatatu", "Ku wa Kane", "Ku wa Gatanu", "Ku wa Gatandatu"];
const rwShortWeekdays = ["Cyu", "Mbe", "Kab", "Gat", "Kan", "Gat", "Gnd"];

export function localizedMonth(date: Date, locale: string, style: "long" | "short" = "long") {
  if (locale === "rw") return (style === "long" ? rwMonths : rwShortMonths)[date.getMonth()];
  return new Intl.DateTimeFormat(locale, { month: style }).format(date);
}

export function localizedWeekday(date: Date, locale: string, style: "long" | "short" = "long") {
  if (locale === "rw") return (style === "long" ? rwWeekdays : rwShortWeekdays)[date.getDay()];
  return new Intl.DateTimeFormat(locale, { weekday: style }).format(date);
}

export function localizedFullDate(date: Date, locale: string) {
  if (locale === "rw") return `${localizedWeekday(date, locale)}, ${date.getDate()} ${localizedMonth(date, locale)} ${date.getFullYear()}`;
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);
}

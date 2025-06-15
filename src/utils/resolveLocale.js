const supported = ["en", "fr"];

export function resolveLocale(locale) {
  const safeLocale = typeof locale === "string" ? locale : "en";
  const short = safeLocale.split("-")[0];
  return supported.includes(short) ? short : "en";
}
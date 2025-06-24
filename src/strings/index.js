import { systemMessages } from "./system-messages/index.js";
import { promptStrings } from "./prompts/index.js";
import { actionStrings } from "./actions/index.js";
import { resolveLocale } from "../utils/resolveLocale.js";

const strings = {
  system: systemMessages,
  prompts: promptStrings,
  actions: actionStrings
};

export function getString(locale, path, vars = {}) {
  const resolved = resolveLocale(locale); // e.g. 'fr'
  const parts = path.split(".");
  let current = strings;

  for (const part of parts) {
    if (current && typeof current === "object") {
      current = current[part];
    } else {
      console.warn(`⚠️ [getString] Invalid path segment "${part}" in "${path}"`);
      return "";
    }
  }

  const localized = current?.[resolved] ?? current?.en;

  if (!localized) {
    console.warn(`⚠️ [getString] No string found for path "${path}" and locale "${resolved}"`);
    return "";
  }

  if (typeof localized === "function") {
    return localized(vars);
  }

  if (typeof localized === "string") {
    return localized.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
  }

  return localized ?? "";
}

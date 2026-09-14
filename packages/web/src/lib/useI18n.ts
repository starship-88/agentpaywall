import { useSyncExternalStore } from "react";
import {
  getLocale,
  setLocale,
  subscribeLocale,
  t,
  localeTag,
  type Locale,
  type MessageKey,
  type Vars,
} from "./i18n";

export function useI18n() {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, () => "en" as Locale);
  return {
    locale,
    setLocale,
    t: (key: MessageKey, vars?: Vars) => t(key, vars, locale),
    tag: localeTag(locale),
  };
}

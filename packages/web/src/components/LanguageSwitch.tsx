import { useI18n } from "../lib/useI18n";

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="ap-lang" role="group" aria-label={t("lang.switcher")}>
      <button
        type="button"
        className={locale === "en" ? "is-active" : ""}
        aria-pressed={locale === "en"}
        aria-label={t("lang.enFull")}
        onClick={() => setLocale("en")}
      >
        {t("lang.en")}
      </button>
      <button
        type="button"
        className={locale === "es" ? "is-active" : ""}
        aria-pressed={locale === "es"}
        aria-label={t("lang.esFull")}
        onClick={() => setLocale("es")}
      >
        {t("lang.es")}
      </button>
    </div>
  );
}

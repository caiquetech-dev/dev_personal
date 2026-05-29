"use client";

import { Locale } from "@/data/resume";

type LanguageToggleProps = {
  locale: Locale;
  onChange: (nextLocale: Locale) => void;
};

export default function LanguageToggle({
  locale,
  onChange,
}: LanguageToggleProps) {
  return (
    <div className="language-toggle" role="group" aria-label="Language switch">
      <button
        type="button"
        onClick={() => onChange("ko")}
        className={locale === "ko" ? "active" : ""}
        aria-pressed={locale === "ko"}
      >
        KR
      </button>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={locale === "en" ? "active" : ""}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}

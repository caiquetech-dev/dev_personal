"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import LanguageToggle from "@/components/LanguageToggle";
import Section from "@/components/Section";
import type { Locale, ResumeContentByLocale } from "@/data/resume";

type ResumeViewProps = {
  initialContent: ResumeContentByLocale;
};

export default function ResumeView({ initialContent }: ResumeViewProps) {
  const [locale, setLocale] = useState<Locale>("ko");
  const content = useMemo(() => initialContent[locale], [initialContent, locale]);
  const navigation = useMemo(
    () =>
      content.sections
        .filter((section) => section.showInNav)
        .map((section) => ({
          id: section.id,
          label: section.navLabel || section.title,
        })),
    [content.sections],
  );

  return (
    <main className="resume-canvas">
      <article className="cv-paper">
        <header className="hero">
          <div className="hero-layout">
            <figure className="profile-photo-frame" aria-label="CES profile photo">
              <Image
                src="/profile-ces.jpg"
                alt="Junyong Lee at CES"
                width={156}
                height={156}
                priority
                onError={(event) => {
                  event.currentTarget
                    .closest(".profile-photo-frame")
                    ?.classList.add("is-missing");
                }}
              />
            </figure>
            <div className="hero-copy">
              <div className="hero-top">
                <p className="eyebrow">
                  {content.languageLabel} Curriculum Vitae
                </p>
                <LanguageToggle locale={locale} onChange={setLocale} />
              </div>
              <h1>{content.hero.name}</h1>
              <p className="hero-role">{content.hero.role}</p>
              <p className="hero-summary">{content.hero.summary}</p>
              <nav className="hero-nav" aria-label="Resume sections">
                {navigation.map((item) => (
                  <a key={item.id} href={`#${item.id}`}>
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <div className="sections-grid">
          {content.sections.map((section) => (
            <Section key={section.id} {...section} />
          ))}
        </div>

        <footer className="footer-links">
          {content.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </footer>
      </article>
    </main>
  );
}

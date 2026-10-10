"use client";

import Image from "next/image";
import { useMemo, useState, type ReactElement } from "react";
import LanguageToggle from "@/components/LanguageToggle";
import Section from "@/components/Section";
import type {
  Locale,
  ResumeContentByLocale,
  ResumeSection,
  SectionGroup,
} from "@/data/resume";

type ResumeViewProps = {
  initialContent: ResumeContentByLocale;
};

type CategoryKey = Extract<
  SectionGroup,
  "education" | "experience" | "certification" | "award" | "program" | "exhibition" | "milestone"
>;

type CategoryDef = {
  key: CategoryKey;
  label: { ko: string; en: string };
  icon: (props: { size?: number }) => ReactElement;
};

const CATEGORIES: CategoryDef[] = [
  {
    key: "education",
    label: { ko: "학력사항", en: "Education" },
    icon: IconCap,
  },
  {
    key: "experience",
    label: { ko: "경력사항", en: "Experience" },
    icon: IconBriefcase,
  },
  {
    key: "certification",
    label: { ko: "자격증", en: "Certifications" },
    icon: IconDocument,
  },
  {
    key: "award",
    label: { ko: "수상경력", en: "Awards" },
    icon: IconTrophy,
  },
  {
    key: "program",
    label: { ko: "사업화지원 실적", en: "Commercialization Support" },
    icon: IconProgram,
  },
  {
    key: "exhibition",
    label: { ko: "사업관련활동", en: "Business Activities" },
    icon: IconExhibition,
  },
  {
    key: "milestone",
    label: { ko: "주요 마일스톤", en: "Key Milestones" },
    icon: IconMilestone,
  },
];

export default function ResumeView({ initialContent }: ResumeViewProps) {
  const [locale, setLocale] = useState<Locale>("ko");
  const content = useMemo(() => initialContent[locale], [initialContent, locale]);

  const groupedSections = useMemo(() => groupSections(content.sections), [content.sections]);
  const groupedByCategory = useMemo(
    () => groupByCategory(groupedSections),
    [groupedSections],
  );

  const timelineCards = useMemo(
    () => buildTimelineCards(CATEGORIES, groupedByCategory),
    [groupedByCategory],
  );

  const contactRows = useMemo(
    () => buildContactRows(content.hero.email, content.hero.phone, content.hero.address),
    [content.hero.email, content.hero.phone, content.hero.address],
  );

  return (
    <main className="resume-canvas">
      <article className="cv-paper">
        <header className="hero">
          <div className="hero-top">
            <figure className="profile-photo-frame" aria-label="Profile photo">
              <Image
                src="/profile-ces.jpg"
                alt={`${content.hero.name} profile`}
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
            <div className="hero-info">
              <div className="hero-info-top">
                <p className="eyebrow">Curriculum Vitae</p>
                <LanguageToggle locale={locale} onChange={setLocale} />
              </div>
              <h1 className="hero-name">{content.hero.name}</h1>
              <p className="hero-role">{content.hero.role}</p>
            </div>
          </div>

          <div className="hero-contact">
            {contactRows.map((row) => (
              <a
                key={row.label}
                className="hero-contact-item"
                href={row.href}
                target={row.external ? "_blank" : undefined}
                rel={row.external ? "noreferrer" : undefined}
              >
                <span className="hero-contact-icon" aria-hidden="true">
                  {row.icon}
                </span>
                <span className="hero-contact-text">{row.value}</span>
              </a>
            ))}
          </div>

          <p className="hero-summary">{content.hero.summary}</p>
        </header>

        <div className="divider-thick" aria-hidden="true" />

        <div className="timeline">
          <div className="timeline-list">
            {timelineCards.map((card) =>
              card.kind === "category" ? (
                <CategoryCard
                  key={`cat-${card.category.key}`}
                  category={card.category}
                  locale={locale}
                  sections={card.sections}
                />
              ) : (
                <ExtraCard key={`extra-${card.section.id}`} section={card.section} />
              ),
            )}
          </div>
        </div>

        {content.links.length > 0 ? (
          <footer className="footer-links-card">
            <h2 className="footer-links-title">
              {locale === "ko" ? "관련 링크" : "Related Links"}
            </h2>
            <div className="footer-links-grid">
              {content.links.map((link) => (
                <a
                  key={link.href}
                  className="footer-link-pill"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="footer-link-dot" aria-hidden="true" />
                  {link.label}
                </a>
              ))}
            </div>
          </footer>
        ) : null}
      </article>
    </main>
  );
}

function CategoryCard({
  category,
  locale,
  sections,
}: {
  category: CategoryDef;
  locale: Locale;
  sections: ResumeSection[];
}) {
  const Icon = category.icon;
  const label = category.label[locale];

  return (
    <article className="category-card">
      <div className="category-marker" aria-hidden="true">
        <span className="category-marker-dot" />
      </div>
      <header className="category-header">
        <span className="category-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <h2 className="category-title">{label}</h2>
      </header>

      <div className="category-body">
        {sections.length > 0 ? (
          sections.map((section) => (
            <Section
              key={section.id}
              id={section.id}
              title={section.title}
              subtitle={section.subtitle}
              bullets={section.bullets}
              badges={section.badges}
              variant="entry"
            />
          ))
        ) : (
          <div className="category-empty" aria-hidden="true">
            {label}
            <span className="category-empty-plus">+ {locale === "ko" ? "추가" : "Add"}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function ExtraCard({ section }: { section: ResumeSection }) {
  return (
    <article className="extra-card">
      <div className="category-marker" aria-hidden="true">
        <span className="category-marker-dot" />
      </div>
      <Section
        id={section.id}
        title={section.title}
        subtitle={section.subtitle}
        bullets={section.bullets}
        badges={section.badges}
        variant="entry"
      />
    </article>
  );
}

function groupSections(sections: ResumeSection[]): ResumeSection[] {
  return sections;
}

type GroupedSections = Record<CategoryKey, ResumeSection[]> & { extra: ResumeSection[] };

function groupByCategory(sections: ResumeSection[]): GroupedSections {
  const empty: GroupedSections = {
    education: [],
    experience: [],
    certification: [],
    award: [],
    program: [],
    exhibition: [],
    milestone: [],
    extra: [],
  };
  return sections.reduce<GroupedSections>((acc, section) => {
    const group = section.group ?? "extra";
    if (
      group === "education" ||
      group === "experience" ||
      group === "certification" ||
      group === "award" ||
      group === "program" ||
      group === "exhibition" ||
      group === "milestone"
    ) {
      acc[group].push(section);
    } else {
      acc.extra.push(section);
    }
    return acc;
  }, empty);
}

type TimelineCard =
  | { kind: "category"; category: CategoryDef; sections: ResumeSection[] }
  | { kind: "extra"; section: ResumeSection };

function buildTimelineCards(
  categories: CategoryDef[],
  grouped: GroupedSections,
): TimelineCard[] {
  const cards: TimelineCard[] = categories.map((category) => ({
    kind: "category",
    category,
    sections: grouped[category.key],
  }));
  for (const section of grouped.extra) {
    cards.push({ kind: "extra", section });
  }
  return cards;
}

type ContactRow = {
  label: string;
  value: string;
  href: string;
  external: boolean;
  icon: ReactElement;
};

function buildContactRows(email: string, phone: string, address: string): ContactRow[] {
  const rows: ContactRow[] = [];
  if (email) {
    rows.push({
      label: "email",
      value: email,
      href: `mailto:${email}`,
      external: false,
      icon: <IconMail size={16} />,
    });
  }
  if (phone) {
    rows.push({
      label: "phone",
      value: phone,
      href: `tel:${phone.replace(/[^0-9+]/g, "")}`,
      external: false,
      icon: <IconPhone size={16} />,
    });
  }
  if (address) {
    rows.push({
      label: "address",
      value: address,
      href: `https://www.google.com/maps/search/${encodeURIComponent(address)}`,
      external: true,
      icon: <IconPin size={16} />,
    });
  }
  return rows;
}

/* Icons */
function IconCap({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 9.5L12 4l10 5.5-10 5.5L2 9.5z" fill="#facc15" />
      <path d="M6 11.5v4.2c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.2" stroke="#fde68a" strokeWidth="1.6" fill="none" />
      <path d="M22 9.5v5" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconBriefcase({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="7" width="18" height="13" rx="2" fill="#f97316" />
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="#fed7aa" strokeWidth="1.6" />
      <path d="M3 12h18" stroke="#fed7aa" strokeWidth="1.6" />
    </svg>
  );
}

function IconDocument({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3h8l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" fill="#fb923c" />
      <path d="M14 3v4h4" stroke="#fed7aa" strokeWidth="1.6" fill="none" />
      <path d="M8 11h8M8 14h8M8 17h5" stroke="#7c2d12" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconTrophy({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4h10v5a5 5 0 11-10 0V4z" fill="#facc15" />
      <path d="M7 5H4v2a3 3 0 003 3" stroke="#fde68a" strokeWidth="1.6" fill="none" />
      <path d="M17 5h3v2a3 3 0 01-3 3" stroke="#fde68a" strokeWidth="1.6" fill="none" />
      <path d="M9 19h6M10 16h4l-1 3h-2l-1-3z" fill="#facc15" />
    </svg>
  );
}

function IconProgram({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="8" width="18" height="11" rx="2" fill="#a855f7" />
      <path d="M3 12h18" stroke="#f3e8ff" strokeWidth="1.4" />
      <path d="M12 8v-2a2 2 0 00-2-2H9" stroke="#f3e8ff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M9 4h4l-1.5 2L13 8" stroke="#f3e8ff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M7 15h4" stroke="#f3e8ff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconExhibition({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9l9-5 9 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" fill="#06b6d4" />
      <path d="M3 9h18" stroke="#cffafe" strokeWidth="1.4" />
      <path d="M9 21v-6h6v6" stroke="#cffafe" strokeWidth="1.4" fill="none" />
      <circle cx="12" cy="12" r="1.4" fill="#cffafe" />
    </svg>
  );
}

function IconMilestone({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3v18" stroke="#ec4899" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 5h12l-2 3 2 3H5" fill="#ec4899" />
      <path d="M5 14h12l-2 3 2 3H5" fill="#ec4899" />
      <circle cx="5" cy="3" r="1.5" fill="#ec4899" />
    </svg>
  );
}

function IconMail({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#dbeafe" />
      <path d="M3 7l9 6 9-6" stroke="#1d4ed8" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

function IconPhone({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="2" width="12" height="20" rx="3" fill="#ede9fe" />
      <circle cx="12" cy="18" r="1" fill="#5b21b6" />
      <g fill="#5b21b6">
        <rect x="8" y="4" width="8" height="2" rx="1" />
        <rect x="8" y="18" width="8" height="2" rx="1" />
      </g>
    </svg>
  );
}

function IconPin({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2c4 0 7 3 7 7 0 5-7 13-7 13S5 14 5 9c0-4 3-7 7-7z" fill="#fee2e2" />
      <circle cx="12" cy="9" r="2.5" fill="#dc2626" />
    </svg>
  );
}

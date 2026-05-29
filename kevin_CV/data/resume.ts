import resumeContentJson from "./resume-content.json";

export type Locale = "ko" | "en";

export type LinkItem = {
  label: string;
  href: string;
};

export type BadgeItem = {
  label: string;
  value: string;
  pending?: boolean;
};

export type ResumeSection = {
  id: string;
  title: string;
  subtitle?: string;
  navLabel: string;
  showInNav: boolean;
  bullets: string[];
  badges?: BadgeItem[];
};

export type Hero = {
  name: string;
  role: string;
  summary: string;
  ctaLabel: string;
};

export type ResumeContent = {
  languageLabel: string;
  hero: Hero;
  sections: ResumeSection[];
  links: LinkItem[];
};

export type ResumeContentByLocale = Record<Locale, ResumeContent>;

export const resumeContent = resumeContentJson as ResumeContentByLocale;
